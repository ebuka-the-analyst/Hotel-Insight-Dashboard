import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for custom auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email OTP table for verification
export const emailOtps = pgTable("email_otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  otpHash: varchar("otp_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type EmailOtp = typeof emailOtps.$inferSelect;
export type InsertEmailOtp = typeof emailOtps.$inferInsert;

// Hotel Bookings Table - matches the ultra-realistic dataset structure
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Core Booking Info
  bookingRef: text("booking_ref").notNull(),
  guestName: text("guest_name").notNull(),
  guestCountry: text("guest_country"),
  
  // Dates
  arrivalDate: date("arrival_date").notNull(),
  departureDate: date("departure_date").notNull(),
  bookingDate: date("booking_date").notNull(),
  
  // Room Details
  roomType: text("room_type").notNull(),
  roomNumber: text("room_number"),
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  
  // Financial
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  adr: decimal("adr", { precision: 10, scale: 2 }).notNull(), // Average Daily Rate
  depositType: text("deposit_type"),
  
  // Distribution
  channel: text("channel").notNull(),
  marketSegment: text("market_segment"),
  
  // Status
  bookingStatus: text("booking_status").notNull(),
  isCancelled: boolean("is_cancelled").notNull().default(false),
  
  // Advanced Fields (PhD-level tracking)
  leadTime: integer("lead_time"),
  lengthOfStay: integer("length_of_stay").notNull(),
  isRepeatedGuest: boolean("is_repeated_guest").default(false),
  previousBookings: integer("previous_bookings").default(0),
  
  // Operational
  bookingChanges: integer("booking_changes").default(0),
  waitingListDays: integer("waiting_list_days").default(0),
  
  // Metadata
  datasetId: varchar("dataset_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Datasets Table - tracks uploaded files
export const datasets = pgTable("datasets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(),
  rowCount: integer("row_count").notNull(),
  
  // Column mapping storage
  columnMapping: jsonb("column_mapping").notNull(),
  
  // Status
  status: text("status").notNull().default('processing'),
  
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// Analytics Cache Table - stores pre-computed metrics
export const analyticsCache = pgTable("analytics_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id").notNull(),
  metricType: text("metric_type").notNull(),
  dateRange: text("date_range"),
  data: jsonb("data").notNull(),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDatasetSchema = createInsertSchema(datasets).omit({
  id: true,
  uploadedAt: true,
  processedAt: true,
});

export const insertAnalyticsCacheSchema = createInsertSchema(analyticsCache).omit({
  id: true,
  computedAt: true,
});

// Types
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;

export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type InsertAnalyticsCache = z.infer<typeof insertAnalyticsCacheSchema>;
