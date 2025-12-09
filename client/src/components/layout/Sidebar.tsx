import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  PieChart, 
  Upload, 
  Users, 
  Settings, 
  Bot, 
  ChevronLeft,
  ChevronRight,
  Hexagon,
  Microscope
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import hyattLogo from "@assets/Hyatt_Place_logo.svg_1765276830551.png";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: PieChart, label: "Analysis", href: "/analysis" },
  { icon: Microscope, label: "Deep Dive (PhD)", href: "/research" },
  { icon: Bot, label: "AI Insights", href: "/agents" },
  { icon: Upload, label: "Data Source", href: "/upload" },
  { icon: Users, label: "Team", href: "/team" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col z-20 relative",
        collapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      <div className="h-24 flex items-center justify-center px-4 border-b border-sidebar-border/50 bg-white dark:bg-sidebar">
        <img 
          src={hyattLogo} 
          alt="Hyatt Place" 
          className={cn(
            "transition-all duration-300 object-contain",
            collapsed ? "w-10 h-10" : "w-40 h-16"
          )}
        />
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 group relative",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-primary" 
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                
                <span className={cn(
                  "ml-3 font-medium transition-all duration-300 overflow-hidden whitespace-nowrap",
                  collapsed ? "opacity-0 w-0 translate-x-10" : "opacity-100 w-auto translate-x-0"
                )}>
                  {item.label}
                </span>

                {isActive && !collapsed && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,165,54,0.6)]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/50">
        <div className={cn(
          "bg-gradient-brand rounded-xl p-4 text-white relative overflow-hidden transition-all duration-300",
          collapsed ? "opacity-0 h-0 p-0" : "opacity-100"
        )}>
          <div className="relative z-10">
            <h4 className="font-serif font-bold mb-1">Upgrade to Pro</h4>
            <p className="text-xs text-white/80 mb-3">Unlock AI predictions</p>
            <Button size="sm" variant="secondary" className="w-full bg-white text-primary hover:bg-white/90 border-none">
              View Plans
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl -mr-4 -mt-4" />
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="mt-4 w-full flex items-center justify-center hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
