import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Receipt,
  Activity,
  DollarSign,
  Settings,
  BarChart3,
  Dumbbell,
  LogOut,
  UserCheck,
  FileText,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Members", url: "/members", icon: Users, permission: "VIEW_MEMBERS" },
  { title: "Enquiries", url: "/enquiries", icon: MessageSquare, permission: "VIEW_ENQUIRIES" },
  { title: "Member Attendance", url: "/attendance", icon: UserCheck, permission: "VIEW_ATTENDANCE" },
  { title: "Receipts", url: "/receipts", icon: Receipt, permission: "VIEW_RECEIPTS" },
  { title: "Body Measurements", url: "/measurements", icon: Activity, permission: "VIEW_MEASUREMENTS" },
  { title: "Staff", url: "/staff", icon: UserPlus, permission: "MANAGE_STAFF" },
  { title: "Staff Attendance", url: "/staff-attendance", icon: UserCheck, permission: "VIEW_ATTENDANCE" },
  { title: "Expenses", url: "/expenses", icon: DollarSign, permission: "MANAGE_EXPENSES" },
  { title: "Staff Salary", url: "/salary", icon: TrendingUp },
  { title: "Monthly Report", url: "/monthly-report", icon: FileText, permission: "VIEW_REPORTS" },
  { title: "WhatsApp Automation", url: "/whatsapp", icon: MessageSquare, permission: "VIEW_REPORTS" },
  { title: "WhatsApp Settings", url: "/whatsapp-settings", icon: Settings, permission: "MANAGE_SETTINGS" },
  { title: "Reports", url: "/reports", icon: FileText, permission: "VIEW_REPORTS" },
  { title: "Settings", url: "/settings", icon: Settings, permission: "MANAGE_SETTINGS" },
];

export const Sidebar: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const filteredItems = sidebarItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-gym-primary to-primary-glow rounded-lg">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
              Prime Fitness Health Point
            </h2>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-gym-accent to-success rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.url;
          const Icon = item.icon;

          return (
            
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};