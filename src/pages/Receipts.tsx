import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, Receipt as ReceiptIcon, FolderOpen, RefreshCw, History } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Receipt, db } from '@/utils/database';
import { ReceiptForm } from '@/components/receipts/ReceiptForm';
import { ReceiptDetails } from '@/components/receipts/ReceiptDetails';
import { ReceiptPDFGenerator } from '@/utils/pdfUtils';
import { format, isValid } from 'date-fns';

export const Receipts: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [receiptHistory, setReceiptHistory] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefilledMember, setPrefilledMember] = useState<unknown>(null);
  const { toast } = useToast();
  const { state: sidebarState } = useSidebar();
  const location = useLocation();

  // Safe date formatting function
  const formatDate = (dateString: string, formatStr: string = 'PPP') => {
    try {
      if (!dateString) return 'Invalid Date';
      const date = new Date(dateString);
      if (!isValid(date)) return 'Invalid Date';
      return format(date, formatStr);
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', dateString);
      return 'Invalid Date';
    }
  };

  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const receiptData = await db.getAllReceipts();

      // Debug: Check if receipts have amount_paid and due_amount
      // console.log('Loaded receipts with amount data:', receiptData.slice(0, 2).map(r => ({
      //   receipt_number: r.receipt_number,
      //   amount: r.amount,
      //   amount_paid: r.amount_paid,
      //   due_amount: r.due_amount
      // })));

      // Filter to show only member receipts (exclude staff receipts)
      const memberReceipts = receiptData.filter(receipt =>
        !receipt.receipt_category || receipt.receipt_category === 'member'
      );


      // Sort receipts by creation date in descending order (newest first)
      const sortedReceipts = memberReceipts.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      setReceipts(sortedReceipts || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
      setReceipts([]);
      toast({
        title: "Error",
        description: "Failed to load receipts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterReceipts = useCallback(() => {
    let filtered = receipts;

    if (searchTerm) {
      filtered = filtered.filter(receipt =>
        receipt.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (paymentTypeFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.payment_type === paymentTypeFilter);
    }

    // Ensure filtered results are also sorted by creation date (newest first)
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, paymentTypeFilter]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  useEffect(() => {
    filterReceipts();
  }, [filterReceipts]);

  // Handle navigation state from MemberDetails
  useEffect(() => {
    if (location.state?.selectedMember && location.state?.openForm) {
      setPrefilledMember(location.state.selectedMember);
      setIsAddDialogOpen(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleAddReceipt = async (receiptData: Omit<Receipt, 'id'>) => {
    try {
      const success = await db.createReceipt(receiptData);

      if (success) {
        // Sync member and receipt data if this was a member receipt
        if (receiptData.member_id) {
          await db.syncMemberReceiptData(receiptData.member_id);
        }

        await loadReceipts();
        setIsAddDialogOpen(false);

        // Add a small delay to ensure database operations complete
        setTimeout(() => {
          // Trigger member refresh to update due amounts
          db.triggerMemberRefresh();
          // Also trigger receipt-specific event
          window.dispatchEvent(new CustomEvent('receiptCreated'));
        }, 100);

        toast({
          title: "Receipt Created",
          description: `Receipt ${receiptData.receipt_number} has been created successfully.`,
        });
      } else {
        throw new Error('Failed to create receipt');
      }
    } catch (error) {
      console.error('Error adding receipt:', error);
      toast({
        title: "Error",
        description: "Failed to create receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMemberUpdate = async (memberId: string) => {
    // This callback is called when member data is updated during receipt creation
    console.log('Member updated:', memberId);
    // Refresh receipts to get updated data
    await loadReceipts();
  };

  const handleReceiptRefresh = async () => {
    // Refresh the receipt list and update selected receipt
    await loadReceipts();
    if (selectedReceipt) {
      // Find the updated receipt in the new list
      const updatedReceipts = await db.getAllReceipts();
      const updatedReceipt = updatedReceipts.find(r => r.id === selectedReceipt.id);
      if (updatedReceipt) {
        setSelectedReceipt(updatedReceipt);
      }
    }
  };

  const handleEditReceipt = async (receiptData: Partial<Receipt>) => {
    if (!selectedReceipt) return;

    try {
      console.log('🔄 Creating new receipt version instead of updating existing one');
      
      // Instead of updating, create a new receipt with the updated data
      const success = await db.createReceiptVersion(selectedReceipt.id, receiptData);
      
      if (success) {
        // Sync member and receipt data if this was a member receipt
        if (selectedReceipt.member_id) {
          await db.syncMemberReceiptData(selectedReceipt.member_id);
        }

        await loadReceipts();
        setIsEditDialogOpen(false);

        // Add a small delay to ensure database operations complete
        setTimeout(() => {
          // Trigger member refresh to update due amounts
          db.triggerMemberRefresh();
          // Also trigger receipt-specific event
          window.dispatchEvent(new CustomEvent('receiptUpdated'));
        }, 100);

        setSelectedReceipt(null);

        toast({
          title: "Receipt Updated",
          description: `New receipt version created. Original receipt preserved in history.`,
        });
      } else {
        throw new Error('Failed to create receipt version');
      }
    } catch (error) {
      console.error('Error creating receipt version:', error);
      toast({
        title: "Error",
        description: "Failed to update receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;

    try {
      const success = await db.deleteReceipt(receiptToDelete.id);
      if (success) {
        // Sync member and receipt data if this was a member receipt
        if (receiptToDelete.member_id) {
          await db.syncMemberReceiptData(receiptToDelete.member_id);
        }

        await loadReceipts();
        setIsDeleteDialogOpen(false);

        // Add a small delay to ensure database operations complete
        setTimeout(() => {
          // Trigger member refresh to update due amounts
          db.triggerMemberRefresh();
          // Also trigger receipt-specific event
          window.dispatchEvent(new CustomEvent('receiptDeleted'));
        }, 100);

        setReceiptToDelete(null);

        toast({
          title: "Receipt Deleted",
          description: `Receipt ${receiptToDelete.receipt_number} has been deleted.`,
          variant: "destructive",
        });
      } else {
        throw new Error('Failed to delete receipt');
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast({
        title: "Error",
        description: "Failed to delete receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'upi': return 'bg-purple-100 text-purple-800';
      case 'bank_transfer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalAmount = () => {
    return filteredReceipts.reduce((total, receipt) => total + receipt.amount, 0);
  };

  const handleDownloadPDF = async (receipt: Receipt) => {
    try {
      await ReceiptPDFGenerator.downloadReceiptPDF(receipt);
      toast({
        title: "PDF Downloaded",
        description: `Receipt ${receipt.receipt_number} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download PDF receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = async (receipt: Receipt) => {
    try {
      console.log('📋 Loading receipt history for:', receipt.id);
      const history = await db.getReceiptHistory(receipt.original_receipt_id || receipt.id);
      setReceiptHistory(history);
      setSelectedReceipt(receipt);
      setIsHistoryDialogOpen(true);
      
      toast({
        title: "Receipt History",
        description: `Found ${history.length} version(s) of this receipt.`,
      });
    } catch (error) {
      console.error('Error loading receipt history:', error);
      toast({
        title: "Error",
        description: "Failed to load receipt history. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenReceiptsFolder = async () => {
    try {
      const result = await db.openReceiptsFolder();
      if (!result.success) {
        throw new Error(result.error || 'Failed to open receipts folder');
      }
      toast({
        title: "Folder Opened",
        description: "Receipts folder has been opened in your file manager.",
      });
    } catch (error) {
      console.error('Error opening receipts folder:', error);
      toast({
        title: "Error",
        description: "Failed to open receipts folder.",
        variant: "destructive",
      });
    }
  };

  const handlePrintReceipt = async (receipt: Receipt) => {
    // Load logo as base64
    let logoBase64 = '';
    try {
      const response = await fetch('/Mono-1.png');
      const blob = await response.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt.receipt_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header .logo { max-width: 150px; height: auto; margin-bottom: 15px; }
            .receipt-details { margin-bottom: 20px; }
            .receipt-details table { width: 100%; border-collapse: collapse; }
            .receipt-details td { padding: 8px; border-bottom: 1px solid #eee; }
            .receipt-details td:first-child { font-weight: bold; width: 150px; }
            .amount { font-size: 18px; font-weight: bold; color: #2563eb; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Prime Fitness Logo" class="logo" />` : ''}
            <h1>Prime Fitness Health Point </h1>
            <h2>Payment Receipt</h2>
          </div>
          <div class="receipt-details">
            <table>
              <tr><td>Receipt Number:</td><td>${receipt.receipt_number}</td></tr>
              <tr><td>Date:</td><td>${(() => {
        try {
          const date = new Date(receipt.created_at);
          return isValid(date) ? format(date, 'PPP') : 'Invalid Date';
        } catch {
          return 'Invalid Date';
        }
      })()}</td></tr>
              <tr><td>Member Name:</td><td>${receipt.member_name}</td></tr>
              <tr><td>Description:</td><td>${receipt.description}</td></tr>
              <tr><td>Payment Type:</td><td>${receipt.payment_type.toUpperCase()}</td></tr>
              <tr><td>Amount:</td><td class="amount">₹${receipt.amount.toFixed(2)}</td></tr>
              <tr><td>Created By:</td><td>${receipt.created_by}</td></tr>
            </table>
          </div>
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>This is a computer-generated receipt.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {sidebarState === 'collapsed' && <SidebarTrigger />}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Receipts</h1>
            <p className="text-muted-foreground">Manage payment receipts and transactions</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={loadReceipts}
            disabled={loading}
            className="gap-2"
            title="Refresh Receipts List"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleOpenReceiptsFolder}
            className="gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Open Receipts Folder
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                setLoading(true);

                const result = await db.fixReceiptAmounts();

                if (result.success) {
                  await loadReceipts(); // Refresh the receipts list

                  toast({
                    title: "Fix Complete",
                    description: `Fixed ${result.fixedCount || 0} receipts with proper amount display.`,
                  });
                } else {
                  throw new Error(result.error || 'Failed to fix receipt amounts');
                }
              } catch (error) {
                console.error('Error fixing receipt amounts:', error);
                toast({
                  title: "Error",
                  description: "Failed to fix receipt amounts. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="gap-2"
            title="Fix existing receipts to show proper paid and due amounts"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Fix Receipt Amounts
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Receipt</DialogTitle>
              </DialogHeader>
              <ReceiptForm 
                onSubmit={(data) => {
                  handleAddReceipt(data);
                  setPrefilledMember(null);
                }} 
                onMemberUpdate={handleMemberUpdate} 
                prefilledMember={prefilledMember}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
              <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredReceipts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{getTotalAmount().toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
              <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredReceipts.filter(r => r.payment_type === 'cash').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Digital Payments</CardTitle>
              <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredReceipts.filter(r => r.payment_type !== 'cash').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Receipt List
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredReceipts.length} receipts)
              </span>
            </CardTitle>
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search receipts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading receipts...
                </div>
              ) : filteredReceipts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || paymentTypeFilter !== 'all' ? 'No receipts found matching your criteria.' : 'No receipts yet. Create your first receipt!'}
                </div>
              ) : (
                filteredReceipts.map((receipt) => (
                  <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <ReceiptIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{receipt.receipt_number}</h3>
                              {receipt.version_number && receipt.version_number > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  v{receipt.version_number}
                                </Badge>
                              )}
                              {receipt.is_current_version === false && (
                                <Badge variant="secondary" className="text-xs">
                                  Superseded
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{receipt.member_name}</p>
                            <div className="flex items-center space-x-2 mt-1 flex-wrap">
                              <span className="text-xs text-muted-foreground">Member ID: {receipt.custom_member_id || 'Not Set'} </span>
                              {/* <span className="text-xs text-muted-foreground">Mobile: {receipt.mobile_no}</span> */}
                              {/* <span className="text-xs text-muted-foreground">Email: {receipt.email}</span> */}
                              {/* <span className="text-xs text-muted-foreground">Package: {receipt.plan_type} | </span>
                              <span className="text-xs text-muted-foreground">Start: {receipt.subscription_start_date} | </span>
                              <span className="text-xs text-muted-foreground">End: {receipt.subscription_end_date} | </span>
                              <span className="text-xs text-muted-foreground">Pay Mode: {receipt.payment_mode} | </span>
                              <span className="text-xs text-muted-foreground">Pkg Fee: {receipt.package_fee} | </span>
                              <span className="text-xs text-muted-foreground">Reg Fee: {receipt.registration_fee} |</span>
                              <span className="text-xs text-muted-foreground">Discount: {receipt.discount} | </span> */}
                              {/* <span className="text-xs text-muted-foreground">CGST: {receipt.cgst}</span> */}
                              {/* <span className="text-xs text-muted-foregrou nd">SIGST: {receipt.sigst}</span> */}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-muted-foreground">
                                {formatDate(receipt.created_at)}
                              </span>
                              <Badge className={getPaymentTypeColor(receipt.payment_type)}>
                                {receipt.payment_type.toUpperCase()}
                              </Badge>
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-semibold text-green-600">
                                  Total: ₹{receipt.amount.toFixed(2)}
                                </span>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-sm text-blue-600">
                                    Paid: ₹{(receipt.amount_paid || 0).toFixed(2)}
                                  </span>
                                  <span className={`text-sm ${(receipt.due_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    Due: ₹{(receipt.due_amount || 0).toFixed(2)}
                                  </span>
                                  {/* Debug info - remove after testing */}
                                  {process.env.NODE_ENV === 'development' && (
                                    <span className="text-xs text-gray-400">
                                      (Debug: paid={receipt.amount_paid}, due={receipt.due_amount})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(receipt)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setIsViewDialogOpen(true);
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setIsEditDialogOpen(true);
                            }}
                            title="Edit Receipt"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(receipt)}
                            title="View Receipt History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReceiptToDelete(receipt);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Delete Receipt"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">{receipt.description}</p>
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
              <DialogTitle>Edit Receipt</DialogTitle>
            </DialogHeader>
            {selectedReceipt && (
              <ReceiptForm
                initialData={selectedReceipt}
                onSubmit={handleEditReceipt}
                onMemberUpdate={handleMemberUpdate}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <ReceiptDetails
          receipt={selectedReceipt}
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false);
            setSelectedReceipt(null);
          }}
          onRefresh={handleReceiptRefresh}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Receipt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete receipt <strong>{receiptToDelete?.receipt_number}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setReceiptToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteReceipt}
                >
                  Delete Receipt
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Receipt History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Receipt History - {selectedReceipt?.receipt_number}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This shows all versions of the receipt. When a receipt is updated, a new version is created while preserving the original.
              </p>
              
              {receiptHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No history available for this receipt.</p>
              ) : (
                <div className="space-y-4">
                  {receiptHistory.map((historyReceipt, index) => (
                    <Card key={historyReceipt.id} className={`${historyReceipt.is_current_version ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={historyReceipt.is_current_version ? "default" : "secondary"}>
                              {historyReceipt.is_current_version ? 'Current Version' : `Version ${historyReceipt.version_number || index + 1}`}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Receipt #{historyReceipt.receipt_number}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(historyReceipt.created_at, 'PPp')}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPDF(historyReceipt)}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Member:</span>
                            <p className="text-muted-foreground">{historyReceipt.member_name}</p>
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span>
                            <p className="text-muted-foreground">₹{historyReceipt.amount?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Paid:</span>
                            <p className="text-green-600">₹{historyReceipt.amount_paid?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Due:</span>
                            <p className={`${(historyReceipt.due_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{historyReceipt.due_amount?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Payment Type:</span>
                            <p className="text-muted-foreground capitalize">{historyReceipt.payment_type}</p>
                          </div>
                          <div>
                            <span className="font-medium">Created By:</span>
                            <p className="text-muted-foreground">{historyReceipt.created_by}</p>
                          </div>
                          {historyReceipt.superseded_at && (
                            <div>
                              <span className="font-medium">Superseded:</span>
                              <p className="text-muted-foreground">{formatDate(historyReceipt.superseded_at, 'PPp')}</p>
                            </div>
                          )}
                          {historyReceipt.description && (
                            <div className="col-span-2 md:col-span-4">
                              <span className="font-medium">Description:</span>
                              <p className="text-muted-foreground">{historyReceipt.description}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};