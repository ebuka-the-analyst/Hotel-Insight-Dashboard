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

export async function deleteDataset(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/datasets/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Delete failed" }));
    throw new Error(error.message || "Failed to delete dataset");
  }

  return response.json();
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

function buildQueryString(params: Record<string, string | undefined>): string {
  const filtered = Object.entries(params).filter(([_, v]) => v !== undefined);
  if (filtered.length === 0) return "";
  return "?" + filtered.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&");
}

export async function getKPIs(datasetId?: string, dateRange?: DateRangeParams): Promise<KPIData> {
  const queryString = buildQueryString({ 
    datasetId, 
    startDate: dateRange?.startDate, 
    endDate: dateRange?.endDate 
  });
  const url = `/api/analytics/kpis${queryString}`;
    
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

export async function getTrends(datasetId?: string, dateRange?: DateRangeParams): Promise<{ daily: TrendData[]; weekly: TrendData[]; monthly: TrendData[] }> {
  const queryString = buildQueryString({ 
    datasetId, 
    startDate: dateRange?.startDate, 
    endDate: dateRange?.endDate 
  });
  const url = `/api/analytics/trends${queryString}`;
    
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
  guestPerformanceAnalytics: {
    loyaltyMetrics: {
      repeatGuestRevenueContribution: number;
      repeatGuestRevenuePercent: number;
      estimatedCLV: number;
      loyaltyTierDistribution: { tier: string; count: number; percent: number; avgSpend: number }[];
      avgTimeBetweenVisits: number;
      retentionCohorts: { cohort: string; retained: number; churned: number; retentionRate: number }[];
      churnRiskDistribution: { risk: string; count: number; percent: number }[];
    };
    segmentationMetrics: {
      guestTypeDistribution: { type: string; count: number; percent: number; avgRevenue: number }[];
      geographicConcentrationIndex: number;
      domesticVsInternationalMix: { domestic: number; international: number; domesticPercent: number };
      marketSegmentMatrix: { segment: string; bookings: number; revenue: number; avgADR: number; cancellationRate: number }[];
      corporateVsLeisureRevenue: { corporate: number; leisure: number; corporatePercent: number };
      highValueGuestAnalysis: { count: number; revenueContribution: number; avgSpend: number; percent: number };
    };
    spendingMetrics: {
      revenuePerGuest: number;
      adrByGuestType: { type: string; adr: number }[];
      spendDistributionPercentiles: { p25: number; p50: number; p75: number; p90: number; p99: number };
      losImpactOnSpend: { losRange: string; avgSpend: number; count: number }[];
      priceSensitivityBySegment: { segment: string; sensitivity: number; avgADR: number; variance: number }[];
      upsellPotentialScore: number;
    };
    bookingPatterns: {
      leadTimeByGuestType: { type: string; avgLeadTime: number; newGuest: number; repeatGuest: number }[];
      preferredArrivalDays: { day: string; count: number; percent: number }[];
      weekendVsWeekdayRatio: { weekend: number; weekday: number; ratio: number };
      advancePlanningIndex: number;
      lastMinutePropensity: number;
      seasonalGuestMix: { season: string; newGuests: number; repeatGuests: number; repeatPercent: number }[];
    };
    riskExperience: {
      cancellationRateByGuestType: { type: string; rate: number; count: number }[];
      guestSatisfactionProxyScore: number;
      roomTypePreferences: { roomType: string; count: number; percent: number; avgADR: number }[];
    };
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

export async function getComprehensiveAnalytics(datasetId?: string, dateRange?: DateRangeParams): Promise<ComprehensiveAnalytics> {
  const queryString = buildQueryString({ 
    datasetId, 
    startDate: dateRange?.startDate, 
    endDate: dateRange?.endDate 
  });
  const url = `/api/analytics/comprehensive${queryString}`;
    
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch comprehensive analytics");
  }

  return response.json();
}

export interface RevenueForecast {
  id: string;
  forecastDate: string;
  predictedRevenue: string;
  predictedBookings: number;
  confidenceLevel: string;
}

export interface ChannelSnapshot {
  id: string;
  channel: string;
  grossRevenue: string;
  commissionRate: string;
  netRevenue: string;
  bookingCount: number;
  recommendation: string | null;
}

export interface CancellationAlert {
  id: string;
  bookingRef: string;
  guestName: string;
  arrivalDate: string;
  riskScore: number;
  riskFactors: string;
  status: string;
}

export interface PricingRecommendation {
  id: string;
  targetDate: string;
  currentAdr: string;
  suggestedAdr: string;
  changePercent: string;
  rationale: string;
  status: string;
}

export interface ReportSubscription {
  id: string;
  emailAddress: string;
  frequency: string;
  reportTypes: string[];
  enabled: boolean;
}

export interface RevenueInsightsSummary {
  forecasts: RevenueForecast[];
  channels: ChannelSnapshot[];
  alerts: CancellationAlert[];
  overview: {
    totalPredictedRevenue: number;
    averageConfidence: number;
    highRiskBookings: number;
    topChannel: string;
    potentialSavings: number;
  };
}

export async function getRevenueInsightsSummary(datasetId?: string): Promise<RevenueInsightsSummary> {
  const url = datasetId 
    ? `/api/revenue-insights/summary?datasetId=${datasetId}`
    : "/api/revenue-insights/summary";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch revenue insights");
  return response.json();
}

export async function generateForecasts(datasetId: string, daysAhead?: number): Promise<RevenueForecast[]> {
  const response = await fetch("/api/revenue-insights/forecasts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId, daysAhead }),
  });
  if (!response.ok) throw new Error("Failed to generate forecasts");
  return response.json();
}

export async function getForecasts(datasetId?: string): Promise<RevenueForecast[]> {
  const url = datasetId 
    ? `/api/revenue-insights/forecasts?datasetId=${datasetId}`
    : "/api/revenue-insights/forecasts";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch forecasts");
  return response.json();
}

export async function analyzeChannels(datasetId: string): Promise<ChannelSnapshot[]> {
  const response = await fetch("/api/revenue-insights/channels/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId }),
  });
  if (!response.ok) throw new Error("Failed to analyze channels");
  return response.json();
}

