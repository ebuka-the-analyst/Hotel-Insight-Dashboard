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
  Microscope,
  UserCheck,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import demoHotelLogo from "@assets/generated_images/demo_hotel_logo_design.png";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: PieChart, label: "Reports", href: "/analysis" },
  { icon: TrendingUp, label: "Revenue Insights", href: "/revenue-insights" },
  { icon: Microscope, label: "Advanced Insights", href: "/research" },
  { icon: UserCheck, label: "Guest Analytics", href: "/guests" },
  { icon: Bot, label: "AI Helpers", href: "/agents" },
  { icon: Upload, label: "Upload Data", href: "/upload" },
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
      <div className="h-36 flex items-center justify-center px-4 border-b border-sidebar-border/50 bg-white dark:bg-sidebar">
        <img 
          src={demoHotelLogo} 
          alt="Demo Hotel" 
          className={cn(
            "transition-all duration-300 object-contain",
            collapsed ? "w-16 h-16" : "w-64 h-28"
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

      <div className="p-4 border-t border-sidebar-border/50 space-y-3">
        <ThemeToggle collapsed={collapsed} />
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-full flex items-center justify-center hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
          data-testid="button-sidebar-collapse"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
