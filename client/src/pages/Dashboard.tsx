import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartWidget } from "@/components/dashboard/ChartWidget";
import { DatasetManager } from "@/components/dashboard/DatasetManager";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { DateRangeFilter, useDefaultDateRange, type DateRangeValue } from "@/components/ui/date-range-filter";
import { 
  BedDouble, 
  CreditCard, 
  TrendingUp, 
  Star,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  BarChart3,
  Users,
  Calendar,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getKPIs, getTrends, getComprehensiveAnalytics, getDatasets, getInsights, generateInsights, type AIInsight } from "@/lib/api-client";
import { useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; agent: string }> = {
  revenue: { icon: <DollarSign className="h-4 w-4" />, color: "bg-green-500/10 text-green-600", agent: "Sterling" },
  guest: { icon: <Users className="h-4 w-4" />, color: "bg-blue-500/10 text-blue-600", agent: "Atlas" },
  operations: { icon: <Calendar className="h-4 w-4" />, color: "bg-purple-500/10 text-purple-600", agent: "Sage" },
  risk: { icon: <AlertTriangle className="h-4 w-4" />, color: "bg-red-500/10 text-red-600", agent: "Nova" },
  channel: { icon: <BarChart3 className="h-4 w-4" />, color: "bg-orange-500/10 text-orange-600", agent: "Sterling" },
  pricing: { icon: <TrendingUp className="h-4 w-4" />, color: "bg-cyan-500/10 text-cyan-600", agent: "Atlas" },
};

const impactColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-600 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-green-500/10 text-green-600 border-green-500/20",
};

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRangeValue>(useDefaultDateRange());
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const queryClient = useQueryClient();

  const dateRangeParams = {
    startDate: format(dateRange.startDate, "yyyy-MM-dd"),
    endDate: format(dateRange.endDate, "yyyy-MM-dd"),
  };

  const { data: datasets, isLoading: datasetsLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => getDatasets(),
  });

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ["kpis", selectedDatasetId, dateRangeParams.startDate, dateRangeParams.endDate],
    queryFn: () => getKPIs(selectedDatasetId, dateRangeParams),
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ["trends", selectedDatasetId, dateRangeParams.startDate, dateRangeParams.endDate],
    queryFn: () => getTrends(selectedDatasetId, dateRangeParams),
  });

  const { data: fullAnalytics } = useQuery({
    queryKey: ["comprehensive-analytics", selectedDatasetId, dateRangeParams.startDate, dateRangeParams.endDate],
    queryFn: () => getComprehensiveAnalytics(selectedDatasetId, dateRangeParams),
  });

  const { data: aiInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ["ai-insights", selectedDatasetId],
    queryFn: () => getInsights(selectedDatasetId),
  });

  const generateInsightsMutation = useMutation({
    mutationFn: (datasetId: string) => generateInsights(datasetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
    },
  });

  const selectedDataset = datasets?.find(d => d.id === selectedDatasetId);

  const trends = trendsData?.daily || [];

  const occupancyData = trends.map(t => ({
    day: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: t.bookings * 10,
  }));

  const revenueData = trends.map(t => ({
    day: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: t.revenue,
  }));

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

  const formatCurrency = (value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const fallbackInsights = [
    { 
      agent: "Sterling", 
      category: "revenue",
      title: "How Far Ahead Guests Book", 
      text: `Guests typically book ${kpis.averageLeadTime.toFixed(0)} days before arriving. ${
        kpis.averageLeadTime > 30 
          ? "You could offer early booking rewards!" 
          : "Most guests are booking last-minute."
      }`, 
      time: "2h ago" 
    },
    { 
      agent: "Atlas", 
      category: "revenue",
      title: "Earnings Overview", 
      text: `You've earned ${formatCurrency(kpis.totalRevenue)} from ${kpis.totalBookings} bookings. ${
        kpis.averageDailyRate > 100 
          ? "Your room prices are performing well." 
          : "You might want to review your room pricing."
      }`, 
      time: "5h ago" 
    },
    { 
      agent: "Sage", 
      category: "guest",
      title: "Returning Guests", 
      text: `${formatPercentage(kpis.repeatGuestRate)} of your guests have stayed before. ${
        kpis.repeatGuestRate > 20 
          ? "Great loyalty! Keep it up." 
          : "A loyalty program could help bring guests back."
      }`, 
      time: "1d ago" 
    },
  ];

  const hasAIInsights = aiInsights && Array.isArray(aiInsights) && aiInsights.length > 0;
  const displayInsights = hasAIInsights ? aiInsights.slice(0, 6) : null;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-serif font-bold text-foreground" data-testid="text-dashboard-title">
              Dashboard
            </h1>
            <DatasetManager 
              datasets={datasets || []}
              selectedDatasetId={selectedDatasetId}
              onSelectDataset={setSelectedDatasetId}
              isLoading={datasetsLoading}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-muted-foreground">
              Here's your executive summary for <span className="font-semibold text-foreground">{selectedDataset?.name || "Hyatt Place"}</span>.
            </p>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
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
                ? `You have ${kpis.totalBookings} bookings with an average price of ${formatCurrency(kpis.averageDailyRate)} per night. ${
                    kpis.cancellationRate > 10 
                      ? `${formatPercentage(kpis.cancellationRate)} of bookings were cancelled, which is higher than usual.`
                      : `Only ${formatPercentage(kpis.cancellationRate)} of bookings were cancelled - that's great!`
                  }`
                : "Upload more data to get personalized insights."
              }
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-primary text-xs mt-2 hover:text-primary/80"
              onClick={() => setLocation("/analysis")}
              data-testid="button-view-details"
            >
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
          title="Price Per Night" 
          value={formatCurrency(kpis.averageDailyRate)} 
          change={2.1} 
          icon={<TrendingUp className="h-6 w-6 text-secondary" />}
          subtext="Average room price"
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
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="font-serif font-semibold text-lg">AI Generated Insights</h3>
              {displayInsights && (
                <Badge variant="secondary" className="text-xs">
                  {aiInsights!.length} insights
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedDatasetId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateInsightsMutation.mutate(selectedDatasetId)}
                  disabled={generateInsightsMutation.isPending}
                  data-testid="button-generate-insights"
                >
                  {generateInsightsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Generate
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/analysis")}
                data-testid="button-view-all-insights"
              >
                View All
              </Button>
            </div>
          </div>
          
          {insightsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : displayInsights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayInsights.map((insight) => {
                const config = categoryConfig[insight.category] || categoryConfig.revenue;
                return (
                  <div 
                    key={insight.id} 
                    className="flex gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors border border-border/50 hover:border-primary/20 cursor-pointer group"
                    onClick={() => setSelectedInsight(insight)}
                    data-testid={`insight-card-${insight.id}`}
                  >
                    <AgentAvatar name={config.agent as any} className="shrink-0 w-10 h-10" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
                          {config.icon}
                          {insight.category}
                        </span>
                        <Badge variant="outline" className={`text-[10px] ${impactColors[insight.impact]}`}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {insight.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
                        </span>
                        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                          View details <ArrowRight className="h-3 w-3 ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {fallbackInsights.map((insight, i) => {
                const config = categoryConfig[insight.category] || categoryConfig.revenue;
                return (
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
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="bg-gradient-brand text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-serif text-2xl font-bold mb-2">Smart Insights</h3>
            <p className="text-white/80 mb-6 text-sm">
              See what's coming next. Upload your booking history to discover patterns and trends.
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

      <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          {selectedInsight && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {categoryConfig[selectedInsight.category] && (
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${categoryConfig[selectedInsight.category].color}`}>
                      {categoryConfig[selectedInsight.category].icon}
                      {selectedInsight.category}
                    </span>
                  )}
                  <Badge variant="outline" className={impactColors[selectedInsight.impact]}>
                    {selectedInsight.impact} impact
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {selectedInsight.confidence}% confidence
                  </span>
                </div>
                <DialogTitle className="text-xl">{selectedInsight.title}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Summary</h4>
                    <p className="text-sm">{selectedInsight.summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Detailed Analysis</h4>
                    <p className="text-sm whitespace-pre-wrap">{selectedInsight.details}</p>
                  </div>
                  
                  {selectedInsight.actionItems && selectedInsight.actionItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Recommended Actions</h4>
                      <ul className="space-y-2">
                        {selectedInsight.actionItems.map((action, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedInsight.relatedMetrics && Object.keys(selectedInsight.relatedMetrics).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Related Metrics</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedInsight.relatedMetrics).map(([key, value]) => (
                          <div key={key} className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="text-lg font-semibold">
                              {typeof value === 'number' 
                                ? value > 1000 
                                  ? `£${value.toLocaleString()}` 
                                  : value.toFixed(1)
                                : value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground pt-4 border-t">
                    Generated {formatDistanceToNow(new Date(selectedInsight.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
