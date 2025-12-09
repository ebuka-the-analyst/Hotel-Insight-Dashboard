import { Booking } from "@shared/schema";

export interface ComprehensiveAnalytics {
  coreKPIs: CoreKPIs;
  revenueAnalytics: RevenueAnalytics;
  bookingAnalytics: BookingAnalytics;
  guestAnalytics: GuestAnalytics;
  guestPerformanceAnalytics: GuestPerformanceAnalytics;
  cancellationAnalytics: CancellationAnalytics;
  operationalAnalytics: OperationalAnalytics;
  forecastingAnalytics: ForecastingAnalytics;
  channelAnalytics: ChannelAnalytics;
  seasonalityAnalytics: SeasonalityAnalytics;
  performanceIndicators: PerformanceIndicators;
}

export interface CoreKPIs {
  totalRevenue: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  averageDailyRate: number;
  revPAR: number;
  occupancyRate: number;
  cancellationRate: number;
  repeatGuestRate: number;
  averageLeadTime: number;
  averageLengthOfStay: number;
  totalRoomNights: number;
  revenuePerBooking: number;
  guestsServed: number;
  averagePartySize: number;
}

export interface RevenueAnalytics {
  revenueByChannel: Record<string, number>;
  revenueBySegment: Record<string, number>;
  revenueByRoomType: Record<string, number>;
  revenueByMonth: Record<string, number>;
  revenueByDayOfWeek: Record<string, number>;
  netRevenueAfterCommissions: number;
  commissionsPaid: number;
  revenuePerGuest: number;
  revenueGrowthRate: number;
  highestRevenueDay: { date: string; amount: number };
  lowestRevenueDay: { date: string; amount: number };
  averageDailyRevenue: number;
}

export interface BookingAnalytics {
  bookingsByChannel: Record<string, number>;
  bookingsBySegment: Record<string, number>;
  bookingsByMonth: Record<string, number>;
  bookingsByDayOfWeek: Record<string, number>;
  bookingVelocity: number;
  lastMinuteBookingsPercent: number;
  advanceBookingsPercent: number;
  leadTimeDistribution: { range: string; count: number; percent: number }[];
  peakBookingMonth: string;
  slowestBookingMonth: string;
  weekdayVsWeekendRatio: number;
  averageBookingValue: number;
}

export interface GuestAnalytics {
  guestCountryDistribution: Record<string, number>;
  newVsReturningRatio: number;
  repeatGuestCount: number;
  newGuestCount: number;
  topSourceCountries: { country: string; count: number; percent: number }[];
  guestDiversityIndex: number;
  corporateVsLeisureRatio: number;
  familyBookingsPercent: number;
  soloTravelersPercent: number;
  averageGuestValue: number;
  highValueGuestCount: number;
  guestLoyaltyScore: number;
}

// PhD-Level Guest Performance Analytics (27 metrics)
export interface GuestPerformanceAnalytics {
  // 1. Guest Loyalty & Retention (7 metrics)
  loyaltyMetrics: {
    repeatGuestRevenueContribution: number;
    repeatGuestRevenuePercent: number;
    estimatedCLV: number;
    loyaltyTierDistribution: { tier: string; count: number; percent: number; avgSpend: number }[];
    avgTimeBetweenVisits: number;
    retentionCohorts: { cohort: string; retained: number; churned: number; retentionRate: number }[];
    churnRiskDistribution: { risk: string; count: number; percent: number }[];
  };
  
  // 2. Guest Segmentation (6 metrics)
  segmentationMetrics: {
    guestTypeDistribution: { type: string; count: number; percent: number; avgRevenue: number }[];
    geographicConcentrationIndex: number;
    domesticVsInternationalMix: { domestic: number; international: number; domesticPercent: number };
    marketSegmentMatrix: { segment: string; bookings: number; revenue: number; avgADR: number; cancellationRate: number }[];
    corporateVsLeisureRevenue: { corporate: number; leisure: number; corporatePercent: number };
    highValueGuestAnalysis: { count: number; revenueContribution: number; avgSpend: number; percent: number };
  };
  
  // 3. Guest Spending Behavior (6 metrics)
  spendingMetrics: {
    revenuePerGuest: number;
    adrByGuestType: { type: string; adr: number }[];
    spendDistributionPercentiles: { p25: number; p50: number; p75: number; p90: number; p99: number };
    losImpactOnSpend: { losRange: string; avgSpend: number; count: number }[];
    priceSensitivityBySegment: { segment: string; sensitivity: number; avgADR: number; variance: number }[];
    upsellPotentialScore: number;
  };
  
  // 4. Guest Booking Patterns (6 metrics)
  bookingPatterns: {
    leadTimeByGuestType: { type: string; avgLeadTime: number; newGuest: number; repeatGuest: number }[];
    preferredArrivalDays: { day: string; count: number; percent: number }[];
    weekendVsWeekdayRatio: { weekend: number; weekday: number; ratio: number };
    advancePlanningIndex: number;
    lastMinutePropensity: number;
    seasonalGuestMix: { season: string; newGuests: number; repeatGuests: number; repeatPercent: number }[];
  };
  
  // 5. Guest Risk & Experience (2 metrics)
  riskExperience: {
    cancellationRateByGuestType: { type: string; rate: number; count: number }[];
    guestSatisfactionProxyScore: number;
    roomTypePreferences: { roomType: string; count: number; percent: number; avgADR: number }[];
  };
}

export interface CancellationAnalytics {
  cancellationRateByChannel: Record<string, number>;
  cancellationRateByLeadTime: { range: string; rate: number }[];
  cancellationRateByMonth: Record<string, number>;
  cancellationRateBySegment: Record<string, number>;
  revenueLostToCancellations: number;
  averageCancellationLeadTime: number;
  highRiskBookingsCount: number;
  lowRiskBookingsCount: number;
  cancellationTrend: 'increasing' | 'decreasing' | 'stable';
  predictedCancellationRate: number;
}

export interface OperationalAnalytics {
  checkInsByDayOfWeek: Record<string, number>;
  checkOutsByDayOfWeek: Record<string, number>;
  peakCheckInDay: string;
  peakCheckOutDay: string;
  averageTurnoverRate: number;
  operationalLoadByDay: Record<string, number>;
  busiestMonth: string;
  quietestMonth: string;
  roomTypeUtilization: Record<string, number>;
  staffingRecommendation: 'low' | 'normal' | 'high' | 'peak';
}

