import { Booking } from "@shared/schema";

export interface ComprehensiveAnalytics {
  coreKPIs: CoreKPIs;
  revenueAnalytics: RevenueAnalytics;
  bookingAnalytics: BookingAnalytics;
  guestAnalytics: GuestAnalytics;
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
