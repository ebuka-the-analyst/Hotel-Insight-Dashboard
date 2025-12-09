import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Users, Mail, Shield } from "lucide-react";

export default function Team() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2" data-testid="text-team-title">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and their access levels.
          </p>
        </div>

        <GlassCard className="p-8">
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Team Features Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Invite team members, assign roles, and collaborate on hotel analytics together.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Email Invites</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Role-based Access</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