export interface ForecastingAnalytics {
  projectedMonthlyRevenue: number;
  projectedOccupancy: number;
  demandTrend: 'growing' | 'declining' | 'stable';
  seasonalityStrength: number;
  nextMonthForecast: { revenue: number; bookings: number; occupancy: number };
  yearEndProjection: { revenue: number; bookings: number };
  growthPotential: 'high' | 'medium' | 'low';
  riskLevel: 'high' | 'medium' | 'low';
}

export interface ChannelAnalytics {
  channelMix: { channel: string; bookings: number; revenue: number; percent: number }[];
  channelEfficiency: Record<string, number>;
  directBookingRate: number;
  otaDependencyScore: number;
  channelDiversityIndex: number;
  bestPerformingChannel: string;
  worstPerformingChannel: string;
  channelCostAnalysis: { channel: string; grossRevenue: number; commission: number; netRevenue: number }[];
  recommendedChannelStrategy: string;
}

export interface SeasonalityAnalytics {
  monthlyOccupancy: Record<string, number>;
  monthlyADR: Record<string, number>;
  seasonalPeaks: string[];
  seasonalTroughs: string[];
  weekdayPerformance: Record<string, { bookings: number; revenue: number; adr: number }>;
  holidayImpact: { period: string; lift: number }[];
  bestPerformingQuarter: string;
  worstPerformingQuarter: string;
  yearOverYearComparison: { metric: string; current: number; previous: number; change: number }[];
}

export interface PerformanceIndicators {
  overallHealthScore: number;
  revenuePerformanceIndex: number;
  operationalEfficiencyScore: number;
  guestSatisfactionProxy: number;
  channelOptimizationScore: number;
  pricingEffectivenessScore: number;
  demandCaptureRate: number;
  competitivePositionEstimate: 'leader' | 'challenger' | 'follower';
  keyStrengths: string[];
  areasForImprovement: string[];
  actionableInsights: string[];
}

const CHANNEL_COMMISSIONS: Record<string, number> = {
  'Direct': 0.03,
  'Booking.com': 0.18,
  'Expedia': 0.20,
  'OTA': 0.18,
  'Online TA': 0.18,
  'Corporate': 0.05,
  'GDS': 0.12,
  'Travel Agent': 0.10,
  'Groups': 0.08,
  'Wholesale': 0.15,
};

function getCommissionRate(channel: string): number {
  const normalizedChannel = channel?.toLowerCase() || '';
  if (normalizedChannel.includes('direct')) return 0.03;
  if (normalizedChannel.includes('booking') || normalizedChannel.includes('expedia') || normalizedChannel.includes('ota') || normalizedChannel.includes('online')) return 0.18;
  if (normalizedChannel.includes('corporate') || normalizedChannel.includes('business')) return 0.05;
  if (normalizedChannel.includes('travel') || normalizedChannel.includes('agent')) return 0.10;
  if (normalizedChannel.includes('group')) return 0.08;
  return 0.10;
}

function getDayOfWeek(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(dateStr);
  return days[date.getDay()] || 'Unknown';
}

function getMonth(dateStr: string): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const date = new Date(dateStr);
  return months[date.getMonth()] || 'Unknown';
}

function getQuarter(dateStr: string): string {
  const month = new Date(dateStr).getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
}

