import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Receipt as ReceiptIcon,
  User,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  Download,
  UserCheck,
  FolderOpen,
  Printer,
  Briefcase
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Receipt, LegacyStaff as Staff, db } from '@/utils/database';
import { useToast } from '@/hooks/use-toast';
import { StaffSalaryPDFGenerator } from '@/utils/staffSalaryPdfUtils';

interface StaffSalaryDetailsProps {
  receipt: Receipt | null;
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffSalaryDetails: React.FC<StaffSalaryDetailsProps> = ({ receipt, staff, isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  if (!receipt) return null;

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
      case 'staff_salary': return 'SALARY PAYMENT';
      case 'staff_bonus': return 'BONUS PAYMENT';
      case 'staff_salary_update': return 'SALARY ADJUSTMENT';
      default: return 'STAFF PAYMENT';
    }
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'card':
        return 'bg-blue-100 text-blue-800';
      case 'upi':
        return 'bg-purple-100 text-purple-800';
      case 'bank_transfer':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeIcon = (paymentType: string) => {
    switch (paymentType) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'upi':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const handlePrintReceipt = async () => {
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
          <title>Staff Salary Receipt - ${receipt.receipt_number}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header .logo {
              max-width: 150px;
              height: auto;
              margin-bottom: 15px;
            }
            .header h1 { 
              margin: 0; 
              color: #333; 
              font-size: 28px;
            }
            .header h2 { 
              margin: 5px 0 0 0; 
              color: #666; 
              font-size: 18px;
              font-weight: normal;
            }
            .receipt-details { 
              margin-bottom: 20px; 
            }
            .receipt-details table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            }
            .receipt-details td { 
              padding: 12px 8px; 
              border-bottom: 1px solid #eee; 
              vertical-align: top;
            }
            .receipt-details td:first-child { 
              font-weight: bold; 
              width: 150px; 
              color: #333;
            }
            .receipt-details td:last-child {
              color: #555;
            }
            .amount { 
              font-size: 24px; 
              font-weight: bold; 
              color: #2563eb; 
              background: #f0f9ff;
              padding: 10px;
              border-radius: 5px;
              text-align: center;
            }
            .payment-type {
              display: inline-block;
              background: #e5e7eb;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              font-size: 12px; 
              color: #666; 
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            .description-box {
              background: #f9fafb;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #2563eb;
              margin: 10px 0;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
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
              <tr>
                <td>Receipt Number:</td>
                <td><strong>${receipt.receipt_number}</strong></td>
              </tr>
              <tr>
                <td>Date & Time:</td>
                <td>${formatDate(receipt.created_at, 'PPP p')}</td>
              </tr>
              <tr>
                <td>Staff Name:</td>
                <td>${receipt.member_name}</td>
              </tr>
              <tr>
                <td>Staff Role:</td>
                <td>${staff?.role || 'Staff'}</td>
              </tr>
              <tr>
                <td>Receipt Type:</td>
                <td><span class="payment-type">${getReceiptTypeLabel(receipt.receipt_category || 'staff_salary')}</span></td>
              </tr>
              <tr>
                <td>Payment Type:</td>
                <td><span class="payment-type">${receipt.payment_type}</span></td>
              </tr>
              <tr>
                <td>Amount Paid:</td>
                <td><div class="amount">$${receipt.amount.toFixed(2)}</div></td>
              </tr>
              <tr>
                <td>Processed By:</td>
                <td>${receipt.created_by}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px;">
              <strong>Description:</strong>
              <div class="description-box">
                ${receipt.description}
              </div>
            </div>
          </div>
          <div class="footer">
            <p><strong>Thank you for your service!</strong></p>
            <p>This is a computer-generated receipt.</p>
            <p>For any queries, please contact the gym administration.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      await StaffSalaryPDFGenerator.downloadSalaryReceiptPDF({
        receipt,
        staff,
        salaryDetails: {
          baseSalary: receipt.amount,
          month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          receiptType: receipt.receipt_category === 'staff_salary' ? 'salary' : 
                      receipt.receipt_category === 'staff_bonus' ? 'bonus' : 'adjustment'
        }
      });
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
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenReceiptsFolder = async () => {
    try {
      const result = await db.openReceiptsFolder();
      if (!result.success) {
        throw new Error(result.error || 'Failed to open receipts folder');
      }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ReceiptIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Staff Salary Receipt</h2>
                <p className="text-sm text-muted-foreground font-normal">
                  {receipt.receipt_number}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintReceipt}
                className="flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-6 pr-2">
          {/* Receipt Summary Header */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/20 rounded-full">
                    <ReceiptIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary">{receipt.receipt_number}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(receipt.created_at, 'PPP p')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Processed by {receipt.created_by}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-3xl font-bold text-green-600">${receipt.amount.toFixed(2)}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getReceiptTypeColor(receipt.receipt_category || 'staff_salary')}>
                      {getReceiptTypeLabel(receipt.receipt_category || 'staff_salary')}
                    </Badge>
                    <Badge className={`${getPaymentTypeColor(receipt.payment_type)} mt-1`}>
                      <span className="flex items-center space-x-1">
                        {getPaymentTypeIcon(receipt.payment_type)}
                        <span>{receipt.payment_type.toUpperCase()}</span>
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Staff Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Staff Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">{receipt.member_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {staff?.role || 'Staff'} • {staff?.status || 'Active'}
                      </p>
                      {staff?.salary && (
                        <p className="text-sm text-muted-foreground">
                          Base Salary: ${staff.salary.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Payment Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                      <Badge className={`${getPaymentTypeColor(receipt.payment_type)} mt-1`}>
                        <span className="flex items-center space-x-1">
                          {getPaymentTypeIcon(receipt.payment_type)}
                          <span>{receipt.payment_type.toUpperCase()}</span>
                        </span>
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Amount</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        ${receipt.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                      <p className="text-sm mt-1">
                        {formatDate(receipt.created_at, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Time</p>
                      <p className="text-sm mt-1">
                        {formatDate(receipt.created_at, 'hh:mm a')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Processed By</p>
                    <p className="text-sm mt-1">{receipt.created_by}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Payment Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Payment Description</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                    <p className="text-sm leading-relaxed">{receipt.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Receipt Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ReceiptIcon className="h-5 w-5" />
                    <span>Receipt Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Receipt Number</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        {receipt.receipt_number}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Receipt Type</span>
                      <Badge className={getReceiptTypeColor(receipt.receipt_category || 'staff_salary')}>
                        {getReceiptTypeLabel(receipt.receipt_category || 'staff_salary')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Status</span>
                      <Badge className="bg-green-100 text-green-800">
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Completed</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium">Generated</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(receipt.created_at, 'PPP p')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Staff Employment Details */}
              {staff && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Briefcase className="h-5 w-5" />
                      <span>Employment Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium">Role</span>
                      <span className="text-sm">{staff.role}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium">Base Salary</span>
                      <span className="text-sm font-semibold">${staff.salary?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium">Joining Date</span>
                      <span className="text-sm">
                        {staff.joiningDate ? formatDate(staff.joiningDate, 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium">Status</span>
                      <Badge className={staff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {staff.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Footer Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <p className="text-lg font-semibold text-green-800">Payment Processed Successfully</p>
                </div>
                <p className="text-sm text-green-700">
                  This salary receipt has been generated for your records. Thank you for your service!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};