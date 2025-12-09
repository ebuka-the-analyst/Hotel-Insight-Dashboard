import { GlassCard } from "@/components/ui/glass-card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  subtext?: string;
}

export function KPICard({ title, value, change, icon, subtext }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <GlassCard className="relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
        {icon}
      </div>
      
      <div className="flex flex-col gap-1 relative z-10">
        <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</span>
        <div className="flex items-baseline gap-2 mt-2">
          <h3 className="text-3xl font-serif font-semibold text-foreground">{value}</h3>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <div className={cn(
            "flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
            isPositive 
              ? "bg-green-500/10 text-green-600 dark:text-green-400" 
              : "bg-red-500/10 text-red-600 dark:text-red-400"
          )}>
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {Math.abs(change)}%
          </div>
          {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
        </div>
      </div>
      
      {/* Decorative gradient blob */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors" />
    </GlassCard>
  );
}
