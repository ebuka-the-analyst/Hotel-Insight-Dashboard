import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  X, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  BarChart3,
  RefreshCcw,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "chart" | "insight";
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your Data Assistant. I have full access to the 'hotel_bookings_dec_2024.csv' dataset you just uploaded. Ask me anything about occupancy, revenue, or guest trends.",
    timestamp: new Date(),
  }
];

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      const response = generateMockResponse(userMsg.content);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.text,
        type: response.type as any,
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const generateMockResponse = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes("revenue") || q.includes("money") || q.includes("income")) {
      return {
        text: "Based on the December dataset, total revenue is £142,500. The highest revenue day was Dec 24th (£12,400). Here is the breakdown by room type.",
        type: "chart"
      };
    }
    if (q.includes("occupancy") || q.includes("full")) {
      return {
        text: "Occupancy is currently at 84.2%. Weekends are showing a 15% higher occupancy rate than weekdays. We have 12 rooms available for tonight.",
        type: "insight"
      };
    }
    return {
      text: "I've analyzed the dataset. Could you specify if you want to see trends regarding Guest Satisfaction, RevPAR, or Cancellation Rates?",
      type: "text"
    };
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-white z-50 animate-in zoom-in duration-300"
        >
          <Bot className="h-7 w-7" />
          <span className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={cn(
            "fixed bottom-6 right-6 z-50 transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-background/95 backdrop-blur-md border border-border",
            isExpanded ? "w-[600px] h-[80vh] max-h-[calc(100vh-3rem)]" : "w-[380px] h-[600px] max-h-[calc(100vh-3rem)]"
          )}
        >
          {/* Header */}
          <div className="h-16 bg-primary px-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Data Assistant</h3>
                <p className="text-[10px] text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Connected to hotel_bookings_dec_2024.csv
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30" ref={scrollRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-none" 
                      : "bg-white dark:bg-card border border-border rounded-bl-none text-foreground"
                  )}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  
                  {msg.type === "chart" && (
                    <div className="mt-3 bg-muted/50 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                        <BarChart3 className="h-3 w-3" />
                        Visualizing Revenue Data
                      </div>
                      <div className="h-32 flex items-end justify-between gap-1 px-2">
                        {[40, 65, 45, 90, 75, 55, 80].map((h, i) => (
                          <div 
                            key={i} 
                            className="w-full bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm relative group" 
                            style={{ height: `${h}%` }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              £{h * 120}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] opacity-50 mt-1 block">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-card border border-border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-background border-t border-border">
            <div className="relative flex items-center gap-2">
              <Input
                placeholder="Ask about your data..."
                className="pr-12 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary rounded-xl"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button 
                size="icon" 
                className="absolute right-1 w-8 h-8 rounded-lg bg-primary text-white hover:bg-primary/90"
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {["Revenue analysis?", "Show occupancy trend", "Top guests?"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInputValue(suggestion);
                    // Optional: auto-send
                  }}
                  className="text-[10px] px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors whitespace-nowrap"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
