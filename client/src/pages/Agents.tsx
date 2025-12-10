import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { Bot, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { queryInsights } from "@/lib/api-client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Agents() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage = message.trim();
    setMessage("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    
    try {
      const response = await queryInsights(userMessage);
      setMessages(prev => [...prev, { role: "assistant", content: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process your question. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2" data-testid="text-agents-title">AI Helpers</h1>
          <p className="text-muted-foreground">
            Chat with our AI assistants to get answers about your hotel's performance.
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
                  Hello! I'm Nova, your hotel assistant. Ask me anything about your bookings, earnings, or guests.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                <AgentAvatar name="Nova" className="w-8 h-8" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/80">
                    I can help you understand your bookings, find ways to earn more, and give you tips to make guests happier. What would you like to know?
                  </p>
                </div>
              </div>
              
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 p-4 rounded-xl ${msg.role === "user" ? "bg-primary/10" : "bg-muted/30"}`}>
                  {msg.role === "assistant" ? (
                    <AgentAvatar name="Nova" className="w-8 h-8" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">U</div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-foreground/80">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                  <AgentAvatar name="Nova" className="w-8 h-8" />
                  <div className="flex-1 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything about your hotel..."
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                data-testid="input-chat-message"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSend}
                disabled={isLoading || !message.trim()}
                className="bg-primary hover:bg-primary/90 text-white px-6" 
                data-testid="button-send-message"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </GlassCard>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Sterling", specialty: "Earnings & Pricing", icon: Sparkles },
              { name: "Atlas", specialty: "Booking Trends", icon: Bot },
              { name: "Sage", specialty: "Guest Happiness", icon: Bot },
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
