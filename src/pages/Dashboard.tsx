import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  UserPlus,
  Receipt,
  Calendar,
  Target
} from 'lucide-react';
import { db, LegacyMember as Member, Receipt as ReceiptType,LegacyAttendance as Attendance, Enquiry } from '@/utils/database';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<any>;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendUp 
}) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">
        {trend && (
          <span className={`inline-flex items-center ${trendUp ? 'text-success' : 'text-destructive'}`}>
            {trend}
          </span>
        )}
        {description}
      </p>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance,setAttendance]=useState<Attendance[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      //Todo
      try {
        setLoading(true);
        const [membersData, enquiriesData,attendanceData] = await Promise.all([
          db.getAllMembers(),
          db.getAllEnquiries(),
          db.getAllAttendance()
        ]);
        setAttendance(attendanceData)
        setMembers(membersData || []);
        setEnquiries(enquiriesData || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setMembers([]);
        setEnquiries([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    if (loading) {
      return {
        totalMembers: 0,
        activeMembers: 0,
        monthlyRevenue: 0,
        todayAttendance: 0,
        newEnquiries: 0
      };
    }

    const activeMembers = members.filter(m => m.status === 'active').length;
    const totalMembers = members.length;
    
    // Calculate this month's revenue (placeholder - we'll need receipts data)
    const monthlyRevenue = 0; // TODO: Implement when receipts are available
    
    // Today's attendance (placeholder - we'll need attendance data)
    const todayAttendance = attendance.length; // TODO: Implement when attendance is available

    // New enquiries this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newEnquiries = enquiries.filter(e => 
      new Date(e.created_at) > weekAgo
    ).length;

    return {
      totalMembers,
      activeMembers,
      monthlyRevenue,
      todayAttendance,
      newEnquiries
    };
  }, [members, enquiries, loading]);

  const recentActivities = useMemo(() => {
    if (loading) return [];

    const activities = [
      ...members.slice(-3).map(m => ({
        type: 'member_joined',
        message: `${m.name} joined the gym`,
        time: m.createdAt,
        icon: UserPlus
      })),
      ...enquiries.slice(-3).map(e => ({
        type: 'enquiry',
        message: `New enquiry from ${e.name}`,
        time: e.created_at,
        icon: UserPlus
      }))
    ];

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }, [members, enquiries, loading]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening at your gym today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Members"
          value={stats.totalMembers}
          description={`${stats.activeMembers} active members`}
          icon={Users}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          description="This month's earnings"
          icon={DollarSign}
          trend="+12.5%"
          trendUp={true}
        />
        <StatsCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          description="Members checked in today"
          icon={Activity}
        />
        <StatsCard
          title="New Enquiries"
          value={stats.newEnquiries}
          description="This week"
          icon={TrendingUp}
          trend="+8"
          trendUp={true}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-primary/10 hover:bg-primary/20 rounded-lg text-left transition-colors group">
                <UserPlus className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Add Member</p>
              </button>
              <button className="p-3 bg-success/10 hover:bg-success/20 rounded-lg text-left transition-colors group">
                <Receipt className="h-5 w-5 text-success mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Create Receipt</p>
              </button>
              <button className="p-3 bg-warning/10 hover:bg-warning/20 rounded-lg text-left transition-colors group">
                <Activity className="h-5 w-5 text-warning mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Mark Attendance</p>
              </button>
              <button className="p-3 bg-gym-accent/10 hover:bg-gym-accent/20 rounded-lg text-left transition-colors group">
                <Target className="h-5 w-5 text-gym-accent mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Body Metrics</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest activities in your gym</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recent activities found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Member Status Overview</CardTitle>
          <CardDescription>Current status of all gym members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-sm">Active: {stats.activeMembers}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-warning rounded-full"></div>
              <span className="text-sm">
                Inactive: {stats.totalMembers - stats.activeMembers}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};