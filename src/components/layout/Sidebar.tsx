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
  MessageSquare,
  Cog
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';

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
  { title: "Deleted Members", url: "/deleted-members", icon: Users, permission: "VIEW_MEMBERS" },
  { title: "Enquiries", url: "/enquiries", icon: MessageSquare, permission: "VIEW_ENQUIRIES" },
  { title: "Member Attendance", url: "/attendance", icon: UserCheck, permission: "VIEW_ATTENDANCE" },
  { title: "Receipts", url: "/receipts", icon: Receipt, permission: "VIEW_RECEIPTS" },
  { title: "Due Payments", url: "/due-payments", icon: DollarSign, permission: "VIEW_RECEIPTS" },
  { title: "Body Measurements", url: "/measurements", icon: Activity, permission: "VIEW_MEASUREMENTS" },
  { title: "Staff", url: "/staff", icon: UserPlus, permission: "MANAGE_STAFF" },
  { title: "Staff Attendance", url: "/staff-attendance", icon: UserCheck, permission: "VIEW_ATTENDANCE" },
  { title: "Expenses", url: "/expenses", icon: DollarSign, permission: "MANAGE_EXPENSES" },
  { title: "Staff Salary", url: "/salary", icon: TrendingUp },
  { title: "Monthly Report", url: "/monthly-report", icon: FileText, permission: "VIEW_REPORTS" },
  { title: "WhatsApp Automation", url: "/whatsapp", icon: MessageSquare, permission: "VIEW_REPORTS" },
  { title: "WhatsApp Settings", url: "/whatsapp-settings", icon: Settings, permission: "MANAGE_SETTINGS" },
  { title: "Reports", url: "/reports", icon: FileText, permission: "VIEW_REPORTS" },
  { title: "Charts", url: "/charts", icon: BarChart3, permission: "VIEW_REPORTS" },
  { title: "Master Settings", url: "/master-settings", icon: Cog, permission: "MANAGE_SETTINGS" },
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
    <SidebarPrimitive variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-gym-primary to-primary-glow rounded-lg">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
                Prime Fitness
              </h2>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>
          <SidebarTrigger className="ml-auto" />
        </div>
        
        {/* User Info */}
        <div className="flex items-center space-x-3 mt-4 p-2 rounded-lg bg-sidebar-accent/50">
          <div className="w-10 h-10 bg-gradient-to-r from-gym-accent to-success rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = location.pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              tooltip="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
};