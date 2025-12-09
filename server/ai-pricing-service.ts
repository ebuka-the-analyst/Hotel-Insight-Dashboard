import OpenAI from "openai";
import { db } from "./db";
import {
  bookings,
  pricingRecommendations,
  type Booking,
  type InsertPricingRecommendation,
} from "@shared/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export class AIPricingService {
  async generatePricingRecommendations(datasetId: string, daysAhead: number = 14): Promise<InsertPricingRecommendation[]> {
    const allBookings = await db.select().from(bookings)
      .where(eq(bookings.datasetId, datasetId));
    
    if (allBookings.length === 0) {
      return [];
    }

    const historicalAnalysis = this.analyzeHistoricalPricing(allBookings);
    const recommendations: InsertPricingRecommendation[] = [];
    
    const today = new Date();
    
    for (let i = 1; i <= daysAhead; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const dateStr = targetDate.toISOString().split('T')[0];
      const dayOfWeek = targetDate.getDay();
      const month = targetDate.getMonth();
      
      const currentAdr = historicalAnalysis.avgAdr;
      const suggestion = await this.getPricingSuggestion(
        historicalAnalysis,
        dayOfWeek,
        month,
        currentAdr
      );
      
      recommendations.push({
        datasetId,
        targetDate: dateStr,
        currentAdr: String(Math.round(currentAdr * 100) / 100),
        suggestedAdr: String(Math.round(suggestion.suggestedAdr * 100) / 100),
        changePercent: String(Math.round(suggestion.changePercent * 100) / 100),
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        roomType: null,
        status: 'pending',
      });
    }
    
    return recommendations;
  }

  async generateAIEnhancedRecommendation(
    datasetId: string,
    targetDate: string,
    context: {
      currentAdr: number;
      occupancyRate: number;
      dayOfWeek: number;
      isHoliday: boolean;
      competitorRates?: number[];
    }
  ): Promise<{
    suggestedAdr: number;
    changePercent: number;
    reason: string;
    confidence: number;
  }> {
    const prompt = `You are a hotel revenue management expert. Based on the following data, suggest an optimal room rate.

Current Data:
- Current ADR: $${context.currentAdr.toFixed(2)}
- Current Occupancy: ${(context.occupancyRate * 100).toFixed(1)}%
- Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][context.dayOfWeek]}
- Date: ${targetDate}
- Holiday: ${context.isHoliday ? 'Yes' : 'No'}
${context.competitorRates ? `- Competitor Rates: $${context.competitorRates.join(', $')}` : ''}

Provide your recommendation in the following JSON format only, with no additional text:
{
  "suggestedAdr": <number>,
  "changePercent": <number>,
  "reason": "<brief explanation>",
  "confidence": <number 1-100>
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }

      const result = JSON.parse(jsonMatch[0]);
      return {
        suggestedAdr: Number(result.suggestedAdr) || context.currentAdr,
        changePercent: Number(result.changePercent) || 0,
        reason: String(result.reason) || "AI-generated recommendation",
        confidence: Math.min(100, Math.max(0, Number(result.confidence) || 75)),
      };
    } catch (error) {
      console.error("AI pricing error:", error);
      return this.getFallbackRecommendation(context);
    }
  }

  private getFallbackRecommendation(context: {
    currentAdr: number;
    occupancyRate: number;
    dayOfWeek: number;
    isHoliday: boolean;
  }): {
    suggestedAdr: number;
    changePercent: number;
    reason: string;
    confidence: number;
  } {
    let multiplier = 1.0;
    let reason = "Based on historical patterns";

    if (context.dayOfWeek === 5 || context.dayOfWeek === 6) {
      multiplier += 0.15;
      reason = "Weekend premium applied";
    }

    if (context.isHoliday) {
      multiplier += 0.25;
      reason = "Holiday premium applied";
    }

    if (context.occupancyRate > 0.85) {
      multiplier += 0.10;
      reason += " - High demand period";
    } else if (context.occupancyRate < 0.5) {
      multiplier -= 0.10;
      reason = "Low occupancy discount to stimulate demand";
    }

    const suggestedAdr = context.currentAdr * multiplier;
    const changePercent = ((suggestedAdr - context.currentAdr) / context.currentAdr) * 100;

    return {
      suggestedAdr,
      changePercent,
      reason,
      confidence: 65,
    };
  }

  private analyzeHistoricalPricing(bookingsList: Booking[]): {
    avgAdr: number;
    minAdr: number;
    maxAdr: number;
    weekdayAvg: number;
    weekendAvg: number;
    seasonalFactors: Record<number, number>;
  } {
    const adrValues = bookingsList.map(b => Number(b.adr)).filter(a => a > 0);
    
    if (adrValues.length === 0) {
      return {
        avgAdr: 150,
        minAdr: 100,
        maxAdr: 250,
        weekdayAvg: 140,
        weekendAvg: 175,
        seasonalFactors: {},
      };
    }

    const avgAdr = adrValues.reduce((a, b) => a + b, 0) / adrValues.length;
    const minAdr = Math.min(...adrValues);
    const maxAdr = Math.max(...adrValues);

    const weekdayBookings = bookingsList.filter(b => {
      const day = new Date(b.arrivalDate).getDay();
      return day >= 1 && day <= 4;
    });
    const weekendBookings = bookingsList.filter(b => {
      const day = new Date(b.arrivalDate).getDay();
      return day === 0 || day === 5 || day === 6;
    });

    const weekdayAvg = weekdayBookings.length > 0
      ? weekdayBookings.reduce((sum, b) => sum + Number(b.adr), 0) / weekdayBookings.length
      : avgAdr;
    const weekendAvg = weekendBookings.length > 0
      ? weekendBookings.reduce((sum, b) => sum + Number(b.adr), 0) / weekendBookings.length
      : avgAdr * 1.15;

    const monthlyRevenue = new Map<number, { total: number; count: number }>();
    bookingsList.forEach(b => {
      const month = new Date(b.arrivalDate).getMonth();
      if (!monthlyRevenue.has(month)) {
        monthlyRevenue.set(month, { total: 0, count: 0 });
      }
      const stats = monthlyRevenue.get(month)!;
      stats.total += Number(b.adr);
      stats.count += 1;
    });

    const seasonalFactors: Record<number, number> = {};
    monthlyRevenue.forEach((stats, month) => {
      const monthAvg = stats.count > 0 ? stats.total / stats.count : avgAdr;
      seasonalFactors[month] = monthAvg / avgAdr;
    });

    return {
      avgAdr,
      minAdr,
      maxAdr,
      weekdayAvg,
      weekendAvg,
      seasonalFactors,
    };
  }

  private async getPricingSuggestion(
    historical: ReturnType<typeof this.analyzeHistoricalPricing>,
    dayOfWeek: number,
    month: number,
    currentAdr: number
  ): Promise<{
    suggestedAdr: number;
    changePercent: number;
    reason: string;
    confidence: number;
  }> {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const baseAdr = isWeekend ? historical.weekendAvg : historical.weekdayAvg;
    
    const seasonalFactor = historical.seasonalFactors[month] ?? 1.0;
    let suggestedAdr = baseAdr * seasonalFactor;

    let reason = "";
    let confidence = 70;

    if (isWeekend) {
      reason = "Weekend rate applied";
      confidence += 5;
    } else {
      reason = "Weekday rate applied";
    }

    if (seasonalFactor > 1.1) {
      reason += ` with peak season adjustment (+${((seasonalFactor - 1) * 100).toFixed(0)}%)`;
      confidence += 5;
    } else if (seasonalFactor < 0.9) {
      reason += ` with off-season adjustment (${((seasonalFactor - 1) * 100).toFixed(0)}%)`;
    }

    suggestedAdr = Math.max(historical.minAdr * 0.9, Math.min(historical.maxAdr * 1.1, suggestedAdr));
    
    const changePercent = ((suggestedAdr - currentAdr) / currentAdr) * 100;

    return {
      suggestedAdr,
      changePercent,
      reason,
      confidence,
    };
  }

  async savePricingRecommendations(recommendations: InsertPricingRecommendation[]): Promise<void> {
    if (recommendations.length === 0) return;
    
    for (const rec of recommendations) {
      await db.insert(pricingRecommendations).values(rec);
    }
  }

  async getPricingRecommendations(datasetId: string, status?: string): Promise<any[]> {
    const conditions = [eq(pricingRecommendations.datasetId, datasetId)];
    if (status) {
      conditions.push(eq(pricingRecommendations.status, status));
    }
    
    return await db.select().from(pricingRecommendations)
      .where(eq(pricingRecommendations.datasetId, datasetId))
      .orderBy(pricingRecommendations.targetDate);
  }

  async updateRecommendationStatus(recommendationId: string, status: string): Promise<any> {
    await db.update(pricingRecommendations)
      .set({ status })
      .where(eq(pricingRecommendations.id, recommendationId));
    
    const [updated] = await db.select().from(pricingRecommendations)
      .where(eq(pricingRecommendations.id, recommendationId));
    return updated;
  }
}

export const aiPricingService = new AIPricingService();
