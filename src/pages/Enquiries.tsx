import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, RefreshCw, UserPlus, Calendar, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LegacyEnquiry, db } from '@/utils/database';
import { EnquiryForm } from '@/components/enquiries/EnquiryForm';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Safe date formatting function to handle invalid dates
const safeFormatDate = (dateValue: string | Date | null | undefined, formatString: string = 'MMM dd, yyyy'): string => {
  if (!dateValue) return 'Not set';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return format(date, formatString);
  } catch (error) {
    console.warn('Date formatting error:', error, 'for value:', dateValue);
    return 'Invalid date';
  }
};

export const Enquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<LegacyEnquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<LegacyEnquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<LegacyEnquiry | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<LegacyEnquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadEnquiries = useCallback(async () => {
    try {
      console.log('Loading enquiries...');
      setLoading(true);
      const enquiryData = await db.getAllEnquiries();
      console.log('Loaded enquiries:', enquiryData?.length || 0);
      setEnquiries(enquiryData || []);
    } catch (error) {
      console.error('Error loading enquiries:', error);
      setEnquiries([]);
      toast({
        title: "Error",
        description: "Failed to load enquiries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterEnquiries = useCallback(() => {
    let filtered = enquiries;

    if (searchTerm) {
      filtered = filtered.filter(enquiry =>
        (enquiry.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (enquiry.mobileNo || '').includes(searchTerm) ||
        (enquiry.occupation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (enquiry.enquiryNumber && enquiry.enquiryNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (enquiry.id || '').includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(enquiry => enquiry.status === statusFilter);
    }

    setFilteredEnquiries(filtered);
  }, [enquiries, searchTerm, statusFilter]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  useEffect(() => {
    filterEnquiries();
  }, [filterEnquiries]);

  const handleAddEnquiry = async (enquiryData: Omit<LegacyEnquiry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const success = await db.createEnquiry(enquiryData);
      if (success) {
        await loadEnquiries();
        setIsAddDialogOpen(false);
        toast({
          title: "Enquiry Added",
          description: `${enquiryData.name}'s enquiry has been added successfully.`,
        });
      } else {
        throw new Error('Failed to create enquiry');
      }
    } catch (error) {
      console.error('Error adding enquiry:', error);
      toast({
        title: "Error",
        description: "Failed to add enquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditEnquiry = async (enquiryData: Omit<LegacyEnquiry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedEnquiry) return;

    try {
      const success = await db.updateEnquiry(selectedEnquiry.id, enquiryData);
      if (success) {
        await loadEnquiries();
        setIsEditDialogOpen(false);
        setSelectedEnquiry(null);
        toast({
          title: "Enquiry Updated",
          description: `${enquiryData.name}'s enquiry has been updated successfully.`,
        });
      } else {
        throw new Error('Failed to update enquiry');
      }
    } catch (error) {
      console.error('Error updating enquiry:', error);
      toast({
        title: "Error",
        description: "Failed to update enquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEnquiry = async () => {
    if (!enquiryToDelete) return;

    try {
      const success = await db.deleteEnquiry(enquiryToDelete.id);
      if (success) {
        await loadEnquiries();
        setIsDeleteDialogOpen(false);
        setEnquiryToDelete(null);
        toast({
          title: "Enquiry Deleted",
          description: `${enquiryToDelete.name}'s enquiry has been removed.`,
          variant: "destructive",
        });
      } else {
        throw new Error('Failed to delete enquiry');
      }
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      toast({
        title: "Error",
        description: "Failed to delete enquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConvertToMember = (enquiry: LegacyEnquiry) => {
    // Navigate to members page with enquiry data
    navigate('/members', { 
      state: { 
        convertFromEnquiry: true, 
        enquiryData: enquiry 
      } 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500 text-white';
      case 'contacted': return 'bg-yellow-500 text-white';
      case 'follow_up': return 'bg-orange-500 text-white';
      case 'converted': return 'bg-green-500 text-white';
      case 'closed': return 'bg-gray-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'New';
      case 'contacted': return 'Contacted';
      case 'follow_up': return 'Follow-up';
      case 'converted': return 'Converted';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount).replace('₹', '₹');
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Enquiries</h1>
          <p className="text-muted-foreground">Manage gym enquiries and convert leads to members</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Enquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Enquiry</DialogTitle>
            </DialogHeader>
            <EnquiryForm onSubmit={handleAddEnquiry} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6 space-y-6">
        {/* Enquiry Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Enquiries</p>
                  <p className="text-2xl font-bold">{enquiries.length}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {enquiries.filter(e => e.status === 'new').length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Follow-up</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {enquiries.filter(e => e.status === 'follow_up').length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Converted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {enquiries.filter(e => e.status === 'converted').length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {enquiries.length > 0 
                      ? Math.round((enquiries.filter(e => e.status === 'converted').length / enquiries.length) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enquiry List</CardTitle>
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search enquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={loadEnquiries}
                disabled={loading}
                title="Refresh Enquiries List"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading enquiries...
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' ? 'No enquiries found matching your criteria.' : 'No enquiries yet. Add your first enquiry!'}
                </div>
              ) : (
                filteredEnquiries.map((enquiry) => (
                  <Card key={enquiry.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-foreground">{enquiry.name}</h3>
                              <Badge className={getStatusColor(enquiry.status)}>
                                {getStatusLabel(enquiry.status)}
                              </Badge>
                              {enquiry.enquiryNumber && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {enquiry.enquiryNumber}
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{enquiry.mobileNo}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{enquiry.occupation}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{safeFormatDate(enquiry.dateOfEnquiry, 'MMM dd, yyyy')}</span>
                              </div>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                              {(enquiry.interestedIn || []).map((interest, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {interest.charAt(0).toUpperCase() + interest.slice(1)}
                                </Badge>
                              ))}
                            </div>

                            {enquiry.membershipFees && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium">Membership Fees: </span>
                                <span className="text-green-600">{formatCurrency(enquiry.membershipFees)}</span>
                                <span className="text-muted-foreground ml-2">({enquiry.paymentFrequency})</span>
                              </div>
                            )}

                            {enquiry.followUpDate && (
                              <div className="mt-2 text-sm text-orange-600">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Follow-up: {safeFormatDate(enquiry.followUpDate, 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {enquiry.status !== 'converted' && enquiry.status !== 'closed' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleConvertToMember(enquiry)}
                              className="gap-1"
                            >
                              <UserPlus className="h-3 w-3" />
                              Convert
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEnquiry(enquiry);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEnquiry(enquiry);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEnquiryToDelete(enquiry);
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Enquiry</DialogTitle>
            </DialogHeader>
            {selectedEnquiry && (
              <EnquiryForm
                initialData={selectedEnquiry}
                onSubmit={handleEditEnquiry}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enquiry Details</DialogTitle>
            </DialogHeader>
            {selectedEnquiry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm">{selectedEnquiry.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Mobile</Label>
                    <p className="text-sm">{selectedEnquiry.mobileNo}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm">{selectedEnquiry.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Occupation</Label>
                    <p className="text-sm">{selectedEnquiry.occupation}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Sex</Label>
                    <p className="text-sm capitalize">{selectedEnquiry.sex}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date of Enquiry</Label>
                    <p className="text-sm">{safeFormatDate(selectedEnquiry.dateOfEnquiry, 'PPP')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusColor(selectedEnquiry.status)}>
                      {getStatusLabel(selectedEnquiry.status)}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Interested In</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedEnquiry.interestedIn || []).map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest.charAt(0).toUpperCase() + interest.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {selectedEnquiry.membershipFees && (
                    <div>
                      <Label className="text-sm font-medium">Membership Fees</Label>
                      <p className="text-sm">{formatCurrency(selectedEnquiry.membershipFees)}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Payment Mode</Label>
                    <p className="text-sm capitalize">{selectedEnquiry.paymentMode}</p>
                  </div>
                  {selectedEnquiry.notes && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm">{selectedEnquiry.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Enquiry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete <strong>{enquiryToDelete?.name}</strong>'s enquiry?
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setEnquiryToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteEnquiry}
                >
                  Delete Enquiry
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};