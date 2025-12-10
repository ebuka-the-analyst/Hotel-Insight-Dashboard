import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DateRangeFilter, useDefaultDateRange, type DateRangeValue } from "@/components/ui/date-range-filter";
import { 
  Users, 
  Search, 
  Download, 
  RefreshCcw,
  Crown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  DollarSign,
  Calendar,
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Heart,
  AlertCircle,
  CheckCircle,
  Clock,
  Briefcase,
  Home,
  UserCheck,
  UserX,
  Zap,
  Globe,
  Award
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from "recharts";

const COLORS = ['#4B77A9', '#bf5b20', '#11b6e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const TIER_COLORS: Record<string, string> = {
  'Bronze': '#cd7f32',
  'Silver': '#c0c0c0',
  'Gold': '#ffd700',
  'Platinum': '#e5e4e2',
};

const STAGE_COLORS: Record<string, string> = {
  'first_timer': '#3b82f6',
  'returning': '#10b981',
  'loyal': '#8b5cf6',
  'champion': '#f59e0b',
  'at_risk': '#ef4444',
  'churned': '#6b7280',
};

async function fetchDatasets() {
  const res = await fetch('/api/datasets');
  if (!res.ok) throw new Error('Failed to fetch datasets');
  return res.json();
}

async function fetchGuestAnalytics(datasetId: string, dateRange?: { startDate?: string; endDate?: string }) {
  const params = new URLSearchParams({ datasetId });
  if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
  if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
  const res = await fetch(`/api/guests/analytics/comprehensive?${params}`);
  if (!res.ok) throw new Error('Failed to fetch guest analytics');
  return res.json();
}

async function fetchGuests(datasetId: string, params: { limit?: number; offset?: number; search?: string; sortBy?: string; sortOrder?: string; startDate?: string; endDate?: string }) {
  const query = new URLSearchParams({ datasetId, ...Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])) });
  const res = await fetch(`/api/guests?${query}`);
  if (!res.ok) throw new Error('Failed to fetch guests');
  return res.json();
}

async function extractGuests(datasetId: string) {
  const res = await fetch(`/api/guests/extract/v2/${datasetId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to extract guests');
  return res.json();
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = "primary"
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon?: any;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}) {
  return (
    <GlassCard className="p-4" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-primary/10`}>
            <Icon className={`h-5 w-5 text-primary`} />
          </div>
        )}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
          {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
        </div>
      )}
    </GlassCard>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-serif font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function ScoreRing({ score, label, maxScore = 100 }: { score: number; label: string; maxScore?: number }) {
  const circumference = 2 * Math.PI * 35;
  const percent = Math.min((score / maxScore) * 100, 100);
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const color = percent >= 70 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted/20" />
          <circle cx="40" cy="40" r="35" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" 
            style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1 text-center">{label}</span>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const tierColors: Record<string, string> = {
    'Bronze': 'bg-amber-700/20 text-amber-700 border-amber-700/30',
    'Silver': 'bg-slate-400/20 text-slate-500 border-slate-400/30',
    'Gold': 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    'Platinum': 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  };
  
  return (
    <Badge className={`${tierColors[tier] || 'bg-muted text-muted-foreground'} border`}>
      {tier === 'Platinum' && <Crown className="h-3 w-3 mr-1" />}
      {tier === 'Gold' && <Star className="h-3 w-3 mr-1" />}
      {tier}
    </Badge>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const stageLabels: Record<string, { label: string; color: string }> = {
    'first_timer': { label: 'First Timer', color: 'bg-blue-500/20 text-blue-600' },
    'returning': { label: 'Returning', color: 'bg-green-500/20 text-green-600' },
    'loyal': { label: 'Loyal', color: 'bg-purple-500/20 text-purple-600' },
    'champion': { label: 'Champion', color: 'bg-yellow-500/20 text-yellow-600' },
    'at_risk': { label: 'At Risk', color: 'bg-red-500/20 text-red-600' },
    'churned': { label: 'Churned', color: 'bg-gray-500/20 text-gray-600' },
  };
  
  const config = stageLabels[stage] || { label: stage, color: 'bg-muted text-muted-foreground' };
  
  return <Badge className={config.color}>{config.label}</Badge>;
}

