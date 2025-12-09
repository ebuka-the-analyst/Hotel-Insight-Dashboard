import OpenAI from "openai";
import { db } from "./db";
import {
  bookings,
  notifications,
  aiInsights,
  aiQueries,
  type InsertNotification,
  type InsertAiInsight,
  type InsertAiQuery,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { calculateComprehensiveAnalytics, type ComprehensiveAnalytics } from "./analytics-service";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const AGENTS = ["Nova", "Sterling", "Atlas", "Sage"] as const;
type AgentName = typeof AGENTS[number];

const AGENT_SPECIALTIES: Record<AgentName, string[]> = {
  Nova: ["revenue", "pricing", "forecasting"],
  Sterling: ["guests", "loyalty", "retention"],
  Atlas: ["operations", "channels", "occupancy"],
  Sage: ["risk", "cancellations", "trends"],
};

export class AIInsightsService {
  async queryData(query: string, datasetId?: string): Promise<{
    response: string;
    metrics?: Record<string, any>;
    relatedInsights?: string[];
  }> {
    let analytics: ComprehensiveAnalytics | null = null;
    
    if (datasetId) {
      const datasetBookings = await db.select().from(bookings)
        .where(eq(bookings.datasetId, datasetId));
      if (datasetBookings.length > 0) {
        analytics = calculateComprehensiveAnalytics(datasetBookings);
      }
    } else {
      const allBookings = await db.select().from(bookings);
      if (allBookings.length > 0) {
        analytics = calculateComprehensiveAnalytics(allBookings);
      }
    }

    if (!analytics) {
      return {
        response: "I don't have any data to analyze yet. Please upload your booking data first.",
        metrics: {},
      };
    }

    const metricsContext = this.buildMetricsContext(analytics);
    
    const prompt = `You are Nova, an expert hotel analytics assistant for AutoInsight. Answer the user's question using ONLY the provided data. Be specific, cite exact numbers, and provide actionable insights.

HOTEL DATA:
${metricsContext}

USER QUESTION: ${query}

Provide a helpful, conversational response that:
1. Directly answers the question with specific data points
2. Highlights relevant patterns or trends
3. Offers actionable recommendations if appropriate
4. Uses British Pound (£) for currency

Keep your response concise but informative (2-4 sentences max unless detailed analysis is requested).`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 500,
      });

      const aiResponse = response.choices[0]?.message?.content || "I couldn't process your question. Please try again.";

      const queryRecord: InsertAiQuery = {
        datasetId: datasetId || null,
        query,
        response: aiResponse,
        metrics: this.extractRelevantMetrics(query, analytics),
      };
      await db.insert(aiQueries).values(queryRecord);

      return {
        response: aiResponse,
        metrics: this.extractRelevantMetrics(query, analytics),
      };
    } catch (error) {
      console.error("AI query error:", error);
      return this.generateFallbackResponse(query, analytics);
    }
  }

  async generateDetailedInsights(datasetId: string): Promise<InsertAiInsight[]> {
    const datasetBookings = await db.select().from(bookings)
      .where(eq(bookings.datasetId, datasetId));
    
    if (datasetBookings.length === 0) {
      return [];
    }

    const analytics = calculateComprehensiveAnalytics(datasetBookings);
    const insights: InsertAiInsight[] = [];

    insights.push(...this.generateRevenueInsights(datasetId, analytics));
    insights.push(...this.generateGuestInsights(datasetId, analytics));
    insights.push(...this.generateOperationalInsights(datasetId, analytics));
    insights.push(...this.generateRiskInsights(datasetId, analytics));
    insights.push(...this.generateChannelInsights(datasetId, analytics));
    insights.push(...this.generatePricingInsights(datasetId, analytics));

    for (const insight of insights) {
      insight.detailedAnalysis = await this.enhanceWithAI(insight, analytics);
    }

    return insights;
  }

  private generateRevenueInsights(datasetId: string, analytics: ComprehensiveAnalytics): InsertAiInsight[] {
    const insights: InsertAiInsight[] = [];
    const { coreKPIs, revenueAnalytics, forecastingAnalytics } = analytics;

    insights.push({
      datasetId,
      category: "revenue",
      title: "Revenue Performance Overview",
      summary: `Total revenue of £${coreKPIs.totalRevenue.toLocaleString()} from ${coreKPIs.totalBookings.toLocaleString()} bookings with an average daily rate of £${coreKPIs.averageDailyRate.toFixed(2)}.`,
      detailedAnalysis: "",
      metrics: {
        totalRevenue: coreKPIs.totalRevenue,
        avgDailyRate: coreKPIs.averageDailyRate,
        revPAR: coreKPIs.revPAR,
        revenuePerBooking: coreKPIs.revenuePerBooking,
        netRevenue: revenueAnalytics.netRevenueAfterCommissions,
        commissionsPaid: revenueAnalytics.commissionsPaid,
      },
      recommendations: [
        coreKPIs.averageDailyRate < 100 ? "Consider increasing room rates during high-demand periods" : "Maintain current pricing strategy",
        revenueAnalytics.commissionsPaid > coreKPIs.totalRevenue * 0.1 ? "Reduce OTA dependency to lower commission costs" : "Commission rates are well managed",
      ],
      impact: coreKPIs.totalRevenue > 1000000 ? "high" : coreKPIs.totalRevenue > 500000 ? "medium" : "low",
      confidence: 95,
      trend: forecastingAnalytics.demandTrend === "growing" ? "up" : forecastingAnalytics.demandTrend === "declining" ? "down" : "stable",
      agentName: "Nova",
    });

    const topChannel = Object.entries(revenueAnalytics.revenueByChannel)
      .sort(([, a], [, b]) => b - a)[0];
    const bottomChannel = Object.entries(revenueAnalytics.revenueByChannel)
      .sort(([, a], [, b]) => a - b)[0];

    insights.push({
      datasetId,
      category: "revenue",
      title: "Revenue by Distribution Channel",
      summary: `${topChannel[0]} leads with £${topChannel[1].toLocaleString()} in revenue, while ${bottomChannel[0]} contributes £${bottomChannel[1].toLocaleString()}.`,
      detailedAnalysis: "",
      metrics: {
        channelBreakdown: revenueAnalytics.revenueByChannel,
        topChannel: { name: topChannel[0], revenue: topChannel[1] },
        bottomChannel: { name: bottomChannel[0], revenue: bottomChannel[1] },
      },
      recommendations: [
        `Invest more in ${topChannel[0]} marketing to capitalize on its success`,
        bottomChannel[1] < topChannel[1] * 0.1 ? `Evaluate whether ${bottomChannel[0]} channel is worth maintaining` : "Maintain diverse channel mix",
      ],
      impact: "high",
      confidence: 90,
      trend: "stable",
      agentName: "Nova",
    });

    return insights;
  }

  private generateGuestInsights(datasetId: string, analytics: ComprehensiveAnalytics): InsertAiInsight[] {
    const insights: InsertAiInsight[] = [];
    const { coreKPIs, guestAnalytics, guestPerformanceAnalytics } = analytics;

    insights.push({
      datasetId,
      category: "guests",
      title: "Guest Loyalty Analysis",
      summary: `${coreKPIs.repeatGuestRate.toFixed(1)}% of guests are returning visitors, contributing significantly to revenue stability.`,
      detailedAnalysis: "",
      metrics: {
        repeatGuestRate: coreKPIs.repeatGuestRate,
        repeatGuestCount: guestAnalytics.repeatGuestCount,
        newGuestCount: guestAnalytics.newGuestCount,
        guestLoyaltyScore: guestAnalytics.guestLoyaltyScore,
        avgGuestValue: guestAnalytics.averageGuestValue,
        repeatRevenueContribution: guestPerformanceAnalytics.loyaltyMetrics.repeatGuestRevenuePercent,
      },
      recommendations: [
        coreKPIs.repeatGuestRate > 50 ? "Your loyalty program is working well - consider adding premium tiers" : "Implement or enhance your guest loyalty program",
        "Send personalized offers to guests who haven't returned in 6+ months",
        "Create special packages for your most valuable repeat guests",
      ],
      impact: coreKPIs.repeatGuestRate > 40 ? "high" : "medium",
      confidence: 88,
      trend: coreKPIs.repeatGuestRate > 30 ? "up" : "stable",
      agentName: "Sterling",
    });

    const topCountries = guestAnalytics.topSourceCountries.slice(0, 5);
    insights.push({
      datasetId,
      category: "guests",
      title: "Geographic Guest Distribution",
      summary: `Top source markets: ${topCountries.map(c => c.country).join(", ")} representing ${topCountries.reduce((sum, c) => sum + c.percent, 0).toFixed(0)}% of all guests.`,
      detailedAnalysis: "",
      metrics: {
        topCountries,
        guestDiversityIndex: guestAnalytics.guestDiversityIndex,
        domesticVsInternational: guestPerformanceAnalytics.segmentationMetrics.domesticVsInternationalMix,
      },
      recommendations: [
        `Consider marketing campaigns targeting ${topCountries[0].country} to strengthen your top market`,
        guestAnalytics.guestDiversityIndex > 0.7 ? "Great market diversification - reduces risk from single-market dependency" : "Consider expanding into new geographic markets",
      ],
      impact: "medium",
      confidence: 92,
      trend: "stable",
      agentName: "Sterling",
    });

    return insights;
  }

  private generateOperationalInsights(datasetId: string, analytics: ComprehensiveAnalytics): InsertAiInsight[] {
    const insights: InsertAiInsight[] = [];
    const { operationalAnalytics, bookingAnalytics, coreKPIs } = analytics;

    insights.push({
      datasetId,
      category: "operations",
      title: "Booking Lead Time Analysis",
      summary: `Average booking lead time is ${coreKPIs.averageLeadTime.toFixed(0)} days. ${bookingAnalytics.lastMinuteBookingsPercent.toFixed(0)}% of bookings are last-minute.`,
      detailedAnalysis: "",
      metrics: {
        avgLeadTime: coreKPIs.averageLeadTime,
        lastMinutePercent: bookingAnalytics.lastMinuteBookingsPercent,
        advancePercent: bookingAnalytics.advanceBookingsPercent,
        leadTimeDistribution: bookingAnalytics.leadTimeDistribution,
      },
      recommendations: [
        bookingAnalytics.lastMinuteBookingsPercent > 30 ? "High last-minute bookings suggest price sensitivity - consider dynamic pricing" : "Booking patterns are healthy",
        coreKPIs.averageLeadTime < 14 ? "Encourage early bookings with advance purchase discounts" : "Lead times are optimal for planning",
        "Implement tiered pricing based on booking window",
      ],
      impact: "medium",
      confidence: 85,
      trend: bookingAnalytics.lastMinuteBookingsPercent > 25 ? "down" : "stable",
      agentName: "Atlas",
    });

    insights.push({
      datasetId,
      category: "operations",
      title: "Peak Operations Analysis",
      summary: `${operationalAnalytics.busiestMonth} is your busiest month with ${operationalAnalytics.peakCheckInDay} being the peak check-in day.`,
      detailedAnalysis: "",
      metrics: {
        busiestMonth: operationalAnalytics.busiestMonth,
        quietestMonth: operationalAnalytics.quietestMonth,
        peakCheckInDay: operationalAnalytics.peakCheckInDay,
        peakCheckOutDay: operationalAnalytics.peakCheckOutDay,
        checkInsByDay: operationalAnalytics.checkInsByDayOfWeek,
        staffingRecommendation: operationalAnalytics.staffingRecommendation,
      },
      recommendations: [
        `Ensure adequate staffing on ${operationalAnalytics.peakCheckInDay}s and ${operationalAnalytics.peakCheckOutDay}s`,
        `Plan maintenance during ${operationalAnalytics.quietestMonth} when occupancy is lowest`,
        operationalAnalytics.staffingRecommendation === "peak" ? "Consider hiring temporary staff for peak periods" : "Current staffing levels should be sufficient",
      ],
      impact: "medium",
      confidence: 90,
      trend: "stable",
      agentName: "Atlas",
    });

    return insights;
  }

  private generateRiskInsights(datasetId: string, analytics: ComprehensiveAnalytics): InsertAiInsight[] {
    const insights: InsertAiInsight[] = [];
    const { coreKPIs, cancellationAnalytics } = analytics;

    insights.push({
      datasetId,
      category: "risk",
      title: "Cancellation Risk Assessment",
      summary: `Current cancellation rate is ${coreKPIs.cancellationRate.toFixed(1)}% with £${cancellationAnalytics.revenueLostToCancellations.toLocaleString()} in lost revenue. ${cancellationAnalytics.highRiskBookingsCount} bookings flagged as high-risk.`,
      detailedAnalysis: "",
      metrics: {
        cancellationRate: coreKPIs.cancellationRate,
        revenueLost: cancellationAnalytics.revenueLostToCancellations,
        highRiskCount: cancellationAnalytics.highRiskBookingsCount,
        lowRiskCount: cancellationAnalytics.lowRiskBookingsCount,
        avgCancellationLeadTime: cancellationAnalytics.averageCancellationLeadTime,
        cancellationTrend: cancellationAnalytics.cancellationTrend,
        rateByChannel: cancellationAnalytics.cancellationRateByChannel,
      },
      recommendations: [
        coreKPIs.cancellationRate > 15 ? "Implement stricter cancellation policies for high-risk booking patterns" : "Cancellation rates are within acceptable range",
        "Require deposits for bookings with long lead times",
        "Contact guests with high-risk bookings 48 hours before arrival to confirm",
        "Consider non-refundable rate options with discounts",
      ],
      impact: coreKPIs.cancellationRate > 20 ? "high" : coreKPIs.cancellationRate > 10 ? "medium" : "low",
      confidence: 87,
      trend: cancellationAnalytics.cancellationTrend === "increasing" ? "up" : cancellationAnalytics.cancellationTrend === "decreasing" ? "down" : "stable",
      agentName: "Sage",
    });

    const highestCancelChannel = Object.entries(cancellationAnalytics.cancellationRateByChannel)
      .sort(([, a], [, b]) => b - a)[0];

    insights.push({
      datasetId,
      category: "risk",
      title: "Channel Cancellation Patterns",
      summary: `${highestCancelChannel[0]} has the highest cancellation rate at ${highestCancelChannel[1].toFixed(1)}%. OTA bookings typically carry higher cancellation risk.`,
      detailedAnalysis: "",
      metrics: {
        channelRates: cancellationAnalytics.cancellationRateByChannel,
        highestRiskChannel: { name: highestCancelChannel[0], rate: highestCancelChannel[1] },
        monthlyRates: cancellationAnalytics.cancellationRateByMonth,
      },
      recommendations: [
        `Apply stricter policies for ${highestCancelChannel[0]} bookings`,
        "Negotiate better terms with OTA partners regarding cancellation policies",
        "Encourage direct bookings with incentives to reduce cancellation exposure",
      ],
      impact: highestCancelChannel[1] > 20 ? "high" : "medium",
      confidence: 85,
      trend: "stable",
      agentName: "Sage",
    });

    return insights;
  }

  private generateChannelInsights(datasetId: string, analytics: ComprehensiveAnalytics): InsertAiInsight[] {
    const insights: InsertAiInsight[] = [];
    const { channelAnalytics, revenueAnalytics } = analytics;

    insights.push({
      datasetId,
      category: "channels",
      title: "Distribution Channel Performance",
      summary: `Direct bookings represent ${channelAnalytics.directBookingRate.toFixed(0)}% of total. ${channelAnalytics.bestPerformingChannel} is your top performer by net revenue.`,
      detailedAnalysis: "",
      metrics: {
        directBookingRate: channelAnalytics.directBookingRate,
        otaDependency: channelAnalytics.otaDependencyScore,
        channelMix: channelAnalytics.channelMix,
        channelDiversity: channelAnalytics.channelDiversityIndex,
        costAnalysis: channelAnalytics.channelCostAnalysis,
      },
      recommendations: [
        channelAnalytics.directBookingRate < 40 ? "Invest in direct booking incentives to reduce OTA commissions" : "Direct booking strategy is effective",
        channelAnalytics.otaDependencyScore > 40 ? "Reduce OTA dependency to protect margins" : "OTA usage is well balanced",
        channelAnalytics.recommendedChannelStrategy,
      ],
      impact: "high",
      confidence: 91,
      trend: channelAnalytics.directBookingRate > 35 ? "up" : "stable",
      agentName: "Atlas",
    });

    return insights;
  }

  private generatePricingInsights(datasetId: string, analytics: ComprehensiveAnalytics): InsertAiInsight[] {
    const insights: InsertAiInsight[] = [];
    const { coreKPIs, seasonalityAnalytics, revenueAnalytics } = analytics;

    const peakMonths = seasonalityAnalytics.seasonalPeaks;
    const troughMonths = seasonalityAnalytics.seasonalTroughs;

    insights.push({
      datasetId,
      category: "pricing",
      title: "Seasonal Pricing Opportunities",
      summary: `Peak season in ${peakMonths.join(", ")} vs low season in ${troughMonths.slice(0, 3).join(", ")}. Current ADR is £${coreKPIs.averageDailyRate.toFixed(2)}.`,
      detailedAnalysis: "",
      metrics: {
        avgAdr: coreKPIs.averageDailyRate,
        monthlyAdr: seasonalityAnalytics.monthlyADR,
        peakMonths,
        troughMonths,
        weekdayPerformance: seasonalityAnalytics.weekdayPerformance,
        bestQuarter: seasonalityAnalytics.bestPerformingQuarter,
      },
      recommendations: [
        `Increase rates by 15-25% during ${peakMonths[0]} peak season`,
        `Offer promotional packages during ${troughMonths[0]} to boost occupancy`,
        "Implement dynamic pricing that responds to demand signals",
        "Consider minimum stay requirements during peak periods",
      ],
      impact: "high",
      confidence: 88,
      trend: "stable",
      agentName: "Nova",
    });

    return insights;
  }

  private async enhanceWithAI(insight: InsertAiInsight, analytics: ComprehensiveAnalytics): Promise<string> {
    const prompt = `You are ${insight.agentName}, a hotel analytics expert. Enhance this insight with detailed analysis.

INSIGHT TITLE: ${insight.title}
SUMMARY: ${insight.summary}
CATEGORY: ${insight.category}
METRICS: ${JSON.stringify(insight.metrics, null, 2)}

Provide a detailed 3-4 paragraph analysis that:
1. Explains what these numbers mean for the hotel business
2. Identifies root causes and patterns
3. Provides specific, actionable recommendations
4. Mentions potential revenue impact

Use British Pounds (£) for currency. Be professional but conversational.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 600,
      });

      return response.choices[0]?.message?.content || insight.summary;
    } catch (error) {
      console.error("AI enhancement error:", error);
      return insight.summary;
    }
  }

  async saveInsights(insights: InsertAiInsight[]): Promise<void> {
    for (const insight of insights) {
      await db.insert(aiInsights).values(insight);
    }
  }

  async getInsights(datasetId?: string): Promise<any[]> {
    if (datasetId) {
      return await db.select().from(aiInsights)
        .where(eq(aiInsights.datasetId, datasetId))
        .orderBy(desc(aiInsights.createdAt));
    }
    return await db.select().from(aiInsights)
      .orderBy(desc(aiInsights.createdAt));
  }

  async getInsightById(insightId: string): Promise<any> {
    const [insight] = await db.select().from(aiInsights)
      .where(eq(aiInsights.id, insightId));
    return insight;
  }

  async generateNotifications(datasetId: string): Promise<InsertNotification[]> {
    const datasetBookings = await db.select().from(bookings)
      .where(eq(bookings.datasetId, datasetId));
    
    if (datasetBookings.length === 0) return [];

    const analytics = calculateComprehensiveAnalytics(datasetBookings);
    const notifs: InsertNotification[] = [];

    if (analytics.coreKPIs.cancellationRate > 15) {
      notifs.push({
        datasetId,
        type: "alert",
        severity: "warning",
        title: "High Cancellation Rate Alert",
        message: `Your cancellation rate is ${analytics.coreKPIs.cancellationRate.toFixed(1)}%, which is above the 15% threshold. Consider implementing stricter policies.`,
        metadata: { cancellationRate: analytics.coreKPIs.cancellationRate },
        actionUrl: "/revenue-insights",
      });
    }

    if (analytics.cancellationAnalytics.highRiskBookingsCount > 10) {
      notifs.push({
        datasetId,
        type: "alert",
        severity: "critical",
        title: "High-Risk Bookings Detected",
        message: `${analytics.cancellationAnalytics.highRiskBookingsCount} bookings have been flagged as high cancellation risk. Review and take action.`,
        metadata: { count: analytics.cancellationAnalytics.highRiskBookingsCount },
        actionUrl: "/revenue-insights",
      });
    }

    if (analytics.channelAnalytics.directBookingRate < 30) {
      notifs.push({
        datasetId,
        type: "insight",
        severity: "info",
        title: "Direct Booking Opportunity",
        message: `Only ${analytics.channelAnalytics.directBookingRate.toFixed(0)}% of bookings are direct. Increasing this could save £${(analytics.revenueAnalytics.commissionsPaid * 0.3).toFixed(0)} in commissions.`,
        metadata: { directRate: analytics.channelAnalytics.directBookingRate },
        actionUrl: "/analysis",
      });
    }

    if (analytics.coreKPIs.repeatGuestRate > 50) {
      notifs.push({
        datasetId,
        type: "insight",
        severity: "success",
        title: "Strong Guest Loyalty",
        message: `${analytics.coreKPIs.repeatGuestRate.toFixed(0)}% of your guests are returning visitors. Your loyalty efforts are paying off!`,
        metadata: { repeatRate: analytics.coreKPIs.repeatGuestRate },
        actionUrl: "/guests",
      });
    }

    notifs.push({
      datasetId,
      type: "insight",
      severity: "info",
      title: "Weekly Performance Summary",
      message: `This period: £${analytics.coreKPIs.totalRevenue.toLocaleString()} revenue from ${analytics.coreKPIs.totalBookings} bookings. ADR: £${analytics.coreKPIs.averageDailyRate.toFixed(2)}.`,
      metadata: { 
        revenue: analytics.coreKPIs.totalRevenue,
        bookings: analytics.coreKPIs.totalBookings,
        adr: analytics.coreKPIs.averageDailyRate,
      },
      actionUrl: "/",
    });

    return notifs;
  }

  async saveNotifications(notifs: InsertNotification[]): Promise<void> {
    for (const notif of notifs) {
      await db.insert(notifications).values(notif);
    }
  }

  async getNotifications(limit: number = 20): Promise<any[]> {
    return await db.select().from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadCount(): Promise<number> {
    const unread = await db.select().from(notifications)
      .where(eq(notifications.isRead, false));
    return unread.length;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsRead(): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.isRead, false));
  }

  private buildMetricsContext(analytics: ComprehensiveAnalytics): string {
    const { coreKPIs, revenueAnalytics, guestAnalytics, bookingAnalytics, cancellationAnalytics, channelAnalytics } = analytics;
    
    return `
CORE METRICS:
- Total Revenue: £${coreKPIs.totalRevenue.toLocaleString()}
- Total Bookings: ${coreKPIs.totalBookings.toLocaleString()}
- Confirmed: ${coreKPIs.confirmedBookings}, Cancelled: ${coreKPIs.cancelledBookings}
- Average Daily Rate (ADR): £${coreKPIs.averageDailyRate.toFixed(2)}
- RevPAR: £${coreKPIs.revPAR.toFixed(2)}
- Occupancy Rate: ${coreKPIs.occupancyRate.toFixed(1)}%
- Cancellation Rate: ${coreKPIs.cancellationRate.toFixed(1)}%
- Repeat Guest Rate: ${coreKPIs.repeatGuestRate.toFixed(1)}%
- Average Lead Time: ${coreKPIs.averageLeadTime.toFixed(0)} days
- Average Length of Stay: ${coreKPIs.averageLengthOfStay.toFixed(1)} nights

REVENUE BY CHANNEL: ${JSON.stringify(revenueAnalytics.revenueByChannel)}
BOOKINGS BY CHANNEL: ${JSON.stringify(bookingAnalytics.bookingsByChannel)}
NET REVENUE (after commissions): £${revenueAnalytics.netRevenueAfterCommissions.toLocaleString()}
COMMISSIONS PAID: £${revenueAnalytics.commissionsPaid.toLocaleString()}

GUEST DATA:
- New Guests: ${guestAnalytics.newGuestCount}
- Repeat Guests: ${guestAnalytics.repeatGuestCount}
- Top Countries: ${guestAnalytics.topSourceCountries.slice(0, 5).map(c => `${c.country} (${c.percent}%)`).join(", ")}

CANCELLATION DATA:
- Revenue Lost: £${cancellationAnalytics.revenueLostToCancellations.toLocaleString()}
- High-Risk Bookings: ${cancellationAnalytics.highRiskBookingsCount}
- Cancellation by Channel: ${JSON.stringify(cancellationAnalytics.cancellationRateByChannel)}

CHANNEL PERFORMANCE:
- Direct Booking Rate: ${channelAnalytics.directBookingRate.toFixed(0)}%
- OTA Dependency: ${channelAnalytics.otaDependencyScore.toFixed(0)}%
- Best Channel: ${channelAnalytics.bestPerformingChannel}
`;
  }

  private extractRelevantMetrics(query: string, analytics: ComprehensiveAnalytics): Record<string, any> {
    const queryLower = query.toLowerCase();
    const metrics: Record<string, any> = {};

    if (queryLower.includes("revenue") || queryLower.includes("earn") || queryLower.includes("money")) {
      metrics.totalRevenue = analytics.coreKPIs.totalRevenue;
      metrics.avgDailyRate = analytics.coreKPIs.averageDailyRate;
      metrics.revenueByChannel = analytics.revenueAnalytics.revenueByChannel;
    }

    if (queryLower.includes("guest") || queryLower.includes("customer") || queryLower.includes("return") || queryLower.includes("repeat") || queryLower.includes("loyal")) {
      metrics.repeatGuestRate = analytics.coreKPIs.repeatGuestRate;
      metrics.repeatGuestCount = analytics.guestAnalytics.repeatGuestCount;
      metrics.newGuestCount = analytics.guestAnalytics.newGuestCount;
      metrics.topCountries = analytics.guestAnalytics.topSourceCountries.slice(0, 5);
    }

    if (queryLower.includes("cancel") || queryLower.includes("risk")) {
      metrics.cancellationRate = analytics.coreKPIs.cancellationRate;
      metrics.revenueLost = analytics.cancellationAnalytics.revenueLostToCancellations;
      metrics.highRiskCount = analytics.cancellationAnalytics.highRiskBookingsCount;
    }

    if (queryLower.includes("channel") || queryLower.includes("ota") || queryLower.includes("direct") || queryLower.includes("booking.com")) {
      metrics.channelMix = analytics.channelAnalytics.channelMix;
      metrics.directBookingRate = analytics.channelAnalytics.directBookingRate;
    }

    if (queryLower.includes("book") || queryLower.includes("reservation")) {
      metrics.totalBookings = analytics.coreKPIs.totalBookings;
      metrics.confirmedBookings = analytics.coreKPIs.confirmedBookings;
      metrics.avgLeadTime = analytics.coreKPIs.averageLeadTime;
    }

    return Object.keys(metrics).length > 0 ? metrics : {
      totalBookings: analytics.coreKPIs.totalBookings,
      totalRevenue: analytics.coreKPIs.totalRevenue,
      avgDailyRate: analytics.coreKPIs.averageDailyRate,
    };
  }

  private generateFallbackResponse(query: string, analytics: ComprehensiveAnalytics): {
    response: string;
    metrics?: Record<string, any>;
  } {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes("return") || queryLower.includes("repeat") || queryLower.includes("loyal")) {
      return {
        response: `${analytics.coreKPIs.repeatGuestRate.toFixed(1)}% of your guests are returning visitors (${analytics.guestAnalytics.repeatGuestCount.toLocaleString()} guests). This is a ${analytics.coreKPIs.repeatGuestRate > 40 ? "strong" : "moderate"} loyalty rate. Returning guests contribute significantly to stable revenue.`,
        metrics: {
          repeatGuestRate: analytics.coreKPIs.repeatGuestRate,
          repeatGuestCount: analytics.guestAnalytics.repeatGuestCount,
        },
      };
    }

    if (queryLower.includes("revenue") || queryLower.includes("earn")) {
      return {
        response: `Your total revenue is £${analytics.coreKPIs.totalRevenue.toLocaleString()} from ${analytics.coreKPIs.totalBookings.toLocaleString()} bookings. The average daily rate is £${analytics.coreKPIs.averageDailyRate.toFixed(2)}.`,
        metrics: {
          totalRevenue: analytics.coreKPIs.totalRevenue,
          avgDailyRate: analytics.coreKPIs.averageDailyRate,
        },
      };
    }

    return {
      response: `Based on your data: ${analytics.coreKPIs.totalBookings.toLocaleString()} bookings, £${analytics.coreKPIs.totalRevenue.toLocaleString()} revenue, ${analytics.coreKPIs.repeatGuestRate.toFixed(1)}% repeat guests. Ask me something more specific for detailed insights!`,
      metrics: {
        totalBookings: analytics.coreKPIs.totalBookings,
        totalRevenue: analytics.coreKPIs.totalRevenue,
      },
    };
  }
}

export const aiInsightsService = new AIInsightsService();
