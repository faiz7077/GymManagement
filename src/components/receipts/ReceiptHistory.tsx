import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

// Lucide React Icons
import {
  Receipt as ReceiptIcon, Search, Eye, Calendar, Filter, RefreshCw, Download,
  ChevronLeft, ChevronRight, User, DollarSign, CreditCard, X, MessageSquare
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

// Hooks & Context
import { useToast } from '@/hooks/use-toast';

// Database & Types
import { Receipt, db } from '@/utils/database';

interface ReceiptHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptHistory: React.FC<ReceiptHistoryProps> = ({ isOpen, onClose }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [paginatedReceipts, setPaginatedReceipts] = useState<Receipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Date filters
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const { toast } = useToast();

  const loadReceipts = useCallback(async () => {
    try {
      console.log('Loading receipt history...');
      setLoading(true);
      const receiptData = await db.getAllReceipts();
      console.log('Loaded receipts:', receiptData?.length || 0);

      setReceipts(receiptData || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
      setReceipts([]);
      toast({
        title: "Error",
        description: "Failed to load receipt history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterReceipts = useCallback(() => {
    let filtered = receipts;

    // Text search filter
    if (searchTerm) {
      filtered = filtered.filter(receipt =>
        (receipt.member_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (receipt.receipt_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (receipt.custom_member_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (receipt.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (receipt.created_by || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Payment type filter
    if (paymentTypeFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.payment_type === paymentTypeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.receipt_category === categoryFilter);
    }

    // Date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(receipt => {
        const receiptDate = new Date(receipt.created_at);
        const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
        const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
        
        if (start && end) {
          return receiptDate >= start && receiptDate <= end;
        } else if (start) {
          return receiptDate >= start;
        } else if (end) {
          return receiptDate <= end;
        }
        return true;
      });
    }

    setFilteredReceipts(filtered);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [receipts, searchTerm, paymentTypeFilter, categoryFilter, startDate, endDate]);

  // Pagination logic
  const paginateReceipts = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredReceipts.slice(startIndex, endIndex);
    
    setPaginatedReceipts(paginated);
    setTotalPages(Math.ceil(filteredReceipts.length / itemsPerPage));
  }, [filteredReceipts, currentPage, itemsPerPage]);

  useEffect(() => {
    if (isOpen) {
      loadReceipts();
    }
  }, [isOpen, loadReceipts]);

  useEffect(() => {
    filterReceipts();
  }, [filterReceipts]);

  useEffect(() => {
    paginateReceipts();
  }, [paginateReceipts]);

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

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case 'cash': return 'bg-green-100 text-green-800 border-green-300';
      case 'upi': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'card': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'bank_transfer': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'member': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'staff_salary': return 'bg-green-100 text-green-800 border-green-300';
      case 'staff_bonus': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5" />
              Receipt History
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search receipts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="flex gap-2">
                <div>
                  <Label>Start Date</Label>
                  <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-40 justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'MMM dd, yyyy') : 'Start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setIsStartDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-40 justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'MMM dd, yyyy') : 'End date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setIsEndDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {(startDate || endDate) && (
                  <Button variant="outline" size="sm" onClick={clearDateFilters} className="mt-6">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Payment Type Filter */}
              <div>
                <Label>Payment Type</Label>
                <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="staff_salary">Staff Salary</SelectItem>
                    <SelectItem value="staff_bonus">Staff Bonus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Items per page */}
              <div>
                <Label>Per Page</Label>
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
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={loadReceipts} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Summary */}
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <div className="flex gap-6">
                <div>
                  <span className="text-sm text-muted-foreground">Total Receipts:</span>
                  <span className="ml-2 font-semibold">{filteredReceipts.length}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total Amount:</span>
                  <span className="ml-2 font-semibold text-green-600">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative">
                {loading ? (
                  <div className="flex justify-center items-center py-8 min-h-[400px]">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading receipt history...</p>
                    </div>
                  </div>
                ) : (
                  <Table className="min-w-[800px]">
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="bg-background">Receipt #</TableHead>
                        <TableHead className="bg-background">Member</TableHead>
                        <TableHead className="bg-background">Amount</TableHead>
                        <TableHead className="bg-background">Payment Type</TableHead>
                        <TableHead className="bg-background">Category</TableHead>
                        <TableHead className="bg-background">Date</TableHead>
                        <TableHead className="bg-background">Created By</TableHead>
                        <TableHead className="bg-background">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedReceipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell className="font-medium">
                            {receipt.receipt_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{receipt.member_name}</div>
                              {receipt.custom_member_id && (
                                <div className="text-sm text-muted-foreground">
                                  ID: {receipt.custom_member_id}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-green-600">
                              ₹{receipt.amount?.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPaymentTypeColor(receipt.payment_type)}>
                              {receipt.payment_type?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(receipt.receipt_category || 'member')}>
                              {receipt.receipt_category?.replace('_', ' ').toUpperCase() || 'MEMBER'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDateTime(receipt.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {receipt.created_by}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedReceipt(receipt);
                                  setIsViewDialogOpen(true);
                                }}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  try {
                                    const { ReceiptPDFGenerator } = await import('@/utils/pdfUtils');
                                    await ReceiptPDFGenerator.downloadReceiptPDF(receipt);
                                    toast({
                                      title: "PDF Downloaded",
                                      description: `Receipt ${receipt.receipt_number} downloaded successfully.`,
                                    });
                                  } catch (error) {
                                    console.error('Error downloading receipt:', error);
                                    toast({
                                      title: "Download Failed",
                                      description: "Failed to download receipt PDF.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  if (!receipt.mobile_no) {
                                    toast({
                                      title: "No Phone Number",
                                      description: "This receipt doesn't have a phone number associated.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  try {
                                    // Load receipt template from settings
                                    const gymName = await db.getSetting('gym_name') || 'Prime Fitness Health Point';
                                    const template = await db.getSetting('whatsapp_receipt_template') || 
                                      'Hi {member_name}, we\'ve received ₹{amount_paid}. Receipt #{receipt_number} is attached. Thank you for choosing {gym_name}! 🎉';
                                    
                                    // Replace placeholders with actual data
                                    const message = template
                                      .replace(/{member_name}/g, receipt.member_name)
                                      .replace(/{amount_paid}/g, (receipt.amount_paid || receipt.amount).toFixed(2))
                                      .replace(/{receipt_number}/g, receipt.receipt_number)
                                      .replace(/{gym_name}/g, gymName)
                                      .replace(/{member_phone}/g, receipt.mobile_no || '')
                                      .replace(/{member_id}/g, receipt.custom_member_id || '')
                                      .replace(/{due_amount}/g, (receipt.due_amount || 0).toFixed(2))
                                      .replace(/{start_date}/g, receipt.subscription_start_date || '')
                                      .replace(/{end_date}/g, receipt.subscription_end_date || '')
                                      .replace(/{plan_type}/g, receipt.plan_type || '');

                                    // Open WhatsApp with pre-filled message
                                    const phone = receipt.mobile_no.replace(/\D/g, '');
                                    const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
                                    window.open(whatsappUrl, '_blank');
                                    
                                    toast({
                                      title: "WhatsApp Opened",
                                      description: `Opening WhatsApp chat with ${receipt.member_name}`,
                                    });
                                  } catch (error) {
                                    console.error('Error opening WhatsApp:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to open WhatsApp.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                title="Send via WhatsApp"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              
              {/* Scroll indicator */}
              <div className="text-xs text-muted-foreground text-center py-2 border-t bg-muted/30">
                <span className="inline-flex items-center gap-1">
                  💡 Tip: Scroll horizontally for more columns, vertically for more rows
                </span>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReceipts.length)} of {filteredReceipts.length} receipts
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

              {!loading && filteredReceipts.length === 0 && (
                <div className="text-center py-8">
                  <ReceiptIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Receipts Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || startDate || endDate || paymentTypeFilter !== 'all' || categoryFilter !== 'all'
                      ? 'No receipts match your search criteria.'
                      : 'No receipts have been created yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Receipt Details</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!selectedReceipt) return;
                    try {
                      const { ReceiptPDFGenerator } = await import('@/utils/pdfUtils');
                      await ReceiptPDFGenerator.downloadReceiptPDF(selectedReceipt);
                      toast({
                        title: "PDF Downloaded",
                        description: `Receipt ${selectedReceipt.receipt_number} downloaded successfully.`,
                      });
                    } catch (error) {
                      console.error('Error downloading receipt:', error);
                      toast({
                        title: "Download Failed",
                        description: "Failed to download receipt PDF.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!selectedReceipt) return;
                    if (!selectedReceipt.mobile_no) {
                      toast({
                        title: "No Phone Number",
                        description: "This receipt doesn't have a phone number associated.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    try {
                      // Load receipt template from settings
                      const gymName = await db.getSetting('gym_name') || 'Prime Fitness Health Point';
                      const template = await db.getSetting('whatsapp_receipt_template') || 
                        'Hi {member_name}, we\'ve received ₹{amount_paid}. Receipt #{receipt_number} is attached. Thank you for choosing {gym_name}! 🎉';
                      
                      // Replace placeholders with actual data
                      const message = template
                        .replace(/{member_name}/g, selectedReceipt.member_name)
                        .replace(/{amount_paid}/g, (selectedReceipt.amount_paid || selectedReceipt.amount).toFixed(2))
                        .replace(/{receipt_number}/g, selectedReceipt.receipt_number)
                        .replace(/{gym_name}/g, gymName)
                        .replace(/{member_phone}/g, selectedReceipt.mobile_no || '')
                        .replace(/{member_id}/g, selectedReceipt.custom_member_id || '')
                        .replace(/{due_amount}/g, (selectedReceipt.due_amount || 0).toFixed(2))
                        .replace(/{start_date}/g, selectedReceipt.subscription_start_date || '')
                        .replace(/{end_date}/g, selectedReceipt.subscription_end_date || '')
                        .replace(/{plan_type}/g, selectedReceipt.plan_type || '');

                      // Open WhatsApp with pre-filled message
                      const phone = selectedReceipt.mobile_no.replace(/\D/g, '');
                      const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                      
                      toast({
                        title: "WhatsApp Opened",
                        description: `Opening WhatsApp chat with ${selectedReceipt.member_name}`,
                      });
                    } catch (error) {
                      console.error('Error opening WhatsApp:', error);
                      toast({
                        title: "Error",
                        description: "Failed to open WhatsApp.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send via WhatsApp
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Receipt Number</label>
                  <p className="text-sm text-muted-foreground">{selectedReceipt.receipt_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Member Name</label>
                  <p className="text-sm text-muted-foreground">{selectedReceipt.member_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Member ID</label>
                  <p className="text-sm text-muted-foreground">{selectedReceipt.custom_member_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <p className="text-sm font-semibold text-green-600">₹{selectedReceipt.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Type</label>
                  <p className="text-sm text-muted-foreground">{selectedReceipt.payment_type?.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedReceipt.receipt_category?.replace('_', ' ').toUpperCase() || 'MEMBER'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created Date</label>
                  <p className="text-sm text-muted-foreground">{formatDateTime(selectedReceipt.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created By</label>
                  <p className="text-sm text-muted-foreground">{selectedReceipt.created_by}</p>
                </div>
              </div>
              {selectedReceipt.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground">{selectedReceipt.description}</p>
                </div>
              )}
              {selectedReceipt.mobile_no && (
                <div>
                  <label className="text-sm font-medium">Mobile Number</label>
                  <p className="text-sm text-muted-foreground">{selectedReceipt.mobile_no}</p>
                </div>
              )}
              {selectedReceipt.email && (
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{selectedReceipt.email}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};