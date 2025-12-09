import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gradient?: boolean;
}

export function GlassCard({ children, className, gradient, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(17,182,233,0.2)]",
        gradient && "bg-gradient-to-br from-white/10 to-white/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