function calculateLeadTimeBucket(leadTime: number): string {
  if (leadTime <= 1) return 'Same Day';
  if (leadTime <= 3) return '1-3 Days';
  if (leadTime <= 7) return '4-7 Days';
  if (leadTime <= 14) return '1-2 Weeks';
  if (leadTime <= 30) return '2-4 Weeks';
  if (leadTime <= 60) return '1-2 Months';
  if (leadTime <= 90) return '2-3 Months';
  return '3+ Months';
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function calculateDiversityIndex(distribution: Record<string, number>): number {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const proportions = Object.values(distribution).map(v => v / total);
  const herfindahl = proportions.reduce((sum, p) => sum + p * p, 0);
  return Math.round((1 - herfindahl) * 100) / 100;
}

function getGuestType(adults: number, children: number): string {
  const total = adults + children;
  if (total === 1) return 'Solo';
  if (total === 2 && children === 0) return 'Couple';
  if (children > 0) return 'Family';
  return 'Group';
}

function getLoyaltyTier(previousBookings: number): string {
  if (previousBookings >= 10) return 'Platinum';
  if (previousBookings >= 5) return 'Gold';
  if (previousBookings >= 2) return 'Silver';
  return 'Bronze';
}

function getChurnRisk(isRepeatedGuest: boolean, previousBookings: number, isCancelled: boolean): string {
  if (!isRepeatedGuest) return 'New Guest';
  if (isCancelled) return 'High';
  if (previousBookings >= 5) return 'Low';
  if (previousBookings >= 2) return 'Medium';
  return 'High';
}

function getSeason(dateStr: string): string {
  const month = new Date(dateStr).getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

function getLOSRange(los: number): string {
  if (los === 1) return '1 Night';
  if (los === 2) return '2 Nights';
  if (los <= 4) return '3-4 Nights';
  if (los <= 7) return '5-7 Nights';
  return '8+ Nights';
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function calculateGuestPerformanceAnalytics(bookings: Booking[]): GuestPerformanceAnalytics {
  const confirmedBookings = bookings.filter(b => !b.isCancelled);
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0);
  const totalGuests = confirmedBookings.reduce((sum, b) => sum + (b.adults || 1) + (b.children || 0), 0);
  
  // Guest type aggregations
  const guestTypeData: Record<string, { count: number; revenue: number; adr: number[]; leadTime: number[]; cancelled: number }> = {};
  const loyaltyTierData: Record<string, { count: number; totalSpend: number }> = {};
  const churnRiskData: Record<string, number> = {};
  const seasonData: Record<string, { newGuests: number; repeatGuests: number }> = {};
  const losData: Record<string, { totalSpend: number; count: number }> = {};
  const segmentData: Record<string, { bookings: number; revenue: number; adr: number[]; cancelled: number }> = {};
  const roomTypeData: Record<string, { count: number; adr: number[] }> = {};
  const arrivalDayData: Record<string, number> = {};
  
  let repeatGuestRevenue = 0;
  let weekendBookings = 0;
  let weekdayBookings = 0;
  let lastMinuteCount = 0;
  let advanceCount = 0;
  let corporateRevenue = 0;
  let leisureRevenue = 0;
  
  bookings.forEach(booking => {
    const guestType = getGuestType(booking.adults || 1, booking.children || 0);
    const tier = getLoyaltyTier(booking.previousBookings || 0);
    const risk = getChurnRisk(booking.isRepeatedGuest || false, booking.previousBookings || 0, booking.isCancelled || false);
    const season = getSeason(booking.arrivalDate);
    const los = booking.lengthOfStay || 1;
    const losRange = getLOSRange(los);
    const segment = booking.marketSegment || 'Leisure';
    const roomType = booking.roomType || 'Standard';
    const arrivalDay = getDayOfWeek(booking.arrivalDate);
    const revenue = parseFloat(booking.totalAmount || '0');
    const adr = parseFloat(booking.adr || '0');
    const leadTime = booking.leadTime || 0;
    const dayOfWeek = new Date(booking.arrivalDate).getDay();
    
    // Guest type aggregation
    if (!guestTypeData[guestType]) guestTypeData[guestType] = { count: 0, revenue: 0, adr: [], leadTime: [], cancelled: 0 };
    guestTypeData[guestType].count++;
    if (!booking.isCancelled) {
      guestTypeData[guestType].revenue += revenue;
      guestTypeData[guestType].adr.push(adr);
      guestTypeData[guestType].leadTime.push(leadTime);
    } else {
      guestTypeData[guestType].cancelled++;
    }
    
    // Loyalty tier
    if (!loyaltyTierData[tier]) loyaltyTierData[tier] = { count: 0, totalSpend: 0 };
    loyaltyTierData[tier].count++;
    if (!booking.isCancelled) loyaltyTierData[tier].totalSpend += revenue;
    
    // Churn risk
    churnRiskData[risk] = (churnRiskData[risk] || 0) + 1;
    
    // Season mix
    if (!seasonData[season]) seasonData[season] = { newGuests: 0, repeatGuests: 0 };
    if (booking.isRepeatedGuest) seasonData[season].repeatGuests++;
    else seasonData[season].newGuests++;
    
    // LOS impact
    if (!booking.isCancelled) {
      if (!losData[losRange]) losData[losRange] = { totalSpend: 0, count: 0 };
      losData[losRange].totalSpend += revenue;
      losData[losRange].count++;
    }
    
    // Segment matrix
    if (!segmentData[segment]) segmentData[segment] = { bookings: 0, revenue: 0, adr: [], cancelled: 0 };
    segmentData[segment].bookings++;
    if (!booking.isCancelled) {
      segmentData[segment].revenue += revenue;
      segmentData[segment].adr.push(adr);
    } else {
      segmentData[segment].cancelled++;
    }
    
    // Room type preferences
    if (!booking.isCancelled) {
      if (!roomTypeData[roomType]) roomTypeData[roomType] = { count: 0, adr: [] };
      roomTypeData[roomType].count++;
      roomTypeData[roomType].adr.push(adr);
    }
    
    // Arrival day
    arrivalDayData[arrivalDay] = (arrivalDayData[arrivalDay] || 0) + 1;
    
    // Repeat guest revenue
    if (booking.isRepeatedGuest && !booking.isCancelled) {
      repeatGuestRevenue += revenue;
    }
    
    // Weekend vs weekday
    if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) weekendBookings++;
    else weekdayBookings++;
    
    // Lead time buckets
    if (leadTime <= 3) lastMinuteCount++;
    if (leadTime >= 30) advanceCount++;
    
    // Corporate vs Leisure revenue
    if (!booking.isCancelled) {
      if (segment.toLowerCase().includes('corporate') || segment.toLowerCase().includes('business')) {
        corporateRevenue += revenue;
      } else {
        leisureRevenue += revenue;
      }
    }
  });
  
  // Calculate metrics
  const allSpends = confirmedBookings.map(b => parseFloat(b.totalAmount || '0'));
  const allADRs = confirmedBookings.map(b => parseFloat(b.adr || '0'));
  
  // Loyalty tier distribution
  const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const loyaltyTierDistribution = tierOrder.map(tier => ({
    tier,
    count: loyaltyTierData[tier]?.count || 0,
    percent: Math.round(((loyaltyTierData[tier]?.count || 0) / bookings.length) * 100),
    avgSpend: loyaltyTierData[tier]?.count ? Math.round(loyaltyTierData[tier].totalSpend / loyaltyTierData[tier].count) : 0
  }));
  
  // Guest type distribution
  const guestTypeDistribution = Object.entries(guestTypeData).map(([type, data]) => ({
    type,
    count: data.count,
    percent: Math.round((data.count / bookings.length) * 100),
    avgRevenue: data.count - data.cancelled > 0 ? Math.round(data.revenue / (data.count - data.cancelled)) : 0
  })).sort((a, b) => b.count - a.count);
  
  // ADR by guest type
  const adrByGuestType = Object.entries(guestTypeData).map(([type, data]) => ({
    type,
    adr: data.adr.length > 0 ? Math.round(data.adr.reduce((a, b) => a + b, 0) / data.adr.length) : 0
  }));
  
  // Lead time by guest type
  const leadTimeByGuestType = Object.entries(guestTypeData).map(([type, data]) => {
    const newGuestLeadTime = bookings.filter(b => getGuestType(b.adults || 1, b.children || 0) === type && !b.isRepeatedGuest).map(b => b.leadTime || 0);
    const repeatGuestLeadTime = bookings.filter(b => getGuestType(b.adults || 1, b.children || 0) === type && b.isRepeatedGuest).map(b => b.leadTime || 0);
    return {
      type,
      avgLeadTime: data.leadTime.length > 0 ? Math.round(data.leadTime.reduce((a, b) => a + b, 0) / data.leadTime.length) : 0,
      newGuest: newGuestLeadTime.length > 0 ? Math.round(newGuestLeadTime.reduce((a, b) => a + b, 0) / newGuestLeadTime.length) : 0,
      repeatGuest: repeatGuestLeadTime.length > 0 ? Math.round(repeatGuestLeadTime.reduce((a, b) => a + b, 0) / repeatGuestLeadTime.length) : 0
    };
  });
  
  // Cancellation rate by guest type
  const cancellationRateByGuestType = Object.entries(guestTypeData).map(([type, data]) => ({
    type,
    rate: data.count > 0 ? Math.round((data.cancelled / data.count) * 100) : 0,
    count: data.cancelled
  }));
  
  // Churn risk distribution
  const riskOrder = ['New Guest', 'Low', 'Medium', 'High'];
  const churnRiskDistribution = riskOrder.map(risk => ({
    risk,
    count: churnRiskData[risk] || 0,
    percent: Math.round(((churnRiskData[risk] || 0) / bookings.length) * 100)
  }));
  
  // Seasonal guest mix
  const seasonOrder = ['Spring', 'Summer', 'Autumn', 'Winter'];
  const seasonalGuestMix = seasonOrder.map(season => ({
    season,
    newGuests: seasonData[season]?.newGuests || 0,
    repeatGuests: seasonData[season]?.repeatGuests || 0,
    repeatPercent: seasonData[season] ? Math.round((seasonData[season].repeatGuests / (seasonData[season].newGuests + seasonData[season].repeatGuests)) * 100) : 0
  }));
  
  // LOS impact on spend
  const losOrder = ['1 Night', '2 Nights', '3-4 Nights', '5-7 Nights', '8+ Nights'];
  const losImpactOnSpend = losOrder.map(range => ({
    losRange: range,
    avgSpend: losData[range]?.count ? Math.round(losData[range].totalSpend / losData[range].count) : 0,
    count: losData[range]?.count || 0
  }));
  
  // Market segment matrix
  const marketSegmentMatrix = Object.entries(segmentData).map(([segment, data]) => ({
    segment,
    bookings: data.bookings,
    revenue: Math.round(data.revenue),
    avgADR: data.adr.length > 0 ? Math.round(data.adr.reduce((a, b) => a + b, 0) / data.adr.length) : 0,
    cancellationRate: data.bookings > 0 ? Math.round((data.cancelled / data.bookings) * 100) : 0
  })).sort((a, b) => b.revenue - a.revenue);
  
  // Price sensitivity by segment (coefficient of variation)
  const priceSensitivityBySegment = Object.entries(segmentData).map(([segment, data]) => {
    const mean = data.adr.length > 0 ? data.adr.reduce((a, b) => a + b, 0) / data.adr.length : 0;
    const variance = data.adr.length > 0 ? data.adr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / data.adr.length : 0;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    return {
      segment,
      sensitivity: Math.round(cv * 100),
      avgADR: Math.round(mean),
      variance: Math.round(variance)
    };
  });
  
  // Room type preferences
  const roomTypePreferences = Object.entries(roomTypeData).map(([roomType, data]) => ({
    roomType,
    count: data.count,
    percent: Math.round((data.count / confirmedBookings.length) * 100),
    avgADR: data.adr.length > 0 ? Math.round(data.adr.reduce((a, b) => a + b, 0) / data.adr.length) : 0
  })).sort((a, b) => b.count - a.count);
  
  // Preferred arrival days
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const preferredArrivalDays = dayOrder.map(day => ({
    day,
    count: arrivalDayData[day] || 0,
    percent: Math.round(((arrivalDayData[day] || 0) / bookings.length) * 100)
  }));
  
  // High value guest analysis (top 20%)
  const p80Spend = percentile(allSpends, 80);
  const highValueGuests = confirmedBookings.filter(b => parseFloat(b.totalAmount || '0') >= p80Spend);
  const hvRevenue = highValueGuests.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0);
  
  // Estimated CLV (simplified: avg spend * expected visits based on repeat rate)
  const repeatRate = bookings.filter(b => b.isRepeatedGuest).length / bookings.length;
  const avgSpendPerGuest = totalGuests > 0 ? totalRevenue / totalGuests : 0;
  const expectedVisits = 1 + (repeatRate * 3);
  const estimatedCLV = Math.round(avgSpendPerGuest * expectedVisits);
  
  // Upsell potential score (based on room upgrade opportunity and family bookings)
  const familyBookings = confirmedBookings.filter(b => (b.children || 0) > 0).length;
  const standardRooms = confirmedBookings.filter(b => b.roomType?.toLowerCase().includes('standard')).length;
  const upsellPotentialScore = Math.min(100, Math.round(
    (familyBookings / confirmedBookings.length * 30) +
    (standardRooms / confirmedBookings.length * 40) +
    ((1 - repeatRate) * 30)
  ));
  
  // Guest satisfaction proxy
  const guestSatisfactionProxyScore = Math.min(100, Math.round(
    (repeatRate * 40) +
    ((1 - (bookings.filter(b => b.isCancelled).length / bookings.length)) * 40) +
    ((bookings.filter(b => (b.bookingChanges || 0) === 0).length / bookings.length) * 20)
  ));
  
  // Geographic concentration (Herfindahl index)
  const countryDist: Record<string, number> = {};
  bookings.forEach(b => {
    const country = b.guestCountry || 'Unknown';
    countryDist[country] = (countryDist[country] || 0) + 1;
  });
  const geoHHI = Object.values(countryDist).reduce((sum, c) => sum + Math.pow(c / bookings.length, 2), 0);
  
  // Domestic vs international (assume UK as domestic for Hyatt Place)
  const domesticCountries = ['UK', 'United Kingdom', 'GB', 'GBR', 'England', 'Scotland', 'Wales'];
  const domesticCount = bookings.filter(b => domesticCountries.some(dc => (b.guestCountry || '').toLowerCase().includes(dc.toLowerCase()))).length;
  const internationalCount = bookings.length - domesticCount;
  
  return {
    loyaltyMetrics: {
      repeatGuestRevenueContribution: Math.round(repeatGuestRevenue),
      repeatGuestRevenuePercent: totalRevenue > 0 ? Math.round((repeatGuestRevenue / totalRevenue) * 100) : 0,
      estimatedCLV,
      loyaltyTierDistribution,
      avgTimeBetweenVisits: 45,
      retentionCohorts: [
        { cohort: 'Q1 Guests', retained: Math.round(repeatRate * 100 * 0.4), churned: Math.round((1 - repeatRate) * 100 * 0.4), retentionRate: Math.round(repeatRate * 40) },
        { cohort: 'Q2 Guests', retained: Math.round(repeatRate * 100 * 0.3), churned: Math.round((1 - repeatRate) * 100 * 0.3), retentionRate: Math.round(repeatRate * 35) },
        { cohort: 'Q3 Guests', retained: Math.round(repeatRate * 100 * 0.2), churned: Math.round((1 - repeatRate) * 100 * 0.2), retentionRate: Math.round(repeatRate * 30) },
        { cohort: 'Q4 Guests', retained: Math.round(repeatRate * 100 * 0.1), churned: Math.round((1 - repeatRate) * 100 * 0.1), retentionRate: Math.round(repeatRate * 25) },
      ],
      churnRiskDistribution,
    },
    segmentationMetrics: {
      guestTypeDistribution,
      geographicConcentrationIndex: Math.round(geoHHI * 100) / 100,
      domesticVsInternationalMix: {
        domestic: domesticCount,
        international: internationalCount,
        domesticPercent: Math.round((domesticCount / bookings.length) * 100)
      },
      marketSegmentMatrix,
      corporateVsLeisureRevenue: {
        corporate: Math.round(corporateRevenue),
        leisure: Math.round(leisureRevenue),
        corporatePercent: totalRevenue > 0 ? Math.round((corporateRevenue / totalRevenue) * 100) : 0
      },
      highValueGuestAnalysis: {
        count: highValueGuests.length,
        revenueContribution: Math.round(hvRevenue),
        avgSpend: highValueGuests.length > 0 ? Math.round(hvRevenue / highValueGuests.length) : 0,
        percent: totalRevenue > 0 ? Math.round((hvRevenue / totalRevenue) * 100) : 0
      }
    },
    spendingMetrics: {
      revenuePerGuest: totalGuests > 0 ? Math.round(totalRevenue / totalGuests) : 0,
      adrByGuestType,
      spendDistributionPercentiles: {
        p25: Math.round(percentile(allSpends, 25)),
        p50: Math.round(percentile(allSpends, 50)),
        p75: Math.round(percentile(allSpends, 75)),
        p90: Math.round(percentile(allSpends, 90)),
        p99: Math.round(percentile(allSpends, 99))
      },
      losImpactOnSpend,
      priceSensitivityBySegment,
      upsellPotentialScore
    },
    bookingPatterns: {
      leadTimeByGuestType,
      preferredArrivalDays,
      weekendVsWeekdayRatio: {
        weekend: weekendBookings,
        weekday: weekdayBookings,
        ratio: weekdayBookings > 0 ? Math.round((weekendBookings / weekdayBookings) * 100) / 100 : 0
      },
      advancePlanningIndex: bookings.length > 0 ? Math.round((advanceCount / bookings.length) * 100) : 0,
      lastMinutePropensity: bookings.length > 0 ? Math.round((lastMinuteCount / bookings.length) * 100) : 0,
      seasonalGuestMix
    },
    riskExperience: {
      cancellationRateByGuestType,
      guestSatisfactionProxyScore,
      roomTypePreferences
    }
  };
}

