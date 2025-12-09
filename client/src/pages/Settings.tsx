import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Settings as SettingsIcon, Bell, Palette, Database } from "lucide-react";

export default function Settings() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground">
            Configure your dashboard preferences and integrations.
          </p>
        </div>

        <GlassCard className="p-8">
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <SettingsIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Settings Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Customize your analytics experience with preferences, notifications, and data connections.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span>Theme</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Data Sources</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
