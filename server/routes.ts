import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import { insertBookingSchema, insertDatasetSchema, type InsertBooking } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { autoMapColumns } from "./auto-mapper";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Upload file and return headers
  app.post("/api/upload", upload.single("file"), async (req, res) => {
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
          // Map columns based on user's mapping
          const bookingData: any = {
            datasetId: dataset.id,
            bookingRef: row[mapping.bookingRef] || `REF-${i + 1}`,
            guestName: row[mapping.guestName] || 'Unknown',
            guestCountry: row[mapping.guestCountry] || null,
            arrivalDate: parseDate(row[mapping.arrivalDate]),
            departureDate: parseDate(row[mapping.departureDate]),
            bookingDate: parseDate(row[mapping.bookingDate]),
            roomType: row[mapping.roomType] || 'Standard',
            roomNumber: row[mapping.roomNumber]?.toString() || null,
            adults: parseInt(row[mapping.adults]) || 1,
            children: parseInt(row[mapping.children]) || 0,
            totalAmount: parseFloat(row[mapping.totalAmount]) || 0,
            adr: parseFloat(row[mapping.adr]) || 0,
            depositType: row[mapping.depositType] || null,
            channel: row[mapping.channel] || 'Direct',
            marketSegment: row[mapping.marketSegment] || null,
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
