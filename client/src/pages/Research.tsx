import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  ScatterChart, 
  Scatter, 
  ZAxis,
  Cell,
  Legend
} from "recharts";
import { generateRealisticData, CHANNEL_COSTS, CANCELLATION_RISK_MATRIX } from "@/lib/analytics-engine";
import { useState, useMemo } from "react";
import { AlertCircle, TrendingUp, DollarSign, Activity, Users, CalendarDays, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom Components for PhD Visuals
const RiskMatrix = () => {
  const leadTimes = ["0-3 Days", "3-7 Days", "7-30 Days", "30+ Days"];
  const channels = ["Direct", "OTA", "Corporate"];
  
  return (
    <div className="grid grid-cols-4 gap-1">
      <div className="col-span-1"></div>
      {channels.map(c => <div key={c} className="text-center text-xs font-semibold text-muted-foreground">{c}</div>)}
      
      {leadTimes.map((lt, rowIndex) => (
        <>
          <div className="text-xs font-medium text-muted-foreground flex items-center">{lt}</div>
          {channels.map((_, colIndex) => {
            const risk = CANCELLATION_RISK_MATRIX[rowIndex][colIndex];
            // Color scale from green (low risk) to red (high risk)
            let bgColor = "bg-green-500/20";
            if (risk > 10) bgColor = "bg-yellow-500/30";
            if (risk > 25) bgColor = "bg-red-500/40";
            
            return (
              <div key={colIndex} className={cn("h-12 rounded-md flex items-center justify-center text-xs font-bold transition-all hover:scale-105 cursor-help", bgColor)}>
                {risk}%
              </div>
            );
          })}
        </>
      ))}
    </div>
  );
};

export default function Research() {
  const [timeRange, setTimeRange] = useState("year");
  const data = useMemo(() => generateRealisticData(), []);

  // Aggregate Data for Charts
  const channelPerformance = [
    { name: 'Direct', revenue: 450000, cost: 450000 * CHANNEL_COSTS.Direct, net: 450000 * (1 - CHANNEL_COSTS.Direct) },
    { name: 'OTA', revenue: 850000, cost: 850000 * CHANNEL_COSTS.OTA, net: 850000 * (1 - CHANNEL_COSTS.OTA) },
    { name: 'Corporate', revenue: 320000, cost: 320000 * CHANNEL_COSTS.Corporate, net: 320000 * (1 - CHANNEL_COSTS.Corporate) },
  ];

  const demandCurveData = [
    { rate: 100, occupancy: 95 },
    { rate: 120, occupancy: 88 },
    { rate: 140, occupancy: 75 },
    { rate: 160, occupancy: 60 },
    { rate: 180, occupancy: 45 },
    { rate: 200, occupancy: 30 },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Research Intelligence</h1>
            <p className="text-muted-foreground">PhD-level analytics for strategic decision making.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setTimeRange("month")}>This Month</Button>
            <Button variant="default" size="sm" onClick={() => setTimeRange("year")}>Full Year Simulation</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="revenue" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <DollarSign className="h-4 w-4 mr-2" /> Revenue Optimization
          </TabsTrigger>
          <TabsTrigger value="risk" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Activity className="h-4 w-4 mr-2" /> Operational Risk
          </TabsTrigger>
          <TabsTrigger value="guests" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" /> Guest Lifecycle
          </TabsTrigger>
        </TabsList>

        {/* REVENUE TAB */}
        <TabsContent value="revenue" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className="font-serif font-semibold mb-2">Net Revenue Efficiency (NRE)</h3>
              <p className="text-xs text-muted-foreground mb-6">True profitability after distribution costs.</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelPerformance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `£${val/1000}k`} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="revenue" name="Gross Revenue" fill="#e5e5e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="net" name="Net Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-red-600">Critical Insight:</span> OTA commissions are eroding 18% of gross margin. Shift 5% of inventory to Direct to reclaim £42k annually.
                </p>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-serif font-semibold mb-2">Price Elasticity Demand Curve</h3>
              <p className="text-xs text-muted-foreground mb-6">Occupancy sensitivity to Average Daily Rate changes.</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis type="number" dataKey="rate" name="ADR" unit="£" />
                    <YAxis type="number" dataKey="occupancy" name="Occupancy" unit="%" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Demand" data={demandCurveData} fill="hsl(var(--secondary))" line shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* RISK TAB */}
        <TabsContent value="risk" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-1">
              <h3 className="font-serif font-semibold mb-4">Cancellation Risk Heatmap</h3>
              <p className="text-xs text-muted-foreground mb-6">Probability of cancellation by Lead Time & Channel.</p>
              <RiskMatrix />
              <div className="mt-6 text-xs text-muted-foreground">
                <span className="font-bold text-foreground">High Risk Zone:</span> OTA bookings made 7-30 days out have a 35% probability of churn.
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-2">
              <h3 className="font-serif font-semibold mb-2">Operational Strain Index</h3>
              <p className="text-xs text-muted-foreground mb-6">Daily load score based on Turnover + Occupancy + Cancellations.</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.slice(0, 30)}>
                    <defs>
                      <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" tickFormatter={(val) => val.split('-')[2]} axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="operationalLoad" stroke="#ef4444" fillOpacity={1} fill="url(#colorLoad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* GUESTS TAB */}
        <TabsContent value="guests" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className="font-serif font-semibold mb-4">Customer Lifetime Value (CLV) Proxy</h3>
              <div className="space-y-4">
                {[
                  { segment: "Business Elite", clv: "£12,400", trend: "+12%", color: "bg-blue-500" },
                  { segment: "Family Leisure", clv: "£4,200", trend: "+5%", color: "bg-green-500" },
                  { segment: "OTA One-Time", clv: "£340", trend: "-2%", color: "bg-gray-400" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-10 rounded-full", item.color)} />
                      <div>
                        <p className="font-medium text-sm">{item.segment}</p>
                        <p className="text-xs text-muted-foreground">Avg Retention: 2.4 years</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.clv}</p>
                      <p className="text-xs text-green-600">{item.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
            
            <GlassCard>
              <h3 className="font-serif font-semibold mb-4">Diversification Risk (HHI Index)</h3>
              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="text-5xl font-bold text-foreground mb-2">0.18</div>
                <div className="text-sm font-medium text-green-600 bg-green-500/10 px-3 py-1 rounded-full">Low Concentration Risk</div>
                <p className="text-center text-xs text-muted-foreground mt-4 max-w-[250px]">
                  Your guest mix is well diversified across 12 countries. No single market exceeds 20% share.
                </p>
              </div>
            </GlassCard>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
