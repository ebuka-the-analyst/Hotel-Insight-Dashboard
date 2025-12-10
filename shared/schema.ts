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

// User storage table - credentials managed by HR
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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

// Guests Table - normalized guest profiles with analytics
export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id").notNull(),
  
  // Identity
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(), // lowercase, trimmed for dedup
  country: text("country"),
  
  // Lifecycle
  firstBookingDate: date("first_booking_date"),
  lastBookingDate: date("last_booking_date"),
  totalBookings: integer("total_bookings").default(0),
  cancelledBookings: integer("cancelled_bookings").default(0),
  
  // Value Metrics
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0"),
  averageSpend: decimal("average_spend", { precision: 10, scale: 2 }).default("0"),
  
  // RFM Scores (1-5 scale)
  recencyScore: integer("recency_score").default(1),
  frequencyScore: integer("frequency_score").default(1),
  monetaryScore: integer("monetary_score").default(1),
  rfmScore: integer("rfm_score").default(3), // Combined RFM
  
  // Behavioral
  preferredChannel: text("preferred_channel"),
  preferredRoomType: text("preferred_room_type"),
  avgLeadTime: decimal("avg_lead_time", { precision: 6, scale: 1 }).default("0"),
  avgLengthOfStay: decimal("avg_length_of_stay", { precision: 6, scale: 1 }).default("0"),
  weekendRatio: decimal("weekend_ratio", { precision: 5, scale: 2 }).default("0"), // 0-1
  
  // Risk Metrics
  cancellationRate: decimal("cancellation_rate", { precision: 5, scale: 2 }).default("0"),
  modificationCount: integer("modification_count").default(0),
  
  // Segmentation
  lifecycleStage: text("lifecycle_stage").default("first_timer"), // first_timer, returning, loyal, champion, at_risk, churned
  loyaltyTier: text("loyalty_tier").default("bronze"), // bronze, silver, gold, platinum
  guestType: text("guest_type").default("leisure"), // corporate, leisure
  travelType: text("travel_type").default("solo"), // solo, couple, family, group
  
  // Predictive Scores (0-100)
  clvScore: decimal("clv_score", { precision: 10, scale: 2 }).default("0"),
  churnRiskScore: integer("churn_risk_score").default(50),
  upsellPropensity: integer("upsell_propensity").default(50),
  retentionProbability: integer("retention_probability").default(50),
  ambassadorScore: integer("ambassador_score").default(50),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_guest_dataset").on(table.datasetId),
  index("IDX_guest_normalized_name").on(table.normalizedName),
  index("IDX_guest_rfm").on(table.rfmScore),
  index("IDX_guest_clv").on(table.clvScore),
]);

// Guest Stays Table - individual stay records linked to guests
export const guestStays = pgTable("guest_stays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").notNull(),
  bookingId: varchar("booking_id").notNull(),
  datasetId: varchar("dataset_id").notNull(),
  
  // Stay details
  arrivalDate: date("arrival_date").notNull(),
  departureDate: date("departure_date").notNull(),
  roomType: text("room_type"),
  channel: text("channel"),
  marketSegment: text("market_segment"),
  
  // Financial
  revenue: decimal("revenue", { precision: 10, scale: 2 }).notNull(),
  adr: decimal("adr", { precision: 10, scale: 2 }),
  
  // Stay metrics
  lengthOfStay: integer("length_of_stay").notNull(),
  leadTime: integer("lead_time"),
  adults: integer("adults").default(1),
  children: integer("children").default(0),
  
  // Status
  isCancelled: boolean("is_cancelled").default(false),
  isWeekend: boolean("is_weekend").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_guest_stays_guest").on(table.guestId),
  index("IDX_guest_stays_dataset").on(table.datasetId),
]);

// Revenue Insights Tables

// Pricing Recommendations - AI-generated rate suggestions
export const pricingRecommendations = pgTable("pricing_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id").notNull(),
  targetDate: date("target_date").notNull(),
  currentAdr: decimal("current_adr", { precision: 10, scale: 2 }).notNull(),
  suggestedAdr: decimal("suggested_adr", { precision: 10, scale: 2 }).notNull(),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  roomType: text("room_type"),
  status: text("status").default("pending"), // pending, applied, dismissed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Revenue Forecasts - predicted future revenue