export default function Guests() {
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(useDefaultDateRange());
  const queryClient = useQueryClient();

  const dateRangeParams = {
    startDate: format(dateRange.startDate, "yyyy-MM-dd"),
    endDate: format(dateRange.endDate, "yyyy-MM-dd"),
  };
  
  const { data: datasets, isLoading: datasetsLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: fetchDatasets,
  });
  
  const activeDatasetId = datasets?.[0]?.id;
  
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ["guest-analytics", activeDatasetId, dateRangeParams.startDate, dateRangeParams.endDate],
    queryFn: () => fetchGuestAnalytics(activeDatasetId, dateRangeParams),
    enabled: !!activeDatasetId,
  });
  
  const { data: guestsData, isLoading: guestsLoading } = useQuery({
    queryKey: ["guests", activeDatasetId, searchQuery, dateRangeParams.startDate, dateRangeParams.endDate],
    queryFn: () => fetchGuests(activeDatasetId, { limit: 50, search: searchQuery, ...dateRangeParams }),
    enabled: !!activeDatasetId,
  });
  
  const extractMutation = useMutation({
    mutationFn: () => extractGuests(activeDatasetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
  });

  if (datasetsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!activeDatasetId) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <GlassCard className="p-8 max-w-md text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-6">
              Upload your hotel booking data to unlock comprehensive guest analytics with 36 advanced metrics.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => setLocation("/upload")}
              data-testid="button-upload-guests"
            >
              Upload Data
            </Button>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (val: number) => `£${val.toLocaleString()}`;
  const formatPercent = (val: number) => `${val}%`;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold" data-testid="text-guests-title">Guest Analytics</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
            <p className="text-muted-foreground">36 advanced metrics for guest performance analysis</p>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => extractMutation.mutate()}
            disabled={extractMutation.isPending}
            data-testid="button-extract-guests"
          >
            {extractMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
            Extract Guests
          </Button>
          <Button size="sm" className="bg-primary text-white hover:bg-primary/90" data-testid="button-export-guests">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {!analytics && !analyticsLoading && (
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <div>
              <h3 className="font-semibold">Guest Data Not Extracted</h3>
              <p className="text-sm text-muted-foreground">
                Click "Extract Guests" to analyze guest data from your bookings and generate analytics.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {analyticsLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading guest analytics...</p>
          </div>
        </div>
      ) : analytics ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="directory" data-testid="tab-directory">Directory</TabsTrigger>
            <TabsTrigger value="lifecycle" data-testid="tab-lifecycle">Lifecycle</TabsTrigger>
            <TabsTrigger value="value" data-testid="tab-value">Value & RFM</TabsTrigger>
            <TabsTrigger value="behavioral" data-testid="tab-behavioral">Behavioral</TabsTrigger>
            <TabsTrigger value="risk" data-testid="tab-risk">Risk</TabsTrigger>
            <TabsTrigger value="engagement" data-testid="tab-engagement">Engagement</TabsTrigger>
            <TabsTrigger value="predictive" data-testid="tab-predictive">Predictive</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <MetricCard title="Total Guests" value={analytics.summary.totalGuests.toLocaleString()} icon={Users} />
              <MetricCard title="Total Revenue" value={formatCurrency(analytics.summary.totalRevenue)} icon={DollarSign} />
              <MetricCard title="Avg Guest Value" value={formatCurrency(analytics.summary.avgGuestValue)} icon={Target} />
              <MetricCard title="Repeat Rate" value={formatPercent(analytics.summary.repeatGuestRate)} icon={Heart} />
              <MetricCard title="Top Segment" value={analytics.summary.topPerformingSegment} icon={Crown} />
              <MetricCard title="High Risk" value={formatPercent(analytics.summary.highRiskGuestPercent)} icon={AlertTriangle} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="Lifecycle Stage Distribution" subtitle="Guest journey stages" />
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie 
                        data={analytics.lifecycle.lifecycleStageDistribution.filter((s: any) => s.count > 0)} 
                        dataKey="count" 
                        nameKey="stage" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100}
                        label={({ stage, percent }) => `${stage.replace('_', ' ')} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {analytics.lifecycle.lifecycleStageDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Loyalty Tier Breakdown" subtitle="Guest loyalty distribution" />
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.engagement.loyaltyTierBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="tier" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Guests">
                        {analytics.engagement.loyaltyTierBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier] || COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <SectionHeader title="Top Guests by Revenue" subtitle="High-value guest profiles" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-3 font-medium">Guest</th>
                      <th className="text-right py-3 font-medium">Revenue</th>
                      <th className="text-right py-3 font-medium">Bookings</th>
                      <th className="text-right py-3 font-medium">RFM</th>
                      <th className="text-right py-3 font-medium">CLV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.value.highValueProfiles.slice(0, 10).map((guest: any, i: number) => (
                      <tr key={i} className="border-b border-muted/50 hover:bg-muted/20">
                        <td className="py-3 font-medium">{guest.name}</td>
                        <td className="text-right py-3">{formatCurrency(guest.revenue)}</td>
                        <td className="text-right py-3">{guest.bookings}</td>
                        <td className="text-right py-3">
                          <Badge variant="outline">{guest.rfmScore}/5</Badge>
                        </td>
                        <td className="text-right py-3 text-green-600">{formatCurrency(guest.clv)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="directory" className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search guests..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-guests"
                  />
                </div>
              </div>
              
              {guestsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="text-left py-3 font-medium">Guest</th>
                        <th className="text-left py-3 font-medium">Country</th>
                        <th className="text-left py-3 font-medium">Stage</th>
                        <th className="text-left py-3 font-medium">Tier</th>
                        <th className="text-right py-3 font-medium">Bookings</th>
                        <th className="text-right py-3 font-medium">Revenue</th>
                        <th className="text-right py-3 font-medium">RFM</th>
                        <th className="text-right py-3 font-medium">Churn Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guestsData?.guests?.map((guest: any) => (
                        <tr key={guest.id} className="border-b border-muted/50 hover:bg-muted/20">
                          <td className="py-3 font-medium">{guest.name}</td>
                          <td className="py-3">{guest.country || '-'}</td>
                          <td className="py-3"><StageBadge stage={guest.lifecycleStage} /></td>
                          <td className="py-3"><TierBadge tier={guest.loyaltyTier?.charAt(0).toUpperCase() + guest.loyaltyTier?.slice(1)} /></td>
                          <td className="text-right py-3">{guest.totalBookings}</td>
                          <td className="text-right py-3">{formatCurrency(parseFloat(guest.totalRevenue || '0'))}</td>
                          <td className="text-right py-3">
                            <Badge variant="outline">{guest.rfmScore}/5</Badge>
                          </td>
                          <td className="text-right py-3">
                            <span className={`${guest.churnRiskScore >= 70 ? 'text-red-500' : guest.churnRiskScore >= 40 ? 'text-amber-500' : 'text-green-500'}`}>
                              {guest.churnRiskScore}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {guestsData?.total > 50 && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Showing 50 of {guestsData.total} guests. Use search to find specific guests.
                    </p>
                  )}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="lifecycle" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard 
                title="First-Timers" 
                value={analytics.lifecycle.firstTimerVsReturnerBreakdown.firstTimers} 
                subtitle={`${analytics.lifecycle.firstTimerVsReturnerBreakdown.firstTimerPercent}%`}
                icon={UserCheck} 
              />
              <MetricCard 
                title="Returners" 
                value={analytics.lifecycle.firstTimerVsReturnerBreakdown.returners} 
                subtitle={`${analytics.lifecycle.firstTimerVsReturnerBreakdown.returnerPercent}%`}
                icon={Heart} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="Guest Journey Map" subtitle="Conversion through lifecycle stages" />
                <div className="space-y-4">
                  {analytics.lifecycle.guestJourneyMap.map((stage: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium capitalize">{stage.stage.replace('_', ' ')}</div>
                      <div className="flex-1">
                        <Progress value={stage.guests / analytics.summary.totalGuests * 100} className="h-3" />
                      </div>
                      <div className="w-20 text-right text-sm">{stage.guests} guests</div>
                      <div className="w-24 text-right text-sm text-muted-foreground">
                        {formatCurrency(stage.avgValue)} avg
                      </div>
                      {stage.nextStageConversion > 0 && (
                        <div className="w-20 text-right text-sm text-green-500">
                          {stage.nextStageConversion}% convert
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Time to Return" subtitle="How quickly guests return" />
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.lifecycle.timeToReturnAnalysis} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="bucket" type="category" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <SectionHeader title="Acquisition Cohorts" subtitle="Guests by first booking month" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.lifecycle.acquisitionCohorts.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="cohort" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="guestCount" name="New Guests" fill="#4B77A9" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="avgBookings" name="Avg Bookings" stroke="#f59e0b" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="value" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="RFM Score Distribution" subtitle="Recency, Frequency, Monetary" />
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.value.rfmDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="score" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="CLV Tiers" subtitle="Customer Lifetime Value" />
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie 
                        data={analytics.value.clvAnalysis.filter((t: any) => t.count > 0)} 
                        dataKey="count" 
                        nameKey="tier" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={40}
                        outerRadius={80}
                        label={({ tier, percent }) => `${tier} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {analytics.value.clvAnalysis.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Whale Analysis (Pareto)" subtitle="Revenue concentration" />
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Top 10% of guests</span>
                    <div className="text-right">
                      <div className="font-bold">{analytics.value.whaleAnalysis.top10Percent.percent}%</div>
                      <div className="text-xs text-muted-foreground">of revenue</div>
                    </div>
                  </div>
                  <Progress value={analytics.value.whaleAnalysis.top10Percent.percent} className="h-3" />
                  
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm">Top 20% of guests</span>
                    <div className="text-right">
                      <div className="font-bold">{analytics.value.whaleAnalysis.top20Percent.percent}%</div>
                      <div className="text-xs text-muted-foreground">of revenue</div>
                    </div>
                  </div>
                  <Progress value={analytics.value.whaleAnalysis.top20Percent.percent} className="h-3" />
                  
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium">Pareto Insight</p>
                    <p className="text-xs text-muted-foreground">
                      {analytics.value.whaleAnalysis.pareto.whaleCount} guests generate {analytics.value.whaleAnalysis.pareto.whaleRevenuePercent}% of total revenue
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <SectionHeader title="Revenue Decile Distribution" subtitle="Guest value segments" />
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.value.revenueDeciles}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="decile" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="behavioral" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="Channel Loyalty" subtitle="Preferred booking channels" />
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.behavioral.channelLoyalty.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="channel" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="loyalGuestCount" name="Loyal Guests" fill="#4B77A9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Room Type Affinity" subtitle="Preferred room types" />
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.behavioral.roomTypeAffinity.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="roomType" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="guestCount" name="Guests" fill="#bf5b20" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="Day of Week Preferences" subtitle="Preferred arrival days" />
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={analytics.behavioral.dayOfWeekPreferences}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fontSize: 10 }} />
                      <Radar name="Preference" dataKey="preferenceScore" stroke="#11b6e9" fill="#11b6e9" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Seasonality Fingerprint" subtitle="Seasonal booking patterns" />
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.behavioral.seasonalityFingerprint}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="guestActivity" name="Activity" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="Lead Time Behavior" subtitle="Booking timing patterns" />
                <div className="space-y-3">
                  {analytics.behavioral.leadTimeBehavior.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-40 text-sm truncate">{item.type}</div>
                      <div className="flex-1">
                        <Progress value={item.guestCount / analytics.summary.totalGuests * 100} className="h-2" />
                      </div>
                      <div className="w-20 text-right text-sm">{item.guestCount}</div>
                      <div className="w-24 text-right text-sm text-muted-foreground">{item.avgLeadTime} days</div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Length of Stay Patterns" subtitle="Stay duration preferences" />
                <div className="space-y-3">
                  {analytics.behavioral.lengthOfStayPatterns.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-32 text-sm">{item.pattern}</div>
                      <div className="flex-1">
                        <Progress value={item.guestCount / analytics.summary.totalGuests * 100} className="h-2" />
                      </div>
                      <div className="w-20 text-right text-sm">{item.guestCount}</div>
                      <div className="w-24 text-right text-sm text-green-500">{formatCurrency(item.revenueImpact)}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="Cancellation Risk Scores" subtitle="Guest cancellation probability" />
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.risk.cancellationRiskScores} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="riskLevel" type="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="No-Show Probability" subtitle="Likelihood of no-shows" />
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie 
                        data={analytics.risk.noShowProbability} 
                        dataKey="count" 
                        nameKey="riskLevel" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={80}
                        label={({ riskLevel, percent }) => `${riskLevel} (${(percent * 100).toFixed(0)}%)`}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="Modification Frequency" subtitle="Booking change patterns" />
                <div className="space-y-4">
                  {analytics.risk.modificationFrequency.map((item: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{item.frequency}</span>
                        <span className="text-sm font-medium">{item.percent}%</span>
                      </div>
                      <Progress value={item.percent} className="h-2" />
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Payment Reliability" subtitle="Guest payment patterns" />
                <div className="space-y-4">
                  {analytics.risk.paymentReliability.map((item: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm flex items-center gap-2">
                          {item.score === 'Excellent' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {item.score === 'Good' && <CheckCircle className="h-4 w-4 text-blue-500" />}
                          {item.score === 'Fair' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                          {item.score === 'Poor' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {item.score}
                        </span>
                        <span className="text-sm font-medium">{item.count} guests ({item.percent}%)</span>
                      </div>
                      <Progress 
                        value={item.percent} 
                        className={`h-2 ${item.score === 'Excellent' ? '[&>div]:bg-green-500' : item.score === 'Good' ? '[&>div]:bg-blue-500' : item.score === 'Fair' ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`} 
                      />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="Guest Tenure Distribution" subtitle="How long guests have been with us" />
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.engagement.tenureDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="tenureBucket" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Churn Risk Indicators" subtitle="Guest retention risk levels" />
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie 
                        data={analytics.engagement.churnRiskIndicators} 
                        dataKey="count" 
                        nameKey="risk" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={40}
                        outerRadius={80}
                        label={({ risk, percent }) => `${risk} (${(percent * 100).toFixed(0)}%)`}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#7f1d1d" />
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <SectionHeader title="Win-Back Candidates" subtitle="High-value guests to re-engage" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-3 font-medium">Guest</th>
                      <th className="text-left py-3 font-medium">Last Visit</th>
                      <th className="text-right py-3 font-medium">Days Since</th>
                      <th className="text-right py-3 font-medium">Potential Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.engagement.winBackCandidates.slice(0, 10).map((guest: any, i: number) => (
                      <tr key={i} className="border-b border-muted/50 hover:bg-muted/20">
                        <td className="py-3 font-medium">{guest.name}</td>
                        <td className="py-3">{guest.lastVisit || '-'}</td>
                        <td className="text-right py-3">
                          <Badge variant="outline" className="text-amber-600">{guest.daysSinceVisit} days</Badge>
                        </td>
                        <td className="text-right py-3 text-green-600 font-medium">{formatCurrency(guest.potentialValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionHeader title="Ambassador Scores" subtitle="Guest advocacy potential" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics.engagement.ambassadorScores.map((item: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className={`h-5 w-5 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{item.scoreRange}</span>
                    </div>
                    <div className="text-2xl font-bold">{item.count}</div>
                    <p className="text-xs text-muted-foreground mt-1">{item.characteristics}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="predictive" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <SectionHeader title="Next Visit Prediction" subtitle="When guests are likely to return" />
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.predictive.nextVisitPrediction}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="likelihood" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#11b6e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Upsell Propensity" subtitle="Guests open to upgrades" />
                <div className="space-y-4 mt-4">
                  {analytics.predictive.upsellPropensityScores.map((item: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{item.score}</span>
                        <Badge>{item.count} guests</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.recommendedAction}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader title="Retention Probability" subtitle="Guest retention forecast" />
                <div className="space-y-4 mt-4">
                  {analytics.predictive.retentionProbability.map((item: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{item.probability}</span>
                        <span className="text-sm">{item.count} guests</span>
                      </div>
                      <Progress 
                        value={item.count / analytics.summary.totalGuests * 100} 
                        className={`h-3 ${i === 0 ? '[&>div]:bg-green-500' : i === 1 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`} 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Avg value: {formatCurrency(item.avgValue)}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <SectionHeader title="Geographic Distribution" subtitle="Guest origin analysis" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.geographic.originMapping.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="revenue" fill="#4B77A9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Domestic</span>
                      </div>
                      <div className="text-2xl font-bold">{analytics.geographic.domesticVsInternational.domestic}</div>
                      <p className="text-xs text-muted-foreground">{formatCurrency(analytics.geographic.domesticVsInternational.domesticRevenue)} revenue</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-5 w-5 text-green-500" />
                        <span className="font-medium">International</span>
                      </div>
                      <div className="text-2xl font-bold">{analytics.geographic.domesticVsInternational.international}</div>
                      <p className="text-xs text-muted-foreground">{formatCurrency(analytics.geographic.domesticVsInternational.internationalRevenue)} revenue</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Corporate</span>
                      </div>
                      <div className="text-2xl font-bold">{analytics.geographic.corporateVsLeisure.corporate}</div>
                      <p className="text-xs text-muted-foreground">{formatCurrency(analytics.geographic.corporateVsLeisure.corporateRevenue)} revenue</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-amber-500" />
                        <span className="font-medium">Leisure</span>
                      </div>
                      <div className="text-2xl font-bold">{analytics.geographic.corporateVsLeisure.leisure}</div>
                      <p className="text-xs text-muted-foreground">{formatCurrency(analytics.geographic.corporateVsLeisure.leisureRevenue)} revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      ) : null}
    </Layout>
  );
}
