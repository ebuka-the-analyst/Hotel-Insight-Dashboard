import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { BarChart3, TrendingUp, Users, Shield, ArrowRight, LineChart, PieChart } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-serif font-bold">AutoInsight</span>
          </div>
          <Button 
            onClick={handleLogin}
            className="bg-primary hover:bg-primary/90 text-white"
            data-testid="button-login"
          >
            Manager Login
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Managers Only Access
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Hotel Analytics
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Upload your booking data and unlock powerful insights with 70+ metrics. 
            Make data-driven decisions to optimize your hotel's performance.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6"
            data-testid="button-login-hero"
          >
            Sign In to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <GlassCard className="p-6 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Revenue Analytics</h3>
            <p className="text-muted-foreground text-sm">
              Track ADR, RevPAR, and revenue trends with advanced forecasting tools.
            </p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <LineChart className="h-7 w-7 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Booking Insights</h3>
            <p className="text-muted-foreground text-sm">
              Analyze booking patterns, lead times, and cancellation risks.
            </p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <PieChart className="h-7 w-7 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Channel Performance</h3>
            <p className="text-muted-foreground text-sm">
              Compare OTAs, direct bookings, and optimize your distribution strategy.
            </p>
          </GlassCard>
        </div>

        <GlassCard className="p-8 text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-3">Built for Hotel Managers</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            AutoInsight is designed specifically for hotel management teams. 
            Sign in with your account to access your personalized analytics dashboard.
          </p>
          <Button 
            onClick={handleLogin}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            data-testid="button-login-footer"
          >
            Access Dashboard
          </Button>
        </GlassCard>
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>AutoInsight Hotel Analytics Dashboard</p>
        </div>
      </footer>
    </div>
  );
}
