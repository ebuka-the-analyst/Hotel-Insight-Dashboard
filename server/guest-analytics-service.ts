import { Booking, Guest, InsertGuest } from "@shared/schema";

// ===== GUEST ANALYTICS INTERFACES =====

export interface GuestLifecycleAnalytics {
  firstTimerVsReturnerBreakdown: { firstTimers: number; returners: number; firstTimerPercent: number; returnerPercent: number };
  lifecycleStageDistribution: { stage: string; count: number; percent: number; avgRevenue: number }[];
  acquisitionCohorts: { cohort: string; guestCount: number; totalRevenue: number; avgBookings: number }[];
  timeToReturnAnalysis: { bucket: string; count: number; avgDays: number }[];
  guestJourneyMap: { stage: string; guests: number; avgValue: number; nextStageConversion: number }[];
}

export interface GuestValueAnalytics {
  rfmDistribution: { score: number; count: number; avgRevenue: number }[];
  clvAnalysis: { tier: string; count: number; avgCLV: number; totalCLV: number }[];
  revenueDeciles: { decile: string; guestCount: number; revenue: number; percent: number }[];
  highValueProfiles: { guestId: string; name: string; revenue: number; bookings: number; rfmScore: number; clv: number }[];
  whaleAnalysis: { top10Percent: { count: number; revenue: number; percent: number }; top20Percent: { count: number; revenue: number; percent: number }; pareto: { whaleCount: number; whaleRevenuePercent: number } };
}

export interface GuestBehavioralAnalytics {
  channelLoyalty: { channel: string; loyalGuestCount: number; avgBookingsPerGuest: number; revenueContribution: number }[];
  roomTypeAffinity: { roomType: string; guestCount: number; avgStays: number; avgRevenue: number }[];
  dayOfWeekPreferences: { day: string; preferenceScore: number; guestCount: number }[];
  seasonalityFingerprint: { season: string; guestActivity: number; revenueShare: number }[];
  leadTimeBehavior: { type: string; avgLeadTime: number; guestCount: number }[];
  lengthOfStayPatterns: { pattern: string; avgLOS: number; guestCount: number; revenueImpact: number }[];
}

export interface GuestRiskAnalytics {
  cancellationRiskScores: { riskLevel: string; count: number; percent: number; avgRate: number }[];
  noShowProbability: { riskLevel: string; count: number; percent: number }[];
  modificationFrequency: { frequency: string; count: number; percent: number }[];
  paymentReliability: { score: string; count: number; percent: number }[];
}

export interface GuestGeographicAnalytics {
  originMapping: { country: string; guestCount: number; revenue: number; avgSpend: number }[];
  domesticVsInternational: { domestic: number; international: number; domesticRevenue: number; internationalRevenue: number };
  corporateVsLeisure: { corporate: number; leisure: number; corporateRevenue: number; leisureRevenue: number };
  familyVsSoloPatterns: { type: string; count: number; avgSpend: number; avgLOS: number }[];
}

export interface GuestEngagementAnalytics {
  tenureDistribution: { tenureBucket: string; count: number; avgRevenue: number }[];
  frequencyScores: { score: number; count: number; avgRevenue: number }[];
  loyaltyTierBreakdown: { tier: string; count: number; revenue: number; avgCLV: number }[];
  churnRiskIndicators: { risk: string; count: number; percent: number; avgDaysSinceLastVisit: number }[];
  winBackCandidates: { guestId: string; name: string; lastVisit: string; potentialValue: number; daysSinceVisit: number }[];
  ambassadorScores: { scoreRange: string; count: number; characteristics: string }[];
}

export interface GuestComparativeAnalytics {
  guestVsCohortComparison: { metric: string; guestAvg: number; cohortAvg: number; percentile: number }[];
  guestRankingLeaderboard: { rank: number; guestId: string; name: string; score: number; metric: string }[];
  peerBenchmarking: { segment: string; avgSpend: number; avgBookings: number; topPerformerSpend: number }[];
}

export interface GuestPredictiveAnalytics {
  nextVisitPrediction: { likelihood: string; count: number; avgDaysToVisit: number }[];
  upsellPropensityScores: { score: string; count: number; recommendedAction: string }[];
  retentionProbability: { probability: string; count: number; avgValue: number }[];
}

export interface ComprehensiveGuestAnalytics {
  lifecycle: GuestLifecycleAnalytics;
  value: GuestValueAnalytics;
  behavioral: GuestBehavioralAnalytics;
  risk: GuestRiskAnalytics;
  geographic: GuestGeographicAnalytics;
  engagement: GuestEngagementAnalytics;
  comparative: GuestComparativeAnalytics;
  predictive: GuestPredictiveAnalytics;
  summary: {
    totalGuests: number;
    totalRevenue: number;
    avgGuestValue: number;
    repeatGuestRate: number;
    topPerformingSegment: string;
    highRiskGuestPercent: number;
  };
}

// ===== HELPER FUNCTIONS =====

function normalizeGuestName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function getMonth(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(dateStr);
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getDayOfWeek(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateStr).getDay()];
}

