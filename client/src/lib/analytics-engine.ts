import { addDays, format, getDay, getMonth, isSameDay, startOfYear, subDays } from "date-fns";

// Types for our sophisticated model
export interface DailyStats {
  date: string;
  occupancy: number;
  adr: number;
  revpar: number;
  revenue: number;
  cancellations: number;
  operationalLoad: number; // 0-100 score
  channelMix: {
    direct: number;
    ota: number;
    corporate: number;
    groups: number;
  };
}

export const generateRealisticData = () => {
  const startDate = startOfYear(new Date(2024, 0, 1));
  const data: DailyStats[] = [];

  for (let i = 0; i < 365; i++) {
    const currentDate = addDays(startDate, i);
    const month = getMonth(currentDate); // 0-11
    const dayOfWeek = getDay(currentDate); // 0 (Sun) - 6 (Sat)
    
    // 1. Seasonality Logic
    let seasonMultiplier = 1.0;
    if (month >= 5 && month <= 7) seasonMultiplier = 1.25; // Summer Peak (June-Aug)
    if (month === 11) seasonMultiplier = 0.7; // Dec dip
    // Christmas Spike (Dec 20-30)
    if (month === 11 && i >= 354 && i <= 364) seasonMultiplier = 1.1; 

    // 2. Weekly Pattern Logic
    let dayMultiplier = 1.0;
    let isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    
    // Corporate Heavy (Mon-Thu) vs Weekend Spikes
    if (isWeekend) {
      dayMultiplier = 1.15; // Leisure spike
    } else {
      dayMultiplier = 0.95; // Standard corporate base
    }

    // 3. Occupancy Generation (Base ~65%)
    let occupancy = 65 * seasonMultiplier * dayMultiplier;
    // Add realistic noise
    occupancy += (Math.random() * 10 - 5); 
    occupancy = Math.min(Math.max(occupancy, 30), 100);

    // 4. Pricing Logic (ADR)
    let baseRate = 140;
    if (seasonMultiplier > 1.1) baseRate += 40; // High season premium
    if (isWeekend) baseRate += 25; // Weekend premium
    // Suites impact (randomized mix boost)
    if (Math.random() > 0.7) baseRate += 15;
    
    const adr = baseRate + (Math.random() * 20 - 10);

    // 5. Channel Mix & Cancellations
    // Weekends = More OTA (Higher cancel risk)
    // Weekdays = More Corporate (Lower cancel risk)
    let otaShare = isWeekend ? 0.45 : 0.20;
    let corporateShare = isWeekend ? 0.05 : 0.50;
    let directShare = 0.30;
    let groupShare = 1 - (otaShare + corporateShare + directShare);

    // Cancellation Rate logic
    // OTA = High (20%), Direct = Low (5%), Corporate = Low (8%)
    const cancelRate = (otaShare * 20) + (directShare * 5) + (corporateShare * 8) + (groupShare * 10);
    const dailyCancellations = Math.round((occupancy / 100) * 150 * (cancelRate / 100)); // Assuming 150 rooms

    // 6. Operational Load Score (Advanced Metric)
    // Driven by: High Occupancy + High Turnover (Fri/Sun) + High Cancellations
    let turnoverFactor = (dayOfWeek === 5 || dayOfWeek === 0) ? 1.5 : 1.0; // Fri/Sun high turnover
    let loadScore = (occupancy * 0.5) + (dailyCancellations * 2) + (turnoverFactor * 10);
    loadScore = Math.min(loadScore, 100);

    data.push({
      date: format(currentDate, "yyyy-MM-dd"),
      occupancy: Math.round(occupancy),
      adr: Math.round(adr),
      revpar: Math.round((occupancy / 100) * adr),
      revenue: Math.round((occupancy / 100) * 150 * adr),
      cancellations: dailyCancellations,
      operationalLoad: Math.round(loadScore),
      channelMix: {
        direct: Math.round(directShare * 100),
        ota: Math.round(otaShare * 100),
        corporate: Math.round(corporateShare * 100),
        groups: Math.round(groupShare * 100),
      }
    });
  }

  return data;
};

export const CHANNEL_COSTS = {
  Direct: 0.03, // 3% cost
  OTA: 0.18,    // 18% commission
  Corporate: 0.05,
  GDS: 0.12
};

export const CANCELLATION_RISK_MATRIX = [
  // Lead Time (Rows: 0-3, 3-7, 7-30, 30+) x Channel (Cols: Direct, OTA, Corp)
  [2, 5, 1],   // Last minute
  [5, 15, 3],  // Short lead
  [8, 35, 5],  // Medium lead (Risk Window!)
  [4, 25, 10], // Long lead
];
