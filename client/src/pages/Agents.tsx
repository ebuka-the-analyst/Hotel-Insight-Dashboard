import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Agents() {
  const [message, setMessage] = useState("");

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2" data-testid="text-agents-title">AI Insights</h1>
          <p className="text-muted-foreground">
            Chat with our AI agents to get personalized insights about your hotel data.
          </p>
        </div>

        <div className="grid gap-6">
          <GlassCard className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <AgentAvatar name="Nova" pulsing />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-primary">Nova</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI Assistant</span>
                </div>
                <p className="text-foreground/80">
                  Hello! I'm Nova, your hotel analytics assistant. Ask me anything about your bookings, revenue trends, or guest patterns.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                <AgentAvatar name="Nova" className="w-8 h-8" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/80">
                    I can help you understand your booking patterns, identify revenue opportunities, and provide recommendations for improving your hotel's performance. What would you like to know?
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your hotel analytics..."
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                data-testid="input-chat-message"
              />
              <Button className="bg-primary hover:bg-primary/90 text-white px-6" data-testid="button-send-message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Sterling", specialty: "Revenue Optimization", icon: Sparkles },
              { name: "Atlas", specialty: "Market Analysis", icon: Bot },
              { name: "Sage", specialty: "Guest Experience", icon: Bot },
            ].map((agent) => (
              <GlassCard key={agent.name} className="p-4 hover:bg-white/5 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <AgentAvatar name={agent.name as any} className="w-10 h-10" />
                  <div>
                    <h4 className="font-semibold text-sm">{agent.name}</h4>
                    <p className="text-xs text-muted-foreground">{agent.specialty}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