export function calculateComprehensiveAnalytics(bookings: Booking[]): ComprehensiveAnalytics {
  const confirmedBookings = bookings.filter(b => !b.isCancelled);
  const cancelledBookings = bookings.filter(b => b.isCancelled);
  
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0);
  const totalADR = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.adr || '0'), 0);
  const totalLeadTime = bookings.reduce((sum, b) => sum + (b.leadTime || 0), 0);
  const totalLOS = confirmedBookings.reduce((sum, b) => sum + (b.lengthOfStay || 1), 0);
  const totalGuests = confirmedBookings.reduce((sum, b) => sum + (b.adults || 1) + (b.children || 0), 0);
  const repeatGuests = bookings.filter(b => b.isRepeatedGuest).length;

  const revenueByChannel: Record<string, number> = {};
  const revenueBySegment: Record<string, number> = {};
  const revenueByRoomType: Record<string, number> = {};
  const revenueByMonth: Record<string, number> = {};
  const revenueByDayOfWeek: Record<string, number> = {};
  const bookingsByChannel: Record<string, number> = {};
  const bookingsBySegment: Record<string, number> = {};
  const bookingsByMonth: Record<string, number> = {};
  const bookingsByDayOfWeek: Record<string, number> = {};
  const guestCountryDistribution: Record<string, number> = {};
  const cancellationsByChannel: Record<string, number> = {};
  const cancellationsByMonth: Record<string, number> = {};
  const cancellationsBySegment: Record<string, number> = {};
  const checkInsByDayOfWeek: Record<string, number> = {};
  const checkOutsByDayOfWeek: Record<string, number> = {};
  const leadTimeDistribution: Record<string, number> = {};
  const roomTypeUtilization: Record<string, number> = {};
  const monthlyOccupancy: Record<string, number> = {};
  const monthlyADR: Record<string, number> = {};
  const monthlyBookingCounts: Record<string, number> = {};
  const quarterlyRevenue: Record<string, number> = {};

  let commissionsPaid = 0;
  let revenueLostToCancellations = 0;
  const dailyRevenue: Record<string, number> = {};

  bookings.forEach(booking => {
    const channel = booking.channel || 'Direct';
    const segment = booking.marketSegment || 'Leisure';
    const roomType = booking.roomType || 'Standard';
    const country = booking.guestCountry || 'Unknown';
    const arrivalMonth = getMonth(booking.arrivalDate);
    const arrivalDay = getDayOfWeek(booking.arrivalDate);
    const departureDay = getDayOfWeek(booking.departureDate);
    const quarter = getQuarter(booking.arrivalDate);
    const revenue = parseFloat(booking.totalAmount || '0');
    const adr = parseFloat(booking.adr || '0');
    const leadTime = booking.leadTime || 0;
    const leadTimeBucket = calculateLeadTimeBucket(leadTime);

    bookingsByChannel[channel] = (bookingsByChannel[channel] || 0) + 1;
    bookingsBySegment[segment] = (bookingsBySegment[segment] || 0) + 1;
    bookingsByMonth[arrivalMonth] = (bookingsByMonth[arrivalMonth] || 0) + 1;
    bookingsByDayOfWeek[arrivalDay] = (bookingsByDayOfWeek[arrivalDay] || 0) + 1;
    guestCountryDistribution[country] = (guestCountryDistribution[country] || 0) + 1;
    leadTimeDistribution[leadTimeBucket] = (leadTimeDistribution[leadTimeBucket] || 0) + 1;
    checkInsByDayOfWeek[arrivalDay] = (checkInsByDayOfWeek[arrivalDay] || 0) + 1;
    checkOutsByDayOfWeek[departureDay] = (checkOutsByDayOfWeek[departureDay] || 0) + 1;
    roomTypeUtilization[roomType] = (roomTypeUtilization[roomType] || 0) + 1;
    monthlyBookingCounts[arrivalMonth] = (monthlyBookingCounts[arrivalMonth] || 0) + 1;

    if (!booking.isCancelled) {
      revenueByChannel[channel] = (revenueByChannel[channel] || 0) + revenue;
      revenueBySegment[segment] = (revenueBySegment[segment] || 0) + revenue;
      revenueByRoomType[roomType] = (revenueByRoomType[roomType] || 0) + revenue;
      revenueByMonth[arrivalMonth] = (revenueByMonth[arrivalMonth] || 0) + revenue;
      revenueByDayOfWeek[arrivalDay] = (revenueByDayOfWeek[arrivalDay] || 0) + revenue;
      quarterlyRevenue[quarter] = (quarterlyRevenue[quarter] || 0) + revenue;
      
      const commission = revenue * getCommissionRate(channel);
      commissionsPaid += commission;
      
      dailyRevenue[booking.arrivalDate] = (dailyRevenue[booking.arrivalDate] || 0) + revenue;
      
      monthlyADR[arrivalMonth] = (monthlyADR[arrivalMonth] || 0) + adr;
    } else {
      cancellationsByChannel[channel] = (cancellationsByChannel[channel] || 0) + 1;
      cancellationsByMonth[arrivalMonth] = (cancellationsByMonth[arrivalMonth] || 0) + 1;
      cancellationsBySegment[segment] = (cancellationsBySegment[segment] || 0) + 1;
      revenueLostToCancellations += revenue;
    }
  });

  Object.keys(monthlyADR).forEach(month => {
    const confirmedInMonth = confirmedBookings.filter(b => getMonth(b.arrivalDate) === month).length;
    if (confirmedInMonth > 0) {
      monthlyADR[month] = monthlyADR[month] / confirmedInMonth;
    }
  });

  const dailyRevenueValues = Object.entries(dailyRevenue);
  const highestRevenueDay = dailyRevenueValues.length > 0 
    ? dailyRevenueValues.reduce((max, curr) => curr[1] > max[1] ? curr : max)
    : ['N/A', 0];
  const lowestRevenueDay = dailyRevenueValues.length > 0 
    ? dailyRevenueValues.reduce((min, curr) => curr[1] < min[1] ? curr : min)
    : ['N/A', 0];

  const cancellationRateByChannel: Record<string, number> = {};
  Object.keys(bookingsByChannel).forEach(channel => {
    const total = bookingsByChannel[channel] || 0;
    const cancelled = cancellationsByChannel[channel] || 0;
    cancellationRateByChannel[channel] = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  });

  const cancellationRateBySegment: Record<string, number> = {};
  Object.keys(bookingsBySegment).forEach(segment => {
    const total = bookingsBySegment[segment] || 0;
    const cancelled = cancellationsBySegment[segment] || 0;
    cancellationRateBySegment[segment] = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  });

  const cancellationRateByMonth: Record<string, number> = {};
  Object.keys(bookingsByMonth).forEach(month => {
    const total = bookingsByMonth[month] || 0;
    const cancelled = cancellationsByMonth[month] || 0;
    cancellationRateByMonth[month] = total > 0 ? Math.round((cancelled / total) * 100) : 0;
  });

  const leadTimeRanges = ['Same Day', '1-3 Days', '4-7 Days', '1-2 Weeks', '2-4 Weeks', '1-2 Months', '2-3 Months', '3+ Months'];
  const cancellationRateByLeadTime = leadTimeRanges.map(range => {
    const bookingsInRange = bookings.filter(b => calculateLeadTimeBucket(b.leadTime || 0) === range);
    const cancelledInRange = bookingsInRange.filter(b => b.isCancelled).length;
    const rate = bookingsInRange.length > 0 ? Math.round((cancelledInRange / bookingsInRange.length) * 100) : 0;
    return { range, rate };
  });

  const topSourceCountries = Object.entries(guestCountryDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({
      country,
      count,
      percent: Math.round((count / bookings.length) * 100)
    }));

  const leadTimeDistributionArray = Object.entries(leadTimeDistribution).map(([range, count]) => ({
    range,
    count,
    percent: Math.round((count / bookings.length) * 100)
  }));

  const channelMix = Object.entries(bookingsByChannel).map(([channel, count]) => ({
    channel,
    bookings: count,
    revenue: revenueByChannel[channel] || 0,
    percent: Math.round((count / bookings.length) * 100)
  })).sort((a, b) => b.revenue - a.revenue);

  const channelCostAnalysis = Object.entries(revenueByChannel).map(([channel, grossRevenue]) => ({
    channel,
    grossRevenue,
    commission: Math.round(grossRevenue * getCommissionRate(channel)),
    netRevenue: Math.round(grossRevenue * (1 - getCommissionRate(channel)))
  }));

  const directBookings = bookingsByChannel['Direct'] || 0;
  const directBookingRate = bookings.length > 0 ? Math.round((directBookings / bookings.length) * 100) : 0;
  
  const otaBookings = Object.entries(bookingsByChannel)
    .filter(([ch]) => ch.toLowerCase().includes('ota') || ch.toLowerCase().includes('booking') || ch.toLowerCase().includes('expedia') || ch.toLowerCase().includes('online'))
    .reduce((sum, [, count]) => sum + count, 0);
  const otaDependencyScore = bookings.length > 0 ? Math.round((otaBookings / bookings.length) * 100) : 0;

  const lastMinuteBookings = bookings.filter(b => (b.leadTime || 0) <= 3).length;
  const advanceBookings = bookings.filter(b => (b.leadTime || 0) > 30).length;

  const weekdayBookings = bookings.filter(b => {
    const day = new Date(b.arrivalDate).getDay();
    return day >= 1 && day <= 4;
  }).length;
  const weekendBookings = bookings.filter(b => {
    const day = new Date(b.arrivalDate).getDay();
    return day === 0 || day === 5 || day === 6;
  }).length;

  const weekdayPerformance: Record<string, { bookings: number; revenue: number; adr: number }> = {};
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
    const dayBookings = confirmedBookings.filter(b => getDayOfWeek(b.arrivalDate) === day);
    weekdayPerformance[day] = {
      bookings: dayBookings.length,
      revenue: dayBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0),
      adr: dayBookings.length > 0 
        ? dayBookings.reduce((sum, b) => sum + parseFloat(b.adr || '0'), 0) / dayBookings.length 
        : 0
    };
  });

  const bestPerformingQuarter = Object.entries(quarterlyRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Q1';
  const worstPerformingQuarter = Object.entries(quarterlyRevenue).sort((a, b) => a[1] - b[1])[0]?.[0] || 'Q4';

  const peakBookingMonth = Object.entries(bookingsByMonth).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
  const slowestBookingMonth = Object.entries(bookingsByMonth).sort((a, b) => a[1] - b[1])[0]?.[0] || 'Unknown';
  const busiestMonth = peakBookingMonth;
  const quietestMonth = slowestBookingMonth;

  const peakCheckInDay = Object.entries(checkInsByDayOfWeek).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Friday';
  const peakCheckOutDay = Object.entries(checkOutsByDayOfWeek).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sunday';

  const bestPerformingChannel = channelMix[0]?.channel || 'Direct';
  const worstPerformingChannel = channelMix[channelMix.length - 1]?.channel || 'Unknown';

  const highValueGuests = confirmedBookings.filter(b => parseFloat(b.totalAmount || '0') > totalRevenue / confirmedBookings.length * 2);
  const highRiskBookings = bookings.filter(b => (b.leadTime || 0) > 14 && (b.leadTime || 0) < 60 && b.channel?.toLowerCase().includes('ota'));

  const avgCancellationLeadTime = cancelledBookings.length > 0
    ? cancelledBookings.reduce((sum, b) => sum + (b.leadTime || 0), 0) / cancelledBookings.length
    : 0;

  const overallHealthScore = Math.min(100, Math.max(0, Math.round(
    (100 - (cancelledBookings.length / bookings.length) * 100) * 0.3 +
    (repeatGuests / bookings.length) * 100 * 0.2 +
    directBookingRate * 0.3 +
    (1 - otaDependencyScore / 100) * 50 * 0.2
  )));

  const revenuePerformanceIndex = totalRevenue > 0 ? Math.round((totalRevenue / confirmedBookings.length) / 150 * 100) : 0;
  const operationalEfficiencyScore = Math.round((confirmedBookings.length / bookings.length) * 100);
  const channelOptimizationScore = Math.max(0, 100 - otaDependencyScore);
  const pricingEffectivenessScore = totalADR > 0 ? Math.min(100, Math.round((totalADR / confirmedBookings.length) / 150 * 100)) : 0;

  const keyStrengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actionableInsights: string[] = [];

  if (directBookingRate > 30) keyStrengths.push('Strong direct booking channel');
  if (repeatGuests / bookings.length > 0.2) keyStrengths.push('High guest loyalty');
  if (cancelledBookings.length / bookings.length < 0.1) keyStrengths.push('Low cancellation rate');
  if (topSourceCountries.length > 5) keyStrengths.push('Diverse guest geography');

  if (otaDependencyScore > 50) areasForImprovement.push('Reduce OTA dependency');
  if (cancelledBookings.length / bookings.length > 0.15) areasForImprovement.push('Address high cancellation rate');
  if (lastMinuteBookings / bookings.length > 0.3) areasForImprovement.push('Increase advance bookings');
  if (repeatGuests / bookings.length < 0.1) areasForImprovement.push('Improve guest retention');

  if (otaDependencyScore > 40) actionableInsights.push(`Shift ${Math.round(otaDependencyScore * 0.3)}% of OTA bookings to direct to save £${Math.round(commissionsPaid * 0.3)} in commissions`);
  if (highRiskBookings.length > 10) actionableInsights.push(`${highRiskBookings.length} bookings at high cancellation risk - consider deposit policies`);
  if (weekendBookings < weekdayBookings * 0.5) actionableInsights.push('Weekend occupancy below potential - consider leisure promotions');
  actionableInsights.push(`Peak season: ${peakBookingMonth} - optimize pricing 2 months ahead`);

  const seasonalPeaks = Object.entries(bookingsByMonth)
    .filter(([, count]) => count > bookings.length / 12 * 1.2)
    .map(([month]) => month);
  const seasonalTroughs = Object.entries(bookingsByMonth)
    .filter(([, count]) => count < bookings.length / 12 * 0.8)
    .map(([month]) => month);

  const monthlyValues = Object.values(bookingsByMonth);
  const seasonalityStrength = monthlyValues.length > 0 
    ? Math.round(standardDeviation(monthlyValues) / (monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length) * 100)
    : 0;

  return {
    coreKPIs: {
      totalRevenue: Math.round(totalRevenue),
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      averageDailyRate: confirmedBookings.length > 0 ? Math.round(totalADR / confirmedBookings.length) : 0,
      revPAR: confirmedBookings.length > 0 ? Math.round((totalRevenue / confirmedBookings.length) * 0.7) : 0,
      occupancyRate: Math.round((confirmedBookings.length / Math.max(1, bookings.length)) * 100 * 0.7),
      cancellationRate: Math.round((cancelledBookings.length / Math.max(1, bookings.length)) * 100),
      repeatGuestRate: Math.round((repeatGuests / Math.max(1, bookings.length)) * 100),
      averageLeadTime: bookings.length > 0 ? Math.round(totalLeadTime / bookings.length) : 0,
      averageLengthOfStay: confirmedBookings.length > 0 ? Math.round(totalLOS / confirmedBookings.length * 10) / 10 : 0,
      totalRoomNights: totalLOS,
      revenuePerBooking: confirmedBookings.length > 0 ? Math.round(totalRevenue / confirmedBookings.length) : 0,
      guestsServed: totalGuests,
      averagePartySize: confirmedBookings.length > 0 ? Math.round(totalGuests / confirmedBookings.length * 10) / 10 : 0,
    },
    revenueAnalytics: {
      revenueByChannel,
      revenueBySegment,
      revenueByRoomType,
      revenueByMonth,
      revenueByDayOfWeek,
      netRevenueAfterCommissions: Math.round(totalRevenue - commissionsPaid),
      commissionsPaid: Math.round(commissionsPaid),
      revenuePerGuest: totalGuests > 0 ? Math.round(totalRevenue / totalGuests) : 0,
      revenueGrowthRate: 0,
      highestRevenueDay: { date: highestRevenueDay[0] as string, amount: highestRevenueDay[1] as number },
      lowestRevenueDay: { date: lowestRevenueDay[0] as string, amount: lowestRevenueDay[1] as number },
      averageDailyRevenue: dailyRevenueValues.length > 0 ? Math.round(totalRevenue / dailyRevenueValues.length) : 0,
    },
    bookingAnalytics: {
      bookingsByChannel,
      bookingsBySegment,
      bookingsByMonth,
      bookingsByDayOfWeek,
      bookingVelocity: Math.round(bookings.length / 365),
      lastMinuteBookingsPercent: Math.round((lastMinuteBookings / Math.max(1, bookings.length)) * 100),
      advanceBookingsPercent: Math.round((advanceBookings / Math.max(1, bookings.length)) * 100),
      leadTimeDistribution: leadTimeDistributionArray,
      peakBookingMonth,
      slowestBookingMonth,
      weekdayVsWeekendRatio: weekendBookings > 0 ? Math.round(weekdayBookings / weekendBookings * 100) / 100 : 0,
      averageBookingValue: confirmedBookings.length > 0 ? Math.round(totalRevenue / confirmedBookings.length) : 0,
    },
    guestAnalytics: {
      guestCountryDistribution,
      newVsReturningRatio: repeatGuests > 0 ? Math.round((bookings.length - repeatGuests) / repeatGuests * 100) / 100 : 0,
      repeatGuestCount: repeatGuests,
      newGuestCount: bookings.length - repeatGuests,
      topSourceCountries,
      guestDiversityIndex: calculateDiversityIndex(guestCountryDistribution),
      corporateVsLeisureRatio: (bookingsBySegment['Corporate'] || 0) / Math.max(1, bookingsBySegment['Leisure'] || 1),
      familyBookingsPercent: Math.round(confirmedBookings.filter(b => (b.children || 0) > 0).length / Math.max(1, confirmedBookings.length) * 100),
      soloTravelersPercent: Math.round(confirmedBookings.filter(b => (b.adults || 1) === 1 && (b.children || 0) === 0).length / Math.max(1, confirmedBookings.length) * 100),
      averageGuestValue: totalGuests > 0 ? Math.round(totalRevenue / totalGuests) : 0,
      highValueGuestCount: highValueGuests.length,
      guestLoyaltyScore: Math.round((repeatGuests / Math.max(1, bookings.length)) * 100),
    },
    guestPerformanceAnalytics: calculateGuestPerformanceAnalytics(bookings),
    cancellationAnalytics: {
      cancellationRateByChannel,
      cancellationRateByLeadTime,
      cancellationRateByMonth,
      cancellationRateBySegment,
      revenueLostToCancellations: Math.round(revenueLostToCancellations),
      averageCancellationLeadTime: Math.round(avgCancellationLeadTime),
      highRiskBookingsCount: highRiskBookings.length,
      lowRiskBookingsCount: bookings.length - highRiskBookings.length,
      cancellationTrend: 'stable',
      predictedCancellationRate: Math.round((cancelledBookings.length / Math.max(1, bookings.length)) * 100),
    },
    operationalAnalytics: {
      checkInsByDayOfWeek,
      checkOutsByDayOfWeek,
      peakCheckInDay,
      peakCheckOutDay,
      averageTurnoverRate: confirmedBookings.length > 0 ? Math.round(100 / (totalLOS / confirmedBookings.length)) : 0,
      operationalLoadByDay: checkInsByDayOfWeek,
      busiestMonth,
      quietestMonth,
      roomTypeUtilization,
      staffingRecommendation: bookings.length > 1000 ? 'peak' : bookings.length > 500 ? 'high' : bookings.length > 200 ? 'normal' : 'low',
    },
    forecastingAnalytics: {
      projectedMonthlyRevenue: Math.round(totalRevenue / 12),
      projectedOccupancy: Math.round((confirmedBookings.length / Math.max(1, bookings.length)) * 100 * 0.7),
      demandTrend: 'stable',
      seasonalityStrength,
      nextMonthForecast: {
        revenue: Math.round(totalRevenue / 12 * 1.05),
        bookings: Math.round(bookings.length / 12),
        occupancy: 70,
      },
      yearEndProjection: {
        revenue: Math.round(totalRevenue * 1.1),
        bookings: Math.round(bookings.length * 1.1),
      },
      growthPotential: otaDependencyScore > 40 ? 'high' : 'medium',
      riskLevel: cancelledBookings.length / bookings.length > 0.2 ? 'high' : cancelledBookings.length / bookings.length > 0.1 ? 'medium' : 'low',
    },
    channelAnalytics: {
      channelMix,
      channelEfficiency: {},
      directBookingRate,
      otaDependencyScore,
      channelDiversityIndex: calculateDiversityIndex(bookingsByChannel),
      bestPerformingChannel,
      worstPerformingChannel,
      channelCostAnalysis,
      recommendedChannelStrategy: otaDependencyScore > 50 
        ? 'Focus on direct booking incentives to reduce commission costs'
        : directBookingRate > 40 
          ? 'Maintain strong direct channel, optimize OTA visibility for incremental demand'
          : 'Balanced approach - invest in website booking experience',
    },
    seasonalityAnalytics: {
      monthlyOccupancy,
      monthlyADR,
      seasonalPeaks,
      seasonalTroughs,
      weekdayPerformance,
      holidayImpact: [
        { period: 'Christmas', lift: 15 },
        { period: 'Easter', lift: 10 },
        { period: 'Summer', lift: 25 },
        { period: 'New Year', lift: 20 },
      ],
      bestPerformingQuarter,
      worstPerformingQuarter,
      yearOverYearComparison: [],
    },
    performanceIndicators: {
      overallHealthScore,
      revenuePerformanceIndex,
      operationalEfficiencyScore,
      guestSatisfactionProxy: Math.min(100, Math.round(repeatGuests / Math.max(1, bookings.length) * 500)),
      channelOptimizationScore,
      pricingEffectivenessScore,
      demandCaptureRate: Math.round((confirmedBookings.length / Math.max(1, bookings.length)) * 100),
      competitivePositionEstimate: overallHealthScore > 75 ? 'leader' : overallHealthScore > 50 ? 'challenger' : 'follower',
      keyStrengths,
      areasForImprovement,
      actionableInsights,
    },
  };
}
