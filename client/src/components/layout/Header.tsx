import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const DEFAULT_PROFILE = {
  name: "Alex Morgan",
  position: "General Manager",
  avatarUrl: "https://github.com/shadcn.png"
};

export function Header() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("userProfile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem("userProfile");
      if (saved) setProfile(JSON.parse(saved));
    };
    window.addEventListener("profileUpdated", handleUpdate);
    return () => window.removeEventListener("profileUpdated", handleUpdate);
  }, []);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Ask anything about your data..." 
            className="pl-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-full transition-all w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
        </Button>
        
        <div className="h-8 w-[1px] bg-border" />
        
        <div 
          className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setLocation("/settings")}
          data-testid="button-profile"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">{profile.name}</p>
            <p className="text-xs text-muted-foreground">{profile.position}</p>
          </div>
          <Avatar className="h-9 w-9 border border-border cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
            <AvatarImage src={profile.avatarUrl} />
            <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
