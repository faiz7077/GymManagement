import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  UserPlus,
  Receipt,
  Calendar,
  Target,
  BarChart3,
  FileText,
  User,
  Phone,
  MessageCircle,
  BookOpen,
  Building2,
  Calculator,
  ChevronRight,
  Eye,
  Gift,
  ChevronLeft,
  History,
  Filter,
  Download
} from 'lucide-react';
import { db, LegacyMember as Member, Receipt as ReceiptType,LegacyAttendance as Attendance, Enquiry } from '@/utils/database';
import { ReportType, REPORT_CONFIGS } from '@/components/reports/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReceiptHistory } from '@/components/receipts/ReceiptHistory';
import { MemberExpiryTables } from '@/components/members/MemberExpiryTables';

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

const MembersWithDueTable: React.FC = () => {
  const [allMembers, setAllMembers] = useState<(Member & { dueAmount?: number })[]>([]);
  const [displayedMembers, setDisplayedMembers] = useState<(Member & { dueAmount?: number })[]>([]);
  const [filter, setFilter] = useState<'due' | 'all'>('due');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const membersData = await db.getAllMembersWithDueAmounts();
        setAllMembers(membersData || []);
      } catch (error) {
        console.error('Error loading members:', error);
        setAllMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();

    // Listen for receipt and member update events
    const handleDataUpdate = () => {
      console.log('Data update event received, refreshing dashboard members...');
      // Add a small delay to ensure database operations complete
      setTimeout(() => {
        loadMembers();
      }, 300);
    };

    window.addEventListener('receiptCreated', handleDataUpdate);
    window.addEventListener('receiptUpdated', handleDataUpdate);
    window.addEventListener('receiptDeleted', handleDataUpdate);
    window.addEventListener('memberDataUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('receiptCreated', handleDataUpdate);
      window.removeEventListener('receiptUpdated', handleDataUpdate);
      window.removeEventListener('receiptDeleted', handleDataUpdate);
      window.removeEventListener('memberDataUpdated', handleDataUpdate);
    };
  }, []);

  useEffect(() => {
    if (allMembers.length === 0) return;

    const membersWithDue = allMembers.filter(member => 
      (member.due_amount || member.dueAmount || 0) > 0
    );

    let filteredMembers: (Member & { dueAmount?: number })[] = [];

    // If no members have due amounts, automatically show all members
    if (membersWithDue.length === 0) {
      setFilter('all');
      filteredMembers = [...allMembers].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Show members based on current filter
      if (filter === 'due') {
        filteredMembers = membersWithDue.sort((a, b) => (b.due_amount || b.dueAmount || 0) - (a.due_amount || a.dueAmount || 0));
      } else {
        filteredMembers = [...allMembers].sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    // Apply pagination
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    setTotalPages(totalPages);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedMembers = filteredMembers.slice(startIndex, endIndex);
    
    setDisplayedMembers(paginatedMembers);
  }, [allMembers, filter, currentPage, itemsPerPage]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleWhatsAppClick = (mobileNo: string, memberName: string, dueAmount?: number) => {
    if (!mobileNo) {
      console.warn('No mobile number available for WhatsApp');
      return;
    }

    // Format mobile number (remove any non-digits and ensure it starts with country code)
    let formattedNumber = mobileNo.replace(/\D/g, '');
    if (formattedNumber.length === 10) {
      formattedNumber = '91' + formattedNumber; // Add India country code
    }

    // Create WhatsApp message based on whether there's a due amount
    let message;
    if (dueAmount && dueAmount > 0) {
      message = `Hello ${memberName}, this is a reminder that you have a pending due amount of ₹${dueAmount}. Please make the payment at your earliest convenience. Thank you!`;
    } else {
      message = `Hello ${memberName}, hope you're doing well! This is a message from your gym. Feel free to reach out if you have any questions or need assistance.`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with the message
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const membersWithDueCount = allMembers.filter(member => 
    (member.due_amount || member.dueAmount || 0) > 0
  ).length;

  const totalDueAmount = allMembers.reduce((sum, member) => 
    sum + (member.due_amount || member.dueAmount || 0), 0
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Members Overview</CardTitle>
          <CardDescription>Loading member information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {filter === 'due' ? 'Members with Due Amounts' : 'All Members'}
          </span>
          <div className="flex items-center gap-2">
            {membersWithDueCount > 0 && (
              <div className="flex gap-1">
                <Button
                  variant={filter === 'due' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('due')}
                  className="text-xs"
                >
                  Due ({membersWithDueCount})
                </Button>
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="text-xs"
                >
                  All ({allMembers.length})
                </Button>
              </div>
            )}
            <Badge variant="secondary">{displayedMembers.length}</Badge>
          </div>
        </CardTitle>
        <CardDescription>
          {filter === 'due' 
            ? 'Members who have pending payments - Click WhatsApp icon to send reminder'
            : 'All gym members - Click WhatsApp icon to send message'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayedMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Members Found</h3>
            <p className="text-muted-foreground">No members available to display.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile No</TableHead>
                  <TableHead className="text-right">Due Amount</TableHead>
                  <TableHead className="text-center">WhatsApp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedMembers.map((member) => {
                  const dueAmount = member.due_amount || member.dueAmount || 0;
                  return (
                    <TableRow key={member.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {member.customMemberId || member.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.member_image || member.memberImage} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{member.mobileNo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {dueAmount > 0 ? (
                          <span className="font-semibold text-red-600">
                            ₹{dueAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">Paid</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWhatsAppClick(member.mobileNo, member.name, dueAmount)}
                          className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                          title={`Send WhatsApp message to ${member.name}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
            <span>
              {filter === 'due' 
                ? `Showing ${displayedMembers.length} members with due amounts (Page ${currentPage} of ${totalPages})`
                : `Showing ${displayedMembers.length} members (Page ${currentPage} of ${totalPages})`
              }
            </span>
            {totalDueAmount > 0 && (
              <span>
                Total Due: ₹{totalDueAmount.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance,setAttendance]=useState<Attendance[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReceiptHistoryOpen, setIsReceiptHistoryOpen] = useState(false);
  const [isMemberExpiryOpen, setIsMemberExpiryOpen] = useState(false);
  const [memberExpiryTab, setMemberExpiryTab] = useState<'expiring' | 'expired'>('expiring');
  const { state: sidebarState } = useSidebar();
  const navigate = useNavigate();

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
        newEnquiries: 0,
        expiringMembers: 0,
        expiredMembers: 0
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

    // Calculate expiring and expired members
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringMembers = members.filter(m => {
      if (!m.subscriptionEndDate) return false;
      const endDate = new Date(m.subscriptionEndDate);
      return endDate >= today && endDate <= thirtyDaysFromNow;
    }).length;

    const expiredMembers = members.filter(m => {
      if (!m.subscriptionEndDate) return false;
      const endDate = new Date(m.subscriptionEndDate);
      return endDate < today;
    }).length;

    return {
      totalMembers,
      activeMembers,
      monthlyRevenue,
      todayAttendance,
      newEnquiries,
      expiringMembers,
      expiredMembers
    };
  }, [members, enquiries, attendance, loading]);

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
      <div className="flex items-center gap-3">
        {sidebarState === 'collapsed' && <SidebarTrigger />}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at your gym today.
          </p>
        </div>
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
          title="Expiring Soon"
          value={stats.expiringMembers}
          description="Members expiring in 30 days"
          icon={Calendar}
          trend={stats.expiringMembers > 0 ? "Needs attention" : "All good"}
          trendUp={stats.expiringMembers === 0}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="p-3 bg-primary/10 hover:bg-primary/20 rounded-lg text-left transition-colors group"
                onClick={() => navigate('/members')}
              >
                <UserPlus className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Add Member</p>
              </button>
              <button 
                className="p-3 bg-success/10 hover:bg-success/20 rounded-lg text-left transition-colors group"
                onClick={() => navigate('/receipts')}
              >
                <Receipt className="h-5 w-5 text-success mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Create Receipt</p>
              </button>
              <button 
                className="p-3 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg text-left transition-colors group"
                onClick={() => {
                  setMemberExpiryTab('expiring');
                  setIsMemberExpiryOpen(true);
                }}
              >
                <Calendar className="h-5 w-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Expiring Soon</p>
              </button>
              <button 
                className="p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-left transition-colors group"
                onClick={() => setIsReceiptHistoryOpen(true)}
              >
                <History className="h-5 w-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Receipt History</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
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

      {/* Member Expiry Quick Access */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => {
            setMemberExpiryTab('expiring');
            setIsMemberExpiryOpen(true);
          }}
          className="flex items-center gap-3 px-6 py-3 text-base hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
        >
          <Calendar className="h-5 w-5 text-amber-600" />
          <span>View Expiring Members</span>
          {stats.expiringMembers > 0 && (
            <Badge variant="secondary" className="ml-2">
              {stats.expiringMembers}
            </Badge>
          )}
          <ChevronRight className="h-4 w-4" />
        </Button>
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

      {/* Members with Due Amounts */}
      <MembersWithDueTable />

      {/* Receipt History Section */}
      <Card className="group cursor-pointer" onClick={() => setIsReceiptHistoryOpen(true)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Receipt History
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardTitle>
          <CardDescription>View and filter all receipt transactions with date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-full">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">Complete Receipt Management</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Filter by date range, payment type, category and more
                </p>
              </div>
            </div>
            <Button variant="outline" className="bg-white/50 hover:bg-white/80">
              <Eye className="h-4 w-4 mr-2" />
              View History
            </Button>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Receipt className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-green-700 dark:text-green-300">All Receipts</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-blue-700 dark:text-blue-300">Date Filter</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Filter className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-purple-700 dark:text-purple-300">Smart Filters</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Download className="h-5 w-5 text-orange-600 mx-auto mb-1" />
              <p className="text-xs text-orange-700 dark:text-orange-300">Export Data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Section */}
      <Card className="group">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Reports & Analytics
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardTitle>
          <CardDescription>Quick access to all reports and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Financial Reports */}
            <div 
              className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 group/report"
              onClick={() => navigate('/reports')}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-green-600 rounded-full">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-medium text-green-800 dark:text-green-200">Financial Reports</h4>
              </div>
              <div className="space-y-1 opacity-0 group-hover/report:opacity-100 transition-opacity duration-200">
                <p className="text-xs text-green-700 dark:text-green-300">• All Collection Report</p>
                <p className="text-xs text-green-700 dark:text-green-300">• Member Balance Payment</p>
                <p className="text-xs text-green-700 dark:text-green-300">• Expense Report</p>
                <p className="text-xs text-green-700 dark:text-green-300">• GST Report</p>
                <p className="text-xs text-green-700 dark:text-green-300">• Profit & Loss</p>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 group-hover/report:hidden">
                Hover to see all reports
              </p>
            </div>

            {/* Member Reports */}
            <div 
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 group/report"
              onClick={() => navigate('/reports')}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-full">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Member Reports</h4>
              </div>
              <div className="space-y-1 opacity-0 group-hover/report:opacity-100 transition-opacity duration-200">
                <p className="text-xs text-blue-700 dark:text-blue-300">• Active/Inactive Members</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">• Member Birthday Report</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">• Membership End Dates</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">• Member Information</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">• Course Registration</p>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 group-hover/report:hidden">
                Hover to see all reports
              </p>
            </div>

            {/* Analytics Reports */}
            <div 
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 group/report"
              onClick={() => navigate('/reports')}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-purple-600 rounded-full">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-medium text-purple-800 dark:text-purple-200">Analytics</h4>
              </div>
              <div className="space-y-1 opacity-0 group-hover/report:opacity-100 transition-opacity duration-200">
                <p className="text-xs text-purple-700 dark:text-purple-300">• Enquiry to Enrollment</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">• Enquiry Follow-up</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">• All Follow-up Report</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">• Detail Report</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">• Course Analytics</p>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 group-hover/report:hidden">
                Hover to see all reports
              </p>
            </div>

            {/* Staff Reports */}
            <div 
              className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 group/report"
              onClick={() => navigate('/reports')}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-orange-600 rounded-full">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-medium text-orange-800 dark:text-orange-200">Staff Reports</h4>
              </div>
              <div className="space-y-1 opacity-0 group-hover/report:opacity-100 transition-opacity duration-200">
                <p className="text-xs text-orange-700 dark:text-orange-300">• Instructor Allocation</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">• Personal Instructor</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">• Staff Performance</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">• Trainer Assignments</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">• Staff Analytics</p>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 group-hover/report:hidden">
                Hover to see all reports
              </p>
            </div>
          </div>

          {/* Quick Report Actions */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/reports')}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View All Reports
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/reports')}
                className="text-xs"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Collection Report
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/reports')}
                className="text-xs"
              >
                <Gift className="h-3 w-3 mr-1" />
                Birthday Report
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/reports')}
                className="text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Expiry Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt History Dialog */}
      <ReceiptHistory 
        isOpen={isReceiptHistoryOpen} 
        onClose={() => setIsReceiptHistoryOpen(false)} 
      />

      {/* Member Expiry Tables Dialog */}
      <MemberExpiryTables 
        isOpen={isMemberExpiryOpen} 
        onClose={() => setIsMemberExpiryOpen(false)}
        initialTab={memberExpiryTab}
      />
    </div>
  );
};