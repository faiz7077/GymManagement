import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';

// Lucide React Icons
import {
  Plus, Search, Edit, Trash2, Eye, Filter, RefreshCw, Download,
  Users, UserPlus, Calendar, List, BarChart3, UserCheck, Activity, ChevronRight, DollarSign,
  ChevronLeft
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

// Hooks & Context
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Database & Types
import { LegacyMember, LegacyMember as Member, LegacyEnquiry, db } from '@/utils/database';

// Components
import { MemberForm } from '@/components/members/MemberForm';
import { MemberDetails } from '@/components/members/MemberDetails';
import { MemberIdEditor } from '@/components/members/MemberIdEditor';
import { MemberExpiryTables } from '@/components/members/MemberExpiryTables';

export const Members: React.FC = () => {
  const [members, setMembers] = useState<(Member & { dueAmount?: number; unpaidInvoices?: number })[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<(Member & { dueAmount?: number; unpaidInvoices?: number })[]>([]);
  const [paginatedMembers, setPaginatedMembers] = useState<(Member & { dueAmount?: number; unpaidInvoices?: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [trainers, setTrainers] = useState<unknown[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [enquiryToConvert, setEnquiryToConvert] = useState<LegacyEnquiry | null>(null);
  const [showMembersListDialog, setShowMembersListDialog] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const { state: sidebarState } = useSidebar();

  const loadMembers = useCallback(async () => {
    try {
      console.log('Loading members...');
      setLoading(true);
      const memberData = await db.getAllMembersWithDueAmounts();
      console.log('Loaded members:', memberData?.length || 0);

      setMembers(memberData || []);
      
      // Load trainers for filter
      const trainersData = await db.getTrainersWithCounts();
      setTrainers(trainersData);
    } catch (error) {
      console.error('Error loading members:', error);
      setMembers([]);
      toast({
        title: "Error",
        description: "Failed to load members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateSubscriptionStatuses = useCallback(async () => {
    try {
      setLoading(true);
      await db.updateAllSubscriptionStatuses();
      await loadMembers();
      toast({
        title: "Success",
        description: "Subscription statuses have been updated.",
      });
    } catch (error) {
      console.error('Error updating subscription statuses:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription statuses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loadMembers, toast]);

  const handleUpdateSubscriptionStatuses = async () => {
    try {
      setLoading(true);
      console.log('Updating subscription statuses...');
      const result = await window.electronAPI.invoke('update-all-subscription-statuses');
      if (result.success) {
        toast({
          title: "Status Updated",
          description: "Subscription statuses have been updated successfully.",
        });
        // Reload the members data to reflect changes
        await loadMembers();
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

  const filterMembers = useCallback(() => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.mobileNo || '').includes(searchTerm) ||
        (member.occupation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.customMemberId && member.customMemberId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.id || '').includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'expired') {
        // For expired filter, check subscription_status instead of main status
        filtered = filtered.filter(member => member.subscriptionStatus === 'expired');
      } else {
        filtered = filtered.filter(member => member.status === statusFilter);
      }
    }

    if (subscriptionFilter !== 'all') {
      filtered = filtered.filter(member => member.subscriptionStatus === subscriptionFilter);
    }

    // Trainer filter
    if (trainerFilter !== 'all') {
      if (trainerFilter === 'unassigned') {
        filtered = filtered.filter(member => 
          !member.assignedTrainerId && !member.assigned_trainer_id
        );
      } else {
        filtered = filtered.filter(member => 
          member.assignedTrainerId === trainerFilter || 
          member.assigned_trainer_id === trainerFilter
        );
      }
    }

    setFilteredMembers(filtered);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [members, searchTerm, statusFilter, subscriptionFilter, trainerFilter]);

  // Pagination logic
  const paginateMembers = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredMembers.slice(startIndex, endIndex);
    
    setPaginatedMembers(paginated);
    setTotalPages(Math.ceil(filteredMembers.length / itemsPerPage));
  }, [filteredMembers, currentPage, itemsPerPage]);

  useEffect(() => {
    loadMembers();

    // Check if we're converting from an enquiry
    if (location.state?.convertFromEnquiry && location.state?.enquiryData) {
      setEnquiryToConvert(location.state.enquiryData);
      setIsAddDialogOpen(true);
      // Clear the location state to prevent re-opening
      window.history.replaceState({}, document.title);
    }

    // Listen for member data updates from other pages (like receipts)
    const handleMemberDataUpdate = async () => {
      console.log('🔄 Member data updated from another page, refreshing Members list...');
      setTimeout(async () => {
        console.log('🔄 Executing delayed member refresh...');
        await loadMembers();
      }, 250);
    };

    window.addEventListener('memberDataUpdated', handleMemberDataUpdate);

    // Also listen for receipt operations that might affect member due amounts
    const handleReceiptUpdate = () => {
      console.log('🧾 Receipt operation detected, refreshing member data...');
      setTimeout(async () => {
        await loadMembers();
      }, 300);
    };

    window.addEventListener('receiptCreated', handleReceiptUpdate);
    window.addEventListener('receiptUpdated', handleReceiptUpdate);
    window.addEventListener('receiptDeleted', handleReceiptUpdate);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('memberDataUpdated', handleMemberDataUpdate);
      window.removeEventListener('receiptCreated', handleReceiptUpdate);
      window.removeEventListener('receiptUpdated', handleReceiptUpdate);
      window.removeEventListener('receiptDeleted', handleReceiptUpdate);
    };
  }, [loadMembers, location.state?.convertFromEnquiry, location.state?.enquiryData]);

  useEffect(() => {
    filterMembers();
  }, [filterMembers]);

  useEffect(() => {
    paginateMembers();
  }, [paginateMembers]);

  const handlePartialSave = async (partialData: unknown) => {
    try {
      console.log('🔵 MEMBERS PAGE: Saving partial member:', partialData);
      console.log('🔵 MEMBERS PAGE: Required fields check:', {
        name: !!partialData.name,
        mobileNo: !!partialData.mobileNo,
        email: !!partialData.email,
        occupation: !!partialData.occupation,
        sex: !!partialData.sex,
        dateOfBirth: !!partialData.dateOfBirth,
        address: !!partialData.address
      });
      
      const result = await db.savePartialMember(partialData);
      console.log('🔵 MEMBERS PAGE: Save result:', result);
      
      if (result.success) {
        console.log('🔵 MEMBERS PAGE: Save successful, reloading members...');
        await loadMembers();
        setIsAddDialogOpen(false);
        setEnquiryToConvert(null);
        
        toast({
          title: "Member Details Saved",
          description: `${partialData.name}'s basic information has been saved. You can complete their membership details later.`,
        });
      } else {
        console.log('🔴 MEMBERS PAGE: Save failed:', result.error);
        throw new Error(result.error || 'Failed to save partial member');
      }
    } catch (error) {
      console.error('🔴 MEMBERS PAGE: Error saving partial member:', error);
      toast({
        title: "Error",
        description: "Failed to save member details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = async (memberData: Omit<LegacyMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('🔵 FRONTEND: handleAddMember called for:', memberData.name);
      let success = false;
      let memberId = '';

      // If converting from enquiry, use the conversion method
      if (enquiryToConvert) {
        const result = await db.convertEnquiryToMember(enquiryToConvert.id, memberData);
        success = result.success;
        memberId = result.memberId || '';

        if (!success) {
          throw new Error(result.error || 'Failed to convert enquiry to member');
        }
      } else {
        success = await db.createMember(memberData);
      }

      if (success) {
        setTimeout(async () => {
          await loadMembers();
          window.dispatchEvent(new CustomEvent('memberDataUpdated'));
        }, 300);

        setIsAddDialogOpen(false);
        setEnquiryToConvert(null);

        const totalFees = (memberData.registrationFee || 0) + (memberData.packageFee || 0) - (memberData.discount || 0);
        const paidAmount = memberData.paidAmount || 0;
        const dueAmount = Math.max(0, totalFees - paidAmount);

        let receiptMessage = '';
        if (paidAmount > 0) {
          if (dueAmount > 0) {
            receiptMessage = ` A receipt has been generated for partial payment of ₹${paidAmount} (Due: ₹${dueAmount}).`;
          } else {
            receiptMessage = ` A receipt has been generated for full payment of ₹${paidAmount}.`;
          }
        }

        const conversionMessage = enquiryToConvert ? ' Enquiry has been successfully converted to member.' : '';

        toast({
          title: enquiryToConvert ? "Enquiry Converted" : "Member Added",
          description: `${memberData.name} has been ${enquiryToConvert ? 'converted to member' : 'added'} successfully.${receiptMessage}${conversionMessage}`,
        });
      } else {
        throw new Error('Failed to create member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: `Failed to ${enquiryToConvert ? 'convert enquiry' : 'add member'}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleEditMember = async (memberData: Omit<LegacyMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedMember) return;

    try {
      console.log('🔄 Updating member with data:', memberData);
      console.log('🔄 Original member data:', selectedMember);

      // Check if this is a partial member being completed
      const isPartialMemberCompletion = selectedMember.status === 'partial' && memberData.status !== 'partial';
      
      // Check if payment-related fields have changed
      const paymentFieldsChanged =
        memberData.paidAmount !== selectedMember.paidAmount ||
        memberData.membershipFees !== selectedMember.membershipFees ||
        memberData.registrationFee !== selectedMember.registrationFee ||
        memberData.packageFee !== selectedMember.packageFee ||
        memberData.discount !== selectedMember.discount ||
        memberData.planType !== selectedMember.planType;

      console.log('💰 Payment field comparison:', {
        paidAmount: { old: selectedMember.paidAmount, new: memberData.paidAmount, changed: memberData.paidAmount !== selectedMember.paidAmount },
        membershipFees: { old: selectedMember.membershipFees, new: memberData.membershipFees, changed: memberData.membershipFees !== selectedMember.membershipFees },
        registrationFee: { old: selectedMember.registrationFee, new: memberData.registrationFee, changed: memberData.registrationFee !== selectedMember.registrationFee },
        packageFee: { old: selectedMember.packageFee, new: memberData.packageFee, changed: memberData.packageFee !== selectedMember.packageFee },
        discount: { old: selectedMember.discount, new: memberData.discount, changed: memberData.discount !== selectedMember.discount },
        planType: { old: selectedMember.planType, new: memberData.planType, changed: memberData.planType !== selectedMember.planType }
      });

      console.log('💰 Payment fields changed:', paymentFieldsChanged);

      const success = await db.updateMember(selectedMember.id, memberData);
      if (success) {
        // Only create receipt if there's an actual NEW payment being made
        // For partial member completion: only if paid amount > 0 and no previous payment
        // For regular updates: only if paid amount has actually increased
        const hasNewPayment = (memberData.paidAmount || 0) > (selectedMember.paidAmount || 0);
        const shouldCreateReceipt = paymentFieldsChanged && hasNewPayment;

        if (shouldCreateReceipt) {
          console.log('💰 Creating receipt for NEW payment...');
          console.log('💰 Payment increase:', {
            old: selectedMember.paidAmount || 0,
            new: memberData.paidAmount || 0,
            increase: (memberData.paidAmount || 0) - (selectedMember.paidAmount || 0)
          });

          try {
            // Use the createMembershipReceipt method with 'update' type
            const receiptCreated = await db.createMembershipReceipt({
              ...memberData,
              id: selectedMember.id,
              member_id: selectedMember.id,
              name: memberData.name || selectedMember.name,
              customMemberId: memberData.customMemberId || selectedMember.customMemberId,
              custom_member_id: memberData.customMemberId || selectedMember.customMemberId,
              registration_fee: memberData.registrationFee || selectedMember.registrationFee || 0,
              package_fee: memberData.packageFee || memberData.membershipFees || selectedMember.packageFee || selectedMember.membershipFees || 0,
              discount: memberData.discount || selectedMember.discount || 0,
              paid_amount: memberData.paidAmount || selectedMember.paidAmount || 0,
              paidAmount: memberData.paidAmount || selectedMember.paidAmount || 0,
              plan_type: memberData.planType || selectedMember.planType,
              payment_mode: memberData.paymentMode || selectedMember.paymentMode,
              mobile_no: memberData.mobileNo || selectedMember.mobileNo,
              email: memberData.email || selectedMember.email,
              subscription_start_date: memberData.subscriptionStartDate || selectedMember.subscriptionStartDate,
              subscription_end_date: memberData.subscriptionEndDate || selectedMember.subscriptionEndDate,
            }, user?.name || 'System', 'update');

            if (receiptCreated) {
              console.log('✅ Member update receipt created successfully');

              // Dispatch receipt creation event
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('receiptCreated'));
              }, 100);
            } else {
              console.warn('⚠️ Failed to create member update receipt');
            }
          } catch (receiptError) {
            console.error('❌ Error creating member update receipt:', receiptError);
            // Don't fail the member update if receipt creation fails
          }
        } else {
          console.log('ℹ️ Skipping receipt creation - no payment change or amount is 0');
        }

        await loadMembers();
        setIsEditDialogOpen(false);
        setSelectedMember(null);

        const receiptMessage = shouldCreateReceipt ? ' A receipt has been generated for the payment changes.' : '';
        const updateMessage = isPartialMemberCompletion 
          ? `${memberData.name}'s membership has been completed successfully.${receiptMessage}`
          : `${memberData.name} has been updated successfully.${receiptMessage}`;

        toast({
          title: isPartialMemberCompletion ? "Membership Completed" : "Member Updated",
          description: updateMessage,
        });
      } else {
        throw new Error('Failed to update member');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "Error",
        description: "Failed to update member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      const success = await db.deleteMember(
        memberToDelete.id, 
        user?.name || 'System', 
        'Member deletion via Members page'
      );
      if (success) {
        await loadMembers();
        setIsDeleteDialogOpen(false);
        setMemberToDelete(null);
        toast({
          title: "Member Deleted",
          description: `${memberToDelete.name} has been moved to deleted members. You can restore it from the Deleted Members page if needed.`,
          variant: "destructive",
        });
      } else {
        throw new Error('Failed to delete member');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "Error",
        description: "Failed to delete member. Please try again.",
        variant: "destructive",
      });
    }
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getDueStatus = (member: Member & { dueAmount?: number; unpaidInvoices?: number }) => {
    return (member.dueAmount || member.due_amount || 0) > 0;
  };

  const parseServices = (services: string | string[] | undefined): string[] => {
    if (!services) return [];
    if (Array.isArray(services)) return services;
    try {
      return JSON.parse(services);
    } catch {
      return [services];
    }
  };

  // Member category cards
  const memberCategories = [
    {
      id: 'all-members',
      title: 'All Members',
      description: 'Complete member database with all details',
      icon: Users,
      color: 'bg-blue-600',
      count: filteredMembers.length
    },
    {
      id: 'active-members',
      title: 'Active Members',
      description: 'Currently active gym members',
      icon: UserCheck,
      color: 'bg-green-600',
      count: filteredMembers.filter(m => m.status === 'active').length
    },
    {
      id: 'inactive-members',
      title: 'Inactive Members',
      description: 'Members with inactive status (not expired)',
      icon: Activity,
      color: 'bg-red-600',
      count: filteredMembers.filter(m => m.status === 'inactive' && m.subscriptionStatus !== 'expired').length
    },
    {
      id: 'expired-members',
      title: 'Expired Members',
      description: 'Members with expired subscriptions',
      icon: Calendar,
      color: 'bg-gray-600',
      count: filteredMembers.filter(m => m.subscriptionStatus === 'expired').length
    },
    {
      id: 'due-members',
      title: 'Members with Dues',
      description: 'Members with outstanding payments',
      icon: DollarSign,
      color: 'bg-orange-600',
      count: filteredMembers.filter(m => getDueStatus(m)).length
    }
  ];

  const openMembersListDialog = () => {
    setShowMembersListDialog(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {sidebarState === 'collapsed' && <SidebarTrigger />}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Members Management</h1>
              <p className="text-muted-foreground">Comprehensive member management and reporting</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={loadMembers}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center mt-4">
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
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subscriptions</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={trainerFilter} onValueChange={setTrainerFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trainers</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {trainers.map((trainer) => (
                <SelectItem key={trainer.id} value={trainer.id}>
                  {trainer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Member Categories */}
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Member Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2">
              {memberCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div 
                    key={category.id}
                    className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 ${category.color} rounded-full`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">{category.title}</h4>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                        {category.count}
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {category.count === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Members ({filteredMembers.length})</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Due Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                            <AvatarImage src={member.memberImage} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {getInitials(member.name || '')}
                            </AvatarFallback>
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
                        <Badge className={getStatusColor(member.subscriptionStatus === 'expired' ? 'expired' : (member.status || 'inactive'))}>
                          {member.subscriptionStatus === 'expired' ? 'expired' : (member.status || 'inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.subscriptionStatus === 'active' ? 'default' : 
                                       member.subscriptionStatus === 'expiring_soon' ? 'secondary' :
                                       member.subscriptionStatus === 'pending' ? 'outline' : 
                                       'destructive'}
                               className={member.subscriptionStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-300' : ''}>
                          {member.subscriptionStatus === 'expiring_soon' ? 'Expiring Soon' : 
                           member.subscriptionStatus === 'pending' ? 'Pending' :
                           member.subscriptionStatus || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getDueStatus(member) ? (
                          <span className="text-red-600 font-medium">
                            ₹{member.dueAmount || member.due_amount || 0}
                          </span>
                        ) : (
                          <span className="text-green-600">Paid</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setMemberToDelete(member);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
                    </div>
                    <div className="flex items-center gap-2">
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
                        {/* Show page numbers */}
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
                  </div>
                )}
              </>
            )}
            
            {!loading && filteredMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <MemberForm
            onSubmit={handleAddMember}
            onPartialSave={handlePartialSave}
            enquiryData={enquiryToConvert}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <MemberForm
              initialData={selectedMember}
              onSubmit={handleEditMember}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <MemberDetails
        member={selectedMember!}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setSelectedMember(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{memberToDelete?.name}</strong>?
              This action cannot be undone and will permanently remove all member data.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setMemberToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteMember}
              >
                Delete Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};