export async function getChannelSnapshots(datasetId?: string): Promise<ChannelSnapshot[]> {
  const url = datasetId 
    ? `/api/revenue-insights/channels?datasetId=${datasetId}`
    : "/api/revenue-insights/channels";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch channel snapshots");
  return response.json();
}

export async function generateAlerts(datasetId: string): Promise<CancellationAlert[]> {
  const response = await fetch("/api/revenue-insights/alerts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId }),
  });
  if (!response.ok) throw new Error("Failed to generate alerts");
  return response.json();
}

export async function getCancellationAlerts(datasetId?: string): Promise<CancellationAlert[]> {
  const url = datasetId 
    ? `/api/revenue-insights/alerts?datasetId=${datasetId}`
    : "/api/revenue-insights/alerts";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch cancellation alerts");
  return response.json();
}

export async function updateAlertStatus(alertId: string, status: string): Promise<CancellationAlert> {
  const response = await fetch(`/api/revenue-insights/alerts/${alertId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update alert");
  return response.json();
}

export async function generatePricingRecommendations(datasetId: string, daysAhead?: number): Promise<PricingRecommendation[]> {
  const response = await fetch("/api/pricing/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId, daysAhead }),
  });
  if (!response.ok) throw new Error("Failed to generate pricing recommendations");
  return response.json();
}

export async function getPricingRecommendations(datasetId?: string): Promise<PricingRecommendation[]> {
  const url = datasetId 
    ? `/api/pricing/recommendations?datasetId=${datasetId}`
    : "/api/pricing/recommendations";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch pricing recommendations");
  return response.json();
}

export async function updatePricingStatus(id: string, status: string): Promise<PricingRecommendation> {
  const response = await fetch(`/api/pricing/recommendations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update pricing recommendation");
  return response.json();
}

export async function getAIPricingSuggestion(datasetId: string, targetDate: string, basePrice: number): Promise<{ suggestedPrice: number; rationale: string }> {
  const response = await fetch("/api/pricing/ai-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetId, targetDate, basePrice }),
  });
  if (!response.ok) throw new Error("Failed to get AI pricing suggestion");
  return response.json();
}

export async function getReportSubscriptions(): Promise<ReportSubscription[]> {
  const response = await fetch("/api/reports/subscriptions");
  if (!response.ok) throw new Error("Failed to fetch subscriptions");
  return response.json();
}

export async function createReportSubscription(data: { datasetId?: string; emailAddress: string; frequency: string; reportTypes: string[] }): Promise<ReportSubscription> {
  const response = await fetch("/api/reports/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create subscription");
  return response.json();
}

export async function updateReportSubscription(id: string, data: Partial<{ emailAddress: string; frequency: string; reportTypes: string[]; enabled: boolean }>): Promise<ReportSubscription> {
  const response = await fetch(`/api/reports/subscriptions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update subscription");
  return response.json();
}

export async function deleteReportSubscription(id: string): Promise<void> {
  const response = await fetch(`/api/reports/subscriptions/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete subscription");
}

export async function sendTestEmail(subscriptionId: string): Promise<{ success: boolean }> {
  const response = await fetch("/api/reports/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscriptionId }),
  });
  if (!response.ok) throw new Error("Failed to send test email");
  return response.json();
}

export interface AIInsight {
  id: string;
  datasetId: string | null;
  category: string;
  title: string;
  summary: string;
  details: string;
  impact: string;
  confidence: number;
  actionItems: string[];
  relatedMetrics: Record<string, number>;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface QueryResponse {
  answer: string;
  dataContext: Record<string, unknown>;
  suggestedActions: string[];
}

export async function queryInsights(query: string, datasetId?: string): Promise<QueryResponse> {
  const response = await fetch('/api/insights/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, datasetId }),
  });
  if (!response.ok) throw new Error("Failed to query insights");
  const data = await response.json();
  return {
    answer: data.response || "No response available",
    dataContext: data.metrics || {},
    suggestedActions: data.suggestedActions || [],
  };
}

export async function getInsights(datasetId?: string): Promise<AIInsight[]> {
  const url = datasetId ? `/api/insights?datasetId=${datasetId}` : '/api/insights';
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch insights");
  return response.json();
}

export async function generateInsights(datasetId: string): Promise<AIInsight[]> {
  const response = await fetch(`/api/insights/generate/${datasetId}`, { method: 'POST' });
  if (!response.ok) throw new Error("Failed to generate insights");
  return response.json();
}

export async function getNotifications(limit?: number): Promise<Notification[]> {
  const url = limit ? `/api/notifications?limit=${limit}` : '/api/notifications';
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  const response = await fetch('/api/notifications/unread-count');
  if (!response.ok) throw new Error("Failed to fetch unread count");
  return response.json();
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const response = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  if (!response.ok) throw new Error("Failed to mark notification read");
  return response.json();
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const response = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
  if (!response.ok) throw new Error("Failed to mark all notifications read");
  return response.json();
}

export async function generateNotifications(datasetId: string): Promise<Notification[]> {
  const response = await fetch(`/api/notifications/generate/${datasetId}`, { method: 'POST' });
  if (!response.ok) throw new Error("Failed to generate notifications");
  return response.json();
}
