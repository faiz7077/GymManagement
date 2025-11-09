import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, Receipt as ReceiptIcon, FolderOpen, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Receipt, LegacyStaff as Staff, db } from '@/utils/database';
import { StaffSalaryForm } from '@/components/staffsalary/StaffSalaryForm';
import { StaffSalaryDetails } from '@/components/staffsalary/StaffSalaryDetails';
import { StaffSalaryPDFGenerator } from '@/utils/staffSalaryPdfUtils';
import { format, isValid } from 'date-fns';

export const StaffSalary: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [salaryReceipts, setSalaryReceipts] = useState<Receipt[]>([]);
    const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [receiptTypeFilter, setReceiptTypeFilter] = useState<string>('all');
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { state: sidebarState } = useSidebar();

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

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            // Load staff data
            const staffData = await db.getAllStaff();
            setStaff(staffData || []);

            // Load staff receipts
            const receiptsData = await db.getStaffReceipts();
            setSalaryReceipts(receiptsData || []);
        } catch (error) {
            console.error('Error loading data:', error);
            setStaff([]);
            setSalaryReceipts([]);
            toast({
                title: "Error",
                description: "Failed to load staff salary data. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const filterReceipts = useCallback(() => {
        let filtered = salaryReceipts;

        if (searchTerm) {
            filtered = filtered.filter(receipt =>
                receipt.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                receipt.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (receiptTypeFilter !== 'all') {
            filtered = filtered.filter(receipt => {
                switch (receiptTypeFilter) {
                    case 'salary':
                        return receipt.receipt_category === 'staff_salary';
                    case 'bonus':
                        return receipt.receipt_category === 'staff_bonus';
                    case 'adjustment':
                        return receipt.receipt_category === 'staff_salary_update';
                    default:
                        return true;
                }
            });
        }

        setFilteredReceipts(filtered);
    }, [salaryReceipts, searchTerm, receiptTypeFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        filterReceipts();
    }, [filterReceipts]);

    const handleAddSalaryReceipt = async (receiptData: { staffId?: string; amount?: number; paymentType?: 'cash' | 'card' | 'upi' | 'bank_transfer'; description?: string; receiptType?: 'salary' | 'bonus' | 'adjustment' }) => {
        // Ensure all required fields are present
        if (!receiptData.staffId || !receiptData.amount || !receiptData.paymentType || !receiptData.description || !receiptData.receiptType) {
            toast({
                title: "Error",
                description: "All fields are required to create a salary receipt.",
                variant: "destructive",
            });
            return;
        }
        try {
            const staffMember = staff.find(s => s.id === receiptData.staffId);
            if (!staffMember) {
                throw new Error('Staff member not found');
            }

            let receipt;
            if (receiptData.receiptType === 'salary') {
                receipt = await db.createStaffSalaryReceipt(staffMember, receiptData.amount, 'Admin', 'salary');
            } else if (receiptData.receiptType === 'bonus') {
                receipt = await db.createBonusReceipt(staffMember, receiptData.amount, 'Admin');
            } else {
                receipt = await db.createSalaryUpdateReceipt(staffMember, receiptData.amount, 'Admin', 0);
            }

            if (receipt) {
                await loadData();
                setIsAddDialogOpen(false);
                toast({
                    title: "Receipt Created",
                    description: `${receiptData.receiptType} receipt has been created successfully.`,
                });
            } else {
                throw new Error('Failed to create receipt');
            }
        } catch (error) {
            console.error('Error adding salary receipt:', error);
            toast({
                title: "Error",
                description: "Failed to create salary receipt. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleEditSalaryReceipt = async (receiptData: { staffId?: string; amount?: number; paymentType?: 'cash' | 'card' | 'upi' | 'bank_transfer'; description?: string; receiptType?: 'salary' | 'bonus' | 'adjustment' }) => {
        // Ensure all required fields are present
        if (!receiptData.staffId || !receiptData.amount || !receiptData.paymentType || !receiptData.description || !receiptData.receiptType) {
            toast({
                title: "Error",
                description: "All fields are required to edit a salary receipt.",
                variant: "destructive",
            });
            return;
        }
        if (!selectedReceipt) return;

        try {
            const updatedReceiptData = {
                member_name: staff.find(s => s.id === receiptData.staffId)?.name || selectedReceipt.member_name,
                amount: receiptData.amount,
                payment_type: receiptData.paymentType,
                description: receiptData.description,
                receipt_category: receiptData.receiptType === 'salary' ? 'staff_salary' :
                    receiptData.receiptType === 'bonus' ? 'staff_bonus' : 'staff_salary_update'
            };

            const success = await db.updateReceipt(selectedReceipt.id, updatedReceiptData);
            if (success) {
                await loadData();
                setIsEditDialogOpen(false);
                setSelectedReceipt(null);
                toast({
                    title: "Receipt Updated",
                    description: `${receiptData.receiptType} receipt has been updated successfully.`,
                });
            } else {
                throw new Error('Failed to update receipt');
            }
        } catch (error) {
            console.error('Error updating salary receipt:', error);
            toast({
                title: "Error",
                description: "Failed to update salary receipt. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteReceipt = async () => {
        if (!receiptToDelete) return;

        try {
            const success = await db.deleteReceipt(receiptToDelete.id);
            if (success) {
                await loadData();
                setIsDeleteDialogOpen(false);
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

    const handleDownloadPDF = async (receipt: Receipt) => {
        try {
            const staffMember = staff.find(s => s.name === receipt.member_name);
            await StaffSalaryPDFGenerator.downloadSalaryReceiptPDF({
                receipt,
                staff: staffMember,
                salaryDetails: {
                    baseSalary: receipt.amount,
                    month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    receiptType: receipt.receipt_category === 'staff_salary' ? 'salary' :
                        receipt.receipt_category === 'staff_bonus' ? 'bonus' : 'adjustment'
                }
            });
            toast({
                title: "PDF Saved",
                description: `Receipt ${receipt.receipt_number} has been saved successfully.`,
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

        const staffMember = staff.find(s => s.name === receipt.member_name);

        const printContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Staff Salary Receipt - ${receipt.receipt_number}</title>
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
                <h2>Staff Salary Receipt</h2>
              </div>
              <div class="receipt-details">
                <table>
                  <tr><td>Receipt Number:</td><td>${receipt.receipt_number}</td></tr>
                  <tr><td>Date:</td><td>${formatDate(receipt.created_at)}</td></tr>
                  <tr><td>Staff Name:</td><td>${receipt.member_name}</td></tr>
                  <tr><td>Staff Role:</td><td>${staffMember?.role || 'Staff'}</td></tr>
                  <tr><td>Receipt Type:</td><td>${getReceiptTypeLabel(receipt.receipt_category || 'staff_salary')}</td></tr>
                  <tr><td>Description:</td><td>${receipt.description}</td></tr>
                  <tr><td>Payment Type:</td><td>${receipt.payment_type.toUpperCase()}</td></tr>
                  <tr><td>Amount:</td><td class="amount">$${receipt.amount.toFixed(2)}</td></tr>
                  <tr><td>Created By:</td><td>${receipt.created_by}</td></tr>
                </table>
              </div>
              <div class="footer">
                <p>Thank you for your service!</p>
                <p>This is a computer-generated receipt.</p>
              </div>
            </body>
          </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const getReceiptTypeColor = (receiptCategory: string) => {
        switch (receiptCategory) {
            case 'staff_salary': return 'bg-green-100 text-green-800';
            case 'staff_bonus': return 'bg-blue-100 text-blue-800';
            case 'staff_salary_update': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getReceiptTypeLabel = (receiptCategory: string) => {
        switch (receiptCategory) {
            case 'staff_salary': return 'SALARY';
            case 'staff_bonus': return 'BONUS';
            case 'staff_salary_update': return 'ADJUSTMENT';
            default: return 'PAYMENT';
        }
    };

    const getTotalAmount = () => {
        return filteredReceipts.reduce((total, receipt) => total + receipt.amount, 0);
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

    return (
        <div className="animate-fade-in">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {sidebarState === 'collapsed' && <SidebarTrigger />}
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gym-primary to-primary-glow bg-clip-text text-transparent">Staff Salary</h1>
                        <p className="text-muted-foreground">Manage staff salary payments, bonuses, and receipts</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        onClick={handleOpenReceiptsFolder}
                        className="gap-2"
                    >
                        <FolderOpen className="h-4 w-4" />
                        Open Receipts Folder
                    </Button>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Salary Receipt
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Salary Receipt</DialogTitle>
                            </DialogHeader>
                            <StaffSalaryForm staff={staff} onSubmit={handleAddSalaryReceipt} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{staff.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {staff.filter(s => s.status === 'active').length} active staff
                            </p>
                        </CardContent>
                    </Card>
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
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">${getTotalAmount().toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bank Transfers</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {filteredReceipts.filter(r => r.payment_type === 'bank_transfer').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Staff Salary Receipt List</CardTitle>
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
                            <Select value={receiptTypeFilter} onValueChange={setReceiptTypeFilter}>
                                <SelectTrigger className="w-40">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="salary">Salary</SelectItem>
                                    <SelectItem value="bonus">Bonus</SelectItem>
                                    <SelectItem value="adjustment">Adjustment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Loading salary receipts...
                                </div>
                            ) : filteredReceipts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {searchTerm || receiptTypeFilter !== 'all' ? 'No receipts found matching your criteria.' : 'No salary receipts yet. Create your first salary receipt!'}
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
                                                        <h3 className="font-semibold text-foreground">{receipt.receipt_number}</h3>
                                                        <p className="text-sm text-muted-foreground">{receipt.member_name}</p>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className="text-sm text-muted-foreground">
                                                                {formatDate(receipt.created_at)}
                                                            </span>
                                                            <Badge className={getReceiptTypeColor(receipt.receipt_category || 'staff_salary')}>
                                                                {getReceiptTypeLabel(receipt.receipt_category || 'staff_salary')}
                                                            </Badge>
                                                            <span className="text-lg font-semibold text-green-600">
                                                                ${receipt.amount.toFixed(2)}
                                                            </span>
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
                            <DialogTitle>Edit Salary Receipt</DialogTitle>
                        </DialogHeader>
                        {selectedReceipt && (
                            <StaffSalaryForm
                                staff={staff}
                                onSubmit={handleEditSalaryReceipt}
                                initialData={{
                                    staffId: staff.find(s => s.name === selectedReceipt.member_name)?.id || '',
                                    amount: selectedReceipt.amount,
                                    paymentType: selectedReceipt.payment_type as 'cash' | 'card' | 'upi' | 'bank_transfer',
                                    receiptType: selectedReceipt.receipt_category === 'staff_salary' ? 'salary' :
                                        selectedReceipt.receipt_category === 'staff_bonus' ? 'bonus' : 'adjustment',
                                    description: selectedReceipt.description
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                {/* View Dialog */}
                <StaffSalaryDetails
                    receipt={selectedReceipt}
                    staff={selectedReceipt ? staff.find(s => s.name === selectedReceipt.member_name) : null}
                    isOpen={isViewDialogOpen}
                    onClose={() => {
                        setIsViewDialogOpen(false);
                        setSelectedReceipt(null);
                    }}
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
            </div>
        </div>
    );
};