import { Resend } from 'resend';
import { db } from "./db";
import {
  reportSubscriptions,
  type InsertReportSubscription,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { revenueInsightsService } from "./revenue-insights-service";
import { aiPricingService } from "./ai-pricing-service";
import { storage } from "./storage";

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export class EmailReportsService {
  async createSubscription(subscription: InsertReportSubscription): Promise<any> {
    const [result] = await db.insert(reportSubscriptions).values(subscription).returning();
    return result;
  }

  async getSubscriptions(userId: string): Promise<any[]> {
    return await db.select().from(reportSubscriptions)
      .where(eq(reportSubscriptions.userId, userId));
  }

  async updateSubscription(subscriptionId: string, data: Partial<InsertReportSubscription>): Promise<void> {
    await db.update(reportSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reportSubscriptions.id, subscriptionId));
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await db.delete(reportSubscriptions)
      .where(eq(reportSubscriptions.id, subscriptionId));
  }

  async sendDailyReport(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [subscription] = await db.select().from(reportSubscriptions)
        .where(eq(reportSubscriptions.id, subscriptionId));
      
      if (!subscription || !subscription.isActive) {
        return { success: false, error: 'Subscription not found or inactive' };
      }

      const reportContent = await this.generateReportContent(
        subscription.datasetId!,
        subscription.reportTypes
      );

      const { client, fromEmail } = await getResendClient();

      await client.emails.send({
        from: fromEmail || 'AutoInsight <reports@autoinsight.com>',
        to: subscription.emailAddress,
        subject: `Daily Revenue Report - ${new Date().toLocaleDateString()}`,
        html: this.formatEmailHtml(reportContent, 'daily'),
      });

      await db.update(reportSubscriptions)
        .set({ lastSentAt: new Date() })
        .where(eq(reportSubscriptions.id, subscriptionId));

      return { success: true };
    } catch (error: any) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWeeklyReport(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [subscription] = await db.select().from(reportSubscriptions)
        .where(eq(reportSubscriptions.id, subscriptionId));
      
      if (!subscription || !subscription.isActive) {
        return { success: false, error: 'Subscription not found or inactive' };
      }

      const reportContent = await this.generateReportContent(
        subscription.datasetId!,
        subscription.reportTypes
      );

      const { client, fromEmail } = await getResendClient();

      await client.emails.send({
        from: fromEmail || 'AutoInsight <reports@autoinsight.com>',
        to: subscription.emailAddress,
        subject: `Weekly Revenue Report - Week of ${new Date().toLocaleDateString()}`,
        html: this.formatEmailHtml(reportContent, 'weekly'),
      });

      await db.update(reportSubscriptions)
        .set({ lastSentAt: new Date() })
        .where(eq(reportSubscriptions.id, subscriptionId));

      return { success: true };
    } catch (error: any) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTestEmail(emailAddress: string, datasetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const reportContent = await this.generateReportContent(
        datasetId,
        ['kpis', 'forecasts', 'alerts']
      );

      const { client, fromEmail } = await getResendClient();

      await client.emails.send({
        from: fromEmail || 'AutoInsight <reports@autoinsight.com>',
        to: emailAddress,
        subject: `AutoInsight Test Report - ${new Date().toLocaleDateString()}`,
        html: this.formatEmailHtml(reportContent, 'test'),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Test email error:', error);
      return { success: false, error: error.message };
    }
  }

  private async generateReportContent(datasetId: string, reportTypes: string[]): Promise<{
    kpis?: any;
    forecasts?: any[];
    alerts?: any[];
    pricing?: any[];
    channels?: any[];
  }> {
    const content: any = {};

    if (reportTypes.includes('kpis')) {
      content.kpis = await storage.getAnalytics(datasetId);
    }

    if (reportTypes.includes('forecasts')) {
      content.forecasts = await revenueInsightsService.getForecasts(datasetId);
    }

    if (reportTypes.includes('alerts')) {
      content.alerts = await revenueInsightsService.getCancellationAlerts(datasetId, 'active');
    }

    if (reportTypes.includes('pricing')) {
      content.pricing = await aiPricingService.getPricingRecommendations(datasetId, 'pending');
    }

    if (reportTypes.includes('channels')) {
      content.channels = await revenueInsightsService.getChannelSnapshots(datasetId);
    }

    return content;
  }

  private formatEmailHtml(content: any, reportType: string): string {
    const title = reportType === 'daily' ? 'Daily Revenue Report' 
      : reportType === 'weekly' ? 'Weekly Revenue Report'
      : 'AutoInsight Test Report';

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #ffa536 0%, #11b6e9 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffa536; padding-bottom: 8px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .kpi-card { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .kpi-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .kpi-value { font-size: 24px; font-weight: 600; color: #333; }
        .alert-item { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-bottom: 10px; border-radius: 0 8px 8px 0; }
        .alert-high { background: #f8d7da; border-left-color: #dc3545; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
          <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="content">
    `;

    if (content.kpis?.kpis) {
      const kpis = content.kpis.kpis;
      html += `
        <div class="section">
          <div class="section-title">Key Performance Indicators</div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Total Revenue</div>
              <div class="kpi-value">$${Number(kpis.totalRevenue).toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Bookings</div>
              <div class="kpi-value">${kpis.totalBookings}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Average ADR</div>
              <div class="kpi-value">$${Number(kpis.avgADR).toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Cancellation Rate</div>
              <div class="kpi-value">${Number(kpis.cancellationRate).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      `;
    }

    if (content.forecasts && content.forecasts.length > 0) {
      html += `
        <div class="section">
          <div class="section-title">Revenue Forecast (Next 7 Days)</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Predicted Revenue</th>
                <th>Expected Bookings</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      content.forecasts.slice(0, 7).forEach((f: any) => {
        html += `
          <tr>
            <td>${new Date(f.forecastDate).toLocaleDateString()}</td>
            <td>$${Number(f.predictedRevenue).toLocaleString()}</td>
            <td>${f.predictedBookings}</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    if (content.alerts && content.alerts.length > 0) {
      html += `
        <div class="section">
          <div class="section-title">Cancellation Risk Alerts</div>
      `;
      
      content.alerts.slice(0, 5).forEach((alert: any) => {
        const isHigh = alert.riskScore >= 75;
        html += `
          <div class="alert-item ${isHigh ? 'alert-high' : ''}">
            <strong>${alert.guestName}</strong> - ${alert.bookingRef}<br>
            <small>Arrival: ${new Date(alert.arrivalDate).toLocaleDateString()} | Risk Score: ${alert.riskScore}%</small><br>
            <small>${alert.suggestedAction}</small>
          </div>
        `;
      });
      
      html += `</div>`;
    }

    if (content.pricing && content.pricing.length > 0) {
      html += `
        <div class="section">
          <div class="section-title">Pricing Recommendations</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Current</th>
                <th>Suggested</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      content.pricing.slice(0, 5).forEach((p: any) => {
        const changeClass = Number(p.changePercent) > 0 ? 'color: green' : 'color: red';
        html += `
          <tr>
            <td>${new Date(p.targetDate).toLocaleDateString()}</td>
            <td>$${Number(p.currentAdr).toFixed(2)}</td>
            <td>$${Number(p.suggestedAdr).toFixed(2)}</td>
            <td style="${changeClass}">${Number(p.changePercent) > 0 ? '+' : ''}${Number(p.changePercent).toFixed(1)}%</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    html += `
        </div>
        <div class="footer">
          <p>This report was automatically generated by AutoInsight.</p>
          <p>To manage your email preferences, visit your dashboard settings.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return html;
  }

  async processScheduledReports(): Promise<{ sent: number; failed: number }> {
    const activeSubscriptions = await db.select().from(reportSubscriptions)
      .where(eq(reportSubscriptions.isActive, true));
    
    let sent = 0;
    let failed = 0;
    const now = new Date();

    for (const sub of activeSubscriptions) {
      const lastSent = sub.lastSentAt ? new Date(sub.lastSentAt) : null;
      const hoursSinceLastSend = lastSent 
        ? (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
        : Infinity;

      const shouldSend = 
        (sub.frequency === 'daily' && hoursSinceLastSend >= 23) ||
        (sub.frequency === 'weekly' && hoursSinceLastSend >= 167);

      if (shouldSend) {
        const result = sub.frequency === 'daily'
          ? await this.sendDailyReport(sub.id)
          : await this.sendWeeklyReport(sub.id);
        
        if (result.success) {
          sent++;
        } else {
          failed++;
          console.error(`Failed to send report ${sub.id}:`, result.error);
        }
      }
    }

    return { sent, failed };
  }
}

export const emailReportsService = new EmailReportsService();
