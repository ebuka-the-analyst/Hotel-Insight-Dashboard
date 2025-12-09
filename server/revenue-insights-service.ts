import { db } from "./db";
import {
  bookings,
  revenueForecasts,
  channelSnapshots,
  cancellationAlerts,
  type Booking,
  type InsertRevenueForecast,
  type InsertChannelSnapshot,
  type InsertCancellationAlert,
} from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

const CHANNEL_COMMISSION_RATES: Record<string, number> = {
  'Booking.com': 0.15,
  'Expedia': 0.18,
  'Hotels.com': 0.20,
  'Agoda': 0.17,
  'Direct': 0.00,
  'Corporate': 0.05,
  'GDS': 0.10,
  'Travel Agent': 0.12,
  'Phone': 0.02,
  'Walk-in': 0.00,
  'OTA': 0.16,
  'default': 0.12,
};

export class RevenueInsightsService {
  async generateRevenueForecasts(datasetId: string, daysAhead: number = 30): Promise<InsertRevenueForecast[]> {
    const historicalBookings = await db.select().from(bookings)
      .where(eq(bookings.datasetId, datasetId));
    
    if (historicalBookings.length === 0) {
      return [];
    }

    const dailyStats = this.aggregateDailyStats(historicalBookings);
    const forecasts: InsertRevenueForecast[] = [];
    
    const today = new Date();
    
    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      
      const dayOfWeek = forecastDate.getDay();
      const month = forecastDate.getMonth();
      
      const { avgRevenue, avgBookings, stdDev } = this.calculateSeasonalAverages(
        dailyStats, dayOfWeek, month
      );
      
      const seasonalMultiplier = this.getSeasonalMultiplier(month);
      const predictedRevenue = avgRevenue * seasonalMultiplier;
      const predictedBookings = Math.round(avgBookings * seasonalMultiplier);
      
      forecasts.push({
        datasetId,
        forecastDate: forecastDate.toISOString().split('T')[0],
        predictedRevenue: String(Math.round(predictedRevenue * 100) / 100),
        predictedBookings,
        predictedOccupancy: String(Math.min(95, Math.round((predictedBookings / 100) * 100))),
        confidenceLow: String(Math.round((predictedRevenue - stdDev * 1.5) * 100) / 100),
        confidenceHigh: String(Math.round((predictedRevenue + stdDev * 1.5) * 100) / 100),
      });
    }
    
