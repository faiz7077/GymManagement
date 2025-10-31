import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Users, IndianRupee, Receipt, RefreshCw, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/utils/database';
import { DuePaymentDialog } from '@/components/payments/DuePaymentDialog';

interface MemberWithDue {
  id: string;
  name: string;
  customMemberId?: string;
  mobileNo: string;
  email: string;
  memberImage?: string;
  status: string;
  subscriptionStatus?: string;
  dueAmount: number;
  unpaidInvoices: number;
  registrationFee?: number;
  packageFee?: number;
  membershipFees?: number;
  discount?: number;
  paidAmount?: number;
}

export const DuePayments: React.FC = () => {
  const { state: sidebarState } = useSidebar();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<MemberWithDue[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalDues: 0,
    membersWithDues: 0,
    todaysCollections: 0
  });
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<MemberWithDue | null>(null);
  const [isDuePaymentDialogOpen, setIsDuePaymentDialogOpen] = useState(false);

  const loadMembersWithDues = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading members with due amounts...');
      
      const memberData = await db.getAllMembersWithDueAmounts();
      console.log('Loaded members:', memberData?.length || 0);

      if (memberData && Array.isArray(memberData)) {
        const membersWithDueAmounts = memberData.map((member: any) => ({
          id: member.id,
          name: member.name,
          customMemberId: member.customMemberId || member.custom_member_id,
          mobileNo: member.mobileNo || member.mobile_no,
          email: member.email,
          memberImage: member.memberImage || member.member_image,
          status: member.status,
          subscriptionStatus: member.subscriptionStatus || member.subscription_status,
          dueAmount: member.dueAmount || member.due_amount || 0,
          unpaidInvoices: member.unpaidInvoices || member.unpaid_invoices || 0,
          registrationFee: member.registrationFee || member.registration_fee || 0,
          packageFee: member.packageFee || member.package_fee || member.membershipFees || member.membership_fees || 0,
          discount: member.discount || 0,
          paidAmount: member.paidAmount || member.paid_amount || 0
        }));

        setMembers(membersWithDueAmounts);
        
        // Calculate stats
        const totalDues = membersWithDueAmounts.reduce((sum, member) => sum + member.dueAmount, 0);
        const membersWithDues = membersWithDueAmounts.filter(member => member.dueAmount > 0).length;
        
        setStats({
          totalMembers: membersWithDueAmounts.length,
          totalDues,
          membersWithDues,
          todaysCollections: 0 // TODO: Calculate today's collections
        });
      }
    } catch (error) {
      console.error('Error loading members with dues:', error);
      toast({
        title: "Error",
        description: "Failed to load members with due amounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterMembers = useCallback(() => {
    let filtered = members;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.mobileNo || '').includes(searchTerm) ||
        (member.customMemberId && member.customMemberId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.id || '').includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter === 'with-dues') {
      filtered = filtered.filter(member => member.dueAmount > 0);
    } else if (statusFilter === 'no-dues') {
      filtered = filtered.filter(member => member.dueAmount === 0);
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, statusFilter]);

  useEffect(() => {
    loadMembersWithDues();
  }, [loadMembersWithDues]);

  // Listen for receipt creation events to refresh data
  useEffect(() => {
    const handleReceiptCreated = () => {
      console.log('Receipt created event received, refreshing due payments data...');
      // Add a small delay to ensure database operations complete
      setTimeout(() => {
        loadMembersWithDues();
      }, 300);
    };

    const handleMemberRefresh = () => {
      console.log('Member refresh event received, refreshing due payments data...');
      setTimeout(() => {
        loadMembersWithDues();
      }, 300);
    };

    const handleMemberDataUpdated = () => {
      console.log('Member data updated event received, refreshing due payments data...');
      setTimeout(() => {
        loadMembersWithDues();
      }, 300);
    };

    window.addEventListener('receiptCreated', handleReceiptCreated);
    window.addEventListener('memberRefresh', handleMemberRefresh);
    window.addEventListener('memberDataUpdated', handleMemberDataUpdated);

    return () => {
      window.removeEventListener('receiptCreated', handleReceiptCreated);
      window.removeEventListener('memberRefresh', handleMemberRefresh);
      window.removeEventListener('memberDataUpdated', handleMemberDataUpdated);
    };
  }, [loadMembersWithDues]);

  useEffect(() => {
    filterMembers();
  }, [filterMembers]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleUpdateSubscriptionStatuses = async () => {
    try {
      setLoading(true);
      console.log('Updating subscription statuses...');
      
      const result = await window.electronAPI.updateAllSubscriptionStatuses();
      
      if (result.success) {
        toast({
          title: "Status Updated",
          description: "Subscription statuses have been updated successfully.",
        });
        // Reload the members data to reflect changes
        await loadMembersWithDues();
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update subscription statuses.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating subscription statuses:', error);
      toast({
        title: "Update Error",
        description: "Failed to update subscription statuses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayDue = (member: MemberWithDue) => {
    setSelectedMemberForPayment(member);
    setIsDuePaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsDuePaymentDialogOpen(false);
    setSelectedMemberForPayment(null);
    // Reload members data to reflect the payment
    loadMembersWithDues();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-destructive text-destructive-foreground';
      case 'frozen': return 'bg-warning text-warning-foreground';
      case 'partial': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'expired': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="animate-fade-in w-full overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 w-full overflow-hidden flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {sidebarState === 'collapsed' && <SidebarTrigger />}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">
                Due Payments
              </h1>
              <p className="text-muted-foreground">
                Manage member due amounts and outstanding balances
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadMembersWithDues} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={handleUpdateSubscriptionStatuses}
              disabled={loading}
            >
              Update Status
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-lg font-bold">{stats.totalMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <IndianRupee className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Dues</p>
                  <p className="text-lg font-bold">₹{stats.totalDues.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Members with Dues</p>
                  <p className="text-lg font-bold">{stats.membersWithDues}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Receipt className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Collections</p>
                  <p className="text-lg font-bold">₹{stats.todaysCollections.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="with-dues">With Dues</SelectItem>
              <SelectItem value="no-dues">No Dues</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content - Members Table */}
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Members Due Amounts ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Total Fee</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Due Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.memberImage} />
                            <AvatarFallback>{getInitials(member.name || '')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.name}</span>
                              {member.status === 'partial' && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                  Incomplete
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {member.customMemberId || member.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{member.mobileNo}</div>
                          <div className="text-muted-foreground">{member.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.status || 'inactive')}>
                          {member.status || 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          member.subscriptionStatus === 'active' ? 'default' : 
                          member.subscriptionStatus === 'expiring_soon' ? 'secondary' : 
                          'destructive'
                        }>
                          {member.subscriptionStatus === 'expiring_soon' ? 'Expiring Soon' : 
                           member.subscriptionStatus || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          ₹{((member.registrationFee || 0) + (member.packageFee || 0) - (member.discount || 0)).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">
                          ₹{(member.paidAmount || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {member.dueAmount > 0 ? (
                          <span className="text-red-600 font-medium">
                            ₹{member.dueAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-green-600">Paid</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {member.dueAmount > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePayDue(member)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay ₹{member.dueAmount.toLocaleString()}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {!loading && filteredMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Due Payment Dialog */}
      <DuePaymentDialog
        member={selectedMemberForPayment}
        isOpen={isDuePaymentDialogOpen}
        onClose={() => {
          setIsDuePaymentDialogOpen(false);
          setSelectedMemberForPayment(null);
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};