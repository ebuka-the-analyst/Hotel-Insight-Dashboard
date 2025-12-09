import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  AlertTriangle,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Globe,
  Clock,
  Building,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getComprehensiveAnalytics } from "@/lib/api-client";
import { useLocation } from "wouter";
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
  Area,
  AreaChart,
} from "recharts";

const COLORS = ['#4B77A9', '#bf5b20', '#11b6e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

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
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            <Icon className={`h-5 w-5 text-${color}`} />
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

function HealthScoreRing({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 transform -rotate-90">
          <circle cx="56" cy="56" r="45" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/20" />
          <circle cx="56" cy="56" r="45" stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" 
            style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

export default function Analysis() {
  const [_, setLocation] = useLocation();
  
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["comprehensive-analytics"],
    queryFn: () => getComprehensiveAnalytics(),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading comprehensive analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !analytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <GlassCard className="p-8 max-w-md text-center">
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-6">
              Upload your hotel booking data to unlock comprehensive analytics with 70+ metrics.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => setLocation("/upload")}
              data-testid="button-upload-analytics"
            >
              Upload Data
            </Button>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  const { coreKPIs, revenueAnalytics, bookingAnalytics, guestAnalytics, guestPerformanceAnalytics, cancellationAnalytics, 
          operationalAnalytics, forecastingAnalytics, channelAnalytics, seasonalityAnalytics, performanceIndicators } = analytics;

  const formatCurrency = (val: number) => `£${val.toLocaleString()}`;
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  const channelRevenueData = Object.entries(revenueAnalytics.revenueByChannel).map(([name, value]) => ({ name, value }));
  const monthlyRevenueData = Object.entries(revenueAnalytics.revenueByMonth).map(([month, revenue]) => ({ month, revenue }));
  const bookingsByMonthData = Object.entries(bookingAnalytics.bookingsByMonth).map(([month, count]) => ({ month, count }));
  const dayOfWeekData = Object.entries(bookingAnalytics.bookingsByDayOfWeek).map(([day, count]) => ({ day, count }));
  const leadTimeData = bookingAnalytics.leadTimeDistribution;
  const countryData = guestAnalytics.topSourceCountries.slice(0, 8);
  const cancellationByLeadTime = cancellationAnalytics.cancellationRateByLeadTime;
  const roomTypeData = Object.entries(operationalAnalytics.roomTypeUtilization).map(([type, count]) => ({ type, count }));
  const channelMixData = channelAnalytics.channelMix;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold" data-testid="text-analysis-title">Comprehensive Analytics</h1>
          <p className="text-muted-foreground">70+ metrics for PhD-level hotel performance analysis</p>
        </div>
        <Button size="sm" className="bg-primary text-white hover:bg-primary/90" data-testid="button-export">
          <Download className="h-4 w-4 mr-2" /> Export Report
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
          <TabsTrigger value="guests" data-testid="tab-guests">Guests</TabsTrigger>
          <TabsTrigger value="guest-performance" data-testid="tab-guest-performance">Guest Performance</TabsTrigger>
          <TabsTrigger value="cancellations" data-testid="tab-cancellations">Cancellations</TabsTrigger>
          <TabsTrigger value="operations" data-testid="tab-operations">Operations</TabsTrigger>
          <TabsTrigger value="forecasting" data-testid="tab-forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <GlassCard className="lg:col-span-1 flex flex-col items-center justify-center p-6">
              <HealthScoreRing score={performanceIndicators.overallHealthScore} label="Health Score" />
              <div className="mt-4 text-center">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  performanceIndicators.competitivePositionEstimate === 'leader' ? 'bg-green-500/20 text-green-600' :
                  performanceIndicators.competitivePositionEstimate === 'challenger' ? 'bg-amber-500/20 text-amber-600' :
                  'bg-red-500/20 text-red-600'
                }`}>
                  {performanceIndicators.competitivePositionEstimate.charAt(0).toUpperCase() + performanceIndicators.competitivePositionEstimate.slice(1)}
                </span>
              </div>
            </GlassCard>
            
            <GlassCard className="lg:col-span-3 p-6">
              <SectionHeader title="Performance Indicators" subtitle="Key health metrics at a glance" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{performanceIndicators.revenuePerformanceIndex}</div>
                  <div className="text-xs text-muted-foreground">Revenue Index</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{performanceIndicators.operationalEfficiencyScore}%</div>
                  <div className="text-xs text-muted-foreground">Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{performanceIndicators.channelOptimizationScore}</div>
                  <div className="text-xs text-muted-foreground">Channel Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{performanceIndicators.pricingEffectivenessScore}</div>
                  <div className="text-xs text-muted-foreground">Pricing Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-500">{performanceIndicators.demandCaptureRate}%</div>
                  <div className="text-xs text-muted-foreground">Demand Capture</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-500">{performanceIndicators.guestSatisfactionProxy}</div>
                  <div className="text-xs text-muted-foreground">Guest Proxy</div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <MetricCard title="Total Revenue" value={formatCurrency(coreKPIs.totalRevenue)} icon={DollarSign} />
            <MetricCard title="Total Bookings" value={coreKPIs.totalBookings} subtitle={`${coreKPIs.confirmedBookings} confirmed`} icon={Calendar} />
            <MetricCard title="ADR" value={formatCurrency(coreKPIs.averageDailyRate)} subtitle="Avg Daily Rate" icon={TrendingUp} />
            <MetricCard title="RevPAR" value={formatCurrency(coreKPIs.revPAR)} subtitle="Revenue per room" icon={BarChart3} />
            <MetricCard title="Occupancy" value={formatPercent(coreKPIs.occupancyRate)} icon={Building} />
            <MetricCard title="Cancellation Rate" value={formatPercent(coreKPIs.cancellationRate)} icon={XCircle} />
            <MetricCard title="Repeat Guests" value={formatPercent(coreKPIs.repeatGuestRate)} icon={Users} />
            <MetricCard title="Avg Lead Time" value={`${coreKPIs.averageLeadTime} days`} icon={Clock} />
            <MetricCard title="Avg Stay" value={`${coreKPIs.averageLengthOfStay} nights`} icon={Calendar} />
            <MetricCard title="Room Nights" value={coreKPIs.totalRoomNights.toLocaleString()} icon={Building} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="p-6">
              <SectionHeader title="Key Strengths" />
              <div className="space-y-2">
                {performanceIndicators.keyStrengths.map((strength, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </div>
                ))}
                {performanceIndicators.keyStrengths.length === 0 && (
                  <p className="text-sm text-muted-foreground">Upload more data to identify strengths</p>
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionHeader title="Areas for Improvement" />
              <div className="space-y-2">
                {performanceIndicators.areasForImprovement.map((area, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{area}</span>
                  </div>
                ))}
                {performanceIndicators.areasForImprovement.length === 0 && (
                  <p className="text-sm text-muted-foreground">No major issues detected</p>
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionHeader title="Actionable Insights" />
              <div className="space-y-2">
                {performanceIndicators.actionableInsights.slice(0, 4).map((insight, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Gross Revenue" value={formatCurrency(coreKPIs.totalRevenue)} icon={DollarSign} />
            <MetricCard title="Net Revenue" value={formatCurrency(revenueAnalytics.netRevenueAfterCommissions)} subtitle="After commissions" icon={DollarSign} />
            <MetricCard title="Commissions Paid" value={formatCurrency(revenueAnalytics.commissionsPaid)} icon={Percent} />
            <MetricCard title="Revenue per Guest" value={formatCurrency(revenueAnalytics.revenuePerGuest)} icon={Users} />
            <MetricCard title="Avg Daily Revenue" value={formatCurrency(revenueAnalytics.averageDailyRevenue)} icon={TrendingUp} />
            <MetricCard title="Revenue/Booking" value={formatCurrency(coreKPIs.revenuePerBooking)} icon={BarChart3} />
            <MetricCard title="Best Day" value={revenueAnalytics.highestRevenueDay.date} subtitle={formatCurrency(revenueAnalytics.highestRevenueDay.amount)} icon={TrendingUp} />
            <MetricCard title="Lowest Day" value={revenueAnalytics.lowestRevenueDay.date} subtitle={formatCurrency(revenueAnalytics.lowestRevenueDay.amount)} icon={TrendingDown} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <SectionHeader title="Revenue by Channel" subtitle="Distribution across booking sources" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={channelRevenueData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {channelRevenueData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionHeader title="Monthly Revenue Trend" subtitle="Revenue over time" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="revenue" stroke="#4B77A9" fill="#4B77A9" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <SectionHeader title="Channel Cost Analysis" subtitle="Commission impact by channel" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="text-left py-3 font-medium">Channel</th>
                    <th className="text-right py-3 font-medium">Gross Revenue</th>
                    <th className="text-right py-3 font-medium">Commission</th>
                    <th className="text-right py-3 font-medium">Net Revenue</th>
                    <th className="text-right py-3 font-medium">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {channelAnalytics.channelCostAnalysis.map((channel, i) => (
                    <tr key={i} className="border-b border-muted/50">
                      <td className="py-3">{channel.channel}</td>
                      <td className="text-right py-3">{formatCurrency(channel.grossRevenue)}</td>
                      <td className="text-right py-3 text-red-500">{formatCurrency(channel.commission)}</td>
                      <td className="text-right py-3 text-green-500">{formatCurrency(channel.netRevenue)}</td>
                      <td className="text-right py-3">{channel.grossRevenue > 0 ? ((channel.netRevenue / channel.grossRevenue) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Total Bookings" value={coreKPIs.totalBookings} icon={Calendar} />
            <MetricCard title="Confirmed" value={coreKPIs.confirmedBookings} icon={CheckCircle} />
            <MetricCard title="Cancelled" value={coreKPIs.cancelledBookings} icon={XCircle} />
            <MetricCard title="Booking Velocity" value={`${bookingAnalytics.bookingVelocity}/day`} icon={Zap} />
            <MetricCard title="Last Minute" value={formatPercent(bookingAnalytics.lastMinuteBookingsPercent)} subtitle="Within 3 days" icon={Clock} />
            <MetricCard title="Advance Bookings" value={formatPercent(bookingAnalytics.advanceBookingsPercent)} subtitle="30+ days ahead" icon={Calendar} />
            <MetricCard title="Peak Month" value={bookingAnalytics.peakBookingMonth} icon={TrendingUp} />
            <MetricCard title="Slowest Month" value={bookingAnalytics.slowestBookingMonth} icon={TrendingDown} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <SectionHeader title="Bookings by Month" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingsByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#bf5b20" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionHeader title="Bookings by Day of Week" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4B77A9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <SectionHeader title="Lead Time Distribution" subtitle="How far in advance guests book" />
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadTimeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="range" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(value: number, name) => name === 'count' ? value : `${value}%`} />
                  <Bar dataKey="count" fill="#11b6e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="guests" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Guests Served" value={coreKPIs.guestsServed.toLocaleString()} icon={Users} />
            <MetricCard title="Repeat Guests" value={guestAnalytics.repeatGuestCount} icon={Users} />
            <MetricCard title="New Guests" value={guestAnalytics.newGuestCount} icon={Users} />
            <MetricCard title="Avg Party Size" value={coreKPIs.averagePartySize.toFixed(1)} icon={Users} />
            <MetricCard title="Loyalty Score" value={guestAnalytics.guestLoyaltyScore.toFixed(0)} icon={Target} />
            <MetricCard title="Avg Guest Value" value={formatCurrency(guestAnalytics.averageGuestValue)} icon={DollarSign} />
            <MetricCard title="High Value Guests" value={guestAnalytics.highValueGuestCount} icon={TrendingUp} />
            <MetricCard title="Diversity Index" value={guestAnalytics.guestDiversityIndex.toFixed(2)} icon={Globe} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <SectionHeader title="Top Source Countries" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionHeader title="Guest Segments" />
              <div className="space-y-4 mt-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Corporate vs Leisure</span>
                    <span className="font-medium">{guestAnalytics.corporateVsLeisureRatio.toFixed(1)}:1</span>
                  </div>
                  <Progress value={guestAnalytics.corporateVsLeisureRatio * 20} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Family Bookings</span>
                    <span className="font-medium">{formatPercent(guestAnalytics.familyBookingsPercent)}</span>
                  </div>
                  <Progress value={guestAnalytics.familyBookingsPercent} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Solo Travelers</span>
                    <span className="font-medium">{formatPercent(guestAnalytics.soloTravelersPercent)}</span>
                  </div>
                  <Progress value={guestAnalytics.soloTravelersPercent} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>New vs Returning</span>
                    <span className="font-medium">{guestAnalytics.newVsReturningRatio.toFixed(1)}:1</span>
                  </div>
                  <Progress value={Math.min(guestAnalytics.newVsReturningRatio * 20, 100)} className="h-2" />
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="guest-performance" className="space-y-6" data-testid="tabcontent-guest-performance">
          {guestPerformanceAnalytics && (
            <>
              {/* Loyalty & Retention Section */}
              <div>
                <SectionHeader title="Guest Loyalty & Retention" subtitle="7 metrics analyzing guest loyalty and churn risk" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <MetricCard 
                    title="Repeat Guest Revenue" 
                    value={formatCurrency(guestPerformanceAnalytics.loyaltyMetrics.repeatGuestRevenueContribution)} 
                    subtitle={`${guestPerformanceAnalytics.loyaltyMetrics.repeatGuestRevenuePercent}% of total`}
                    icon={DollarSign} 
                  />
                  <MetricCard 
                    title="Estimated CLV" 
                    value={formatCurrency(guestPerformanceAnalytics.loyaltyMetrics.estimatedCLV)} 
                    subtitle="Customer lifetime value"
                    icon={Target} 
                  />
                  <MetricCard 
                    title="Avg Time Between Visits" 
                    value={`${guestPerformanceAnalytics.loyaltyMetrics.avgTimeBetweenVisits} days`} 
                    icon={Clock} 
                  />
                  <MetricCard 
                    title="Upsell Potential" 
                    value={`${guestPerformanceAnalytics.spendingMetrics.upsellPotentialScore}/100`} 
                    icon={TrendingUp} 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <GlassCard className="p-6">
                    <SectionHeader title="Loyalty Tier Distribution" />
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={guestPerformanceAnalytics.loyaltyMetrics.loyaltyTierDistribution}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="tier" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value: number, name) => name === 'avgSpend' ? formatCurrency(value) : value} />
                          <Legend />
                          <Bar dataKey="count" fill="#4B77A9" name="Guests" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      {guestPerformanceAnalytics.loyaltyMetrics.loyaltyTierDistribution.map(t => (
                        <div key={t.tier} className="flex justify-between py-1 border-b border-muted/20">
                          <span>{t.tier}</span>
                          <span>Avg Spend: {formatCurrency(t.avgSpend)}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <SectionHeader title="Churn Risk Distribution" />
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie 
                            data={guestPerformanceAnalytics.loyaltyMetrics.churnRiskDistribution} 
                            dataKey="count" 
                            nameKey="risk" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={90} 
                            label={({ risk, percent }) => `${risk} (${percent}%)`}
                          >
                            {guestPerformanceAnalytics.loyaltyMetrics.churnRiskDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={['#10b981', '#4B77A9', '#f59e0b', '#ef4444'][index % 4]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <SectionHeader title="Retention Cohorts" />
                    <div className="space-y-3 mt-4">
                      {guestPerformanceAnalytics.loyaltyMetrics.retentionCohorts.map((cohort, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{cohort.cohort}</span>
                            <span className={`font-medium ${cohort.retentionRate >= 50 ? 'text-green-500' : cohort.retentionRate >= 25 ? 'text-amber-500' : 'text-red-500'}`}>
                              {cohort.retentionRate}% retained
                            </span>
                          </div>
                          <Progress value={cohort.retentionRate} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{cohort.retained} retained</span>
                            <span>{cohort.churned} churned</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </div>

              {/* Guest Segmentation Section */}
              <div>
                <SectionHeader title="Guest Segmentation" subtitle="6 metrics for understanding guest composition" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <MetricCard 
                    title="Geographic Concentration" 
                    value={guestPerformanceAnalytics.segmentationMetrics.geographicConcentrationIndex.toFixed(2)} 
                    subtitle="Diversity index (0-1)"
                    icon={Globe} 
                  />
                  <MetricCard 
                    title="Domestic Guests" 
                    value={`${guestPerformanceAnalytics.segmentationMetrics.domesticVsInternationalMix.domesticPercent}%`} 
                    subtitle={`${guestPerformanceAnalytics.segmentationMetrics.domesticVsInternationalMix.domestic} bookings`}
                    icon={Building} 
                  />
                  <MetricCard 
                    title="Corporate Revenue" 
                    value={`${guestPerformanceAnalytics.segmentationMetrics.corporateVsLeisureRevenue.corporatePercent}%`} 
                    subtitle={formatCurrency(guestPerformanceAnalytics.segmentationMetrics.corporateVsLeisureRevenue.corporate)}
                    icon={Building} 
                  />
                  <MetricCard 
                    title="High Value Guests" 
                    value={guestPerformanceAnalytics.segmentationMetrics.highValueGuestAnalysis.count} 
                    subtitle={`${guestPerformanceAnalytics.segmentationMetrics.highValueGuestAnalysis.percent}% of guests`}
                    icon={TrendingUp} 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassCard className="p-6">
                    <SectionHeader title="Guest Type Distribution" />
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie 
                            data={guestPerformanceAnalytics.segmentationMetrics.guestTypeDistribution} 
                            dataKey="count" 
                            nameKey="type" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={100} 
                            label={({ type, percent }) => `${type} (${percent}%)`}
                          >
                            {guestPerformanceAnalytics.segmentationMetrics.guestTypeDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name, props) => [value, props.payload?.type]} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {guestPerformanceAnalytics.segmentationMetrics.guestTypeDistribution.map(t => (
                        <div key={t.type} className="flex justify-between py-1 border-b border-muted/20">
                          <span>{t.type}</span>
                          <span>Avg Revenue: {formatCurrency(t.avgRevenue)}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <SectionHeader title="Market Segment Matrix" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-muted">
                            <th className="text-left py-2 font-medium">Segment</th>
                            <th className="text-right py-2 font-medium">Bookings</th>
                            <th className="text-right py-2 font-medium">Revenue</th>
                            <th className="text-right py-2 font-medium">Avg ADR</th>
                            <th className="text-right py-2 font-medium">Cancel %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {guestPerformanceAnalytics.segmentationMetrics.marketSegmentMatrix.slice(0, 6).map((seg, i) => (
                            <tr key={i} className="border-b border-muted/50">
                              <td className="py-2">{seg.segment}</td>
                              <td className="text-right py-2">{seg.bookings}</td>
                              <td className="text-right py-2">{formatCurrency(seg.revenue)}</td>
                              <td className="text-right py-2">{formatCurrency(seg.avgADR)}</td>
                              <td className={`text-right py-2 ${seg.cancellationRate > 20 ? 'text-red-500' : seg.cancellationRate > 10 ? 'text-amber-500' : 'text-green-500'}`}>
                                {seg.cancellationRate}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                </div>
              </div>

              {/* Spending Behavior Section */}
              <div>
                <SectionHeader title="Guest Spending Behavior" subtitle="6 metrics analyzing spending patterns" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <MetricCard title="Revenue per Guest" value={formatCurrency(guestPerformanceAnalytics.spendingMetrics.revenuePerGuest)} icon={DollarSign} />
                  <MetricCard title="25th Percentile" value={formatCurrency(guestPerformanceAnalytics.spendingMetrics.spendDistributionPercentiles.p25)} subtitle="Low spenders" icon={TrendingDown} />
                  <MetricCard title="Median Spend" value={formatCurrency(guestPerformanceAnalytics.spendingMetrics.spendDistributionPercentiles.p50)} subtitle="50th percentile" icon={BarChart3} />
                  <MetricCard title="75th Percentile" value={formatCurrency(guestPerformanceAnalytics.spendingMetrics.spendDistributionPercentiles.p75)} subtitle="High spenders" icon={TrendingUp} />
                  <MetricCard title="Top 1% Spend" value={formatCurrency(guestPerformanceAnalytics.spendingMetrics.spendDistributionPercentiles.p99)} subtitle="99th percentile" icon={Target} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassCard className="p-6">
                    <SectionHeader title="ADR by Guest Type" />
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={guestPerformanceAnalytics.spendingMetrics.adrByGuestType} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
                          <YAxis dataKey="type" type="category" tick={{ fontSize: 12 }} width={70} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="adr" fill="#bf5b20" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <SectionHeader title="Length of Stay Impact on Spend" />
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={guestPerformanceAnalytics.spendingMetrics.losImpactOnSpend}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="losRange" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={70} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
                          <Tooltip formatter={(value: number, name) => name === 'avgSpend' ? formatCurrency(value) : value} />
                          <Bar dataKey="avgSpend" fill="#10b981" name="Avg Spend" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </div>

                <GlassCard className="p-6">
                  <SectionHeader title="Price Sensitivity by Segment" subtitle="Coefficient of variation in ADR" />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-muted">
                          <th className="text-left py-2 font-medium">Segment</th>
                          <th className="text-right py-2 font-medium">Sensitivity</th>
                          <th className="text-right py-2 font-medium">Avg ADR</th>
                          <th className="text-right py-2 font-medium">Variance</th>
                          <th className="text-left py-2 font-medium pl-4">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guestPerformanceAnalytics.spendingMetrics.priceSensitivityBySegment.map((seg, i) => (
                          <tr key={i} className="border-b border-muted/50">
                            <td className="py-2">{seg.segment}</td>
                            <td className="text-right py-2">{seg.sensitivity}%</td>
                            <td className="text-right py-2">{formatCurrency(seg.avgADR)}</td>
                            <td className="text-right py-2">{seg.variance.toLocaleString()}</td>
                            <td className={`py-2 pl-4 ${seg.sensitivity > 30 ? 'text-red-500' : seg.sensitivity > 15 ? 'text-amber-500' : 'text-green-500'}`}>
                              {seg.sensitivity > 30 ? 'High sensitivity' : seg.sensitivity > 15 ? 'Moderate' : 'Price stable'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>

              {/* Booking Patterns Section */}
              <div>
                <SectionHeader title="Guest Booking Patterns" subtitle="6 metrics on how guests book" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <MetricCard 
                    title="Weekend Ratio" 
                    value={`${guestPerformanceAnalytics.bookingPatterns.weekendVsWeekdayRatio.ratio.toFixed(2)}:1`} 
                    subtitle={`${guestPerformanceAnalytics.bookingPatterns.weekendVsWeekdayRatio.weekend} weekend`}
                    icon={Calendar} 
                  />
                  <MetricCard 
                    title="Advance Planning" 
                    value={`${guestPerformanceAnalytics.bookingPatterns.advancePlanningIndex}%`} 
                    subtitle="30+ days ahead"
                    icon={Clock} 
                  />
                  <MetricCard 
                    title="Last Minute" 
                    value={`${guestPerformanceAnalytics.bookingPatterns.lastMinutePropensity}%`} 
                    subtitle="Within 3 days"
                    icon={Zap} 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassCard className="p-6">
                    <SectionHeader title="Preferred Arrival Days" />
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={guestPerformanceAnalytics.bookingPatterns.preferredArrivalDays}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#11b6e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <SectionHeader title="Lead Time by Guest Type" subtitle="New vs Repeat guests" />
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={guestPerformanceAnalytics.bookingPatterns.leadTimeByGuestType}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="newGuest" fill="#4B77A9" name="New Guest" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="repeatGuest" fill="#10b981" name="Repeat Guest" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </div>

                <GlassCard className="p-6">
                  <SectionHeader title="Seasonal Guest Mix" subtitle="New vs returning guests by season" />
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={guestPerformanceAnalytics.bookingPatterns.seasonalGuestMix}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="newGuests" stackId="a" fill="#4B77A9" name="New Guests" />
                        <Bar dataKey="repeatGuests" stackId="a" fill="#10b981" name="Repeat Guests" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                    {guestPerformanceAnalytics.bookingPatterns.seasonalGuestMix.map(s => (
                      <div key={s.season} className="p-2 bg-muted/30 rounded-lg">
                        <div className="font-semibold">{s.season}</div>
                        <div className="text-xs text-muted-foreground">{s.repeatPercent}% repeat</div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Risk & Experience Section */}
              <div>
                <SectionHeader title="Guest Risk & Experience" subtitle="3 metrics on cancellation risk and satisfaction" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <MetricCard 
                    title="Satisfaction Proxy" 
                    value={`${guestPerformanceAnalytics.riskExperience.guestSatisfactionProxyScore}/100`} 
                    subtitle="Based on behavior"
                    icon={Target} 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GlassCard className="p-6">
                    <SectionHeader title="Cancellation Rate by Guest Type" />
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={guestPerformanceAnalytics.riskExperience.cancellationRateByGuestType}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                          <Tooltip formatter={(value: number) => `${value}%`} />
                          <Bar dataKey="rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {guestPerformanceAnalytics.riskExperience.cancellationRateByGuestType.map(t => (
                        <div key={t.type} className="flex justify-between py-1 border-b border-muted/20">
                          <span>{t.type}</span>
                          <span>{t.count} cancellations</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <SectionHeader title="Room Type Preferences" />
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={guestPerformanceAnalytics.riskExperience.roomTypePreferences.slice(0, 6)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis dataKey="roomType" type="category" tick={{ fontSize: 10 }} width={100} />
                          <Tooltip formatter={(value: number, name) => name === 'avgADR' ? formatCurrency(value) : value} />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {guestPerformanceAnalytics.riskExperience.roomTypePreferences.slice(0, 4).map(r => (
                        <div key={r.roomType} className="flex justify-between py-1 border-b border-muted/20">
                          <span>{r.roomType} ({r.percent}%)</span>
                          <span>ADR: {formatCurrency(r.avgADR)}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="cancellations" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Cancellation Rate" value={formatPercent(coreKPIs.cancellationRate)} icon={XCircle} />
            <MetricCard title="Revenue Lost" value={formatCurrency(cancellationAnalytics.revenueLostToCancellations)} icon={TrendingDown} />
            <MetricCard title="High Risk Bookings" value={cancellationAnalytics.highRiskBookingsCount} icon={AlertTriangle} />
            <MetricCard title="Low Risk Bookings" value={cancellationAnalytics.lowRiskBookingsCount} icon={CheckCircle} />
            <MetricCard title="Avg Cancel Lead Time" value={`${cancellationAnalytics.averageCancellationLeadTime.toFixed(0)} days`} icon={Clock} />
            <MetricCard title="Predicted Rate" value={formatPercent(cancellationAnalytics.predictedCancellationRate)} icon={Target} />
            <MetricCard title="Trend" value={cancellationAnalytics.cancellationTrend} icon={cancellationAnalytics.cancellationTrend === 'increasing' ? TrendingUp : TrendingDown} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <SectionHeader title="Cancellation Rate by Lead Time" subtitle="Longer lead times = higher risk?" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cancellationByLeadTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionHeader title="Cancellation by Channel" />
              <div className="space-y-3 mt-4">
                {Object.entries(cancellationAnalytics.cancellationRateByChannel).slice(0, 6).map(([channel, rate]) => (
                  <div key={channel}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{channel}</span>
                      <span className={`font-medium ${rate > 20 ? 'text-red-500' : rate > 10 ? 'text-amber-500' : 'text-green-500'}`}>
                        {rate}%
                      </span>
                    </div>
                    <Progress value={rate} className="h-2" />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Peak Check-in Day" value={operationalAnalytics.peakCheckInDay} icon={Calendar} />
            <MetricCard title="Peak Check-out Day" value={operationalAnalytics.peakCheckOutDay} icon={Calendar} />
            <MetricCard title="Busiest Month" value={operationalAnalytics.busiestMonth} icon={TrendingUp} />
            <MetricCard title="Quietest Month" value={operationalAnalytics.quietestMonth} icon={TrendingDown} />
            <MetricCard title="Avg Turnover Rate" value={formatPercent(operationalAnalytics.averageTurnoverRate)} icon={Zap} />
            <MetricCard 
              title="Staffing Need" 
              value={operationalAnalytics.staffingRecommendation.charAt(0).toUpperCase() + operationalAnalytics.staffingRecommendation.slice(1)} 
              icon={Users} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <SectionHeader title="Check-ins by Day of Week" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(operationalAnalytics.checkInsByDayOfWeek).map(([day, count]) => ({ day, count }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionHeader title="Room Type Utilization" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={roomTypeData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={({ type, percent }) => `${type} (${(percent * 100).toFixed(0)}%)`}>
                      {roomTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Projected Revenue" value={formatCurrency(forecastingAnalytics.projectedMonthlyRevenue)} subtitle="Next month" icon={DollarSign} />
            <MetricCard title="Projected Occupancy" value={formatPercent(forecastingAnalytics.projectedOccupancy)} icon={Building} />
            <MetricCard title="Demand Trend" value={forecastingAnalytics.demandTrend.charAt(0).toUpperCase() + forecastingAnalytics.demandTrend.slice(1)} icon={forecastingAnalytics.demandTrend === 'growing' ? TrendingUp : TrendingDown} />
            <MetricCard title="Seasonality" value={`${forecastingAnalytics.seasonalityStrength}%`} subtitle="Strength" icon={Calendar} />
            <MetricCard title="Growth Potential" value={forecastingAnalytics.growthPotential.toUpperCase()} icon={Target} />
            <MetricCard title="Risk Level" value={forecastingAnalytics.riskLevel.toUpperCase()} icon={AlertTriangle} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <SectionHeader title="Next Month Forecast" />
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(forecastingAnalytics.nextMonthForecast.revenue)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Revenue</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">{forecastingAnalytics.nextMonthForecast.bookings}</div>
                  <div className="text-xs text-muted-foreground mt-1">Bookings</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">{formatPercent(forecastingAnalytics.nextMonthForecast.occupancy)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Occupancy</div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionHeader title="Year End Projection" />
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-primary">{formatCurrency(forecastingAnalytics.yearEndProjection.revenue)}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Revenue</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-green-500">{forecastingAnalytics.yearEndProjection.bookings.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Bookings</div>
                </div>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <SectionHeader title="Seasonality Analysis" subtitle="Peak and trough periods" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Seasonal Peaks
                </h4>
                <div className="flex flex-wrap gap-2">
                  {seasonalityAnalytics.seasonalPeaks.map((month, i) => (
                    <span key={i} className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-sm">{month}</span>
                  ))}
                  {seasonalityAnalytics.seasonalPeaks.length === 0 && (
                    <span className="text-sm text-muted-foreground">No clear peaks identified</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" /> Seasonal Troughs
                </h4>
                <div className="flex flex-wrap gap-2">
                  {seasonalityAnalytics.seasonalTroughs.map((month, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-sm">{month}</span>
                  ))}
                  {seasonalityAnalytics.seasonalTroughs.length === 0 && (
                    <span className="text-sm text-muted-foreground">No clear troughs identified</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div className="text-xl font-bold">{seasonalityAnalytics.bestPerformingQuarter}</div>
                <div className="text-xs text-muted-foreground">Best Quarter</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div className="text-xl font-bold">{seasonalityAnalytics.worstPerformingQuarter}</div>
                <div className="text-xs text-muted-foreground">Weakest Quarter</div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
