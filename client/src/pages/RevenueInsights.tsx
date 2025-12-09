import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Mail, 
  Sparkles,
  RefreshCw,
  Check,
  X,
  ChevronRight,
  BarChart3,
  Loader2,
  Send,
  Plus,
  Trash2
} from "lucide-react";
import { 
  getDatasets,
  getForecasts,
  generateForecasts,
  getChannelSnapshots,
  analyzeChannels,
  getCancellationAlerts,
  generateAlerts,
  updateAlertStatus,
  getPricingRecommendations,
  generatePricingRecommendations,
  updatePricingStatus,
  getReportSubscriptions,
  createReportSubscription,
  updateReportSubscription,
  deleteReportSubscription,
  sendTestEmail,
  type RevenueForecast,
  type ChannelSnapshot,
  type CancellationAlert,
  type PricingRecommendation,
  type ReportSubscription
} from "@/lib/api-client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { format } from "date-fns";

export default function RevenueInsights() {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>(undefined);
  const [newEmail, setNewEmail] = useState("");
  const [newFrequency, setNewFrequency] = useState("weekly");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: datasets } = useQuery({
    queryKey: ["datasets"],
    queryFn: getDatasets,
  });

  const { data: forecasts, isLoading: forecastsLoading } = useQuery({
    queryKey: ["forecasts", selectedDatasetId],
    queryFn: () => getForecasts(selectedDatasetId),
  });

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ["channel-snapshots", selectedDatasetId],
    queryFn: () => getChannelSnapshots(selectedDatasetId),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["cancellation-alerts", selectedDatasetId],
    queryFn: () => getCancellationAlerts(selectedDatasetId),
  });

  const { data: pricing, isLoading: pricingLoading } = useQuery({
    queryKey: ["pricing-recommendations", selectedDatasetId],
    queryFn: () => getPricingRecommendations(selectedDatasetId),
  });

  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ["report-subscriptions"],
    queryFn: getReportSubscriptions,
  });

  const generateForecastsMutation = useMutation({
    mutationFn: (datasetId: string) => generateForecasts(datasetId, 14),
    onSuccess: (data) => {
      queryClient.setQueryData(["forecasts", selectedDatasetId], data);
      toast({ title: "Forecasts generated", description: "Revenue predictions have been updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to generate forecasts.", variant: "destructive" }),
  });

  const analyzeChannelsMutation = useMutation({
    mutationFn: (datasetId: string) => analyzeChannels(datasetId),
    onSuccess: (data) => {
      queryClient.setQueryData(["channel-snapshots", selectedDatasetId], data);
      toast({ title: "Channels analyzed", description: "Channel performance has been updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to analyze channels.", variant: "destructive" }),
  });

  const generateAlertsMutation = useMutation({
    mutationFn: (datasetId: string) => generateAlerts(datasetId),
    onSuccess: (data) => {
      queryClient.setQueryData(["cancellation-alerts", selectedDatasetId], data);
      toast({ title: "Alerts generated", description: "Cancellation risk alerts have been updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to generate alerts.", variant: "destructive" }),
  });

  const generatePricingMutation = useMutation({
    mutationFn: (datasetId: string) => generatePricingRecommendations(datasetId, 7),
    onSuccess: (data) => {
      queryClient.setQueryData(["pricing-recommendations", selectedDatasetId], data);
      toast({ title: "Pricing generated", description: "AI pricing suggestions have been updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to generate pricing.", variant: "destructive" }),
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ alertId, status }: { alertId: string; status: string }) => updateAlertStatus(alertId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cancellation-alerts", selectedDatasetId] });
      toast({ title: "Alert updated" });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updatePricingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-recommendations", selectedDatasetId] });
      toast({ title: "Pricing recommendation updated" });
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: (data: { datasetId?: string; emailAddress: string; frequency: string; reportTypes: string[] }) => 
      createReportSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-subscriptions"] });
      setNewEmail("");
      toast({ title: "Subscription created", description: "You'll receive reports at the specified email." });
    },
    onError: () => toast({ title: "Error", description: "Failed to create subscription.", variant: "destructive" }),
  });

  const toggleSubscriptionMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateReportSubscription(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-subscriptions"] });
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: (id: string) => deleteReportSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-subscriptions"] });
      toast({ title: "Subscription deleted" });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: (subscriptionId: string) => sendTestEmail(subscriptionId),
    onSuccess: () => toast({ title: "Test email sent", description: "Check your inbox!" }),
    onError: () => toast({ title: "Error", description: "Failed to send test email.", variant: "destructive" }),
  });

  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `£${num.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatPercent = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  const forecastChartData = (forecasts || []).map((f: RevenueForecast) => ({
    date: format(new Date(f.forecastDate), "MMM d"),
    revenue: parseFloat(f.predictedRevenue),
    bookings: f.predictedBookings,
  }));

  const channelChartData = (channels || []).map((c: ChannelSnapshot) => ({
    channel: c.channel,
    gross: parseFloat(c.grossRevenue),
    net: parseFloat(c.netRevenue),
  }));

  const highRiskAlerts = (alerts || []).filter((a: CancellationAlert) => a.riskScore >= 70 && a.status === "pending");
  const pendingPricing = (pricing || []).filter((p: PricingRecommendation) => p.status === "pending");

  return (
    <Layout>
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground" data-testid="text-revenue-insights-title">
            Revenue Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analytics to maximize your hotel's revenue potential
          </p>
        </div>
        
        <Select value={selectedDatasetId || "all"} onValueChange={(v) => setSelectedDatasetId(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-[200px]" data-testid="select-dataset">
            <SelectValue placeholder="All datasets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All datasets</SelectItem>
            {datasets?.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">14-Day Forecast</p>
              <p className="text-xl font-semibold" data-testid="text-forecast-total">
                {forecasts?.length ? formatCurrency(forecasts.reduce((sum: number, f: RevenueForecast) => sum + parseFloat(f.predictedRevenue), 0)) : "—"}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Channel</p>
              <p className="text-xl font-semibold" data-testid="text-top-channel">
                {channels?.length ? channels.reduce((max: ChannelSnapshot | null, c: ChannelSnapshot) => 
                  (!max || parseFloat(c.netRevenue) > parseFloat(max.netRevenue)) ? c : max, null as ChannelSnapshot | null)?.channel || "—" : "—"}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Risk Bookings</p>
              <p className="text-xl font-semibold" data-testid="text-high-risk-count">{highRiskAlerts.length}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pricing Suggestions</p>
              <p className="text-xl font-semibold" data-testid="text-pricing-count">{pendingPricing.length}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <Tabs defaultValue="forecasting" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="forecasting" data-testid="tab-forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="channels" data-testid="tab-channels">Channels</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">Risk Alerts</TabsTrigger>
          <TabsTrigger value="pricing" data-testid="tab-pricing">AI Pricing</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Email Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasting" className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-lg font-semibold">Revenue Forecasting</h3>
                <p className="text-sm text-muted-foreground">Predicted revenue for the next 14 days</p>
              </div>
              <Button 
                onClick={() => selectedDatasetId && generateForecastsMutation.mutate(selectedDatasetId)}
                disabled={!selectedDatasetId || generateForecastsMutation.isPending}
                data-testid="button-generate-forecasts"
              >
                {generateForecastsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Generate Forecasts
              </Button>
            </div>

            {forecastsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : forecasts?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
                <p>No forecasts available. Select a dataset and generate forecasts.</p>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-lg font-semibold">Channel Performance</h3>
                <p className="text-sm text-muted-foreground">Gross vs net revenue by distribution channel</p>
              </div>
              <Button 
                onClick={() => selectedDatasetId && analyzeChannelsMutation.mutate(selectedDatasetId)}
                disabled={!selectedDatasetId || analyzeChannelsMutation.isPending}
                data-testid="button-analyze-channels"
              >
                {analyzeChannelsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Analyze Channels
              </Button>
            </div>

            {channelsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : channels?.length ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={channelChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="channel" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <Tooltip 
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="gross" fill="hsl(var(--primary))" name="Gross Revenue" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="net" fill="hsl(var(--secondary))" name="Net Revenue" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map((channel: ChannelSnapshot) => (
                    <div key={channel.id} className="p-4 rounded-lg border border-border bg-card/50" data-testid={`card-channel-${channel.channel}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{channel.channel}</h4>
                        <Badge variant="outline">{formatPercent(channel.commissionRate)} fee</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross:</span>
                          <span>{formatCurrency(channel.grossRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Net:</span>
                          <span className="text-green-600">{formatCurrency(channel.netRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bookings:</span>
                          <span>{channel.bookingCount}</span>
                        </div>
                      </div>
                      {channel.recommendation && (
                        <p className="mt-3 text-xs text-muted-foreground italic">{channel.recommendation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <p>No channel data available. Select a dataset and analyze channels.</p>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-lg font-semibold">Cancellation Risk Alerts</h3>
                <p className="text-sm text-muted-foreground">Bookings with high cancellation probability</p>
              </div>
              <Button 
                onClick={() => selectedDatasetId && generateAlertsMutation.mutate(selectedDatasetId)}
                disabled={!selectedDatasetId || generateAlertsMutation.isPending}
                data-testid="button-generate-alerts"
              >
                {generateAlertsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Scan for Risks
              </Button>
            </div>

            {alertsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : alerts?.length ? (
              <div className="space-y-3">
                {alerts.map((alert: CancellationAlert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-lg border ${alert.status === "pending" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card/50"}`}
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">{alert.guestName}</span>
                          <Badge variant={alert.riskScore >= 80 ? "destructive" : alert.riskScore >= 60 ? "default" : "secondary"}>
                            {alert.riskScore}% risk
                          </Badge>
                          <Badge variant="outline">{alert.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Booking: {alert.bookingRef} • Arrival: {format(new Date(alert.arrivalDate), "MMM d, yyyy")}</p>
                          <p className="text-xs">{alert.riskFactors}</p>
                        </div>
                      </div>
                      {alert.status === "pending" && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateAlertMutation.mutate({ alertId: alert.id, status: "contacted" })}
                            data-testid={`button-contact-${alert.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => updateAlertMutation.mutate({ alertId: alert.id, status: "dismissed" })}
                            data-testid={`button-dismiss-${alert.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                <p>No alerts available. Select a dataset and scan for risks.</p>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-lg font-semibold">AI Pricing Suggestions</h3>
                <p className="text-sm text-muted-foreground">Smart rate recommendations for the next 7 days</p>
              </div>
              <Button 
                onClick={() => selectedDatasetId && generatePricingMutation.mutate(selectedDatasetId)}
                disabled={!selectedDatasetId || generatePricingMutation.isPending}
                data-testid="button-generate-pricing"
              >
                {generatePricingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Suggestions
              </Button>
            </div>

            {pricingLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pricing?.length ? (
              <div className="space-y-3">
                {pricing.map((rec: PricingRecommendation) => {
                  const change = parseFloat(rec.changePercent);
                  const isIncrease = change > 0;
                  return (
                    <div 
                      key={rec.id} 
                      className="p-4 rounded-lg border border-border bg-card/50"
                      data-testid={`pricing-${rec.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium">{format(new Date(rec.targetDate), "EEEE, MMM d")}</span>
                            <Badge variant={isIncrease ? "default" : "secondary"} className={isIncrease ? "bg-green-600" : ""}>
                              {isIncrease ? "+" : ""}{change.toFixed(1)}%
                            </Badge>
                            <Badge variant="outline">{rec.status}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">Current: {formatCurrency(rec.currentAdr)}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <span className={isIncrease ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                              Suggested: {formatCurrency(rec.suggestedAdr)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{rec.rationale}</p>
                        </div>
                        {rec.status === "pending" && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => updatePricingMutation.mutate({ id: rec.id, status: "accepted" })}
                              data-testid={`button-accept-${rec.id}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => updatePricingMutation.mutate({ id: rec.id, status: "rejected" })}
                              data-testid={`button-reject-${rec.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <DollarSign className="h-12 w-12 mb-4 opacity-50" />
                <p>No pricing suggestions available. Select a dataset and generate suggestions.</p>
              </div>
            )}
          </GlassCard>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <GlassCard>
            <div className="mb-6">
              <h3 className="font-serif text-lg font-semibold">Automated Email Reports</h3>
              <p className="text-sm text-muted-foreground">Receive regular performance summaries in your inbox</p>
            </div>

            <div className="border-b border-border pb-6 mb-6">
              <h4 className="font-medium mb-4">Add New Subscription</h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    data-testid="input-new-email"
                  />
                </div>
                <div className="w-40">
                  <Label>Frequency</Label>
                  <Select value={newFrequency} onValueChange={setNewFrequency}>
                    <SelectTrigger data-testid="select-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => {
                      if (newEmail) {
                        createSubscriptionMutation.mutate({
                          datasetId: selectedDatasetId,
                          emailAddress: newEmail,
                          frequency: newFrequency,
                          reportTypes: ["kpis", "forecasts", "alerts"],
                        });
                      }
                    }}
                    disabled={!newEmail || createSubscriptionMutation.isPending}
                    data-testid="button-add-subscription"
                  >
                    {createSubscriptionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {subscriptionsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : subscriptions?.length ? (
              <div className="space-y-3">
                {subscriptions.map((sub: ReportSubscription) => (
                  <div 
                    key={sub.id} 
                    className="p-4 rounded-lg border border-border bg-card/50 flex items-center justify-between"
                    data-testid={`subscription-${sub.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{sub.emailAddress}</p>
                        <p className="text-sm text-muted-foreground capitalize">{sub.frequency} reports</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => sendTestEmailMutation.mutate(sub.id)}
                        disabled={sendTestEmailMutation.isPending}
                        data-testid={`button-test-${sub.id}`}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                      <Switch 
                        checked={sub.enabled}
                        onCheckedChange={(enabled) => toggleSubscriptionMutation.mutate({ id: sub.id, enabled })}
                        data-testid={`switch-${sub.id}`}
                      />
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteSubscriptionMutation.mutate(sub.id)}
                        data-testid={`button-delete-${sub.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Mail className="h-12 w-12 mb-4 opacity-50" />
                <p>No subscriptions yet. Add an email to receive reports.</p>
              </div>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
