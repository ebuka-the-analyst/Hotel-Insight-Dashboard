import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  name: "Nova" | "Sterling" | "Atlas" | "Sage";
  className?: string;
  pulsing?: boolean;
}

const AGENT_COLORS = {
  Nova: "from-blue-400 to-cyan-500", // Innovation - Blue
  Sterling: "from-yellow-400 to-amber-500", // Financial - Gold
  Atlas: "from-emerald-400 to-green-500", // Growth - Emerald
  Sage: "from-purple-400 to-violet-500", // Compliance - Purple
};

export function AgentAvatar({ name, className, pulsing = false }: AgentAvatarProps) {
  const gradient = AGENT_COLORS[name];

  return (
    <div className={cn("relative group cursor-pointer", className)}>
      {pulsing && (
        <div className={cn(
          "absolute -inset-1 rounded-full bg-gradient-to-br opacity-50 blur-md animate-pulse",
          gradient
        )} />
      )}
      <div className={cn(
        "relative w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/20 transition-transform group-hover:scale-105",
        gradient
      )}>
        {name[0]}
      </div>
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
    </div>
  );
}
