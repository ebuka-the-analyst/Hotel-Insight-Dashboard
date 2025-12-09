import type { Booking, Dataset } from "@shared/schema";

export interface AutoMappingResult {
  columnMapping: Record<string, string>;
  confidence: number;
  unmappedHeaders: string[];
  missingRequired: string[];
  mappingDetails: { header: string; field: string; confidence: number }[];
}

export interface UploadResponse {
  filename: string;
  headers: string[];
  rowCount: number;
  fileSize: number;
  autoMapping: AutoMappingResult;
}

export interface CreateDatasetRequest {
  file: File;
  name: string;
  columnMapping: Record<string, string>;
}

export interface CreateDatasetResponse {
  dataset: Dataset;
  bookingsCount: number;
}

export interface KPIData {
  totalRevenue: number;
  totalBookings: number;
  averageDailyRate: number;
  cancellationRate: number;
  averageLeadTime: number;
  repeatGuestRate: number;
  occupancyRate?: number;
}

export interface TrendData {
  date: string;
  revenue: number;
  bookings: number;
  adr: number;
}

export interface ChannelPerformance {
  channel: string;
  revenue: number;
  bookings: number;
  adr: number;
  cancellationRate: number;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || "Upload failed");
  }

  return response.json();
}

export async function createDataset(request: CreateDatasetRequest): Promise<CreateDatasetResponse> {
  const formData = new FormData();
  formData.append("file", request.file);
  formData.append("name", request.name);
  formData.append("columnMapping", JSON.stringify(request.columnMapping));

  const response = await fetch("/api/datasets", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Dataset creation failed" }));
    throw new Error(error.message || "Dataset creation failed");
  }

  return response.json();
}

export async function getDatasets(): Promise<Dataset[]> {
  const response = await fetch("/api/datasets");

  if (!response.ok) {
    throw new Error("Failed to fetch datasets");
  }

  return response.json();
}

export async function getKPIs(datasetId?: string): Promise<KPIData> {
  const url = datasetId 
    ? `/api/analytics/kpis?datasetId=${datasetId}`
    : "/api/analytics/kpis";
    
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch KPIs");
  }

  const data = await response.json();
  
  return {
    totalRevenue: data.kpis.totalRevenue,
    totalBookings: data.kpis.totalBookings,
    averageDailyRate: data.kpis.avgADR,
    cancellationRate: data.kpis.cancellationRate,
    averageLeadTime: data.kpis.avgLeadTime,
    repeatGuestRate: data.kpis.repeatGuestRate,
  };
}

export async function getTrends(datasetId?: string): Promise<{ daily: TrendData[]; weekly: TrendData[]; monthly: TrendData[] }> {
  const url = datasetId 
    ? `/api/analytics/trends?datasetId=${datasetId}`
    : "/api/analytics/trends";
    
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch trends");
  }

  return response.json();
}

export async function getChannelPerformance(datasetId?: string): Promise<ChannelPerformance[]> {
  const url = datasetId 
    ? `/api/analytics/channels?datasetId=${datasetId}`
    : "/api/analytics/channels";
    
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch channel performance");
  }

  return response.json();
}

export async function getBookings(datasetId?: string): Promise<Booking[]> {
  const url = datasetId 
    ? `/api/bookings?datasetId=${datasetId}`
    : "/api/bookings";
    
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }

  return response.json();
}

export interface ComprehensiveAnalytics {
  coreKPIs: {
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
  };
  revenueAnalytics: {
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
  };
  bookingAnalytics: {
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
  };
  guestAnalytics: {
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
  };
  cancellationAnalytics: {
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
  };
  operationalAnalytics: {
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
  };
  forecastingAnalytics: {
    projectedMonthlyRevenue: number;
    projectedOccupancy: number;
    demandTrend: 'growing' | 'declining' | 'stable';
    seasonalityStrength: number;
    nextMonthForecast: { revenue: number; bookings: number; occupancy: number };
    yearEndProjection: { revenue: number; bookings: number };
    growthPotential: 'high' | 'medium' | 'low';
    riskLevel: 'high' | 'medium' | 'low';
  };
  channelAnalytics: {
    channelMix: { channel: string; bookings: number; revenue: number; percent: number }[];
    channelEfficiency: Record<string, number>;
    directBookingRate: number;
    otaDependencyScore: number;
    channelDiversityIndex: number;
    bestPerformingChannel: string;
    worstPerformingChannel: string;
    channelCostAnalysis: { channel: string; grossRevenue: number; commission: number; netRevenue: number }[];
    recommendedChannelStrategy: string;
  };
  seasonalityAnalytics: {
    monthlyOccupancy: Record<string, number>;
    monthlyADR: Record<string, number>;
    seasonalPeaks: string[];
    seasonalTroughs: string[];
    weekdayPerformance: Record<string, { bookings: number; revenue: number; adr: number }>;
    holidayImpact: { period: string; lift: number }[];
    bestPerformingQuarter: string;
    worstPerformingQuarter: string;
    yearOverYearComparison: { metric: string; current: number; previous: number; change: number }[];
  };
  performanceIndicators: {
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
  };
}

export async function getComprehensiveAnalytics(datasetId?: string): Promise<ComprehensiveAnalytics> {
  const url = datasetId 
    ? `/api/analytics/comprehensive?datasetId=${datasetId}`
    : "/api/analytics/comprehensive";
    
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch comprehensive analytics");
  }

  return response.json();
}
