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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_OCCUPANCY_DATA = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 72 },
  { day: "Wed", value: 78 },
  { day: "Thu", value: 85 },
  { day: "Fri", value: 92 },
  { day: "Sat", value: 95 },
  { day: "Sun", value: 88 },
];

const MOCK_REVENUE_DATA = [
  { day: "Mon", value: 4500 },
  { day: "Tue", value: 5200 },
  { day: "Wed", value: 5800 },
  { day: "Thu", value: 7500 },
  { day: "Fri", value: 9200 },
  { day: "Sat", value: 9800 },
  { day: "Sun", value: 8500 },
];

export default function Dashboard() {
  return (
    <Layout>
      {/* Welcome Section with AI Insight */}
      <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
            Good Morning, Alex
          </h1>
          <p className="text-muted-foreground">
            Here's your executive summary for <span className="font-semibold text-foreground">The Grand Hotel</span>.
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
              Occupancy is trending <span className="text-[hsl(var(--chart-4))] font-semibold">up 12%</span> this weekend due to the local jazz festival. I recommend increasing ADR by £15 for remaining suites.
            </p>
            <Button variant="link" className="p-0 h-auto text-primary text-xs mt-2 hover:text-primary/80">
              Apply Recommendation <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Occupancy Rate" 
          value="84.2%" 
          change={5.4} 
          icon={<BedDouble className="h-6 w-6 text-primary" />}
          subtext="vs last week"
        />
        <KPICard 
          title="RevPAR" 
          value="£128.50" 
          change={12.1} 
          icon={<TrendingUp className="h-6 w-6 text-secondary" />}
          subtext="Revenue per available room"
        />
        <KPICard 
          title="ADR" 
          value="£152.00" 
          change={-2.3} 
          icon={<CreditCard className="h-6 w-6 text-[hsl(var(--chart-4))]" />}
          subtext="Average Daily Rate"
        />
        <KPICard 
          title="Guest Score" 
          value="9.2" 
          change={0.4} 
          icon={<Star className="h-6 w-6 text-[hsl(var(--chart-5))]" />}
          subtext="Based on 42 reviews"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget 
          title="Occupancy Trends" 
          data={MOCK_OCCUPANCY_DATA} 
          dataKey="value" 
          category="day"
          color="hsl(var(--primary))" // Primary Blue
        />
        <ChartWidget 
          title="Total Revenue (7 Days)" 
          data={MOCK_REVENUE_DATA} 
          dataKey="value" 
          category="day"
          color="hsl(var(--secondary))" // Piper Orange
        />
      </div>

      {/* Recent Activity / Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif font-semibold text-lg">AI Generated Insights</h3>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          
          <div className="space-y-4">
            {[
              { agent: "Sterling", title: "Cost Saving Opportunity", text: "Housekeeping supplies usage is 15% above average. Check inventory logs for the 3rd floor.", time: "2h ago" },
              { agent: "Atlas", title: "Corporate Booking Spike", text: "Detected a pattern of bookings from 'TechCorp Inc'. Suggest offering a corporate rate package.", time: "5h ago" },
              { agent: "Sage", title: "Compliance Alert", text: "Fire safety certification is due for renewal in 14 days. Scheduled a reminder.", time: "1d ago" },
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
            <Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/90 border-none shadow-lg">
              Upload Data
            </Button>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
