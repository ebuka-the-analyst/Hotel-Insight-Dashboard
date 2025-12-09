import { Bell, Search, X, Loader2, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  queryInsights,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
  type QueryResponse,
} from "@/lib/api-client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<QueryResponse | null>(null);
  const [showSearchResult, setShowSearchResult] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem("userProfile");
      if (saved) setProfile(JSON.parse(saved));
    };
    window.addEventListener("profileUpdated", handleUpdate);
    return () => window.removeEventListener("profileUpdated", handleUpdate);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResult(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => getUnreadNotificationCount(),
    refetchInterval: 30000,
  });

  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(10),
    enabled: notificationsOpen,
    staleTime: 0,
  });

  useEffect(() => {
    if (notificationsOpen) {
      refetchNotifications();
    }
  }, [notificationsOpen, refetchNotifications]);

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setShowSearchResult(true);
    try {
      const result = await queryInsights(searchQuery);
      setSearchResult(result);
    } catch (error) {
      setSearchResult({
        answer: "Sorry, I couldn't process your query. Please try again.",
        dataContext: {},
        suggestedActions: [],
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
      setNotificationsOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      default: return "bg-blue-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "alert": return "🚨";
      case "insight": return "💡";
      case "milestone": return "🏆";
      case "recommendation": return "📊";
      default: return "📬";
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
      <div className="flex items-center w-full max-w-md" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Ask anything about your data..." 
            className="pl-10 pr-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-full transition-all w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResult && setShowSearchResult(true)}
            data-testid="input-search"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
          )}
          {!isSearching && searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResult(null);
                setShowSearchResult(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {showSearchResult && (
            <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden">
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white text-lg">✨</span>
                  <span className="text-white font-medium text-sm">AI Assistant</span>
                </div>
                <button
                  onClick={() => setShowSearchResult(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  data-testid="button-close-ai-response"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="p-6 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Analyzing...</span>
                  </div>
                ) : searchResult ? (
                  <div className="p-4">
                    <p className="text-sm text-foreground leading-relaxed">{searchResult.answer}</p>
                    {searchResult.suggestedActions && searchResult.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {searchResult.suggestedActions.map((action, i) => (
                            <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="flex items-center gap-4">
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-muted-foreground hover:text-foreground"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {(unreadCount?.count ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white font-medium flex items-center justify-center px-1">
                  {unreadCount!.count > 9 ? "9+" : unreadCount!.count}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {(unreadCount?.count ?? 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications && notifications.length > 0 ? (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-primary/5' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-item-${notification.id}`}
                    >
                      <div className="flex gap-3">
                        <div className="relative">
                          <span className="text-lg">{getTypeIcon(notification.type)}</span>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''} line-clamp-1`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground mt-1">We'll notify you when there's something new</p>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
        
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
