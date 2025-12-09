import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartWidget } from "@/components/dashboard/ChartWidget";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  BedDouble, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Star,
  ArrowRight,
  Sparkles,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getKPIs, getTrends } from "@/lib/api-client";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [_, setLocation] = useLocation();

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ["kpis"],
    queryFn: () => getKPIs(),
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["trends"],
    queryFn: () => getTrends(),
  });

  const occupancyData = trends?.map(t => ({
    day: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: t.bookings * 10,
  })) || [];

  const revenueData = trends?.map(t => ({
    day: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: t.revenue,
  })) || [];

  if (kpisLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (kpisError || !kpis) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <GlassCard className="p-8 max-w-md text-center">
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-6">
              Upload your hotel booking data to start seeing analytics and insights.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => setLocation("/upload")}
              data-testid="button-upload-data"
            >
              Upload Data
            </Button>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (value: number) => `£${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Here's your executive summary for <span className="font-semibold text-foreground">Hyatt Place Leeds</span>.
          </p>
        </div>
        
        <GlassCard className="flex items-start gap-4 p-4 max-w-xl w-full bg-primary/5 border-primary/10">
          <AgentAvatar name="Nova" pulsing />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-primary">Nova Insight</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">New</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {kpis.totalBookings > 0 
                ? `You have ${kpis.totalBookings} bookings with an average daily rate of ${formatCurrency(kpis.averageDailyRate)}. ${
                    kpis.cancellationRate > 10 
                      ? `Your cancellation rate is ${formatPercentage(kpis.cancellationRate)}, which is higher than average.`
                      : `Your cancellation rate is ${formatPercentage(kpis.cancellationRate)}, which is excellent.`
                  }`
                : "Upload more data to get personalized insights."
              }
            </p>
            <Button variant="link" className="p-0 h-auto text-primary text-xs mt-2 hover:text-primary/80">
              View Details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Revenue" 
          value={formatCurrency(kpis.totalRevenue)} 
          change={5.4} 
          icon={<CreditCard className="h-6 w-6 text-primary" />}
          subtext={`${kpis.totalBookings} bookings`}
        />
        <KPICard 
          title="Average Daily Rate" 
          value={formatCurrency(kpis.averageDailyRate)} 
          change={2.1} 
          icon={<TrendingUp className="h-6 w-6 text-secondary" />}
          subtext="ADR per booking"
        />
        <KPICard 
          title="Cancellation Rate" 
          value={formatPercentage(kpis.cancellationRate)} 
          change={-1.2} 
          icon={<BedDouble className="h-6 w-6 text-[hsl(var(--chart-4))]" />}
          subtext="Booking cancellations"
        />
        <KPICard 
          title="Repeat Guest Rate" 
          value={formatPercentage(kpis.repeatGuestRate)} 
          change={0.8} 
          icon={<Star className="h-6 w-6 text-[hsl(var(--chart-5))]" />}
          subtext="Returning guests"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trendsLoading ? (
          <>
            <GlassCard className="p-6 flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </GlassCard>
            <GlassCard className="p-6 flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </GlassCard>
          </>
        ) : (
          <>
            <ChartWidget 
              title="Booking Trends" 
              data={occupancyData} 
              dataKey="value" 
              category="day"
              color="hsl(var(--primary))"
            />
            <ChartWidget 
              title="Revenue Trends (Daily)" 
              data={revenueData} 
              dataKey="value" 
              category="day"
              color="hsl(var(--secondary))"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif font-semibold text-lg">AI Generated Insights</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          
          <div className="space-y-4">
            {[
              { 
                agent: "Sterling", 
                title: "Average Lead Time", 
                text: `Your average booking lead time is ${kpis.averageLeadTime.toFixed(0)} days. ${
                  kpis.averageLeadTime > 30 
                    ? "Consider implementing early bird discounts." 
                    : "Your guests tend to book last-minute."
                }`, 
                time: "2h ago" 
              },
              { 
                agent: "Atlas", 
                title: "Revenue Performance", 
                text: `Total revenue of ${formatCurrency(kpis.totalRevenue)} across ${kpis.totalBookings} bookings. ${
                  kpis.averageDailyRate > 100 
                    ? "Your ADR is strong." 
                    : "Consider reviewing your pricing strategy."
                }`, 
                time: "5h ago" 
              },
              { 
                agent: "Sage", 
                title: "Guest Retention", 
                text: `${formatPercentage(kpis.repeatGuestRate)} of your guests are returning. ${
                  kpis.repeatGuestRate > 20 
                    ? "Excellent loyalty! Keep it up." 
                    : "Consider implementing a loyalty program."
                }`, 
                time: "1d ago" 
              },
            ].map((insight, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <AgentAvatar name={insight.agent as any} className="shrink-0 w-10 h-10" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <span className="text-xs text-muted-foreground">• {insight.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.text}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-brand text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-2">AutoInsight Lab</h3>
            <p className="text-white/80 mb-6 text-sm">
              Unlock the full power of predictive analytics. Upload your historical CSVs to train custom models.
            </p>
          </div>
          
          <div className="relative z-10">
            <Button 
              variant="secondary" 
              className="w-full bg-white text-primary hover:bg-white/90 border-none shadow-lg"
              onClick={() => setLocation("/upload")}
              data-testid="button-upload-lab"
            >
              Upload Data
            </Button>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
