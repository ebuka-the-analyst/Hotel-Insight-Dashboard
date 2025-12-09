import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import { insertBookingSchema, insertDatasetSchema, type InsertBooking } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { autoMapColumns } from "./auto-mapper";
import { calculateComprehensiveAnalytics } from "./analytics-service";
import { setupEmailAuth, isAuthenticated, verifyPassword, hashPassword } from "./emailAuth";
import { extractGuestsFromBookings, calculateGuestAnalytics } from "./guest-analytics-service";
import { revenueInsightsService } from "./revenue-insights-service";
import { aiPricingService } from "./ai-pricing-service";
import { emailReportsService } from "./email-reports-service";
import { insertReportSubscriptionSchema } from "@shared/schema";

// Simple in-memory rate limiter for login
const loginRateLimiter = new Map<string, { count: number; resetTime: number }>();

function getClientIp(req: any): string {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.connection?.remoteAddress || 
         'unknown';
}

function checkRateLimit(
  limiter: Map<string, { count: number; resetTime: number }>,
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = limiter.get(key);
  
  if (!record || now > record.resetTime) {
    limiter.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
  }
  
  record.count++;
  return { allowed: true };
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup email authentication with sessions
  setupEmailAuth(app);

  // Login with email and password
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const normalizedEmail = email.toLowerCase();
      const clientIp = getClientIp(req);
      
      // Rate limit by IP: 10 login attempts per IP per 15 minutes
      const ipCheck = checkRateLimit(loginRateLimiter, `login:${clientIp}`, 10, 15 * 60 * 1000);
      if (!ipCheck.allowed) {
        return res.status(429).json({ 
          message: "Too many login attempts. Please try again later.",
          retryAfter: ipCheck.retryAfter 
        });
      }

      // Find user by email
      const user = await storage.getUserByEmail(normalizedEmail);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      if (!verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).email = user.email;

      res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Get current user from session
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Return only safe user data (exclude passwordHash)
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout - destroy session
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // Upload file and return headers (protected)
  app.post("/api/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Parse Excel/CSV file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get headers from first row
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      const headers = data[0] || [];
      
      // Get row count (excluding header)
      const rowCount = data.length - 1;

      // Auto-map columns using the intelligent mapper
      const autoMapping = autoMapColumns(headers.map(String));

      res.json({
        filename: req.file.originalname,
        headers,
        rowCount,
        fileSize: req.file.size,
        autoMapping,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "Failed to process file" });
    }
  });

  // Create dataset and process bookings
  app.post("/api/datasets", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { name, columnMapping } = req.body;
      
      if (!name || !columnMapping) {
        return res.status(400).json({ error: "Missing required fields: name, columnMapping" });
      }

      const mapping = JSON.parse(columnMapping);

      // Parse Excel/CSV file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Create dataset record
      const datasetData = insertDatasetSchema.parse({
        name,
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        rowCount: rows.length,
        columnMapping: mapping,
        status: 'processing',
      });

      const dataset = await storage.createDataset(datasetData);

      // Map and validate bookings
      const bookings: InsertBooking[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        try {
          // Map columns based on user's mapping - convert all values to correct types
          const bookingData: any = {
            datasetId: dataset.id,
            bookingRef: String(row[mapping.bookingRef] ?? `REF-${i + 1}`),
            guestName: String(row[mapping.guestName] ?? 'Unknown'),
            guestCountry: row[mapping.guestCountry] ? String(row[mapping.guestCountry]) : null,
            arrivalDate: parseDate(row[mapping.arrivalDate]),
            departureDate: parseDate(row[mapping.departureDate]),
            bookingDate: parseDate(row[mapping.bookingDate]),
            roomType: String(row[mapping.roomType] ?? 'Standard'),
            roomNumber: row[mapping.roomNumber] ? String(row[mapping.roomNumber]) : null,
            adults: parseInt(row[mapping.adults]) || 1,
            children: parseInt(row[mapping.children]) || 0,
            totalAmount: String(parseFloat(row[mapping.totalAmount]) || 0),
            adr: String(parseFloat(row[mapping.adr]) || parseFloat(row['Rate']) || 0),
            depositType: row[mapping.depositType] ? String(row[mapping.depositType]) : null,
            channel: String(row[mapping.channel] ?? 'Direct'),
            marketSegment: row[mapping.marketSegment] ? String(row[mapping.marketSegment]) : null,
            bookingStatus: String(row[mapping.bookingStatus] ?? 'Confirmed'),
            isCancelled: parseBoolean(row['Is Canceled']) || String(row[mapping.bookingStatus] ?? '').toLowerCase().includes('cancel'),
            leadTime: parseInt(row[mapping.leadTime]) || null,
            lengthOfStay: parseInt(row[mapping.lengthOfStay]) || calculateLOS(
              parseDate(row[mapping.arrivalDate]),
              parseDate(row[mapping.departureDate])
            ),
            isRepeatedGuest: parseBoolean(row[mapping.isRepeatedGuest]),
            previousBookings: parseInt(row[mapping.previousBookings]) || 0,
            bookingChanges: 0,
            waitingListDays: 0,
          };

          // Validate with Zod schema
          const validated = insertBookingSchema.parse(bookingData);
          bookings.push(validated);
        } catch (error: any) {
          if (error instanceof z.ZodError) {
            const validationError = fromZodError(error);
            errors.push(`Row ${i + 1}: ${validationError.message}`);
          } else {
            errors.push(`Row ${i + 1}: ${error.message}`);
          }
        }
      }

      // Insert bookings into database
      if (bookings.length > 0) {
        await storage.createBookings(bookings);
      }

      // Update dataset status
      await storage.updateDatasetStatus(
        dataset.id, 
        errors.length > 0 ? 'completed_with_errors' : 'completed',
        new Date()
      );

      res.json({
        dataset,
        processedRows: bookings.length,
        totalRows: rows.length,
        errors: errors.slice(0, 10), // Return first 10 errors only
      });
    } catch (error: any) {
      console.error("Dataset creation error:", error);
      res.status(500).json({ error: error.message || "Failed to create dataset" });
    }
  });

  // Get all datasets
  app.get("/api/datasets", async (req, res) => {
    try {
      const datasets = await storage.getDatasets();
      res.json(datasets);
    } catch (error: any) {
      console.error("Get datasets error:", error);
      res.status(500).json({ error: error.message || "Failed to get datasets" });
    }
  });

  // Delete dataset (with cascading cleanup)
  app.delete("/api/datasets/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify dataset exists
      const dataset = await storage.getDataset(id);
      if (!dataset) {
        return res.status(404).json({ error: "Dataset not found" });
      }
      
      // Delete dataset and all related data
      await storage.deleteDataset(id);
      
      res.json({ success: true, message: "Dataset deleted successfully" });
    } catch (error: any) {
      console.error("Delete dataset error:", error);
      res.status(500).json({ error: error.message || "Failed to delete dataset" });
    }
  });

  // Get analytics KPIs
  app.get("/api/analytics/kpis", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const analytics = await storage.getAnalytics(datasetId, startDate, endDate);
      res.json(analytics);
    } catch (error: any) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: error.message || "Failed to get analytics" });
    }
  });

  // Get trends
  app.get("/api/analytics/trends", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const trends = await storage.getTrends(datasetId, startDate, endDate);
      res.json(trends);
    } catch (error: any) {
      console.error("Get trends error:", error);
      res.status(500).json({ error: error.message || "Failed to get trends" });
    }
  });

  // Get channel performance
  app.get("/api/analytics/channels", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const channels = await storage.getChannelPerformance(datasetId, startDate, endDate);
      res.json(channels);
    } catch (error: any) {
      console.error("Get channel performance error:", error);
      res.status(500).json({ error: error.message || "Failed to get channel performance" });
    }
  });

  // Get bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const bookings = await storage.getBookings(datasetId, startDate, endDate);
      res.json(bookings);
    } catch (error: any) {
      console.error("Get bookings error:", error);
      res.status(500).json({ error: error.message || "Failed to get bookings" });
    }
  });

  // Get comprehensive analytics (70+ metrics)
  app.get("/api/analytics/comprehensive", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const bookings = await storage.getBookings(datasetId, startDate, endDate);
      
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({ error: "No booking data available for selected period" });
      }
      
      const analytics = calculateComprehensiveAnalytics(bookings);
      res.json(analytics);
    } catch (error: any) {
      console.error("Get comprehensive analytics error:", error);
      res.status(500).json({ error: error.message || "Failed to get comprehensive analytics" });
    }
  });

  // ===== GUEST ANALYTICS ENDPOINTS =====

  // Extract and populate guests from bookings for a dataset
  app.post("/api/guests/extract/:datasetId", isAuthenticated, async (req, res) => {
    try {
      const { datasetId } = req.params;
      
      // Get bookings for this dataset
      const bookings = await storage.getBookings(datasetId);
      
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({ error: "No booking data found for this dataset" });
      }
      
      // Delete existing guests for this dataset (re-extraction)
      await storage.deleteGuestsByDataset(datasetId);
      
      // Extract guests from bookings
      const guests = extractGuestsFromBookings(bookings, datasetId);
      
      // Store guests
      await storage.createGuests(guests);
      
      res.json({
        success: true,
        guestsExtracted: guests.length,
        bookingsProcessed: bookings.length,
      });
    } catch (error: any) {
      console.error("Guest extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract guests" });
    }
  });

  // Get guests list with pagination and search
  app.get("/api/guests", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      const result = await storage.getGuests(datasetId, { limit, offset, search, sortBy, sortOrder });
      res.json(result);
    } catch (error: any) {
      console.error("Get guests error:", error);
      res.status(500).json({ error: error.message || "Failed to get guests" });
    }
  });

  // Get single guest profile
  app.get("/api/guests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const guest = await storage.getGuest(id);
      
      if (!guest) {
        return res.status(404).json({ error: "Guest not found" });
      }
      
      res.json(guest);
    } catch (error: any) {
      console.error("Get guest error:", error);
      res.status(500).json({ error: error.message || "Failed to get guest" });
    }
  });

  // Get guest count for a dataset
  app.get("/api/guests/count/:datasetId", async (req, res) => {
    try {
      const { datasetId } = req.params;
      const count = await storage.getGuestCount(datasetId);
      res.json({ count });
    } catch (error: any) {
      console.error("Get guest count error:", error);
      res.status(500).json({ error: error.message || "Failed to get guest count" });
    }
  });

  // Get top guests by revenue
  app.get("/api/guests/top/revenue", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      const guests = await storage.getTopGuestsByRevenue(datasetId, limit);
      res.json(guests);
    } catch (error: any) {
      console.error("Get top guests error:", error);
      res.status(500).json({ error: error.message || "Failed to get top guests" });
    }
  });

  // Get top guests by bookings
  app.get("/api/guests/top/bookings", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      const guests = await storage.getTopGuestsByBookings(datasetId, limit);
      res.json(guests);
    } catch (error: any) {
      console.error("Get top guests error:", error);
      res.status(500).json({ error: error.message || "Failed to get top guests" });
    }
  });

  // Get guests by lifecycle stage
  app.get("/api/guests/segments/lifecycle", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      const stages = await storage.getGuestsByLifecycleStage(datasetId);
      res.json(stages);
    } catch (error: any) {
      console.error("Get lifecycle stages error:", error);
      res.status(500).json({ error: error.message || "Failed to get lifecycle stages" });
    }
  });

  // Get guests by loyalty tier
  app.get("/api/guests/segments/loyalty", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      const tiers = await storage.getGuestsByLoyaltyTier(datasetId);
      res.json(tiers);
    } catch (error: any) {
      console.error("Get loyalty tiers error:", error);
      res.status(500).json({ error: error.message || "Failed to get loyalty tiers" });
    }
  });

  // Get comprehensive guest analytics (all 36 features)
  app.get("/api/guests/analytics/comprehensive", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      // Get guests and bookings for the dataset
      const { guests } = await storage.getGuests(datasetId, { limit: 10000 });
      const bookings = await storage.getBookings(datasetId);
      
      if (!guests || guests.length === 0) {
        return res.status(404).json({ error: "No guest data available. Please extract guests first." });
      }
      
      // Calculate comprehensive guest analytics
      const analytics = calculateGuestAnalytics(guests, bookings);
      res.json(analytics);
    } catch (error: any) {
      console.error("Get guest analytics error:", error);
      res.status(500).json({ error: error.message || "Failed to get guest analytics" });
    }
  });

  // ===== REVENUE INSIGHTS ENDPOINTS =====

  // Get revenue insights summary
  app.get("/api/revenue-insights/summary", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      const summary = await revenueInsightsService.getRevenueInsightsSummary(datasetId);
      res.json(summary);
    } catch (error: any) {
      console.error("Get revenue insights summary error:", error);
      res.status(500).json({ error: error.message || "Failed to get revenue insights" });
    }
  });

  // Generate revenue forecasts
  app.post("/api/revenue-insights/forecasts/generate", isAuthenticated, async (req, res) => {
    try {
      const { datasetId, daysAhead } = req.body;
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      const forecasts = await revenueInsightsService.generateRevenueForecasts(datasetId, daysAhead || 30);
      await revenueInsightsService.saveForecasts(forecasts);
      const savedForecasts = await revenueInsightsService.getForecasts(datasetId);
      
      res.json(savedForecasts);
    } catch (error: any) {
      console.error("Generate forecasts error:", error);
      res.status(500).json({ error: error.message || "Failed to generate forecasts" });
    }
  });

  // Get revenue forecasts
  app.get("/api/revenue-insights/forecasts", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      if (!datasetId) {
        return res.json([]);
      }
      
      const forecasts = await revenueInsightsService.getForecasts(datasetId);
      res.json(forecasts);
    } catch (error: any) {
      console.error("Get forecasts error:", error);
      res.status(500).json({ error: error.message || "Failed to get forecasts" });
    }
  });

  // Generate channel analysis
  app.post("/api/revenue-insights/channels/analyze", isAuthenticated, async (req, res) => {
    try {
      const { datasetId } = req.body;
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      const snapshots = await revenueInsightsService.analyzeChannelPerformance(datasetId);
      await revenueInsightsService.saveChannelSnapshots(snapshots);
      const savedSnapshots = await revenueInsightsService.getChannelSnapshots(datasetId);
      
      res.json(savedSnapshots);
    } catch (error: any) {
      console.error("Analyze channels error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze channels" });
    }
  });

  // Get channel snapshots
  app.get("/api/revenue-insights/channels", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      if (!datasetId) {
        return res.json([]);
      }
      
      const snapshots = await revenueInsightsService.getChannelSnapshots(datasetId);
      res.json(snapshots);
    } catch (error: any) {
      console.error("Get channel snapshots error:", error);
      res.status(500).json({ error: error.message || "Failed to get channel data" });
    }
  });

  // Generate cancellation alerts
  app.post("/api/revenue-insights/alerts/generate", isAuthenticated, async (req, res) => {
    try {
      const { datasetId } = req.body;
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      const alerts = await revenueInsightsService.identifyHighRiskBookings(datasetId);
      await revenueInsightsService.saveCancellationAlerts(alerts);
      const savedAlerts = await revenueInsightsService.getCancellationAlerts(datasetId);
      
      res.json(savedAlerts);
    } catch (error: any) {
      console.error("Generate alerts error:", error);
      res.status(500).json({ error: error.message || "Failed to generate alerts" });
    }
  });

  // Get cancellation alerts
  app.get("/api/revenue-insights/alerts", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      const status = req.query.status as string | undefined;
      if (!datasetId) {
        return res.json([]);
      }
      
      const alerts = await revenueInsightsService.getCancellationAlerts(datasetId, status);
      res.json(alerts);
    } catch (error: any) {
      console.error("Get alerts error:", error);
      res.status(500).json({ error: error.message || "Failed to get alerts" });
    }
  });

  // Update alert status
  app.patch("/api/revenue-insights/alerts/:alertId", isAuthenticated, async (req, res) => {
    try {
      const { alertId } = req.params;
      const { status } = req.body;
      
      const updated = await revenueInsightsService.updateAlertStatus(alertId, status);
      res.json(updated);
    } catch (error: any) {
      console.error("Update alert error:", error);
      res.status(500).json({ error: error.message || "Failed to update alert" });
    }
  });

  // ===== AI PRICING ENDPOINTS =====

  // Generate pricing recommendations
  app.post("/api/pricing/generate", isAuthenticated, async (req, res) => {
    try {
      const { datasetId, daysAhead } = req.body;
      if (!datasetId) {
        return res.status(400).json({ error: "datasetId is required" });
      }
      
      const recommendations = await aiPricingService.generatePricingRecommendations(datasetId, daysAhead || 14);
      await aiPricingService.savePricingRecommendations(recommendations);
      const savedRecs = await aiPricingService.getPricingRecommendations(datasetId);
      
      res.json(savedRecs);
    } catch (error: any) {
      console.error("Generate pricing error:", error);
      res.status(500).json({ error: error.message || "Failed to generate pricing" });
    }
  });

  // Get pricing recommendations
  app.get("/api/pricing/recommendations", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string;
      const status = req.query.status as string | undefined;
      if (!datasetId) {
        return res.json([]);
      }
      
      const recommendations = await aiPricingService.getPricingRecommendations(datasetId, status);
      res.json(recommendations);
    } catch (error: any) {
      console.error("Get pricing error:", error);
      res.status(500).json({ error: error.message || "Failed to get pricing" });
    }
  });

  // Update pricing recommendation status
  app.patch("/api/pricing/recommendations/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updated = await aiPricingService.updateRecommendationStatus(id, status);
      res.json(updated);
    } catch (error: any) {
      console.error("Update pricing error:", error);
      res.status(500).json({ error: error.message || "Failed to update pricing" });
    }
  });

  // Get AI-enhanced pricing for specific date
  app.post("/api/pricing/ai-suggest", isAuthenticated, async (req, res) => {
    try {
      const { datasetId, targetDate, currentAdr, occupancyRate, dayOfWeek, isHoliday } = req.body;
      if (!datasetId || !targetDate) {
        return res.status(400).json({ error: "datasetId and targetDate are required" });
      }
      
      const suggestion = await aiPricingService.generateAIEnhancedRecommendation(
        datasetId,
        targetDate,
        {
          currentAdr: currentAdr || 150,
          occupancyRate: occupancyRate || 0.7,
          dayOfWeek: dayOfWeek ?? new Date(targetDate).getDay(),
          isHoliday: isHoliday || false,
        }
      );
      
      res.json(suggestion);
    } catch (error: any) {
      console.error("AI pricing error:", error);
      res.status(500).json({ error: error.message || "Failed to get AI pricing" });
    }
  });

  // ===== EMAIL REPORTS ENDPOINTS =====

  // Get user's report subscriptions
  app.get("/api/reports/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const subscriptions = await emailReportsService.getSubscriptions(userId);
      res.json(subscriptions);
    } catch (error: any) {
      console.error("Get subscriptions error:", error);
      res.status(500).json({ error: error.message || "Failed to get subscriptions" });
    }
  });

  // Create report subscription
  app.post("/api/reports/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { datasetId, emailAddress, frequency, reportTypes } = req.body;
      
      const subscriptionData = insertReportSubscriptionSchema.parse({
        userId,
        datasetId,
        emailAddress,
        frequency,
        reportTypes,
        isActive: true,
      });
      
      const subscription = await emailReportsService.createSubscription(subscriptionData);
      res.json({ success: true, subscription });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Create subscription error:", error);
      res.status(500).json({ error: error.message || "Failed to create subscription" });
    }
  });

  // Update report subscription
  app.patch("/api/reports/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive, frequency, reportTypes } = req.body;
      
      await emailReportsService.updateSubscription(id, { isActive, frequency, reportTypes });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update subscription error:", error);
      res.status(500).json({ error: error.message || "Failed to update subscription" });
    }
  });

  // Delete report subscription
  app.delete("/api/reports/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await emailReportsService.deleteSubscription(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete subscription error:", error);
      res.status(500).json({ error: error.message || "Failed to delete subscription" });
    }
  });

  // Send test email
  app.post("/api/reports/test", isAuthenticated, async (req, res) => {
    try {
      const { emailAddress, datasetId } = req.body;
      if (!emailAddress || !datasetId) {
        return res.status(400).json({ error: "emailAddress and datasetId are required" });
      }
      
      const result = await emailReportsService.sendTestEmail(emailAddress, datasetId);
      res.json(result);
    } catch (error: any) {
      console.error("Send test email error:", error);
      res.status(500).json({ error: error.message || "Failed to send test email" });
    }
  });

  // Trigger scheduled reports (for cron job or manual trigger)
  app.post("/api/reports/process-scheduled", isAuthenticated, async (req, res) => {
    try {
      const result = await emailReportsService.processScheduledReports();
      res.json(result);
    } catch (error: any) {
      console.error("Process scheduled reports error:", error);
      res.status(500).json({ error: error.message || "Failed to process scheduled reports" });
    }
  });

  return httpServer;
}

// Helper functions
function parseDate(value: any): string {
  if (!value) return new Date().toISOString().split('T')[0];
  
  // If it's already a string in YYYY-MM-DD format
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  
  // If it's a Date object or Excel serial date
  if (typeof value === 'number') {
    // Excel serial date (days since 1899-12-30 with Excel's leap year bug)
    // Excel incorrectly treats 1900 as a leap year, so we adjust for that
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  // Try to parse as date string
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return new Date().toISOString().split('T')[0];
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }
  if (typeof value === 'number') return value === 1;
  return false;
}

function calculateLOS(arrivalDate: string, departureDate: string): number {
  const arrival = new Date(arrivalDate);
  const departure = new Date(departureDate);
  const diffTime = Math.abs(departure.getTime() - arrival.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}
