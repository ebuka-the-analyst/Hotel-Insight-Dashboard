import { db } from "./db";
import { bookings, datasets, analyticsCache, users, guests, guestStays, type Booking, type InsertBooking, type Dataset, type InsertDataset, type AnalyticsCache, type InsertAnalyticsCache, type User, type UpsertUser, type Guest, type InsertGuest, type GuestStay } from "@shared/schema";
import { eq, sql, and, gte, lte, desc, asc, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  
  // Dataset operations
  createDataset(data: InsertDataset): Promise<Dataset>;
  getDatasets(): Promise<Dataset[]>;
  getDataset(id: string): Promise<Dataset | undefined>;
  updateDatasetStatus(id: string, status: string, processedAt?: Date): Promise<void>;
  deleteDataset(id: string): Promise<void>;
  
  // Booking operations
  createBookings(bookingData: InsertBooking[]): Promise<void>;
  getBookings(datasetId?: string, startDate?: string, endDate?: string): Promise<Booking[]>;
  getBookingsByDateRange(startDate: Date, endDate: Date, datasetId?: string): Promise<Booking[]>;
  
  // Analytics operations
  getAnalytics(datasetId?: string, startDate?: string, endDate?: string): Promise<any>;
  getTrends(datasetId?: string, startDate?: string, endDate?: string): Promise<any>;
  getChannelPerformance(datasetId?: string, startDate?: string, endDate?: string): Promise<any>;
  
  // Analytics cache operations
  getCachedAnalytics(datasetId: string, metricType: string): Promise<AnalyticsCache | undefined>;
  setCachedAnalytics(data: InsertAnalyticsCache): Promise<AnalyticsCache>;
  
  // Guest operations
  createGuests(guestData: InsertGuest[]): Promise<void>;
  getGuests(datasetId: string, options?: { limit?: number; offset?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<{ guests: Guest[]; total: number }>;
  getGuest(id: string): Promise<Guest | undefined>;
  getGuestByName(datasetId: string, normalizedName: string): Promise<Guest | undefined>;
  updateGuest(id: string, data: Partial<InsertGuest>): Promise<Guest | undefined>;
  deleteGuestsByDataset(datasetId: string): Promise<void>;
  getGuestCount(datasetId: string): Promise<number>;
  getTopGuestsByRevenue(datasetId: string, limit?: number): Promise<Guest[]>;
  getTopGuestsByBookings(datasetId: string, limit?: number): Promise<Guest[]>;
  getGuestsByLifecycleStage(datasetId: string): Promise<{ stage: string; count: number }[]>;
  getGuestsByLoyaltyTier(datasetId: string): Promise<{ tier: string; count: number; avgRevenue: number }[]>;
  getGuestStays(guestId: string): Promise<GuestStay[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async deleteDataset(id: string): Promise<void> {
    // Cascade delete in a transaction for data integrity
    await db.transaction(async (tx) => {
      await tx.delete(bookings).where(eq(bookings.datasetId, id));
      await tx.delete(guests).where(eq(guests.datasetId, id));
      await tx.delete(analyticsCache).where(eq(analyticsCache.datasetId, id));
      await tx.delete(datasets).where(eq(datasets.id, id));
    });
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

  async getBookings(datasetId?: string, startDate?: string, endDate?: string): Promise<Booking[]> {
    const conditions: any[] = [];
    if (datasetId) conditions.push(eq(bookings.datasetId, datasetId));
    if (startDate) conditions.push(gte(bookings.arrivalDate, startDate));
    if (endDate) conditions.push(lte(bookings.arrivalDate, endDate));
    
    if (conditions.length > 0) {
      return await db.select().from(bookings).where(and(...conditions));
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
  async getAnalytics(datasetId?: string, startDate?: string, endDate?: string): Promise<any> {
    const conditions: any[] = [];
    if (datasetId) conditions.push(eq(bookings.datasetId, datasetId));
    if (startDate) conditions.push(gte(bookings.arrivalDate, startDate));
    if (endDate) conditions.push(lte(bookings.arrivalDate, endDate));
    
    const allBookings = conditions.length > 0
      ? await db.select().from(bookings).where(and(...conditions))
      : await db.select().from(bookings);
    
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

  async getTrends(datasetId?: string, startDate?: string, endDate?: string): Promise<any> {
    const conditions: any[] = [];
    if (datasetId) conditions.push(eq(bookings.datasetId, datasetId));
    if (startDate) conditions.push(gte(bookings.arrivalDate, startDate));
    if (endDate) conditions.push(lte(bookings.arrivalDate, endDate));
    
    const allBookings = conditions.length > 0
      ? await db.select().from(bookings).where(and(...conditions))
      : await db.select().from(bookings);
    
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

  async getChannelPerformance(datasetId?: string, startDate?: string, endDate?: string): Promise<any> {
    const conditions: any[] = [];
    if (datasetId) conditions.push(eq(bookings.datasetId, datasetId));
    if (startDate) conditions.push(gte(bookings.arrivalDate, startDate));
    if (endDate) conditions.push(lte(bookings.arrivalDate, endDate));
    
    const allBookings = conditions.length > 0
      ? await db.select().from(bookings).where(and(...conditions))
      : await db.select().from(bookings);
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

  // Guest operations
  async createGuests(guestData: InsertGuest[]): Promise<void> {
    if (guestData.length === 0) return;
    
    const batchSize = 100;
    for (let i = 0; i < guestData.length; i += batchSize) {
      const batch = guestData.slice(i, i + batchSize);
      await db.insert(guests).values(batch);
    }
  }

  async getGuests(datasetId: string, options?: { limit?: number; offset?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<{ guests: Guest[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    let conditions = [eq(guests.datasetId, datasetId)];
    
    if (options?.search) {
      conditions.push(ilike(guests.name, `%${options.search}%`));
    }
    
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(guests)
      .where(and(...conditions));
    
    const total = Number(countResult?.count || 0);
    
    let query = db.select().from(guests).where(and(...conditions));
    
    const sortOrder = options?.sortOrder === 'asc' ? asc : desc;
    const sortBy = options?.sortBy || 'totalRevenue';
    
    if (sortBy === 'totalRevenue') {
      query = query.orderBy(sortOrder(guests.totalRevenue));
    } else if (sortBy === 'totalBookings') {
      query = query.orderBy(sortOrder(guests.totalBookings));
    } else if (sortBy === 'name') {
      query = query.orderBy(sortOrder(guests.name));
    } else if (sortBy === 'rfmScore') {
      query = query.orderBy(sortOrder(guests.rfmScore));
    } else if (sortBy === 'clvScore') {
      query = query.orderBy(sortOrder(guests.clvScore));
    } else {
      query = query.orderBy(desc(guests.totalRevenue));
    }
    
    const result = await query.limit(limit).offset(offset);
    
    return { guests: result, total };
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    const [guest] = await db.select().from(guests).where(eq(guests.id, id));
    return guest;
  }

  async getGuestByName(datasetId: string, normalizedName: string): Promise<Guest | undefined> {
    const [guest] = await db.select().from(guests)
      .where(and(eq(guests.datasetId, datasetId), eq(guests.normalizedName, normalizedName)));
    return guest;
  }

  async updateGuest(id: string, data: Partial<InsertGuest>): Promise<Guest | undefined> {
    const [updated] = await db.update(guests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(guests.id, id))
      .returning();
    return updated;
  }

  async deleteGuestsByDataset(datasetId: string): Promise<void> {
    await db.delete(guests).where(eq(guests.datasetId, datasetId));
  }

  async getGuestCount(datasetId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(guests)
      .where(eq(guests.datasetId, datasetId));
    return Number(result?.count || 0);
  }

  async getTopGuestsByRevenue(datasetId: string, limit: number = 10): Promise<Guest[]> {
    return await db.select().from(guests)
      .where(eq(guests.datasetId, datasetId))
      .orderBy(desc(guests.totalRevenue))
      .limit(limit);
  }

  async getTopGuestsByBookings(datasetId: string, limit: number = 10): Promise<Guest[]> {
    return await db.select().from(guests)
      .where(eq(guests.datasetId, datasetId))
      .orderBy(desc(guests.totalBookings))
      .limit(limit);
  }

  async getGuestsByLifecycleStage(datasetId: string): Promise<{ stage: string; count: number }[]> {
    const result = await db.select({
      stage: guests.lifecycleStage,
      count: sql<number>`count(*)`
    })
      .from(guests)
      .where(eq(guests.datasetId, datasetId))
      .groupBy(guests.lifecycleStage);
    
    return result.map(r => ({ stage: r.stage || 'unknown', count: Number(r.count) }));
  }

  async getGuestsByLoyaltyTier(datasetId: string): Promise<{ tier: string; count: number; avgRevenue: number }[]> {
    const result = await db.select({
      tier: guests.loyaltyTier,
      count: sql<number>`count(*)`,
      avgRevenue: sql<number>`avg(${guests.totalRevenue})`
    })
      .from(guests)
      .where(eq(guests.datasetId, datasetId))
      .groupBy(guests.loyaltyTier);
    
    return result.map(r => ({ 
      tier: r.tier || 'bronze', 
      count: Number(r.count),
      avgRevenue: Number(r.avgRevenue || 0)
    }));
  }

  async getGuestStays(guestId: string): Promise<GuestStay[]> {
    return await db.select().from(guestStays)
      .where(eq(guestStays.guestId, guestId))
      .orderBy(desc(guestStays.arrivalDate));
  }
}

export const storage = new DatabaseStorage();
