import { db } from "./db";
import { bookings, guests, guestStays, type Booking, type InsertGuest, type InsertGuestStay } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

interface GuestExtractionResult {
  totalGuests: number;
  newGuests: number;
  updatedGuests: number;
  totalStays: number;
}

export class GuestExtractionService {
  
  async extractGuestsFromDataset(datasetId: string): Promise<GuestExtractionResult> {
    const datasetBookings = await db.select().from(bookings).where(eq(bookings.datasetId, datasetId));
    
    if (datasetBookings.length === 0) {
      return { totalGuests: 0, newGuests: 0, updatedGuests: 0, totalStays: 0 };
    }

    await db.delete(guestStays).where(eq(guestStays.datasetId, datasetId));
    await db.delete(guests).where(eq(guests.datasetId, datasetId));

    const guestMap = new Map<string, {
      bookings: Booking[];
      name: string;
      country: string | null;
    }>();

    for (const booking of datasetBookings) {
      const normalizedName = this.normalizeName(booking.guestName);
      
      if (!guestMap.has(normalizedName)) {
        guestMap.set(normalizedName, {
          bookings: [],
          name: booking.guestName,
          country: booking.guestCountry,
        });
      }
      guestMap.get(normalizedName)!.bookings.push(booking);
    }

    let newGuests = 0;
    let totalStays = 0;

    for (const [normalizedName, guestData] of Array.from(guestMap.entries())) {
      const guestProfile = this.calculateGuestMetrics(guestData.bookings, guestData.name, normalizedName, guestData.country, datasetId);
      
      const [insertedGuest] = await db.insert(guests).values(guestProfile).returning();
      newGuests++;

      const stays: InsertGuestStay[] = guestData.bookings.map((booking: Booking) => ({
        guestId: insertedGuest.id,
        bookingId: booking.id,
        datasetId: datasetId,
        arrivalDate: booking.arrivalDate,
        departureDate: booking.departureDate,
        roomType: booking.roomType,
        channel: booking.channel,
        marketSegment: booking.marketSegment,
        revenue: booking.totalAmount,
        adr: booking.adr,
        lengthOfStay: booking.lengthOfStay,
        leadTime: booking.leadTime,
        adults: booking.adults,
        children: booking.children,
        isCancelled: booking.isCancelled,
        isWeekend: this.isWeekendArrival(booking.arrivalDate),
      }));

      if (stays.length > 0) {
        await db.insert(guestStays).values(stays);
        totalStays += stays.length;
      }
    }

    return {
      totalGuests: guestMap.size,
      newGuests,
      updatedGuests: 0,
      totalStays,
    };
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private isWeekendArrival(dateStr: string): boolean {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  private calculateGuestMetrics(
    guestBookings: Booking[],
    name: string,
    normalizedName: string,
    country: string | null,
    datasetId: string
  ): InsertGuest {
    const confirmedBookings = guestBookings.filter(b => !b.isCancelled);
    const cancelledCount = guestBookings.filter(b => b.isCancelled).length;
    
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
    const totalBookings = guestBookings.length;
    const avgSpend = confirmedBookings.length > 0 ? totalRevenue / confirmedBookings.length : 0;
    
    const dates = guestBookings.map(b => new Date(b.arrivalDate)).sort((a, b) => a.getTime() - b.getTime());
    const firstBookingDate = dates[0]?.toISOString().split('T')[0];
    const lastBookingDate = dates[dates.length - 1]?.toISOString().split('T')[0];
    
    const avgLeadTime = guestBookings.reduce((sum, b) => sum + (b.leadTime || 0), 0) / totalBookings;
    const avgLengthOfStay = guestBookings.reduce((sum, b) => sum + b.lengthOfStay, 0) / totalBookings;
    
    const weekendBookings = guestBookings.filter(b => this.isWeekendArrival(b.arrivalDate)).length;
    const weekendRatio = weekendBookings / totalBookings;
    
    const channelCounts = new Map<string, number>();
    const roomTypeCounts = new Map<string, number>();
    const segmentCounts = new Map<string, number>();
    
    for (const booking of guestBookings) {
      channelCounts.set(booking.channel, (channelCounts.get(booking.channel) || 0) + 1);
      roomTypeCounts.set(booking.roomType, (roomTypeCounts.get(booking.roomType) || 0) + 1);
      if (booking.marketSegment) {
        segmentCounts.set(booking.marketSegment, (segmentCounts.get(booking.marketSegment) || 0) + 1);
      }
    }
    
    const preferredChannel = Array.from(channelCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const preferredRoomType = Array.from(roomTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topSegment = Array.from(segmentCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    const cancellationRate = (cancelledCount / totalBookings) * 100;
    const modificationCount = guestBookings.reduce((sum, b) => sum + (b.bookingChanges || 0), 0);
    
    const recencyScore = this.calculateRecencyScore(lastBookingDate);
    const frequencyScore = this.calculateFrequencyScore(totalBookings);
    const monetaryScore = this.calculateMonetaryScore(totalRevenue);
    const rfmScore = Math.round((recencyScore + frequencyScore + monetaryScore) / 3);
    
    const lifecycleStage = this.determineLifecycleStage(totalBookings, recencyScore, cancellationRate);
    const loyaltyTier = this.determineLoyaltyTier(totalBookings, totalRevenue, rfmScore);
    
    const guestType = topSegment?.toLowerCase().includes('corporate') ? 'corporate' : 'leisure';
    const travelType = this.determineTravelType(guestBookings);
    
    const clvScore = this.calculateCLV(avgSpend, totalBookings, recencyScore);
    const churnRiskScore = this.calculateChurnRisk(recencyScore, frequencyScore, cancellationRate);
    const retentionProbability = 100 - churnRiskScore;
    const upsellPropensity = this.calculateUpsellPropensity(avgSpend, frequencyScore, preferredRoomType);
    const ambassadorScore = this.calculateAmbassadorScore(frequencyScore, monetaryScore, cancellationRate);

    return {
      datasetId,
      name,
      normalizedName,
      country,
      firstBookingDate,
      lastBookingDate,
      totalBookings,
      cancelledBookings: cancelledCount,
      totalRevenue: totalRevenue.toFixed(2),
      averageSpend: avgSpend.toFixed(2),
      recencyScore,
      frequencyScore,
      monetaryScore,
      rfmScore,
      preferredChannel,
      preferredRoomType,
      avgLeadTime: avgLeadTime.toFixed(1),
      avgLengthOfStay: avgLengthOfStay.toFixed(1),
      weekendRatio: weekendRatio.toFixed(2),
      cancellationRate: cancellationRate.toFixed(2),
      modificationCount,
      lifecycleStage,
      loyaltyTier,
      guestType,
      travelType,
      clvScore: clvScore.toFixed(2),
      churnRiskScore: Math.round(churnRiskScore),
      upsellPropensity: Math.round(upsellPropensity),
      retentionProbability: Math.round(retentionProbability),
      ambassadorScore: Math.round(ambassadorScore),
    };
  }

  private calculateRecencyScore(lastBookingDate: string | undefined): number {
    if (!lastBookingDate) return 1;
    const daysSinceLast = Math.floor((Date.now() - new Date(lastBookingDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLast <= 30) return 5;
    if (daysSinceLast <= 90) return 4;
    if (daysSinceLast <= 180) return 3;
    if (daysSinceLast <= 365) return 2;
    return 1;
  }

  private calculateFrequencyScore(totalBookings: number): number {
    if (totalBookings >= 10) return 5;
    if (totalBookings >= 5) return 4;
    if (totalBookings >= 3) return 3;
    if (totalBookings >= 2) return 2;
    return 1;
  }

  private calculateMonetaryScore(totalRevenue: number): number {
    if (totalRevenue >= 5000) return 5;
    if (totalRevenue >= 2000) return 4;
    if (totalRevenue >= 1000) return 3;
    if (totalRevenue >= 500) return 2;
    return 1;
  }

  private determineLifecycleStage(totalBookings: number, recencyScore: number, cancellationRate: number): string {
    if (totalBookings === 1 && recencyScore >= 4) return "first_timer";
    if (totalBookings >= 5 && recencyScore >= 4) return "champion";
    if (totalBookings >= 3 && recencyScore >= 3) return "loyal";
    if (totalBookings >= 2 && recencyScore >= 3) return "returning";
    if (recencyScore <= 2 && totalBookings >= 2) return "at_risk";
    if (recencyScore === 1) return "churned";
    return "first_timer";
  }

  private determineLoyaltyTier(totalBookings: number, totalRevenue: number, rfmScore: number): string {
    if (rfmScore >= 4 && totalBookings >= 5 && totalRevenue >= 2000) return "platinum";
    if (rfmScore >= 4 || (totalBookings >= 3 && totalRevenue >= 1000)) return "gold";
    if (rfmScore >= 3 || totalBookings >= 2) return "silver";
    return "bronze";
  }

  private determineTravelType(guestBookings: Booking[]): string {
    const avgAdults = guestBookings.reduce((sum, b) => sum + b.adults, 0) / guestBookings.length;
    const avgChildren = guestBookings.reduce((sum, b) => sum + b.children, 0) / guestBookings.length;
    
    if (avgChildren > 0.5) return "family";
    if (avgAdults >= 3) return "group";
    if (avgAdults >= 1.5) return "couple";
    return "solo";
  }

  private calculateCLV(avgSpend: number, totalBookings: number, recencyScore: number): number {
    const annualFrequency = Math.min(totalBookings, 4);
    const retentionRate = recencyScore / 5;
    const avgCustomerLifespan = 3;
    return avgSpend * annualFrequency * retentionRate * avgCustomerLifespan;
  }

  private calculateChurnRisk(recencyScore: number, frequencyScore: number, cancellationRate: number): number {
    const recencyRisk = (5 - recencyScore) * 15;
    const frequencyRisk = (5 - frequencyScore) * 10;
    const cancellationRisk = Math.min(cancellationRate * 2, 30);
    return Math.min(100, Math.max(0, recencyRisk + frequencyRisk + cancellationRisk));
  }

  private calculateUpsellPropensity(avgSpend: number, frequencyScore: number, preferredRoomType: string | undefined): number {
    let score = 50;
    if (avgSpend > 300) score += 15;
    if (frequencyScore >= 3) score += 15;
    if (preferredRoomType?.toLowerCase().includes('suite') || preferredRoomType?.toLowerCase().includes('deluxe')) score += 10;
    return Math.min(100, score);
  }

  private calculateAmbassadorScore(frequencyScore: number, monetaryScore: number, cancellationRate: number): number {
    let score = ((frequencyScore + monetaryScore) / 2) * 20;
    if (cancellationRate > 20) score -= 20;
    return Math.min(100, Math.max(0, score));
  }

  async getGuestAnalytics(datasetId: string) {
    const allGuests = await db.select().from(guests).where(eq(guests.datasetId, datasetId));
    
    if (allGuests.length === 0) {
      return null;
    }

    const totalGuests = allGuests.length;
    const totalRevenue = allGuests.reduce((sum, g) => sum + parseFloat(g.totalRevenue || "0"), 0);
    const avgCLV = allGuests.reduce((sum, g) => sum + parseFloat(g.clvScore || "0"), 0) / totalGuests;
    
    const tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    const stageCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    
    let atRiskCount = 0;
    let vipCount = 0;
    let newCount = 0;
    let repeatCount = 0;

    for (const guest of allGuests) {
      const tier = guest.loyaltyTier || 'bronze';
      const stage = guest.lifecycleStage || 'first_timer';
      const travelType = guest.travelType || 'solo';
      
      if (tier in tierCounts) {
        tierCounts[tier as keyof typeof tierCounts]++;
      }
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      if (guest.country) {
        countryCounts[guest.country] = (countryCounts[guest.country] || 0) + 1;
      }
      typeCounts[travelType] = (typeCounts[travelType] || 0) + 1;
      
      if ((guest.churnRiskScore || 0) >= 70) atRiskCount++;
      if (tier === 'platinum' || tier === 'gold') vipCount++;
      if (guest.totalBookings === 1) newCount++;
      if ((guest.totalBookings || 0) >= 2) repeatCount++;
    }

    const topSpenders = allGuests
      .sort((a, b) => parseFloat(b.totalRevenue || "0") - parseFloat(a.totalRevenue || "0"))
      .slice(0, 10);

    const mostFrequent = allGuests
      .sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0))
      .slice(0, 10);

    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count, percent: Math.round((count / totalGuests) * 100) }));

    return {
      summary: {
        totalGuests,
        totalRevenue,
        avgCLV: Math.round(avgCLV),
        avgSpendPerGuest: Math.round(totalRevenue / totalGuests),
        vipCount,
        atRiskCount,
        newCount,
        repeatCount,
        repeatRate: Math.round((repeatCount / totalGuests) * 100),
      },
      tierDistribution: tierCounts,
      lifecycleDistribution: stageCounts,
      travelTypeDistribution: typeCounts,
      topCountries,
      topSpenders: topSpenders.map(g => ({
        id: g.id,
        name: g.name,
        country: g.country,
        totalRevenue: parseFloat(g.totalRevenue || "0"),
        totalBookings: g.totalBookings,
        loyaltyTier: g.loyaltyTier,
        clvScore: parseFloat(g.clvScore || "0"),
      })),
      mostFrequent: mostFrequent.map(g => ({
        id: g.id,
        name: g.name,
        country: g.country,
        totalBookings: g.totalBookings,
        totalRevenue: parseFloat(g.totalRevenue || "0"),
        loyaltyTier: g.loyaltyTier,
        avgSpend: parseFloat(g.averageSpend || "0"),
      })),
    };
  }
}

export const guestExtractionService = new GuestExtractionService();
