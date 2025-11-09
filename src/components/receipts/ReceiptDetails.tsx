import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  MessageSquare
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Receipt, db } from '@/utils/database';
import { ReceiptPDFGenerator } from '@/utils/pdfUtils';
import { useToast } from '@/hooks/use-toast';
// 

interface ReceiptDetailsProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void; // Callback to refresh receipt data
}

export const ReceiptDetails: React.FC<ReceiptDetailsProps> = ({ receipt, isOpen, onClose, onRefresh }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [receiptHistory, setReceiptHistory] = useState<Receipt[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { toast } = useToast();

  // Debug: Log receipt data when component receives it
  React.useEffect(() => {
    if (receipt && isOpen) {
      console.log('ReceiptDetails received receipt data:', {
        receipt_number: receipt.receipt_number,
        amount: receipt.amount,
        amount_paid: receipt.amount_paid,
        due_amount: receipt.due_amount
      });
    }
  }, [receipt, isOpen]);

  // Load receipt history for the member
  const loadReceiptHistory = async (memberId: string) => {
    setIsLoadingHistory(true);
    try {
      console.log('Loading receipt history for member:', memberId);
      const history = await db.getReceiptsByMemberId(memberId);
      console.log('Receipt history loaded:', history.length, 'receipts');
      setReceiptHistory(history);
    } catch (error) {
      console.error('Error loading receipt history:', error);
      setReceiptHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Refresh receipt data when dialog opens
  useEffect(() => {
    if (isOpen && onRefresh) {
      onRefresh();
    }
    
    // Load receipt history when dialog opens and receipt is available
    if (isOpen && receipt?.member_id) {
      loadReceiptHistory(receipt.member_id);
    }
  }, [isOpen, onRefresh, receipt?.member_id]);

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
          <title>Receipt - ${receipt.receipt_number}</title>
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
            <h2>Payment Receipt</h2>
          </div>
          <div class="receipt-details">
            <table>
              <tr>
                <td>Receipt Number:</td>
                <td><strong>${receipt.receipt_number}</strong></td>
              </tr>
              <tr>
                <td>Date & Time:</td>
                <td>${(() => {
        try {
          const date = new Date(receipt.created_at);
          return isValid(date) ? format(date, 'PPP p') : 'Invalid Date';
        } catch {
          return 'Invalid Date';
        }
      })()}</td>
              </tr>
              <tr>
                <td>Member Name:</td>
                <td>${receipt.member_name}</td>
              </tr>
              <tr>
                <td>Payment Type:</td>
                <td><span class="payment-type">${receipt.payment_type}</span></td>
              </tr>
              <tr>
                <td>Amount Paid:</td>
                <td><div class="amount">₹${receipt.amount.toFixed(2)}</div></td>
              </tr>
              ${(receipt.cgst || 0) > 0 || (receipt.sigst || 0) > 0 ? `
              <tr>
                <td>CGST:</td>
                <td>₹${(receipt.cgst || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST:</td>
                <td>₹${(receipt.sigst || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Total Tax:</td>
                <td><strong>₹${((receipt.cgst || 0) + (receipt.sigst || 0)).toFixed(2)}</strong></td>
              </tr>
              ` : ''}
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
            <p><strong>Thank you for your payment!</strong></p>
            <p>This is a computer-generated receipt.</p>
            <p>For any queries, please contact the gym reception.</p>
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
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToSystem = async () => {
    try {
      setIsSaving(true);

      // Generate PDF blob
      const pdfBlob = await ReceiptPDFGenerator.generateReceiptPDF({ receipt });
      const arrayBuffer = await pdfBlob.arrayBuffer();

      // Save to system
      const result = await db.saveReceiptPDF(receipt, arrayBuffer);

      if (result.success) {
        toast({
          title: "Receipt Saved",
          description: `Receipt saved to system as ${result.filename}`,
        });
      } else {
        throw new Error(result.error || 'Failed to save receipt');
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save receipt to system. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
                <h2 className="text-xl font-bold">Receipt Details</h2>
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
                className="flex items-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Send via WhatsApp</span>
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
                  <p className="text-3xl font-bold text-green-600">₹{receipt.amount.toFixed(2)}</p>
                  <Badge className={`${getPaymentTypeColor(receipt.payment_type)} mt-1`}>
                    <span className="flex items-center space-x-1">
                      {getPaymentTypeIcon(receipt.payment_type)}
                      <span>{receipt.payment_type.toUpperCase()}</span>
                    </span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Member Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Member Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">{receipt.member_name}</h4>
                      <p className="text-sm text-muted-foreground">Member ID: {receipt.custom_member_id || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Mobile: {receipt.mobile_no || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Email: {receipt.email || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Package: {receipt.plan_type || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Start: {receipt.subscription_start_date || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">End: {receipt.subscription_end_date || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Pay Mode: {receipt.payment_mode || 'N/A'}</p>
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
                      <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        ₹{receipt.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                      <p className="text-xl font-bold text-blue-600 mt-1">
                        ₹{(receipt.amount_paid || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Due Amount</p>
                      <p className={`text-xl font-bold mt-1 ${
                        (receipt.due_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ₹{(receipt.due_amount || 0).toFixed(2)}
                      </p>
                      {(receipt.due_amount || 0) > 0 && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Partial Payment
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Package Fee</p>
                      <p className="text-sm mt-1">₹{(receipt.package_fee || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Registration Fee</p>
                      <p className="text-sm mt-1">₹{(receipt.registration_fee || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Discount</p>
                      <p className="text-sm mt-1">-₹{(receipt.discount || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CGST</p>
                      <p className="text-sm mt-1">₹{(receipt.cgst || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">SIGST</p>
                      <p className="text-sm mt-1">₹{(receipt.sigst || 0).toFixed(2)}</p>
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
              {/* Transaction Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Transaction Description</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                    <p className="text-sm leading-relaxed">{receipt.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Details */}
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
                      <span className="text-sm font-medium">Member ID</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        {receipt.custom_member_id || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Start Date</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        {receipt.subscription_start_date || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">End Date</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        {receipt.subscription_end_date || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Package</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        {receipt.plan_type || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Pay Mode</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        {receipt.payment_mode || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Mobile No.</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        {receipt.mobile_no || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Email</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        {receipt.email || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Package Fee</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        ₹{(receipt.package_fee || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Registration Fee</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        ₹{(receipt.registration_fee || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Discount</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        -₹{(receipt.discount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">CGST</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        ₹{(receipt.cgst || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">SIGST</span>
                      <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                        ₹{(receipt.sigst || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Amount Paid</span>
                      <span className="text-sm font-mono bg-blue-50 px-3 py-1 rounded text-blue-800">
                        ₹{(receipt.amount_paid || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-muted">
                      <span className="text-sm font-medium">Due Amount</span>
                      <span className={`text-sm font-mono px-3 py-1 rounded ${
                        (receipt.due_amount || 0) > 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                      }`}>
                        ₹{(receipt.due_amount || 0).toFixed(2)}
                      </span>
                    </div>
                    {((receipt.cgst || 0) > 0 || (receipt.sigst || 0) > 0) && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">CGST</span>
                          <span className="text-sm font-mono bg-yellow-50 px-3 py-1 rounded text-yellow-800">
                            ₹{(receipt.cgst || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">SGST</span>
                          <span className="text-sm font-mono bg-yellow-50 px-3 py-1 rounded text-yellow-800">
                            ₹{(receipt.sigst || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="text-sm font-medium">Total Tax</span>
                          <span className="text-sm font-mono bg-orange-50 px-3 py-1 rounded text-orange-800">
                            ₹{((receipt.cgst || 0) + (receipt.sigst || 0)).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium">Generated</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(receipt.created_at, 'PPP p')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Receipt History */}
          {receiptHistory.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Receipt History for {receipt.member_name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoadingHistory ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading history...</p>
                    </div>
                  ) : (
                    receiptHistory.map((historyReceipt, index) => (
                      <div 
                        key={historyReceipt.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          historyReceipt.id === receipt.id 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-muted/30 border-muted'
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            historyReceipt.id === receipt.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted-foreground text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {historyReceipt.id === receipt.id ? 'Current Receipt' : `Receipt #${historyReceipt.receipt_number}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(historyReceipt.created_at, 'PPP')} • {historyReceipt.payment_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-sm font-bold">₹{(historyReceipt.amount_paid || historyReceipt.amount).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {historyReceipt.description?.includes('New') ? 'New' : 
                               historyReceipt.description?.includes('Renewal') ? 'Renewal' : 
                               historyReceipt.description?.includes('update') ? 'Update' : 'Payment'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await ReceiptPDFGenerator.downloadReceiptPDF(historyReceipt);
                                  toast({
                                    title: "PDF Downloaded",
                                    description: `Receipt ${historyReceipt.receipt_number} downloaded successfully.`,
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
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total Receipts:</span>
                    <span>{receiptHistory.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total Amount Paid:</span>
                    <span className="font-bold">
                      ₹{receiptHistory.reduce((sum, r) => sum + (r.amount_paid || r.amount), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <p className="text-lg font-semibold text-green-800">Payment Successful</p>
                </div>
                <p className="text-sm text-green-700">
                  Thank you for your payment! This receipt has been generated for your records.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};