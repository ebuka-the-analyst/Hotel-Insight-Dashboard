import { db } from "./db";
import { bookings, datasets, analyticsCache, users, emailOtps, type Booking, type InsertBooking, type Dataset, type InsertDataset, type AnalyticsCache, type InsertAnalyticsCache, type User, type UpsertUser, type EmailOtp, type InsertEmailOtp } from "@shared/schema";
import { eq, sql, and, gte, lte, desc, lt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // OTP operations
  createOtp(data: InsertEmailOtp): Promise<EmailOtp>;
  getValidOtp(email: string): Promise<EmailOtp | undefined>;
  markOtpUsed(id: string): Promise<void>;
  incrementOtpAttempts(id: string): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;
  
  // Dataset operations
  createDataset(data: InsertDataset): Promise<Dataset>;
  getDatasets(): Promise<Dataset[]>;
  getDataset(id: string): Promise<Dataset | undefined>;
  updateDatasetStatus(id: string, status: string, processedAt?: Date): Promise<void>;
  
  // Booking operations
  createBookings(bookingData: InsertBooking[]): Promise<void>;
  getBookings(datasetId?: string): Promise<Booking[]>;
  getBookingsByDateRange(startDate: Date, endDate: Date, datasetId?: string): Promise<Booking[]>;
  
  // Analytics operations
  getAnalytics(datasetId?: string): Promise<any>;
  getTrends(datasetId?: string): Promise<any>;
  getChannelPerformance(datasetId?: string): Promise<any>;
  
  // Analytics cache operations
  getCachedAnalytics(datasetId: string, metricType: string): Promise<AnalyticsCache | undefined>;
  setCachedAnalytics(data: InsertAnalyticsCache): Promise<AnalyticsCache>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Dataset operations
  async createDataset(data: InsertDataset): Promise<Dataset> {
    const [dataset] = await db.insert(datasets).values(data).returning();
    return dataset;
  }

  async getDatasets(): Promise<Dataset[]> {
    return await db.select().from(datasets).orderBy(desc(datasets.uploadedAt));
  }

  async getDataset(id: string): Promise<Dataset | undefined> {
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id));
    return dataset;
  }

  async updateDatasetStatus(id: string, status: string, processedAt?: Date): Promise<void> {
    await db.update(datasets)
      .set({ status, processedAt })
      .where(eq(datasets.id, id));
  }

  // Booking operations
  async createBookings(bookingData: InsertBooking[]): Promise<void> {
    if (bookingData.length === 0) return;
    
    // Insert in batches of 100 for better performance
    const batchSize = 100;
    for (let i = 0; i < bookingData.length; i += batchSize) {
      const batch = bookingData.slice(i, i + batchSize);
      await db.insert(bookings).values(batch);
    }
  }

  async getBookings(datasetId?: string): Promise<Booking[]> {
    if (datasetId) {
      return await db.select().from(bookings).where(eq(bookings.datasetId, datasetId));
    }
    return await db.select().from(bookings);
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date, datasetId?: string): Promise<Booking[]> {
    const conditions = [
      gte(bookings.arrivalDate, startDate.toISOString().split('T')[0]),
      lte(bookings.arrivalDate, endDate.toISOString().split('T')[0])
    ];
    
    if (datasetId) {
      conditions.push(eq(bookings.datasetId, datasetId));
    }
    
    return await db.select().from(bookings).where(and(...conditions));
  }

  // Analytics operations
  async getAnalytics(datasetId?: string): Promise<any> {
    const query = datasetId 
      ? db.select().from(bookings).where(eq(bookings.datasetId, datasetId))
      : db.select().from(bookings);
    
    const allBookings = await query;
    
    if (allBookings.length === 0) {
      return this.getEmptyAnalytics();
    }

    const totalRevenue = allBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const totalNights = allBookings.reduce((sum, b) => sum + b.lengthOfStay, 0);
    const confirmedBookings = allBookings.filter(b => b.bookingStatus === 'Confirmed' && !b.isCancelled);
    const cancelledBookings = allBookings.filter(b => b.isCancelled || b.bookingStatus === 'Cancelled');
    
    const avgADR = totalRevenue / totalNights;
    const avgLeadTime = allBookings.reduce((sum, b) => sum + (b.leadTime || 0), 0) / allBookings.length;
    const avgLOS = totalNights / allBookings.length;
    const cancellationRate = (cancelledBookings.length / allBookings.length) * 100;
    const repeatGuestRate = (allBookings.filter(b => b.isRepeatedGuest).length / allBookings.length) * 100;

    // Channel breakdown
    const channelStats = this.groupByChannel(allBookings);
    
    // Market segment breakdown
    const segmentStats = this.groupBySegment(allBookings);

    return {
      kpis: {
        totalRevenue,
        totalBookings: allBookings.length,
        confirmedBookings: confirmedBookings.length,
        cancelledBookings: cancelledBookings.length,
        avgADR,
        avgLeadTime,
        avgLOS,
        cancellationRate,
        repeatGuestRate,
        totalNights,
      },
      channels: channelStats,
      segments: segmentStats,
    };
  }

  async getTrends(datasetId?: string): Promise<any> {
    const query = datasetId 
      ? db.select().from(bookings).where(eq(bookings.datasetId, datasetId))
      : db.select().from(bookings);
    
    const allBookings = await query;
    
    if (allBookings.length === 0) {
      return { daily: [], weekly: [], monthly: [] };
    }

    // Group by arrival date for daily trends
    const dailyMap = new Map<string, any>();
    
    allBookings.forEach(booking => {
      const date = booking.arrivalDate;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          revenue: 0,
          bookings: 0,
          nights: 0,
          adr: 0,
        });
      }
      
      const day = dailyMap.get(date)!;
      day.revenue += Number(booking.totalAmount);
      day.bookings += 1;
      day.nights += booking.lengthOfStay;
    });

    const daily = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        ...day,
        adr: day.nights > 0 ? day.revenue / day.nights : 0,
      }));

    return { daily, weekly: [], monthly: [] };
  }

  async getChannelPerformance(datasetId?: string): Promise<any> {
    const query = datasetId 
      ? db.select().from(bookings).where(eq(bookings.datasetId, datasetId))
      : db.select().from(bookings);
    
    const allBookings = await query;
    return this.groupByChannel(allBookings);
  }

  // Analytics cache operations
  async getCachedAnalytics(datasetId: string, metricType: string): Promise<AnalyticsCache | undefined> {
    const [cache] = await db.select()
      .from(analyticsCache)
      .where(and(
        eq(analyticsCache.datasetId, datasetId),
        eq(analyticsCache.metricType, metricType)
      ))
      .orderBy(desc(analyticsCache.computedAt))
      .limit(1);
    
    return cache;
  }

  async setCachedAnalytics(data: InsertAnalyticsCache): Promise<AnalyticsCache> {
    const [cache] = await db.insert(analyticsCache).values(data).returning();
    return cache;
  }

  // Helper methods
  private groupByChannel(bookings: Booking[]): any[] {
    const channelMap = new Map<string, any>();
    
    bookings.forEach(booking => {
      const channel = booking.channel;
      if (!channelMap.has(channel)) {
        channelMap.set(channel, {
          channel,
          revenue: 0,
          bookings: 0,
          cancelled: 0,
          avgADR: 0,
          totalNights: 0,
        });
      }
      
      const stats = channelMap.get(channel)!;
      stats.revenue += Number(booking.totalAmount);
      stats.bookings += 1;
      stats.totalNights += booking.lengthOfStay;
      if (booking.isCancelled) stats.cancelled += 1;
    });

    return Array.from(channelMap.values()).map(stats => ({
      ...stats,
      avgADR: stats.totalNights > 0 ? stats.revenue / stats.totalNights : 0,
      cancellationRate: stats.bookings > 0 ? (stats.cancelled / stats.bookings) * 100 : 0,
    }));
  }

  private groupBySegment(bookings: Booking[]): any[] {
    const segmentMap = new Map<string, any>();
    
    bookings.forEach(booking => {
      const segment = booking.marketSegment || 'Unknown';
      if (!segmentMap.has(segment)) {
        segmentMap.set(segment, {
          segment,
          revenue: 0,
          bookings: 0,
          totalNights: 0,
        });
      }
      
      const stats = segmentMap.get(segment)!;
      stats.revenue += Number(booking.totalAmount);
      stats.bookings += 1;
      stats.totalNights += booking.lengthOfStay;
    });

    return Array.from(segmentMap.values()).map(stats => ({
      ...stats,
      avgADR: stats.totalNights > 0 ? stats.revenue / stats.totalNights : 0,
    }));
  }

  private getEmptyAnalytics() {
    return {
      kpis: {
        totalRevenue: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        avgADR: 0,
        avgLeadTime: 0,
        avgLOS: 0,
        cancellationRate: 0,
        repeatGuestRate: 0,
        totalNights: 0,
      },
      channels: [],
      segments: [],
    };
  }
}

export const storage = new DatabaseStorage();
