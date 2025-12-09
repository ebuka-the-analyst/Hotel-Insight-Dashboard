import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { ChartWidget } from "@/components/dashboard/ChartWidget";
import { Button } from "@/components/ui/button";
import { Download, Share2, Filter, Calendar } from "lucide-react";

// Mock Heatmap Component
const Heatmap = () => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex">
          <div className="w-12"></div>
          {hours.filter(h => h % 2 === 0).map(h => (
            <div key={h} className="flex-1 text-xs text-muted-foreground text-center">{h}:00</div>
          ))}
        </div>
        {days.map(day => (
          <div key={day} className="flex items-center mt-1">
            <div className="w-12 text-xs font-medium text-muted-foreground">{day}</div>
            <div className="flex-1 flex gap-1">
              {hours.map(h => {
                // Generate semi-random intensity based on typical hotel patterns
                // Peak hours: 8-10am (breakfast/checkout), 6-9pm (dinner)
                // Busy days: Fri, Sat
                const isWeekend = day === "Fri" || day === "Sat";
                const isPeak = (h >= 8 && h <= 10) || (h >= 18 && h <= 21);
                let intensity = Math.random() * 0.3;
                if (isWeekend) intensity += 0.2;
                if (isPeak) intensity += 0.4;
                
                return (
                  <div 
                    key={h} 
                    className="h-8 flex-1 rounded-sm transition-all hover:scale-110 hover:z-10 cursor-pointer relative group"
                    style={{ 
                      backgroundColor: `rgba(255, 165, 54, ${Math.min(intensity, 1)})` // Primary Orange
                    }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black/80 text-white text-xs p-2 rounded whitespace-nowrap z-20">
                      {day} {h}:00 - {(intensity * 100).toFixed(0)}% Occupancy
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Analysis() {
  const MOCK_DATA = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    revenue: Math.floor(Math.random() * 5000) + 3000,
    occupancy: Math.floor(Math.random() * 30) + 60,
  }));

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Deep Analysis</h1>
          <p className="text-muted-foreground">Detailed breakdown of operational metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Calendar className="h-4 w-4 mr-2" /> Dec 2024</Button>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
          <Button variant="outline" size="sm"><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button size="sm" className="bg-primary text-white hover:bg-primary/90"><Download className="h-4 w-4 mr-2" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartWidget 
            title="Revenue vs Occupancy Correlation" 
            data={MOCK_DATA} 
            dataKey="revenue" 
            category="date"
            color="#11b6e9" 
            className="h-[400px]"
          />
          
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif font-semibold text-lg">Occupancy Heatmap</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Low</span>
                <div className="w-20 h-2 bg-gradient-to-r from-transparent to-primary rounded-full" />
                <span className="text-xs text-muted-foreground">High</span>
              </div>
            </div>
            <Heatmap />
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <h3 className="font-serif font-semibold mb-4">Key Findings</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Saturday Dinner Service</span> is consistently understaffed between 19:00 - 20:30, leading to a 15% drop in guest satisfaction scores.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Deluxe Suites</span> have seen a 22% increase in RevPAR since the new pricing strategy was implemented.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Booking Lead Time</span> has decreased from 14 days to 9 days. Consider launching last-minute offers earlier.</p>
              </li>
            </ul>
          </GlassCard>

          <GlassCard>
            <h3 className="font-serif font-semibold mb-4">Guest Demographics</h3>
            <div className="space-y-4">
              {[
                { label: "Business Travelers", val: 45, color: "bg-blue-500" },
                { label: "Leisure Couples", val: 30, color: "bg-purple-500" },
                { label: "Families", val: 15, color: "bg-green-500" },
                { label: "Groups", val: 10, color: "bg-orange-500" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.val}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
