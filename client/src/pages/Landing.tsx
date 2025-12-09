import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Users, Shield, ArrowRight, LineChart, PieChart, Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import hyattLogo from "@assets/Hyatt_Place_logo.svg_1765284683778.png";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send verification code");
      }
      
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the verification code");
      return;
    }
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Invalid verification code");
      }
      
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={hyattLogo} alt="Hyatt Place" className="h-14 object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Shield className="h-4 w-4" />
            Manager Portal
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Hotel Analytics
              <br />
              <span className="text-primary">Dashboard</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Upload your booking data and unlock powerful insights with 70+ metrics. 
              Make data-driven decisions to optimize your hotel's performance.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Revenue Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LineChart className="h-5 w-5 text-secondary" />
                <span>Booking Insights</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <PieChart className="h-5 w-5 text-green-500" />
                <span>Channel Performance</span>
              </div>
            </div>
          </div>

          <GlassCard className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-serif font-bold mb-2">Manager Sign In</h2>
              <p className="text-muted-foreground text-sm">
                {step === "email" 
                  ? "Enter your email to receive a verification code" 
                  : "Enter the 6-digit code sent to your email"}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {step === "email" ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@hyattplace.com"
                      className="pl-10"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={isLoading}
                  data-testid="button-request-otp"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Send Verification Code
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={6}
                    data-testid="input-otp"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Code sent to {email}
                  </p>
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={isLoading || otp.length !== 6}
                  data-testid="button-verify-otp"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Verify & Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  data-testid="button-back-email"
                >
                  Use different email
                </Button>
              </form>
            )}
          </GlassCard>
        </div>

        <div className="mt-16">
          <GlassCard className="p-8 text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold mb-3">Built for Hyatt Place Managers</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              This analytics dashboard is designed specifically for hotel management teams. 
              Sign in with your hotel email to access your personalized insights.
            </p>
          </GlassCard>
        </div>
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Hyatt Place Analytics Dashboard</p>
        </div>
      </footer>
    </div>
  );
}