function getSeason(dateStr: string): string {
  const month = new Date(dateStr).getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

function calculateRFMScore(recency: number, frequency: number, monetary: number): number {
  return Math.round((recency + frequency + monetary) / 3);
}

function getLifecycleStage(totalBookings: number, daysSinceLastBooking: number, cancelledBookings: number): string {
  const cancellationRate = totalBookings > 0 ? cancelledBookings / totalBookings : 0;
  
  if (totalBookings === 1 && daysSinceLastBooking < 365) return 'first_timer';
  if (totalBookings >= 10 && cancellationRate < 0.1) return 'champion';
  if (totalBookings >= 5 && cancellationRate < 0.2) return 'loyal';
  if (totalBookings >= 2 && daysSinceLastBooking < 180) return 'returning';
  if (daysSinceLastBooking > 365) return 'churned';
  if (daysSinceLastBooking > 180) return 'at_risk';
  return 'returning';
}

function getLoyaltyTier(rfmScore: number, totalBookings: number): string {
  if (rfmScore >= 4 && totalBookings >= 10) return 'platinum';
  if (rfmScore >= 3 && totalBookings >= 5) return 'gold';
  if (rfmScore >= 2 && totalBookings >= 2) return 'silver';
  return 'bronze';
}

function getGuestType(segment: string): string {
  const lower = segment?.toLowerCase() || '';
  if (lower.includes('corporate') || lower.includes('business')) return 'corporate';
  return 'leisure';
}

function getTravelType(adults: number, children: number): string {
  const total = adults + children;
  if (total === 1) return 'solo';
  if (total === 2 && children === 0) return 'couple';
  if (children > 0) return 'family';
  return 'group';
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ===== GUEST EXTRACTION FROM BOOKINGS =====

export function extractGuestsFromBookings(bookings: Booking[], datasetId: string): InsertGuest[] {
  const guestMap = new Map<string, {
    name: string;
    normalizedName: string;
    country: string | null;
    bookings: Booking[];
  }>();

  bookings.forEach(booking => {
    const normalizedName = normalizeGuestName(booking.guestName);
    
    if (!guestMap.has(normalizedName)) {
      guestMap.set(normalizedName, {
        name: booking.guestName,
        normalizedName,
        country: booking.guestCountry,
        bookings: [],
      });
    }
    
    guestMap.get(normalizedName)!.bookings.push(booking);
  });

  const today = new Date();
  const guests: InsertGuest[] = [];

  guestMap.forEach((guestData) => {
    const { name, normalizedName, country, bookings: guestBookings } = guestData;
    
    const confirmedBookings = guestBookings.filter(b => !b.isCancelled);
    const cancelledBookings = guestBookings.filter(b => b.isCancelled);
    
    const sortedByArrival = [...guestBookings].sort((a, b) => 
      new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
    );
    
    const firstBooking = sortedByArrival[0];
    const lastBooking = sortedByArrival[sortedByArrival.length - 1];
    
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0);
    const avgSpend = confirmedBookings.length > 0 ? totalRevenue / confirmedBookings.length : 0;
    
    const daysSinceLastBooking = daysBetween(lastBooking.arrivalDate, today.toISOString().split('T')[0]);
    
    // RFM Scoring (1-5 scale)
    const recencyScore = daysSinceLastBooking <= 30 ? 5 : daysSinceLastBooking <= 90 ? 4 : daysSinceLastBooking <= 180 ? 3 : daysSinceLastBooking <= 365 ? 2 : 1;
    const frequencyScore = guestBookings.length >= 10 ? 5 : guestBookings.length >= 5 ? 4 : guestBookings.length >= 3 ? 3 : guestBookings.length >= 2 ? 2 : 1;
    const monetaryScore = totalRevenue >= 10000 ? 5 : totalRevenue >= 5000 ? 4 : totalRevenue >= 2000 ? 3 : totalRevenue >= 500 ? 2 : 1;
    const rfmScore = calculateRFMScore(recencyScore, frequencyScore, monetaryScore);
    
    // Behavioral metrics
    const channelCounts: Record<string, number> = {};
    const roomTypeCounts: Record<string, number> = {};
    let weekendCount = 0;
    let totalLeadTime = 0;
    let totalLOS = 0;
    let totalModifications = 0;
    
    confirmedBookings.forEach(b => {
      channelCounts[b.channel] = (channelCounts[b.channel] || 0) + 1;
      roomTypeCounts[b.roomType] = (roomTypeCounts[b.roomType] || 0) + 1;
      
      const dayOfWeek = new Date(b.arrivalDate).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) weekendCount++;
      
      totalLeadTime += b.leadTime || 0;
      totalLOS += b.lengthOfStay || 1;
      totalModifications += b.bookingChanges || 0;
    });
    
    const preferredChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const preferredRoomType = Object.entries(roomTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const avgLeadTime = confirmedBookings.length > 0 ? totalLeadTime / confirmedBookings.length : 0;
    const avgLengthOfStay = confirmedBookings.length > 0 ? totalLOS / confirmedBookings.length : 0;
    const weekendRatio = confirmedBookings.length > 0 ? weekendCount / confirmedBookings.length : 0;
    
    // Risk metrics
    const cancellationRate = guestBookings.length > 0 ? cancelledBookings.length / guestBookings.length : 0;
    
    // Segmentation
    const lifecycleStage = getLifecycleStage(guestBookings.length, daysSinceLastBooking, cancelledBookings.length);
    const loyaltyTier = getLoyaltyTier(rfmScore, guestBookings.length);
    
    const lastSegment = confirmedBookings[confirmedBookings.length - 1]?.marketSegment || 'Leisure';
    const guestType = getGuestType(lastSegment);
    
    const avgAdults = confirmedBookings.length > 0 
      ? confirmedBookings.reduce((sum, b) => sum + (b.adults || 1), 0) / confirmedBookings.length 
      : 1;
    const avgChildren = confirmedBookings.length > 0 
      ? confirmedBookings.reduce((sum, b) => sum + (b.children || 0), 0) / confirmedBookings.length 
      : 0;
    const travelType = getTravelType(Math.round(avgAdults), Math.round(avgChildren));
    
    // Predictive scores (0-100)
    const clvScore = Math.min(totalRevenue * (1 + rfmScore * 0.2), 100000);
    const churnRiskScore = lifecycleStage === 'churned' ? 90 : lifecycleStage === 'at_risk' ? 70 : lifecycleStage === 'first_timer' ? 50 : 20;
    const upsellPropensity = Math.min(100, Math.round(monetaryScore * 10 + frequencyScore * 8 + (travelType === 'family' ? 20 : 10)));
    const retentionProbability = Math.max(0, 100 - churnRiskScore);
    const ambassadorScore = Math.min(100, rfmScore * 15 + (guestBookings.length >= 5 ? 25 : 0) + (cancellationRate < 0.1 ? 20 : 0));
    
    guests.push({
      datasetId,
      name,
      normalizedName,
      country,
      firstBookingDate: firstBooking.arrivalDate,
      lastBookingDate: lastBooking.arrivalDate,
      totalBookings: guestBookings.length,
      cancelledBookings: cancelledBookings.length,
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
      modificationCount: totalModifications,
      lifecycleStage,
      loyaltyTier,
      guestType,
      travelType,
      clvScore: clvScore.toFixed(2),
      churnRiskScore,
      upsellPropensity,
      retentionProbability,
      ambassadorScore,
    });
  });

  return guests;
}

// ===== COMPREHENSIVE GUEST ANALYTICS =====

export function calculateGuestAnalytics(guests: Guest[], bookings: Booking[]): ComprehensiveGuestAnalytics {
  const totalGuests = guests.length;
  const totalRevenue = guests.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
  const avgGuestValue = totalGuests > 0 ? totalRevenue / totalGuests : 0;
  const returners = guests.filter(g => (g.totalBookings || 0) > 1).length;
  const repeatGuestRate = totalGuests > 0 ? (returners / totalGuests) * 100 : 0;
  
  return {
    lifecycle: calculateLifecycleAnalytics(guests),
    value: calculateValueAnalytics(guests),
    behavioral: calculateBehavioralAnalytics(guests, bookings),
    risk: calculateRiskAnalytics(guests),
    geographic: calculateGeographicAnalytics(guests, bookings),
    engagement: calculateEngagementAnalytics(guests),
    comparative: calculateComparativeAnalytics(guests),
    predictive: calculatePredictiveAnalytics(guests),
    summary: {
      totalGuests,
      totalRevenue: Math.round(totalRevenue),
      avgGuestValue: Math.round(avgGuestValue),
      repeatGuestRate: Math.round(repeatGuestRate),
      topPerformingSegment: getTopPerformingSegment(guests),
      highRiskGuestPercent: Math.round((guests.filter(g => (g.churnRiskScore || 0) >= 70).length / totalGuests) * 100),
    },
  };
}

function getTopPerformingSegment(guests: Guest[]): string {
  const segmentRevenue: Record<string, number> = {};
  guests.forEach(g => {
    const segment = g.guestType || 'leisure';
    segmentRevenue[segment] = (segmentRevenue[segment] || 0) + parseFloat(g.totalRevenue || '0');
  });
  return Object.entries(segmentRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || 'leisure';
}

// ===== 1. LIFECYCLE ANALYTICS =====

function calculateLifecycleAnalytics(guests: Guest[]): GuestLifecycleAnalytics {
  const firstTimers = guests.filter(g => (g.totalBookings || 0) === 1);
  const returners = guests.filter(g => (g.totalBookings || 0) > 1);
  
  // Lifecycle stage distribution
  const stageData: Record<string, { count: number; revenue: number }> = {};
  guests.forEach(g => {
    const stage = g.lifecycleStage || 'first_timer';
    if (!stageData[stage]) stageData[stage] = { count: 0, revenue: 0 };
    stageData[stage].count++;
    stageData[stage].revenue += parseFloat(g.totalRevenue || '0');
  });
  
  const stageOrder = ['first_timer', 'returning', 'loyal', 'champion', 'at_risk', 'churned'];
  const lifecycleStageDistribution = stageOrder.map(stage => ({
    stage,
    count: stageData[stage]?.count || 0,
    percent: guests.length > 0 ? Math.round(((stageData[stage]?.count || 0) / guests.length) * 100) : 0,
    avgRevenue: stageData[stage]?.count ? Math.round(stageData[stage].revenue / stageData[stage].count) : 0,
  }));
  
  // Acquisition cohorts by first booking month
  const cohortData: Record<string, { count: number; revenue: number; bookings: number }> = {};
  guests.forEach(g => {
    if (g.firstBookingDate) {
      const cohort = getMonth(g.firstBookingDate);
      if (!cohortData[cohort]) cohortData[cohort] = { count: 0, revenue: 0, bookings: 0 };
      cohortData[cohort].count++;
      cohortData[cohort].revenue += parseFloat(g.totalRevenue || '0');
      cohortData[cohort].bookings += g.totalBookings || 0;
    }
  });
  
  const acquisitionCohorts = Object.entries(cohortData)
    .map(([cohort, data]) => ({
      cohort,
      guestCount: data.count,
      totalRevenue: Math.round(data.revenue),
      avgBookings: data.count > 0 ? Math.round((data.bookings / data.count) * 10) / 10 : 0,
    }))
    .sort((a, b) => new Date(a.cohort).getTime() - new Date(b.cohort).getTime());
  
  // Time to return analysis (for returning guests)
  const returnTimes: number[] = [];
  returners.forEach(g => {
    if (g.firstBookingDate && g.lastBookingDate && g.totalBookings && g.totalBookings > 1) {
      const totalDays = daysBetween(g.firstBookingDate, g.lastBookingDate);
      const avgDaysBetween = totalDays / (g.totalBookings - 1);
      returnTimes.push(avgDaysBetween);
    }
  });
  
  const timeToReturnBuckets = [
    { bucket: '< 30 days', min: 0, max: 30 },
    { bucket: '30-90 days', min: 30, max: 90 },
    { bucket: '90-180 days', min: 90, max: 180 },
    { bucket: '180-365 days', min: 180, max: 365 },
    { bucket: '> 365 days', min: 365, max: Infinity },
  ];
  
  const timeToReturnAnalysis = timeToReturnBuckets.map(b => {
    const matching = returnTimes.filter(t => t >= b.min && t < b.max);
    return {
      bucket: b.bucket,
      count: matching.length,
      avgDays: matching.length > 0 ? Math.round(matching.reduce((a, c) => a + c, 0) / matching.length) : 0,
    };
  });
  
  // Guest journey map
  const journeyStages = ['first_timer', 'returning', 'loyal', 'champion'];
  const guestJourneyMap = journeyStages.map((stage, idx) => {
    const stageGuests = guests.filter(g => g.lifecycleStage === stage);
    const nextStage = journeyStages[idx + 1];
    const nextStageGuests = nextStage ? guests.filter(g => g.lifecycleStage === nextStage).length : 0;
    
    return {
      stage,
      guests: stageGuests.length,
      avgValue: stageGuests.length > 0 
        ? Math.round(stageGuests.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0) / stageGuests.length) 
        : 0,
      nextStageConversion: stageGuests.length > 0 ? Math.round((nextStageGuests / stageGuests.length) * 100) : 0,
    };
  });
  
  return {
    firstTimerVsReturnerBreakdown: {
      firstTimers: firstTimers.length,
      returners: returners.length,
      firstTimerPercent: guests.length > 0 ? Math.round((firstTimers.length / guests.length) * 100) : 0,
      returnerPercent: guests.length > 0 ? Math.round((returners.length / guests.length) * 100) : 0,
    },
    lifecycleStageDistribution,
    acquisitionCohorts,
    timeToReturnAnalysis,
    guestJourneyMap,
  };
}

// ===== 2. VALUE ANALYTICS =====

function calculateValueAnalytics(guests: Guest[]): GuestValueAnalytics {
  // RFM Distribution
  const rfmData: Record<number, { count: number; revenue: number }> = {};
  for (let i = 1; i <= 5; i++) rfmData[i] = { count: 0, revenue: 0 };
  
  guests.forEach(g => {
    const score = g.rfmScore || 1;
    rfmData[score].count++;
    rfmData[score].revenue += parseFloat(g.totalRevenue || '0');
  });
  
  const rfmDistribution = Object.entries(rfmData).map(([score, data]) => ({
    score: parseInt(score),
    count: data.count,
    avgRevenue: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
  }));
  
  // CLV Analysis by tier
  const clvTiers = [
    { tier: 'Elite', min: 50000, max: Infinity },
    { tier: 'High', min: 10000, max: 50000 },
    { tier: 'Medium', min: 2000, max: 10000 },
    { tier: 'Low', min: 0, max: 2000 },
  ];
  
  const clvAnalysis = clvTiers.map(t => {
    const tierGuests = guests.filter(g => {
      const clv = parseFloat(g.clvScore || '0');
      return clv >= t.min && clv < t.max;
    });
    const totalCLV = tierGuests.reduce((sum, g) => sum + parseFloat(g.clvScore || '0'), 0);
    
    return {
      tier: t.tier,
      count: tierGuests.length,
      avgCLV: tierGuests.length > 0 ? Math.round(totalCLV / tierGuests.length) : 0,
      totalCLV: Math.round(totalCLV),
    };
  });
  
  // Revenue deciles
  const sortedByRevenue = [...guests].sort((a, b) => 
    parseFloat(b.totalRevenue || '0') - parseFloat(a.totalRevenue || '0')
  );
  
  const decileLabels = ['Top 10%', 'Top 20%', 'Top 30%', 'Top 40%', 'Top 50%', 'Bottom 50%'];
  const totalRevenue = guests.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
  
  const revenueDeciles = decileLabels.map((label, idx) => {
    let decileGuests: Guest[];
    if (idx < 5) {
      const startIdx = Math.floor((idx * guests.length) / 10);
      const endIdx = Math.floor(((idx + 1) * guests.length) / 10);
      decileGuests = sortedByRevenue.slice(startIdx, endIdx);
    } else {
      decileGuests = sortedByRevenue.slice(Math.floor(guests.length / 2));
    }
    
    const decileRevenue = decileGuests.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
    
    return {
      decile: label,
      guestCount: decileGuests.length,
      revenue: Math.round(decileRevenue),
      percent: totalRevenue > 0 ? Math.round((decileRevenue / totalRevenue) * 100) : 0,
    };
  });
  
  // High value profiles (top 20 guests)
  const highValueProfiles = sortedByRevenue.slice(0, 20).map(g => ({
    guestId: g.id,
    name: g.name,
    revenue: Math.round(parseFloat(g.totalRevenue || '0')),
    bookings: g.totalBookings || 0,
    rfmScore: g.rfmScore || 1,
    clv: Math.round(parseFloat(g.clvScore || '0')),
  }));
  
  // Whale analysis (Pareto 80/20)
  let cumulativeRevenue = 0;
  let whaleCount = 0;
  const targetRevenue = totalRevenue * 0.8;
  
  for (const guest of sortedByRevenue) {
    cumulativeRevenue += parseFloat(guest.totalRevenue || '0');
    whaleCount++;
    if (cumulativeRevenue >= targetRevenue) break;
  }
  
  const top10Count = Math.ceil(guests.length * 0.1);
  const top20Count = Math.ceil(guests.length * 0.2);
  const top10Revenue = sortedByRevenue.slice(0, top10Count).reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
  const top20Revenue = sortedByRevenue.slice(0, top20Count).reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
  
  return {
    rfmDistribution,
    clvAnalysis,
    revenueDeciles,
    highValueProfiles,
    whaleAnalysis: {
      top10Percent: {
        count: top10Count,
        revenue: Math.round(top10Revenue),
        percent: totalRevenue > 0 ? Math.round((top10Revenue / totalRevenue) * 100) : 0,
      },
      top20Percent: {
        count: top20Count,
        revenue: Math.round(top20Revenue),
        percent: totalRevenue > 0 ? Math.round((top20Revenue / totalRevenue) * 100) : 0,
      },
      pareto: {
        whaleCount,
        whaleRevenuePercent: 80,
      },
    },
  };
}

// ===== 3. BEHAVIORAL ANALYTICS =====

function calculateBehavioralAnalytics(guests: Guest[], bookings: Booking[]): GuestBehavioralAnalytics {
  // Channel loyalty
  const channelData: Record<string, { guestCount: number; totalBookings: number; revenue: number }> = {};
  guests.forEach(g => {
    const channel = g.preferredChannel || 'Direct';
    if (!channelData[channel]) channelData[channel] = { guestCount: 0, totalBookings: 0, revenue: 0 };
    channelData[channel].guestCount++;
    channelData[channel].totalBookings += g.totalBookings || 0;
    channelData[channel].revenue += parseFloat(g.totalRevenue || '0');
  });
  
  const channelLoyalty = Object.entries(channelData).map(([channel, data]) => ({
    channel,
    loyalGuestCount: data.guestCount,
    avgBookingsPerGuest: data.guestCount > 0 ? Math.round((data.totalBookings / data.guestCount) * 10) / 10 : 0,
    revenueContribution: Math.round(data.revenue),
  })).sort((a, b) => b.revenueContribution - a.revenueContribution);
  
  // Room type affinity
  const roomData: Record<string, { guestCount: number; totalStays: number; revenue: number }> = {};
  guests.forEach(g => {
    const room = g.preferredRoomType || 'Standard';
    if (!roomData[room]) roomData[room] = { guestCount: 0, totalStays: 0, revenue: 0 };
    roomData[room].guestCount++;
    roomData[room].totalStays += g.totalBookings || 0;
    roomData[room].revenue += parseFloat(g.totalRevenue || '0');
  });
  
  const roomTypeAffinity = Object.entries(roomData).map(([roomType, data]) => ({
    roomType,
    guestCount: data.guestCount,
    avgStays: data.guestCount > 0 ? Math.round((data.totalStays / data.guestCount) * 10) / 10 : 0,
    avgRevenue: data.guestCount > 0 ? Math.round(data.revenue / data.guestCount) : 0,
  })).sort((a, b) => b.guestCount - a.guestCount);
  
  // Day of week preferences from bookings
  const dayPrefs: Record<string, number> = {};
  bookings.forEach(b => {
    if (!b.isCancelled) {
      const day = getDayOfWeek(b.arrivalDate);
      dayPrefs[day] = (dayPrefs[day] || 0) + 1;
    }
  });
  
  const totalDayBookings = Object.values(dayPrefs).reduce((a, b) => a + b, 0);
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeekPreferences = dayOrder.map(day => ({
    day,
    preferenceScore: totalDayBookings > 0 ? Math.round(((dayPrefs[day] || 0) / totalDayBookings) * 100) : 0,
    guestCount: dayPrefs[day] || 0,
  }));
  
  // Seasonality fingerprint
  const seasonData: Record<string, { bookings: number; revenue: number }> = {};
  bookings.forEach(b => {
    if (!b.isCancelled) {
      const season = getSeason(b.arrivalDate);
      if (!seasonData[season]) seasonData[season] = { bookings: 0, revenue: 0 };
      seasonData[season].bookings++;
      seasonData[season].revenue += parseFloat(b.totalAmount || '0');
    }
  });
  
  const totalSeasonRevenue = Object.values(seasonData).reduce((sum, d) => sum + d.revenue, 0);
  const seasonOrder = ['Spring', 'Summer', 'Autumn', 'Winter'];
  const seasonalityFingerprint = seasonOrder.map(season => ({
    season,
    guestActivity: seasonData[season]?.bookings || 0,
    revenueShare: totalSeasonRevenue > 0 ? Math.round((seasonData[season]?.revenue || 0) / totalSeasonRevenue * 100) : 0,
  }));
  
  // Lead time behavior
  const leadTimeBuckets = [
    { type: 'Last-minute (<7 days)', min: 0, max: 7 },
    { type: 'Short-term (7-30 days)', min: 7, max: 30 },
    { type: 'Medium-term (30-90 days)', min: 30, max: 90 },
    { type: 'Long-term planners (>90 days)', min: 90, max: Infinity },
  ];
  
  const leadTimeBehavior = leadTimeBuckets.map(bucket => {
    const matching = guests.filter(g => {
      const lt = parseFloat(g.avgLeadTime || '0');
      return lt >= bucket.min && lt < bucket.max;
    });
    const avgLT = matching.length > 0 
      ? matching.reduce((sum, g) => sum + parseFloat(g.avgLeadTime || '0'), 0) / matching.length 
      : 0;
    
    return {
      type: bucket.type,
      avgLeadTime: Math.round(avgLT),
      guestCount: matching.length,
    };
  });
  
  // Length of stay patterns
  const losBuckets = [
    { pattern: '1 Night', min: 0, max: 1.5 },
    { pattern: '2-3 Nights', min: 1.5, max: 3.5 },
    { pattern: '4-7 Nights', min: 3.5, max: 7.5 },
    { pattern: 'Extended (>7 Nights)', min: 7.5, max: Infinity },
  ];
  
  const lengthOfStayPatterns = losBuckets.map(bucket => {
    const matching = guests.filter(g => {
      const los = parseFloat(g.avgLengthOfStay || '0');
      return los >= bucket.min && los < bucket.max;
    });
    const avgLOS = matching.length > 0 
      ? matching.reduce((sum, g) => sum + parseFloat(g.avgLengthOfStay || '0'), 0) / matching.length 
      : 0;
    const revenue = matching.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
    
    return {
      pattern: bucket.pattern,
      avgLOS: Math.round(avgLOS * 10) / 10,
      guestCount: matching.length,
      revenueImpact: Math.round(revenue),
    };
  });
  
  return {
    channelLoyalty,
    roomTypeAffinity,
    dayOfWeekPreferences,
    seasonalityFingerprint,
    leadTimeBehavior,
    lengthOfStayPatterns,
  };
}

// ===== 4. RISK ANALYTICS =====

function calculateRiskAnalytics(guests: Guest[]): GuestRiskAnalytics {
  // Cancellation risk scores
  const riskLevels = [
    { riskLevel: 'Low (<10%)', min: 0, max: 0.1 },
    { riskLevel: 'Medium (10-30%)', min: 0.1, max: 0.3 },
    { riskLevel: 'High (30-50%)', min: 0.3, max: 0.5 },
    { riskLevel: 'Very High (>50%)', min: 0.5, max: Infinity },
  ];
  
  const cancellationRiskScores = riskLevels.map(level => {
    const matching = guests.filter(g => {
      const rate = parseFloat(g.cancellationRate || '0');
      return rate >= level.min && rate < level.max;
    });
    const avgRate = matching.length > 0 
      ? matching.reduce((sum, g) => sum + parseFloat(g.cancellationRate || '0'), 0) / matching.length 
      : 0;
    
    return {
      riskLevel: level.riskLevel,
      count: matching.length,
      percent: guests.length > 0 ? Math.round((matching.length / guests.length) * 100) : 0,
      avgRate: Math.round(avgRate * 100),
    };
  });
  
  // No-show probability (based on cancellation pattern)
  const noShowRiskLevels = [
    { riskLevel: 'Low', minScore: 0, maxScore: 30 },
    { riskLevel: 'Medium', minScore: 30, maxScore: 60 },
    { riskLevel: 'High', minScore: 60, maxScore: 100 },
  ];
  
  const noShowProbability = noShowRiskLevels.map(level => {
    const matching = guests.filter(g => {
      const score = g.churnRiskScore || 0;
      return score >= level.minScore && score < level.maxScore;
    });
    
    return {
      riskLevel: level.riskLevel,
      count: matching.length,
      percent: guests.length > 0 ? Math.round((matching.length / guests.length) * 100) : 0,
    };
  });
  
  // Modification frequency
  const modFreqLevels = [
    { frequency: 'None', min: 0, max: 1 },
    { frequency: 'Low (1-2)', min: 1, max: 3 },
    { frequency: 'Medium (3-5)', min: 3, max: 6 },
    { frequency: 'High (>5)', min: 6, max: Infinity },
  ];
  
  const modificationFrequency = modFreqLevels.map(level => {
    const matching = guests.filter(g => {
      const mods = g.modificationCount || 0;
      return mods >= level.min && mods < level.max;
    });
    
    return {
      frequency: level.frequency,
      count: matching.length,
      percent: guests.length > 0 ? Math.round((matching.length / guests.length) * 100) : 0,
    };
  });
  
  // Payment reliability (simplified based on cancellation rate and modifications)
  const paymentReliability = [
    { score: 'Excellent', count: 0, percent: 0 },
    { score: 'Good', count: 0, percent: 0 },
    { score: 'Fair', count: 0, percent: 0 },
    { score: 'Poor', count: 0, percent: 0 },
  ];
  
  guests.forEach(g => {
    const cancRate = parseFloat(g.cancellationRate || '0');
    const mods = g.modificationCount || 0;
    
    if (cancRate < 0.1 && mods < 2) paymentReliability[0].count++;
    else if (cancRate < 0.2 && mods < 4) paymentReliability[1].count++;
    else if (cancRate < 0.4) paymentReliability[2].count++;
    else paymentReliability[3].count++;
  });
  
  paymentReliability.forEach(p => {
    p.percent = guests.length > 0 ? Math.round((p.count / guests.length) * 100) : 0;
  });
  
  return {
    cancellationRiskScores,
    noShowProbability,
    modificationFrequency,
    paymentReliability,
  };
}

// ===== 5. GEOGRAPHIC ANALYTICS =====

function calculateGeographicAnalytics(guests: Guest[], bookings: Booking[]): GuestGeographicAnalytics {
  // Origin mapping
  const countryData: Record<string, { count: number; revenue: number }> = {};
  guests.forEach(g => {
    const country = g.country || 'Unknown';
    if (!countryData[country]) countryData[country] = { count: 0, revenue: 0 };
    countryData[country].count++;
    countryData[country].revenue += parseFloat(g.totalRevenue || '0');
  });
  
  const originMapping = Object.entries(countryData)
    .map(([country, data]) => ({
      country,
      guestCount: data.count,
      revenue: Math.round(data.revenue),
      avgSpend: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20);
  
  // Domestic vs International (assuming USA as domestic for example)
  const domestic = guests.filter(g => g.country?.toLowerCase().includes('us') || g.country?.toLowerCase().includes('united states'));
  const international = guests.filter(g => !g.country?.toLowerCase().includes('us') && !g.country?.toLowerCase().includes('united states') && g.country);
  
  const domesticRevenue = domestic.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
  const internationalRevenue = international.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
  
  // Corporate vs Leisure
  const corporate = guests.filter(g => g.guestType === 'corporate');
  const leisure = guests.filter(g => g.guestType === 'leisure');
  
  const corporateRevenue = corporate.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
  const leisureRevenue = leisure.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
  
  // Family vs Solo patterns
  const travelTypes = ['solo', 'couple', 'family', 'group'];
  const familyVsSoloPatterns = travelTypes.map(type => {
    const typeGuests = guests.filter(g => g.travelType === type);
    const avgSpend = typeGuests.length > 0 
      ? typeGuests.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0) / typeGuests.length 
      : 0;
    const avgLOS = typeGuests.length > 0 
      ? typeGuests.reduce((sum, g) => sum + parseFloat(g.avgLengthOfStay || '0'), 0) / typeGuests.length 
      : 0;
    
    return {
      type,
      count: typeGuests.length,
      avgSpend: Math.round(avgSpend),
      avgLOS: Math.round(avgLOS * 10) / 10,
    };
  });
  
  return {
    originMapping,
    domesticVsInternational: {
      domestic: domestic.length,
      international: international.length,
      domesticRevenue: Math.round(domesticRevenue),
      internationalRevenue: Math.round(internationalRevenue),
    },
    corporateVsLeisure: {
      corporate: corporate.length,
      leisure: leisure.length,
      corporateRevenue: Math.round(corporateRevenue),
      leisureRevenue: Math.round(leisureRevenue),
    },
    familyVsSoloPatterns,
  };
}

// ===== 6. ENGAGEMENT ANALYTICS =====

function calculateEngagementAnalytics(guests: Guest[]): GuestEngagementAnalytics {
  const today = new Date();
  
  // Tenure distribution
  const tenureBuckets = [
    { tenureBucket: 'New (<30 days)', min: 0, max: 30 },
    { tenureBucket: 'Recent (30-90 days)', min: 30, max: 90 },
    { tenureBucket: 'Established (90-365 days)', min: 90, max: 365 },
    { tenureBucket: 'Loyal (1-2 years)', min: 365, max: 730 },
    { tenureBucket: 'Long-term (>2 years)', min: 730, max: Infinity },
  ];
  
  const tenureDistribution = tenureBuckets.map(bucket => {
    const matching = guests.filter(g => {
      if (!g.firstBookingDate) return false;
      const tenure = daysBetween(g.firstBookingDate, today.toISOString().split('T')[0]);
      return tenure >= bucket.min && tenure < bucket.max;
    });
    const avgRevenue = matching.length > 0 
      ? matching.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0) / matching.length 
      : 0;
    
    return {
      tenureBucket: bucket.tenureBucket,
      count: matching.length,
      avgRevenue: Math.round(avgRevenue),
    };
  });
  
  // Frequency scores distribution
  const frequencyScores = [1, 2, 3, 4, 5].map(score => {
    const matching = guests.filter(g => g.frequencyScore === score);
    const avgRevenue = matching.length > 0 
      ? matching.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0) / matching.length 
      : 0;
    
    return {
      score,
      count: matching.length,
      avgRevenue: Math.round(avgRevenue),
    };
  });
  
  // Loyalty tier breakdown
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  const loyaltyTierBreakdown = tierOrder.map(tier => {
    const tierGuests = guests.filter(g => g.loyaltyTier === tier);
    const totalRevenue = tierGuests.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0);
    const avgCLV = tierGuests.length > 0 
      ? tierGuests.reduce((sum, g) => sum + parseFloat(g.clvScore || '0'), 0) / tierGuests.length 
      : 0;
    
    return {
      tier: tier.charAt(0).toUpperCase() + tier.slice(1),
      count: tierGuests.length,
      revenue: Math.round(totalRevenue),
      avgCLV: Math.round(avgCLV),
    };
  });
  
  // Churn risk indicators
  const churnLevels = [
    { risk: 'Low', min: 0, max: 30 },
    { risk: 'Medium', min: 30, max: 60 },
    { risk: 'High', min: 60, max: 80 },
    { risk: 'Critical', min: 80, max: 101 },
  ];
  
  const churnRiskIndicators = churnLevels.map(level => {
    const matching = guests.filter(g => {
      const risk = g.churnRiskScore || 0;
      return risk >= level.min && risk < level.max;
    });
    
    const avgDaysSinceLastVisit = matching.length > 0 
      ? matching.reduce((sum, g) => {
          if (!g.lastBookingDate) return sum;
          return sum + daysBetween(g.lastBookingDate, today.toISOString().split('T')[0]);
        }, 0) / matching.length 
      : 0;
    
    return {
      risk: level.risk,
      count: matching.length,
      percent: guests.length > 0 ? Math.round((matching.length / guests.length) * 100) : 0,
      avgDaysSinceLastVisit: Math.round(avgDaysSinceLastVisit),
    };
  });
  
  // Win-back candidates (churned or at-risk with high past value)
  const winBackCandidates = guests
    .filter(g => (g.lifecycleStage === 'churned' || g.lifecycleStage === 'at_risk') && parseFloat(g.totalRevenue || '0') > 500)
    .sort((a, b) => parseFloat(b.totalRevenue || '0') - parseFloat(a.totalRevenue || '0'))
    .slice(0, 20)
    .map(g => ({
      guestId: g.id,
      name: g.name,
      lastVisit: g.lastBookingDate || '',
      potentialValue: Math.round(parseFloat(g.clvScore || '0')),
      daysSinceVisit: g.lastBookingDate ? daysBetween(g.lastBookingDate, today.toISOString().split('T')[0]) : 999,
    }));
  
  // Ambassador scores
  const ambassadorRanges = [
    { scoreRange: 'Champions (80-100)', min: 80, max: 101, characteristics: 'High frequency, low cancellation, long tenure' },
    { scoreRange: 'Advocates (60-79)', min: 60, max: 80, characteristics: 'Regular visitors, moderate spend' },
    { scoreRange: 'Potential (40-59)', min: 40, max: 60, characteristics: 'Growing engagement, room for nurturing' },
    { scoreRange: 'Passive (0-39)', min: 0, max: 40, characteristics: 'Infrequent, limited engagement' },
  ];
  
  const ambassadorScores = ambassadorRanges.map(range => {
    const matching = guests.filter(g => {
      const score = g.ambassadorScore || 0;
      return score >= range.min && score < range.max;
    });
    
    return {
      scoreRange: range.scoreRange,
      count: matching.length,
      characteristics: range.characteristics,
    };
  });
  
  return {
    tenureDistribution,
    frequencyScores,
    loyaltyTierBreakdown,
    churnRiskIndicators,
    winBackCandidates,
    ambassadorScores,
  };
}

