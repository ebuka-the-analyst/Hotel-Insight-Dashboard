import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0" />
        <div className="absolute -top-[100px] right-[10%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none z-0" />
        
        <Header />
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {children}
          </div>
        </main>
        
        <ChatAssistant />
      </div>
    </div>
  );
}
