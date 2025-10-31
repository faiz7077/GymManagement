import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

// Lucide React Icons
import {
  Users, Search, Eye, RotateCcw, Trash2, RefreshCw, Calendar, 
  User, Phone, Mail, ChevronLeft, ChevronRight, AlertTriangle
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
import { Alert, AlertDescription } from '@/components/ui/alert';

// Hooks & Context
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Database & Types
import { DeletedMember, db } from '@/utils/database';

export const DeletedMembers: React.FC = () => {
  const [deletedMembers, setDeletedMembers] = useState<DeletedMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<DeletedMember[]>([]);
  const [paginatedMembers, setPaginatedMembers] = useState<DeletedMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<DeletedMember | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const [memberToRestore, setMemberToRestore] = useState<DeletedMember | null>(null);
  const [memberToPermanentDelete, setMemberToPermanentDelete] = useState<DeletedMember | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const { toast } = useToast();
  const { user } = useAuth();
  const { state: sidebarState } = useSidebar();

  const loadDeletedMembers = useCallback(async () => {
    try {
      console.log('Loading deleted members...');
      setLoading(true);
      const deletedMemberData = await db.getAllDeletedMembers();
      console.log('Loaded deleted members:', deletedMemberData?.length || 0);

      setDeletedMembers(deletedMemberData || []);
    } catch (error) {
      console.error('Error loading deleted members:', error);
      setDeletedMembers([]);
      toast({
        title: "Error",
        description: "Failed to load deleted members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterMembers = useCallback(() => {
    let filtered = deletedMembers;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.mobile_no || '').includes(searchTerm) ||
        (member.occupation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.custom_member_id && member.custom_member_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.original_member_id || '').includes(searchTerm) ||
        (member.deleted_by || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [deletedMembers, searchTerm]);

  // Pagination logic
  const paginateMembers = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredMembers.slice(startIndex, endIndex);
    
    setPaginatedMembers(paginated);
    setTotalPages(Math.ceil(filteredMembers.length / itemsPerPage));
  }, [filteredMembers, currentPage, itemsPerPage]);

  useEffect(() => {
    loadDeletedMembers();
  }, [loadDeletedMembers]);

  useEffect(() => {
    filterMembers();
  }, [filterMembers]);

  useEffect(() => {
    paginateMembers();
  }, [paginateMembers]);

  const handleRestoreMember = async () => {
    if (!memberToRestore) return;

    try {
      console.log('Restoring member:', memberToRestore.name);
      const result = await db.restoreDeletedMember(memberToRestore.id);
      
      if (result.success) {
        await loadDeletedMembers();
        setIsRestoreDialogOpen(false);
        setMemberToRestore(null);
        
        toast({
          title: "Member Restored",
          description: `${memberToRestore.name} has been restored successfully.`,
        });
      } else {
        throw new Error(result.error || 'Failed to restore member');
      }
    } catch (error) {
      console.error('Error restoring member:', error);
      toast({
        title: "Error",
        description: "Failed to restore member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async () => {
    if (!memberToPermanentDelete) return;

    try {
      console.log('Permanently deleting member:', memberToPermanentDelete.name);
      const result = await db.permanentlyDeleteMember(memberToPermanentDelete.id);
      
      if (result.success) {
        await loadDeletedMembers();
        setIsPermanentDeleteDialogOpen(false);
        setMemberToPermanentDelete(null);
        
        toast({
          title: "Member Permanently Deleted",
          description: `${memberToPermanentDelete.name}'s record has been permanently removed.`,
          variant: "destructive",
        });
      } else {
        throw new Error(result.error || 'Failed to permanently delete member');
      }
    } catch (error) {
      console.error('Error permanently deleting member:', error);
      toast({
        title: "Error",
        description: "Failed to permanently delete member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="animate-fade-in w-full overflow-hidden h-full flex flex-col">
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 w-full overflow-hidden flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {sidebarState === 'collapsed' && <SidebarTrigger />}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Deleted Members</h1>
              <p className="text-muted-foreground">View and manage deleted member records</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap w-full overflow-hidden">
          <Button
            variant="outline"
            className="gap-2"
            onClick={loadDeletedMembers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-4 items-center mt-4 w-full overflow-hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deleted members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Info Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This page shows members that have been deleted from the system. You can restore them or permanently delete their records.
          </AlertDescription>
        </Alert>

        {/* Deleted Members Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Deleted Members ({filteredMembers.length})</CardTitle>
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
                      <TableHead>Deleted Date</TableHead>
                      <TableHead>Deleted By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.member_image} />
                              <AvatarFallback>{getInitials(member.name || '')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{member.name}</span>
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                                  Deleted
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {member.custom_member_id || member.original_member_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.mobile_no}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(member.deleted_at)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {member.deleted_by}
                            </div>
                            {member.deletion_reason && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {member.deletion_reason}
                              </div>
                            )}
                          </div>
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
                                setMemberToRestore(member);
                                setIsRestoreDialogOpen(true);
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setMemberToPermanentDelete(member);
                                setIsPermanentDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} deleted members
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
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Deleted Members Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No deleted members match your search criteria.' : 'No members have been deleted yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deleted Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Member ID</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.custom_member_id || selectedMember.original_member_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Mobile</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.mobile_no}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Registration Date</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.date_of_registration ? formatDate(selectedMember.date_of_registration) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Plan Type</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.plan_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Deleted Date</label>
                  <p className="text-sm text-muted-foreground">{formatDateTime(selectedMember.deleted_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Deleted By</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.deleted_by}</p>
                </div>
              </div>
              {selectedMember.deletion_reason && (
                <div>
                  <label className="text-sm font-medium">Deletion Reason</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.deletion_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restore Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to restore <strong>{memberToRestore?.name}</strong>?
              This will move the member back to the active members list.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsRestoreDialogOpen(false);
                  setMemberToRestore(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRestoreMember}
                className="bg-green-600 hover:bg-green-700"
              >
                Restore Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={isPermanentDeleteDialogOpen} onOpenChange={setIsPermanentDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Permanently Delete Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. This will permanently delete all records of <strong>{memberToPermanentDelete?.name}</strong>.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsPermanentDeleteDialogOpen(false);
                  setMemberToPermanentDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handlePermanentDelete}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};