// ===== 7. COMPARATIVE ANALYTICS =====

function calculateComparativeAnalytics(guests: Guest[]): GuestComparativeAnalytics {
  const avgRevenue = guests.length > 0 
    ? guests.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0) / guests.length 
    : 0;
  const avgBookings = guests.length > 0 
    ? guests.reduce((sum, g) => sum + (g.totalBookings || 0), 0) / guests.length 
    : 0;
  const avgRFM = guests.length > 0 
    ? guests.reduce((sum, g) => sum + (g.rfmScore || 0), 0) / guests.length 
    : 0;
  const avgCLV = guests.length > 0 
    ? guests.reduce((sum, g) => sum + parseFloat(g.clvScore || '0'), 0) / guests.length 
    : 0;
  
  // Guest vs cohort comparison (for overall metrics)
  const guestVsCohortComparison = [
    { metric: 'Revenue', guestAvg: Math.round(avgRevenue), cohortAvg: Math.round(avgRevenue), percentile: 50 },
    { metric: 'Bookings', guestAvg: Math.round(avgBookings * 10) / 10, cohortAvg: Math.round(avgBookings * 10) / 10, percentile: 50 },
    { metric: 'RFM Score', guestAvg: Math.round(avgRFM * 10) / 10, cohortAvg: Math.round(avgRFM * 10) / 10, percentile: 50 },
    { metric: 'CLV', guestAvg: Math.round(avgCLV), cohortAvg: Math.round(avgCLV), percentile: 50 },
  ];
  
  // Guest ranking leaderboard (top 20 by total score)
  const rankedGuests = guests
    .map(g => ({
      guestId: g.id,
      name: g.name,
      score: (g.rfmScore || 1) * 20 + parseFloat(g.totalRevenue || '0') / 100,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((g, idx) => ({
      rank: idx + 1,
      guestId: g.guestId,
      name: g.name,
      score: Math.round(g.score),
      metric: 'Combined Score',
    }));
  
  // Peer benchmarking by loyalty tier
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  const peerBenchmarking = tierOrder.map(tier => {
    const tierGuests = guests.filter(g => g.loyaltyTier === tier);
    const avgSpend = tierGuests.length > 0 
      ? tierGuests.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0) / tierGuests.length 
      : 0;
    const avgBookingsVal = tierGuests.length > 0 
      ? tierGuests.reduce((sum, g) => sum + (g.totalBookings || 0), 0) / tierGuests.length 
      : 0;
    const topPerformer = tierGuests.length > 0 
      ? Math.max(...tierGuests.map(g => parseFloat(g.totalRevenue || '0'))) 
      : 0;
    
    return {
      segment: tier.charAt(0).toUpperCase() + tier.slice(1),
      avgSpend: Math.round(avgSpend),
      avgBookings: Math.round(avgBookingsVal * 10) / 10,
      topPerformerSpend: Math.round(topPerformer),
    };
  });
  
  return {
    guestVsCohortComparison,
    guestRankingLeaderboard: rankedGuests,
    peerBenchmarking,
  };
}

// ===== 8. PREDICTIVE ANALYTICS =====

function calculatePredictiveAnalytics(guests: Guest[]): GuestPredictiveAnalytics {
  const today = new Date();
  
  // Next visit prediction
  const visitLikelihoods = [
    { likelihood: 'Very Likely (<30 days)', min: 0, max: 30 },
    { likelihood: 'Likely (30-90 days)', min: 30, max: 90 },
    { likelihood: 'Possible (90-180 days)', min: 90, max: 180 },
    { likelihood: 'Unlikely (>180 days)', min: 180, max: Infinity },
  ];
  
  const nextVisitPrediction = visitLikelihoods.map(level => {
    const matching = guests.filter(g => {
      if (!g.lastBookingDate) return false;
      const daysSince = daysBetween(g.lastBookingDate, today.toISOString().split('T')[0]);
      const avgTimeBetween = g.totalBookings && g.totalBookings > 1 && g.firstBookingDate
        ? daysBetween(g.firstBookingDate, g.lastBookingDate) / (g.totalBookings - 1)
        : 90;
      const predictedDays = Math.max(0, avgTimeBetween - daysSince);
      return predictedDays >= level.min && predictedDays < level.max;
    });
    
    return {
      likelihood: level.likelihood,
      count: matching.length,
      avgDaysToVisit: Math.round((level.min + Math.min(level.max, 365)) / 2),
    };
  });
  
  // Upsell propensity scores
  const upsellLevels = [
    { score: 'High (70-100)', min: 70, max: 101, recommendedAction: 'Premium room upgrades, spa packages, dining experiences' },
    { score: 'Medium (40-69)', min: 40, max: 70, recommendedAction: 'Room upgrades, breakfast packages' },
    { score: 'Low (0-39)', min: 0, max: 40, recommendedAction: 'Focus on retention, loyalty program enrollment' },
  ];
  
  const upsellPropensityScores = upsellLevels.map(level => {
    const matching = guests.filter(g => {
      const propensity = g.upsellPropensity || 0;
      return propensity >= level.min && propensity < level.max;
    });
    
    return {
      score: level.score,
      count: matching.length,
      recommendedAction: level.recommendedAction,
    };
  });
  
  // Retention probability
  const retentionLevels = [
    { probability: 'High (70-100%)', min: 70, max: 101 },
    { probability: 'Medium (40-69%)', min: 40, max: 70 },
    { probability: 'Low (0-39%)', min: 0, max: 40 },
  ];
  
  const retentionProbability = retentionLevels.map(level => {
    const matching = guests.filter(g => {
      const prob = g.retentionProbability || 0;
      return prob >= level.min && prob < level.max;
    });
    const avgValue = matching.length > 0 
      ? matching.reduce((sum, g) => sum + parseFloat(g.totalRevenue || '0'), 0) / matching.length 
      : 0;
    
    return {
      probability: level.probability,
      count: matching.length,
      avgValue: Math.round(avgValue),
    };
  });
  
  return {
    nextVisitPrediction,
    upsellPropensityScores,
    retentionProbability,
  };
}
