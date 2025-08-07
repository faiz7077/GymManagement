import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LegacyMember, LegacyMember as Member, LegacyEnquiry, db } from '@/utils/database';
import { MemberForm } from '@/components/members/MemberForm';
import { MemberDetails } from '@/components/members/MemberDetails';
import { useLocation } from 'react-router-dom';

export const Members: React.FC = () => {
  const [members, setMembers] = useState<(Member & { dueAmount?: number; unpaidInvoices?: number })[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<(Member & { dueAmount?: number; unpaidInvoices?: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [enquiryToConvert, setEnquiryToConvert] = useState<LegacyEnquiry | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();

  const loadMembers = useCallback(async () => {
    try {
      console.log('Loading members...');
      setLoading(true);
      const memberData = await db.getAllMembersWithDueAmounts();
      console.log('Loaded members:', memberData?.length || 0);
      
      // Debug: Log members with due amounts
      const membersWithDue = memberData?.filter(m => (m.dueAmount || m.due_amount || 0) > 0) || [];
      if (membersWithDue.length > 0) {
        console.log('🔍 Members with due amounts:', membersWithDue.map(m => ({
          name: m.name,
          dueAmount: m.dueAmount,
          due_amount: m.due_amount
        })));
      }
      
      setMembers(memberData || []);
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
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    if (subscriptionFilter !== 'all') {
      filtered = filtered.filter(member => member.subscriptionStatus === subscriptionFilter);
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, statusFilter, subscriptionFilter]);

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
      // Add a small delay to ensure all database operations are complete
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
  }, [loadMembers]);

  useEffect(() => {
    filterMembers();
  }, [filterMembers]);

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
        // Add a small delay to ensure all database operations (including receipt creation) are complete
        setTimeout(async () => {
          await loadMembers(); // Reload members from database
          
          // Trigger member data update event for other components
          window.dispatchEvent(new CustomEvent('memberDataUpdated'));
        }, 300);
        
        setIsAddDialogOpen(false);
        setEnquiryToConvert(null); // Clear enquiry conversion state

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

        console.log('✅ Member created successfully:', {
          name: memberData.name,
          totalFees,
          paidAmount,
          dueAmount,
          receiptGenerated: paidAmount > 0,
          convertedFromEnquiry: !!enquiryToConvert,
          enquiryId: enquiryToConvert?.id
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
      // Check if financial fields have changed
      const financialFieldsChanged = (
        (memberData.membershipFees || 0) !== (selectedMember.membershipFees || 0) ||
        (memberData.registrationFee || 0) !== (selectedMember.registrationFee || 0) ||
        (memberData.packageFee || 0) !== (selectedMember.packageFee || 0) ||
        (memberData.discount || 0) !== (selectedMember.discount || 0) ||
        memberData.planType !== selectedMember.planType
      );

      // Check if basic member info has changed (affects receipts)
      const memberInfoChanged = (
        memberData.name !== selectedMember.name ||
        memberData.mobileNo !== selectedMember.mobileNo ||
        memberData.email !== selectedMember.email ||
        memberData.customMemberId !== selectedMember.customMemberId ||
        memberData.paymentMode !== selectedMember.paymentMode ||
        memberData.subscriptionStartDate !== selectedMember.subscriptionStartDate ||
        memberData.subscriptionEndDate !== selectedMember.subscriptionEndDate
      );

      console.log('🔄 Member update analysis:', {
        memberName: memberData.name,
        financialFieldsChanged,
        memberInfoChanged,
        oldFees: {
          registrationFee: selectedMember.registrationFee,
          packageFee: selectedMember.packageFee,
          discount: selectedMember.discount,
          planType: selectedMember.planType
        },
        newFees: {
          registrationFee: memberData.registrationFee,
          packageFee: memberData.packageFee,
          discount: memberData.discount,
          planType: memberData.planType
        }
      });

      const success = await db.updateMember(selectedMember.id, memberData);
      if (success) {
        let receiptUpdatesCount = 0;
        let receiptCreated = false;

        // Update existing receipts if financial fields or member info changed
        if (financialFieldsChanged || memberInfoChanged) {
          try {
            if (financialFieldsChanged) {
              console.log('💰 Financial fields changed - updating receipt fee structure...');
              const feeUpdateResult = await db.updateMemberReceiptsFeeStructure(selectedMember.id);
              if (feeUpdateResult.success) {
                receiptUpdatesCount = feeUpdateResult.updatedReceipts || 0;
                console.log(`✅ Updated ${receiptUpdatesCount} receipts with new fee structure`);
              } else {
                console.error('❌ Failed to update receipt fee structure:', feeUpdateResult.error);
              }
            } else if (memberInfoChanged) {
              console.log('📝 Member info changed - updating receipt information...');
              const infoUpdateResult = await db.updateMemberReceiptsInfo(selectedMember.id);
              if (infoUpdateResult.success) {
                console.log('✅ Updated receipt information for member');
              } else {
                console.error('❌ Failed to update receipt information:', infoUpdateResult.error);
              }
            }

            // Create a new receipt for the update if financial fields changed
            if (financialFieldsChanged) {
              const receiptData = {
                ...memberData,
                id: selectedMember.id,
                member_id: selectedMember.id,
              };

              const result = await db.createPlanUpdateReceipt(receiptData, user?.name || 'System');
              if (result) {
                receiptCreated = true;
                console.log('✅ Update receipt generated for member:', memberData.name);
              }
            }

            // Recalculate member totals to ensure consistency
            await db.syncMemberReceiptData(selectedMember.id);
            console.log('✅ Member totals recalculated');

          } catch (updateError) {
            console.error('❌ Failed to update receipts:', updateError);
            // Don't fail the member update if receipt updates fail
          }
        }

        // Trigger member data refresh for other components
        setTimeout(() => {
          db.triggerMemberRefresh();
          window.dispatchEvent(new CustomEvent('memberUpdated', { detail: { memberId: selectedMember.id } }));
        }, 100);

        await loadMembers(); // Reload members from database
        setIsEditDialogOpen(false);
        setSelectedMember(null);

        // Create appropriate success message
        let updateMessage = `${memberData.name} has been updated successfully.`;
        if (receiptUpdatesCount > 0) {
          updateMessage += ` ${receiptUpdatesCount} existing receipt(s) have been updated with the new fee structure.`;
        }
        if (receiptCreated) {
          updateMessage += ' A new receipt has been generated for this update.';
        }

        toast({
          title: "Member Updated",
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
      const success = await db.deleteMember(memberToDelete.id);
      if (success) {
        await loadMembers(); // Reload members from database
        setIsDeleteDialogOpen(false);
        setMemberToDelete(null);
        toast({
          title: "Member Deleted",
          description: `${memberToDelete.name} has been removed.`,
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
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getDueStatus = (member: Member & { dueAmount?: number; unpaidInvoices?: number }) => {
    // Use the database-calculated due amount for consistency
    return (member.dueAmount || member.due_amount || 0) > 0;
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Members</h1>
          <p className="text-muted-foreground">Manage your gym members</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
            </DialogHeader>
            <MemberForm 
              onSubmit={handleAddMember} 
              enquiryData={enquiryToConvert}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6 space-y-6">


        <Card>
          <CardHeader>
            <CardTitle>Member List</CardTitle>
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
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
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
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={loadMembers}
                disabled={loading}
                title="Refresh Members List"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const success = await db.refreshAllMemberDueAmounts();
                    if (success) {
                      toast({
                        title: "Success",
                        description: "All member due amounts have been refreshed.",
                      });
                    } else {
                      throw new Error('Failed to refresh due amounts');
                    }
                  } catch (error) {
                    console.error('Error refreshing due amounts:', error);
                    toast({
                      title: "Error",
                      description: "Failed to refresh due amounts. Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="gap-2"
                title="Refresh All Due Amounts"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Due Amounts
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // Test due amount calculation for members with due amounts
                    const membersWithDue = filteredMembers.filter(m => (m.dueAmount || m.due_amount || 0) > 0);
                    if (membersWithDue.length === 0) {
                      toast({
                        title: "No Due Amounts",
                        description: "No members have due amounts to test.",
                      });
                      return;
                    }

                    console.log('🧪 Testing due amount calculations...');
                    let consistentCount = 0;
                    let inconsistentCount = 0;
                    
                    for (const member of membersWithDue.slice(0, 3)) { // Test first 3 members
                      const verification = await db.verifyDueAmountConsistency(member.id);
                      
                      if (verification.isConsistent) {
                        consistentCount++;
                        console.log(`✅ ${member.name}: Due amounts are consistent (₹${verification.directCallDue})`);
                      } else {
                        inconsistentCount++;
                        console.log(`❌ ${member.name}: Due amounts are INCONSISTENT!`, verification);
                      }
                    }
                    
                    console.log(`🧪 Test Summary: ${consistentCount} consistent, ${inconsistentCount} inconsistent`);

                    toast({
                      title: "Test Complete",
                      description: `Tested ${membersWithDue.slice(0, 3).length} members: ${consistentCount} consistent, ${inconsistentCount} inconsistent. Check console for details.`,
                    });
                  } catch (error) {
                    console.error('Error testing due amounts:', error);
                    toast({
                      title: "Test Failed",
                      description: "Failed to test due amounts. Check console for details.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={loading}
                className="gap-2"
                title="Test Due Amount Calculations"
              >
                🧪 Test Due Amounts
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={updateSubscriptionStatuses}
                disabled={loading}
                title="Update Subscription Statuses"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>



            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading members...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || subscriptionFilter !== 'all' ? 'No members found matching your criteria.' : 'No members yet. Add your first member!'}
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.memberImage || undefined} className="object-cover" />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-muted-foreground">{member.mobileNo || 'No phone'}</span>
                              {member.customMemberId && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  ID: {member.customMemberId}
                                </span>
                              )}
                              <Badge className={getStatusColor(member.status || 'active')}>
                                {member.status || 'active'}
                              </Badge>
                              {member.subscriptionStatus === 'expiring_soon' && (
                                <Badge className="bg-amber-500 text-white">
                                  {(() => {
                                    const daysUntil = db.getDaysUntilExpiration(member.subscriptionEndDate);
                                    return daysUntil > 0 ? `Expires in ${daysUntil}d` : 'Expires Today';
                                  })()}
                                </Badge>
                              )}
                              {member.subscriptionStatus === 'expired' && (
                                <Badge className="bg-red-500 text-white">
                                  {(() => {
                                    const daysExpired = Math.abs(db.getDaysUntilExpiration(member.subscriptionEndDate));
                                    return `Expired ${daysExpired}d ago`;
                                  })()}
                                </Badge>
                              )}
                              {getDueStatus(member) && (
                                <Badge className="bg-red-500 text-white">
                                  Due: ₹{member.dueAmount || member.due_amount || 0}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-muted-foreground">{member.occupation || 'Not specified'}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{member.planType || 'monthly'}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">₹{member.membershipFees || 0}</span>
                              {((member.dueAmount || member.due_amount || 0) > 0) && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <Badge variant="destructive" className="text-xs">
                                    Due: ₹{member.dueAmount || member.due_amount || 0}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMemberToDelete(member);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
        {/* View Dialog - Using MemberDetails component */}
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
    </div>
  );
};