import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings as SettingsIcon, Bell, Palette, Database, User, Upload, Save, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_PROFILE = {
  name: "Alex Morgan",
  position: "General Manager",
  avatarUrl: ""
};

export function useProfile() {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("userProfile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const updateProfile = (newProfile: typeof DEFAULT_PROFILE) => {
    localStorage.setItem("userProfile", JSON.stringify(newProfile));
    setProfile(newProfile);
    window.dispatchEvent(new Event("profileUpdated"));
  };

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem("userProfile");
      if (saved) setProfile(JSON.parse(saved));
    };
    window.addEventListener("profileUpdated", handleUpdate);
    return () => window.removeEventListener("profileUpdated", handleUpdate);
  }, []);

  return { profile, updateProfile };
}

export default function Settings() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("userProfile");
    const profile = saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    setName(profile.name);
    setPosition(profile.position);
    setAvatarUrl(profile.avatarUrl);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    const newProfile = { name, position, avatarUrl };
    localStorage.setItem("userProfile", JSON.stringify(newProfile));
    window.dispatchEvent(new Event("profileUpdated"));
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground">
            Configure your dashboard preferences and integrations.
          </p>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Profile Settings</h3>
                <p className="text-sm text-muted-foreground">Update your name, position, and profile picture</p>
              </div>
            </div>

            <div className="grid md:grid-cols-[200px_1fr] gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">{getInitials(name)}</AvatarFallback>
                  </Avatar>
                  {avatarUrl && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                      onClick={handleRemovePhoto}
                      data-testid="button-remove-photo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-medium">{name || "Your Name"}</p>
                  <p className="text-sm text-muted-foreground">{position || "Your Position"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    data-testid="input-profile-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position / Title</Label>
                  <Input
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g., General Manager"
                    data-testid="input-profile-position"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="avatar-upload"
                    data-testid="input-profile-avatar-file"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                      data-testid="button-upload-photo"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {avatarUrl ? "Change Photo" : "Upload Photo"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a JPG or PNG image (max 2MB)
                  </p>
                </div>

                <Button 
                  onClick={handleSave} 
                  className="bg-primary text-white hover:bg-primary/90 mt-4"
                  data-testid="button-save-profile"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center">
                <SettingsIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">More Settings</h3>
                <p className="text-sm text-muted-foreground">Additional configuration options coming soon</p>
              </div>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Palette className="h-4 w-4" />
                <span>Theme</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Database className="h-4 w-4" />
                <span>Data Sources</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
