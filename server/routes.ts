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
import { setupEmailAuth, isAuthenticated, generateOtp, hashOtp, verifyOtpHash } from "./emailAuth";
import { sendOtpEmail } from "./emailService";

// Simple in-memory rate limiter for OTP endpoints
const otpRequestLimiter = new Map<string, { count: number; resetTime: number }>();
const otpVerifyLimiter = new Map<string, { count: number; resetTime: number }>();
const ipRateLimiter = new Map<string, { count: number; resetTime: number }>();

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

  // Request OTP - send verification code to email
  app.post('/api/auth/request-otp', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const normalizedEmail = email.toLowerCase();
      const clientIp = getClientIp(req);
      
      // Rate limit by IP: 10 OTP requests per IP per 15 minutes
      const ipCheck = checkRateLimit(ipRateLimiter, `request:${clientIp}`, 10, 15 * 60 * 1000);
      if (!ipCheck.allowed) {
        return res.status(429).json({ 
          message: "Too many requests. Please try again later.",
          retryAfter: ipCheck.retryAfter 
        });
      }
      
      // Rate limit by email: 3 OTP requests per email per 5 minutes
      const emailCheck = checkRateLimit(otpRequestLimiter, normalizedEmail, 3, 5 * 60 * 1000);
      if (!emailCheck.allowed) {
        return res.status(429).json({ 
          message: "Too many requests. Please try again later.",
          retryAfter: emailCheck.retryAfter 
        });
      }

      // Generate OTP and store hashed version
      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtp({
        email: email.toLowerCase(),
        otpHash,
        expiresAt,
      });

      // Send OTP via email
      const result = await sendOtpEmail(email, otp);
      
      if (!result.success) {
        return res.status(500).json({ message: "Failed to send verification code" });
      }

      res.json({ success: true, message: "Verification code sent" });
    } catch (error) {
      console.error("Error requesting OTP:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  // Verify OTP - validate code and create session
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      const normalizedEmail = email.toLowerCase();
      const clientIp = getClientIp(req);
      
      // Rate limit by IP: 20 verification attempts per IP per 15 minutes
      const ipCheck = checkRateLimit(ipRateLimiter, `verify:${clientIp}`, 20, 15 * 60 * 1000);
      if (!ipCheck.allowed) {
        return res.status(429).json({ 
          message: "Too many attempts. Please try again later.",
          retryAfter: ipCheck.retryAfter 
        });
      }
      
      // Rate limit by email: 5 verification attempts per email per 10 minutes
      const emailCheck = checkRateLimit(otpVerifyLimiter, normalizedEmail, 5, 10 * 60 * 1000);
      if (!emailCheck.allowed) {
        return res.status(429).json({ 
          message: "Too many attempts. Please try again later.",
          retryAfter: emailCheck.retryAfter 
        });
      }

      const storedOtp = await storage.getValidOtp(normalizedEmail);

      if (!storedOtp) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      // Verify OTP hash
      if (!verifyOtpHash(otp, storedOtp.otpHash)) {
        await storage.incrementOtpAttempts(storedOtp.id);
        return res.status(400).json({ message: "Invalid code" });
      }

      // Mark OTP as used
      await storage.markOtpUsed(storedOtp.id);

      // Upsert user
      let user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        user = await storage.upsertUser({ email: normalizedEmail });
      }

      // Create session
      (req.session as any).userId = user.id;
      (req.session as any).email = user.email;

      res.json({ success: true, user });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  // Get current user from session
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      res.json(user);
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

  // Get analytics KPIs
  app.get("/api/analytics/kpis", async (req, res) => {
    try {
      const datasetId = req.query.datasetId as string | undefined;
      const analytics = await storage.getAnalytics(datasetId);
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
      const trends = await storage.getTrends(datasetId);
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
      const channels = await storage.getChannelPerformance(datasetId);
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
      const bookings = await storage.getBookings(datasetId);
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
      const bookings = await storage.getBookings(datasetId);
      
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({ error: "No booking data available" });
      }
      
      const analytics = calculateComprehensiveAnalytics(bookings);
      res.json(analytics);
    } catch (error: any) {
      console.error("Get comprehensive analytics error:", error);
      res.status(500).json({ error: error.message || "Failed to get comprehensive analytics" });
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
