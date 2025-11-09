import React from 'react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MasterSettings as MasterSettingsComponent } from '@/components/settings/MasterSettings';
import { useAuth } from '@/contexts/AuthContext';

export const MasterSettings: React.FC = () => {
  const { state: sidebarState } = useSidebar();
  const { user } = useAuth();

  // Only allow access to admins
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                Only administrators can access the master settings page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          {sidebarState === 'collapsed' && <SidebarTrigger />}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
              Master Settings
            </h1>
            <p className="text-muted-foreground">
              Manage master data configurations and standard options
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Master Settings Component */}
        <MasterSettingsComponent />
      </div>
    </div>
  );
};

export default MasterSettings;
