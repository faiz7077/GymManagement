import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { LegacyStaff, db } from '@/utils/database';
import { StaffForm } from '@/components/staff/StaffForm';
import { StaffDetails } from '@/components/staff/StaffDetails';

export const Staff: React.FC = () => {
  const [staff, setStaff] = useState<LegacyStaff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<LegacyStaff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<LegacyStaff | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<LegacyStaff | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const staffData = await db.getAllStaff();
      setStaff(staffData || []);
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaff([]);
      toast({
        title: "Error",
        description: "Failed to load staff. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterStaff = useCallback(() => {
    let filtered = staff;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, statusFilter, roleFilter]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    filterStaff();
  }, [filterStaff]);

  const handleAddStaff = async (staffData: Omit<LegacyStaff, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Attempting to create staff with data:', staffData);
      const success = await db.createStaff(staffData);
      console.log('Staff creation result:', success);
      
      if (success) {
        await loadStaff();
        setIsAddDialogOpen(false);
        toast({
          title: "Staff Added",
          description: `${staffData.name} has been added successfully.${staffData.salary > 0 ? ' Initial salary receipt has been generated.' : ''}`,
        });
      } else {
        console.error('Staff creation returned false');
        throw new Error('Failed to create staff - database operation returned false');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error",
        description: `Failed to add staff: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleEditStaff = async (staffData: Omit<LegacyStaff, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedStaff) return;

    try {
      const salaryUpdated = staffData.salary !== undefined && selectedStaff && staffData.salary !== selectedStaff.salary;
      const success = await db.updateStaff(selectedStaff.id, staffData);
      
      if (success) {
        await loadStaff();
        setIsEditDialogOpen(false);
        setSelectedStaff(null);
        
        toast({
          title: "Staff Updated",
          description: `${staffData.name} has been updated successfully.${salaryUpdated ? ' Salary adjustment receipt has been generated.' : ''}`,
        });
      } else {
        throw new Error('Failed to update staff');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: "Error",
        description: "Failed to update staff. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;

    try {
      const success = await db.deleteStaff(staffToDelete.id);
      if (success) {
        await loadStaff();
        setIsDeleteDialogOpen(false);
        setStaffToDelete(null);
        toast({
          title: "Staff Deleted",
          description: `${staffToDelete.name} has been removed.`,
          variant: "destructive",
        });
      } else {
        throw new Error('Failed to delete staff');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'trainer': return 'bg-blue-100 text-blue-800';
      case 'receptionist': return 'bg-green-100 text-green-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Staff</h1>
          <p className="text-muted-foreground">Manage your gym staff</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Staff</DialogTitle>
            </DialogHeader>
            <StaffForm onSubmit={handleAddStaff} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Staff List</CardTitle>
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
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
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading staff...
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' ? 'No staff found matching your criteria.' : 'No staff yet. Add your first staff member!'}
                </div>
              ) : (
                filteredStaff.map((member) => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.profileImage || undefined} className="object-cover" />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-muted-foreground">{member.phone}</span>
                              <Badge className={getStatusColor(member.status)}>
                                {member.status}
                              </Badge>
                              <Badge className={getRoleColor(member.role)}>
                                {member.role}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(member);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(member);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setStaffToDelete(member);
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <StaffForm
                initialData={selectedStaff}
                onSubmit={handleEditStaff}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* View Dialog - Using StaffDetails component */}
        <StaffDetails 
          staff={selectedStaff}
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false);
            setSelectedStaff(null);
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Staff</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete <strong>{staffToDelete?.name}</strong>?
                This action cannot be undone and will permanently remove all staff data.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setStaffToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteStaff}
                >
                  Delete Staff
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};