export const revenueForecasts = pgTable("revenue_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id").notNull(),
  forecastDate: date("forecast_date").notNull(),
  predictedRevenue: decimal("predicted_revenue", { precision: 12, scale: 2 }).notNull(),
  predictedBookings: integer("predicted_bookings").notNull(),
  predictedOccupancy: decimal("predicted_occupancy", { precision: 5, scale: 2 }),
  confidenceLow: decimal("confidence_low", { precision: 12, scale: 2 }),
  confidenceHigh: decimal("confidence_high", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Channel Performance Snapshots - margin tracking per channel
export const channelSnapshots = pgTable("channel_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id").notNull(),
  channel: text("channel").notNull(),
  grossRevenue: decimal("gross_revenue", { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  netRevenue: decimal("net_revenue", { precision: 12, scale: 2 }).notNull(),
  bookingCount: integer("booking_count").notNull(),
  avgAdr: decimal("avg_adr", { precision: 10, scale: 2 }),
  recommendation: text("recommendation"),
  snapshotDate: date("snapshot_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cancellation Alerts - high-risk booking flags
export const cancellationAlerts = pgTable("cancellation_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id").notNull(),
  bookingId: varchar("booking_id").notNull(),
  bookingRef: text("booking_ref").notNull(),
  guestName: text("guest_name").notNull(),
  arrivalDate: date("arrival_date").notNull(),
  riskScore: integer("risk_score").notNull(), // 0-100
  riskFactors: jsonb("risk_factors").notNull(), // Array of reasons
  suggestedAction: text("suggested_action"),
  status: text("status").default("active"), // active, resolved, false_positive
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications - system alerts and insights for users
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id"),
  type: text("type").notNull(), // insight, alert, system, pricing, forecast
  severity: text("severity").default("info"), // info, warning, critical, success
  title: text("title").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"), // Additional context like booking IDs, metrics
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"), // Where to navigate on click
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Generated Insights - detailed analytics insights
export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id").notNull(),
  category: text("category").notNull(), // revenue, occupancy, guests, risk, pricing, operations
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  detailedAnalysis: text("detailed_analysis").notNull(),
  metrics: jsonb("metrics").notNull(), // Key metrics with values
  recommendations: jsonb("recommendations").notNull(), // Action items
  impact: text("impact").notNull(), // high, medium, low
  confidence: integer("confidence").notNull(), // 0-100
  trend: text("trend"), // up, down, stable
  agentName: text("agent_name").notNull(), // Nova, Sterling, Atlas, Sage
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Query History - track user queries for context
export const aiQueries = pgTable("ai_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  datasetId: varchar("dataset_id"),
  query: text("query").notNull(),
  response: text("response").notNull(),
  metrics: jsonb("metrics"), // Supporting data used in response
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email Report Subscriptions - user preferences for automated reports
export const reportSubscriptions = pgTable("report_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  datasetId: varchar("dataset_id"),
  emailAddress: text("email_address").notNull(),
  frequency: text("frequency").notNull(), // daily, weekly
  reportTypes: text("report_types").array().notNull(), // kpis, forecasts, alerts, pricing
  isActive: boolean("is_active").default(true),
  lastSentAt: timestamp("last_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPricingRecommendationSchema = createInsertSchema(pricingRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertRevenueForecastSchema = createInsertSchema(revenueForecasts).omit({
  id: true,
  createdAt: true,
});

export const insertChannelSnapshotSchema = createInsertSchema(channelSnapshots).omit({
  id: true,
  createdAt: true,
});

export const insertCancellationAlertSchema = createInsertSchema(cancellationAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertReportSubscriptionSchema = createInsertSchema(reportSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
  createdAt: true,
});

export const insertAiQuerySchema = createInsertSchema(aiQueries).omit({
  id: true,
  createdAt: true,
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

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGuestStaySchema = createInsertSchema(guestStays).omit({
  id: true,
  createdAt: true,
});

// Types
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;

export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type InsertAnalyticsCache = z.infer<typeof insertAnalyticsCacheSchema>;

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;

export type GuestStay = typeof guestStays.$inferSelect;
export type InsertGuestStay = z.infer<typeof insertGuestStaySchema>;

export type PricingRecommendation = typeof pricingRecommendations.$inferSelect;
export type InsertPricingRecommendation = z.infer<typeof insertPricingRecommendationSchema>;

export type RevenueForecast = typeof revenueForecasts.$inferSelect;
export type InsertRevenueForecast = z.infer<typeof insertRevenueForecastSchema>;

export type ChannelSnapshot = typeof channelSnapshots.$inferSelect;
export type InsertChannelSnapshot = z.infer<typeof insertChannelSnapshotSchema>;

export type CancellationAlert = typeof cancellationAlerts.$inferSelect;
export type InsertCancellationAlert = z.infer<typeof insertCancellationAlertSchema>;

export type ReportSubscription = typeof reportSubscriptions.$inferSelect;
export type InsertReportSubscription = z.infer<typeof insertReportSubscriptionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;

export type AiQuery = typeof aiQueries.$inferSelect;
export type InsertAiQuery = z.infer<typeof insertAiQuerySchema>;
