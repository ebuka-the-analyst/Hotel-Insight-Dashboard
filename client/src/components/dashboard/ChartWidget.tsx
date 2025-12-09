import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ChartWidgetProps {
  title: string;
  data: any[];
  dataKey: string;
  category: string;
  color?: string;
  className?: string;
}

export function ChartWidget({ title, data, dataKey, category, color = "#ffa536", className }: ChartWidgetProps) {
  return (
    <GlassCard className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif font-semibold text-lg">{title}</h3>
        <select className="bg-transparent text-sm border-none outline-none text-muted-foreground cursor-pointer hover:text-foreground">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>This Year</option>
        </select>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey={category} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              itemStyle={{ color: '#171717', fontWeight: 600 }}
              labelStyle={{ color: '#737373' }}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={3}
              fill={`url(#gradient-${dataKey})`} 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