    return forecasts;
  }

  async saveForecasts(forecasts: InsertRevenueForecast[]): Promise<void> {
    if (forecasts.length === 0) return;
    
    for (const forecast of forecasts) {
      await db.insert(revenueForecasts).values(forecast);
    }
  }

  async getForecasts(datasetId: string): Promise<any[]> {
    return await db.select().from(revenueForecasts)
      .where(eq(revenueForecasts.datasetId, datasetId))
      .orderBy(revenueForecasts.forecastDate);
  }

  async analyzeChannelPerformance(datasetId: string): Promise<InsertChannelSnapshot[]> {
    const allBookings = await db.select().from(bookings)
      .where(eq(bookings.datasetId, datasetId));
    
    if (allBookings.length === 0) {
      return [];
    }

    const channelStats = new Map<string, {
      grossRevenue: number;
      bookingCount: number;
      totalNights: number;
      cancelled: number;
    }>();

    allBookings.forEach(booking => {
      const channel = booking.channel;
      if (!channelStats.has(channel)) {
        channelStats.set(channel, {
          grossRevenue: 0,
          bookingCount: 0,
          totalNights: 0,
          cancelled: 0,
        });
      }
      
      const stats = channelStats.get(channel)!;
      stats.grossRevenue += Number(booking.totalAmount);
      stats.bookingCount += 1;
      stats.totalNights += booking.lengthOfStay;
      if (booking.isCancelled) stats.cancelled += 1;
    });

    const snapshots: InsertChannelSnapshot[] = [];
    const snapshotDate = new Date().toISOString().split('T')[0];

    channelStats.forEach((stats, channel) => {
      const commissionRate = CHANNEL_COMMISSION_RATES[channel] ?? CHANNEL_COMMISSION_RATES.default;
      const netRevenue = stats.grossRevenue * (1 - commissionRate);
      const avgAdr = stats.totalNights > 0 ? stats.grossRevenue / stats.totalNights : 0;
      const cancellationRate = stats.bookingCount > 0 ? stats.cancelled / stats.bookingCount : 0;

      const recommendation = this.generateChannelRecommendation(
        channel, commissionRate, netRevenue, avgAdr, cancellationRate
      );

      snapshots.push({
        datasetId,
        channel,
        grossRevenue: String(Math.round(stats.grossRevenue * 100) / 100),
        commissionRate: String(commissionRate),
        netRevenue: String(Math.round(netRevenue * 100) / 100),
        bookingCount: stats.bookingCount,
        avgAdr: String(Math.round(avgAdr * 100) / 100),
        recommendation,
        snapshotDate,
      });
    });

    return snapshots.sort((a, b) => Number(b.netRevenue) - Number(a.netRevenue));
  }

  async saveChannelSnapshots(snapshots: InsertChannelSnapshot[]): Promise<void> {
    if (snapshots.length === 0) return;
    
    for (const snapshot of snapshots) {
      await db.insert(channelSnapshots).values(snapshot);
    }
  }

  async getChannelSnapshots(datasetId: string): Promise<any[]> {
    return await db.select().from(channelSnapshots)
      .where(eq(channelSnapshots.datasetId, datasetId))
      .orderBy(desc(channelSnapshots.createdAt));
  }

  async identifyHighRiskBookings(datasetId: string): Promise<InsertCancellationAlert[]> {
    const allBookings = await db.select().from(bookings)
      .where(and(
        eq(bookings.datasetId, datasetId),
        eq(bookings.isCancelled, false)
      ));
    
    const alerts: InsertCancellationAlert[] = [];
    
    const channelCancellationRates = this.calculateChannelCancellationRates(allBookings);
    const guestCancellationHistory = this.getGuestCancellationHistory(allBookings);

    for (const booking of allBookings) {
      const { riskScore, riskFactors } = this.calculateCancellationRisk(
        booking,
        channelCancellationRates,
        guestCancellationHistory
      );
      
      if (riskScore >= 60) {
        alerts.push({
          datasetId,
          bookingId: booking.id,
          bookingRef: booking.bookingRef,
          guestName: booking.guestName,
          arrivalDate: booking.arrivalDate,
          riskScore,
          riskFactors,
          suggestedAction: this.getSuggestedAction(riskScore, riskFactors),
          status: 'active',
        });
      }
    }
    
    return alerts.sort((a, b) => b.riskScore - a.riskScore);
  }

  async saveCancellationAlerts(alerts: InsertCancellationAlert[]): Promise<void> {
    if (alerts.length === 0) return;
    
    for (const alert of alerts) {
      await db.insert(cancellationAlerts).values(alert);
    }
  }

  async getCancellationAlerts(datasetId: string, status?: string): Promise<any[]> {
    const conditions = [eq(cancellationAlerts.datasetId, datasetId)];
    if (status) {
      conditions.push(eq(cancellationAlerts.status, status));
    }
    
    return await db.select().from(cancellationAlerts)
      .where(and(...conditions))
      .orderBy(desc(cancellationAlerts.riskScore));
  }

  async updateAlertStatus(alertId: string, status: string): Promise<any> {
    await db.update(cancellationAlerts)
      .set({ status })
      .where(eq(cancellationAlerts.id, alertId));
    
    const [updated] = await db.select().from(cancellationAlerts)
      .where(eq(cancellationAlerts.id, alertId));
    return updated;
  }

  private aggregateDailyStats(bookingsList: Booking[]): Map<string, { revenue: number; count: number }> {
    const dailyStats = new Map<string, { revenue: number; count: number }>();
    
    bookingsList.forEach(booking => {
      const date = booking.arrivalDate;
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { revenue: 0, count: 0 });
      }
      const stats = dailyStats.get(date)!;
      stats.revenue += Number(booking.totalAmount);
      stats.count += 1;
    });
    
    return dailyStats;
  }

  private calculateSeasonalAverages(
    dailyStats: Map<string, { revenue: number; count: number }>,
    targetDayOfWeek: number,
    targetMonth: number
  ): { avgRevenue: number; avgBookings: number; stdDev: number } {
    const matchingDays: { revenue: number; count: number }[] = [];
    
    dailyStats.forEach((stats, dateStr) => {
      const date = new Date(dateStr);
      if (date.getDay() === targetDayOfWeek && date.getMonth() === targetMonth) {
        matchingDays.push(stats);
      }
    });
    
    if (matchingDays.length === 0) {
      dailyStats.forEach((stats) => {
        matchingDays.push(stats);
      });
    }
    
    if (matchingDays.length === 0) {
      return { avgRevenue: 0, avgBookings: 0, stdDev: 0 };
    }
    
    const avgRevenue = matchingDays.reduce((sum, d) => sum + d.revenue, 0) / matchingDays.length;
    const avgBookings = matchingDays.reduce((sum, d) => sum + d.count, 0) / matchingDays.length;
    
    const variance = matchingDays.reduce((sum, d) => sum + Math.pow(d.revenue - avgRevenue, 2), 0) / matchingDays.length;
    const stdDev = Math.sqrt(variance);
    
    return { avgRevenue, avgBookings, stdDev };
  }

  private getSeasonalMultiplier(month: number): number {
    const seasonalFactors: Record<number, number> = {
      0: 0.8,   // January
      1: 0.75,  // February
      2: 0.9,   // March
      3: 1.0,   // April
      4: 1.1,   // May
      5: 1.3,   // June
      6: 1.4,   // July
      7: 1.4,   // August
      8: 1.1,   // September
      9: 1.0,   // October
      10: 0.85, // November
      11: 1.2,  // December
    };
    return seasonalFactors[month] ?? 1.0;
  }

  private generateChannelRecommendation(
    channel: string,
    commissionRate: number,
    netRevenue: number,
    avgAdr: number,
    cancellationRate: number
  ): string {
    if (channel === 'Direct' || channel === 'Walk-in') {
      return 'Maximize direct bookings - best margin channel';
    }
    
    if (commissionRate > 0.18) {
      return `High commission (${(commissionRate * 100).toFixed(0)}%) - consider negotiating rates or reducing allocation`;
    }
    
    if (cancellationRate > 0.3) {
      return `High cancellation rate (${(cancellationRate * 100).toFixed(0)}%) - review booking policies for this channel`;
    }
    
    if (avgAdr < 100) {
      return 'Low ADR - consider rate parity enforcement or premium positioning';
    }
    
    return 'Channel performing well - maintain current strategy';
  }

  private calculateChannelCancellationRates(bookingsList: Booking[]): Map<string, number> {
    const channelStats = new Map<string, { total: number; cancelled: number }>();
    
    bookingsList.forEach(booking => {
      if (!channelStats.has(booking.channel)) {
        channelStats.set(booking.channel, { total: 0, cancelled: 0 });
      }
      const stats = channelStats.get(booking.channel)!;
      stats.total += 1;
      if (booking.isCancelled) stats.cancelled += 1;
    });
    
    const rates = new Map<string, number>();
    channelStats.forEach((stats, channel) => {
      rates.set(channel, stats.total > 0 ? stats.cancelled / stats.total : 0);
    });
    
    return rates;
  }

  private getGuestCancellationHistory(bookingsList: Booking[]): Map<string, { total: number; cancelled: number }> {
    const guestHistory = new Map<string, { total: number; cancelled: number }>();
    
    bookingsList.forEach(booking => {
      const name = booking.guestName.toLowerCase().trim();
      if (!guestHistory.has(name)) {
        guestHistory.set(name, { total: 0, cancelled: 0 });
      }
      const stats = guestHistory.get(name)!;
      stats.total += 1;
      if (booking.isCancelled) stats.cancelled += 1;
    });
    
    return guestHistory;
  }

  private calculateCancellationRisk(
    booking: Booking,
    channelRates: Map<string, number>,
    guestHistory: Map<string, { total: number; cancelled: number }>
  ): { riskScore: number; riskFactors: string[] } {
    let riskScore = 0;
    const riskFactors: string[] = [];

    const leadTime = booking.leadTime ?? 0;
    if (leadTime > 60) {
      riskScore += 20;
      riskFactors.push(`Long lead time (${leadTime} days)`);
    } else if (leadTime > 30) {
      riskScore += 10;
      riskFactors.push(`Moderate lead time (${leadTime} days)`);
    }

    const channelRate = channelRates.get(booking.channel) ?? 0;
    if (channelRate > 0.3) {
      riskScore += 25;
      riskFactors.push(`High-risk channel (${(channelRate * 100).toFixed(0)}% cancellation rate)`);
    } else if (channelRate > 0.2) {
      riskScore += 15;
      riskFactors.push(`Moderate channel risk`);
    }

    const guestName = booking.guestName.toLowerCase().trim();
    const history = guestHistory.get(guestName);
    if (history && history.total > 1) {
      const guestCancelRate = history.cancelled / history.total;
      if (guestCancelRate > 0.5) {
        riskScore += 30;
        riskFactors.push(`Guest history: ${(guestCancelRate * 100).toFixed(0)}% cancellation rate`);
      } else if (guestCancelRate > 0.25) {
        riskScore += 15;
        riskFactors.push(`Guest has previous cancellations`);
      }
    }

    if (booking.depositType === 'No Deposit' || !booking.depositType) {
      riskScore += 15;
      riskFactors.push('No deposit required');
    }

    if (booking.lengthOfStay > 7) {
      riskScore += 10;
      riskFactors.push(`Extended stay (${booking.lengthOfStay} nights)`);
    }

    if (booking.bookingChanges && booking.bookingChanges > 2) {
      riskScore += 10;
      riskFactors.push(`Multiple booking modifications (${booking.bookingChanges})`);
    }

    return { 
      riskScore: Math.min(100, riskScore), 
      riskFactors 
    };
  }

  private getSuggestedAction(riskScore: number, riskFactors: string[]): string {
    if (riskScore >= 80) {
      return 'Immediate follow-up recommended: Call guest to confirm booking and consider requiring deposit';
    }
    
    if (riskScore >= 70) {
      return 'Send confirmation reminder email and verify guest contact information';
    }
    
    if (riskScore >= 60) {
      return 'Monitor booking closely and prepare for potential overbooking strategy';
    }
    
    return 'Standard monitoring - no immediate action required';
  }

  async getRevenueInsightsSummary(datasetId: string): Promise<{
    forecasts: any[];
    channelSnapshots: any[];
    cancellationAlerts: any[];
    summary: {
      totalForecastedRevenue: number;
      topChannel: string;
      highRiskBookings: number;
      potentialRevenueAtRisk: number;
    };
  }> {
    const [forecasts, channels, alerts] = await Promise.all([
      this.getForecasts(datasetId),
      this.getChannelSnapshots(datasetId),
      this.getCancellationAlerts(datasetId, 'active'),
    ]);

    const totalForecastedRevenue = forecasts.reduce(
      (sum, f) => sum + Number(f.predictedRevenue), 0
    );

    const topChannel = channels.length > 0 
      ? channels[0].channel 
      : 'N/A';

    const highRiskBookings = alerts.length;

    const allBookings = await db.select().from(bookings)
      .where(eq(bookings.datasetId, datasetId));
    
    const potentialRevenueAtRisk = alerts.reduce((sum, alert) => {
      const booking = allBookings.find(b => b.id === alert.bookingId);
      return sum + (booking ? Number(booking.totalAmount) : 0);
    }, 0);

    return {
      forecasts: forecasts.slice(0, 14),
      channelSnapshots: channels,
      cancellationAlerts: alerts.slice(0, 20),
      summary: {
        totalForecastedRevenue,
        topChannel,
        highRiskBookings,
        potentialRevenueAtRisk,
      },
    };
  }
}

export const revenueInsightsService = new RevenueInsightsService();
