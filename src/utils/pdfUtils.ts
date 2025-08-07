import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Receipt } from './database';
import { format } from 'date-fns';

export interface PDFGenerationOptions {
  receipt: Receipt;
  gymName?: string;
  gymAddress?: string;
  gymPhone?: string;
  gymEmail?: string;
}

export class ReceiptPDFGenerator {
  private static readonly DEFAULT_GYM_INFO = {
    name: 'Prime Fitness Health Point ',
    address: '123 Fitness Street, Gym City, GC 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@fitzonegym.com'
  };

  static async generateReceiptPDF(options: PDFGenerationOptions): Promise<Blob> {
    const { receipt } = options;
    const gymInfo = {
      ...this.DEFAULT_GYM_INFO,
      name: options.gymName || this.DEFAULT_GYM_INFO.name,
      address: options.gymAddress || this.DEFAULT_GYM_INFO.address,
      phone: options.gymPhone || this.DEFAULT_GYM_INFO.phone,
      email: options.gymEmail || this.DEFAULT_GYM_INFO.email,
    };

    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Colors
    const redColor = [220, 38, 38]; // Red
    const blackColor = [0, 0, 0]; // Black
    const darkRedColor = [153, 27, 27]; // Dark red
    const lightRedColor = [254, 242, 242]; // Light red background
    const grayColor = [107, 114, 128]; // Gray
    
    let currentY = 20;
    
    // Header with red background
    pdf.setFillColor(...redColor);
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // Gym name in white
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(26);
    pdf.setFont('helvetica', 'bold');
    pdf.text(gymInfo.name, pageWidth / 2, 20, { align: 'center' });
    
    // Receipt title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    pdf.text('PAYMENT RECEIPT', pageWidth / 2, 32, { align: 'center' });
    
    currentY = 55;
    
    // Gym info in gray
    pdf.setTextColor(...grayColor);
    pdf.setFontSize(10);
    pdf.text(gymInfo.address, pageWidth / 2, currentY, { align: 'center' });
    pdf.text(`Phone: ${gymInfo.phone} | Email: ${gymInfo.email}`, pageWidth / 2, currentY + 6, { align: 'center' });
    
    currentY += 20;
    
    // Receipt header info with red accent
    pdf.setFillColor(...lightRedColor);
    pdf.rect(15, currentY, pageWidth - 30, 35, 'F');
    pdf.setDrawColor(...redColor);
    pdf.setLineWidth(1);
    pdf.rect(15, currentY, pageWidth - 30, 35);
    
    // Receipt details
    pdf.setTextColor(...blackColor);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    
    // Left column
    pdf.text('Receipt No:', 20, currentY + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.receipt_number, 50, currentY + 10);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date & Time:', 20, currentY + 20);
    pdf.setFont('helvetica', 'normal');
    pdf.text(format(new Date(receipt.created_at), 'PPP p'), 50, currentY + 20);
    
    // Right column
    pdf.setFont('helvetica', 'bold');
    pdf.text('Processed By:', pageWidth - 80, currentY + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.created_by, pageWidth - 50, currentY + 10);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Type:', pageWidth - 80, currentY + 20);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.payment_type.toUpperCase(), pageWidth - 50, currentY + 20);
    
    currentY += 50;
    
    // Member Information Section
    pdf.setTextColor(...redColor);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MEMBER INFORMATION', 20, currentY);
    
    currentY += 10;
    
    // Member info box
    pdf.setFillColor(248, 250, 252); // Light gray background
    pdf.rect(15, currentY, pageWidth - 30, 45, 'F');
    pdf.setDrawColor(...grayColor);
    pdf.setLineWidth(0.5);
    pdf.rect(15, currentY, pageWidth - 30, 45);
    
    pdf.setTextColor(...blackColor);
    pdf.setFontSize(11);
    
    // Left column - Member details
    pdf.setFont('helvetica', 'bold');
    pdf.text('Member Name:', 20, currentY + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.member_name, 55, currentY + 10);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Member ID:', 20, currentY + 20);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.custom_member_id || receipt.member_id, 50, currentY + 20);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mobile:', 20, currentY + 30);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.mobile_no || 'N/A', 40, currentY + 30);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Email:', 20, currentY + 40);
    pdf.setFont('helvetica', 'normal');
    const emailText = receipt.email || 'N/A';
    const maxEmailWidth = 70;
    if (pdf.getTextWidth(emailText) > maxEmailWidth) {
      const emailLines = pdf.splitTextToSize(emailText, maxEmailWidth);
      pdf.text(emailLines, 35, currentY + 40);
    } else {
      pdf.text(emailText, 35, currentY + 40);
    }
    
    // Right column - Subscription details
    pdf.setFont('helvetica', 'bold');
    pdf.text('Package:', pageWidth - 100, currentY + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.plan_type || 'N/A', pageWidth - 70, currentY + 10);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Start Date:', pageWidth - 100, currentY + 20);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.subscription_start_date || 'N/A', pageWidth - 60, currentY + 20);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('End Date:', pageWidth - 100, currentY + 30);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.subscription_end_date || 'N/A', pageWidth - 60, currentY + 30);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Pay Mode:', pageWidth - 100, currentY + 40);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.payment_mode || 'N/A', pageWidth - 60, currentY + 40);
    
    currentY += 60;
    
    // Payment Breakdown Section
    pdf.setTextColor(...redColor);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT BREAKDOWN', 20, currentY);
    
    currentY += 10;
    
    // Payment breakdown box
    pdf.setFillColor(...lightRedColor);
    pdf.rect(15, currentY, pageWidth - 30, 50, 'F');
    pdf.setDrawColor(...redColor);
    pdf.setLineWidth(1);
    pdf.rect(15, currentY, pageWidth - 30, 50);
    
    pdf.setTextColor(...blackColor);
    pdf.setFontSize(11);
    
    // Left column - Fees
    pdf.setFont('helvetica', 'bold');
    pdf.text('Package Fee:', 20, currentY + 12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`$${(receipt.package_fee || 0).toFixed(2)}`, 60, currentY + 12);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Registration Fee:', 20, currentY + 22);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`$${(receipt.registration_fee || 0).toFixed(2)}`, 70, currentY + 22);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Discount:', 20, currentY + 32);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`-$${(receipt.discount || 0).toFixed(2)}`, 45, currentY + 32);
    
    // Right column - Taxes
    pdf.setFont('helvetica', 'bold');
    pdf.text('CGST:', pageWidth - 80, currentY + 12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`$${(receipt.cgst || 0).toFixed(2)}`, pageWidth - 50, currentY + 12);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('SGST:', pageWidth - 80, currentY + 22);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`$${(receipt.sigst || 0).toFixed(2)}`, pageWidth - 50, currentY + 22);
    
    // Total amount (prominent)
    const totalAmount = (receipt.registration_fee || 0) + (receipt.package_fee || 0) - (receipt.discount || 0) + (receipt.cgst || 0) + (receipt.sigst || 0);
    
    pdf.setDrawColor(...darkRedColor);
    pdf.setLineWidth(2);
    pdf.line(pageWidth - 100, currentY + 35, pageWidth - 20, currentY + 35);
    
    pdf.setTextColor(...darkRedColor);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL AMOUNT:', pageWidth - 100, currentY + 45);
    pdf.setFontSize(16);
    pdf.text(`₹${totalAmount.toFixed(2)}`, pageWidth - 50, currentY + 45);
    
    // Calculate amounts using the same logic as Members page
    const registrationFee = receipt.registration_fee || 0;
    const packageFee = receipt.package_fee || 0;
    const discount = receipt.discount || 0;
    const totalFees = Math.max(0, registrationFee + packageFee - discount);
    const amountPaid = receipt.amount_paid || receipt.amount || totalFees;
    const dueAmount = Math.max(0, totalFees - amountPaid);
    
    pdf.setTextColor(...blackColor);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AMOUNT PAID:', pageWidth - 100, currentY + 55);
    pdf.setTextColor(0, 100, 200); // Blue color
    pdf.setFontSize(14);
    pdf.text(`₹${amountPaid.toFixed(2)}`, pageWidth - 50, currentY + 55);
    
    // Due Amount (if any)
    let additionalHeight = 0;
    if (dueAmount > 0) {
      pdf.setTextColor(...blackColor);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DUE AMOUNT:', pageWidth - 100, currentY + 65);
      pdf.setTextColor(220, 38, 38); // Red color
      pdf.setFontSize(14);
      pdf.text(`₹${dueAmount.toFixed(2)}`, pageWidth - 50, currentY + 65);
      
      // Add partial payment note
      pdf.setTextColor(220, 38, 38);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('(Partial Payment - Balance Due)', pageWidth - 100, currentY + 75);
      additionalHeight = 20;
    }
    
    currentY += 65 + additionalHeight;
    
    // Transaction Description
    pdf.setTextColor(...redColor);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TRANSACTION DESCRIPTION', 20, currentY);
    
    currentY += 10;
    
    // Description box
    pdf.setFillColor(248, 250, 252);
    pdf.rect(15, currentY, pageWidth - 30, 30, 'F');
    pdf.setDrawColor(...grayColor);
    pdf.setLineWidth(0.5);
    pdf.rect(15, currentY, pageWidth - 30, 30);
    
    pdf.setTextColor(...blackColor);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const description = receipt.description || 'No description provided';
    const maxDescWidth = pageWidth - 40;
    const descriptionLines = pdf.splitTextToSize(description, maxDescWidth);
    pdf.text(descriptionLines, 20, currentY + 10);
    
    currentY += 45;
    
    // Payment Success Banner
    pdf.setFillColor(34, 197, 94); // Green background
    pdf.rect(15, currentY, pageWidth - 30, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('✓ PAYMENT SUCCESSFUL', pageWidth / 2, currentY + 10, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Thank you for your payment! This receipt has been generated for your records.', pageWidth / 2, currentY + 18, { align: 'center' });
    
    // Footer
    const footerY = pageHeight - 30;
    pdf.setDrawColor(...grayColor);
    pdf.setLineWidth(0.5);
    pdf.line(20, footerY, pageWidth - 20, footerY);
    
    pdf.setTextColor(...grayColor);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('This is a computer-generated receipt. For any queries, please contact the gym reception.', pageWidth / 2, footerY + 8, { align: 'center' });
    
    // Generate timestamp
    pdf.setFontSize(8);
    pdf.text(`Generated on: ${format(new Date(), 'PPP p')}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    
    return pdf.output('blob');
  }

  static async downloadReceiptPDF(receipt: Receipt, options?: Partial<PDFGenerationOptions>): Promise<void> {
    try {
      const pdfBlob = await this.generateReceiptPDF({
        receipt,
        ...options
      });
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${receipt.receipt_number}_${receipt.member_name.replace(/\s+/g, '_')}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF receipt');
    }
  }

  static getReceiptFileName(receipt: Receipt): string {
    const date = format(new Date(receipt.created_at), 'yyyy-MM-dd');
    const memberName = receipt.member_name.replace(/[^a-zA-Z0-9]/g, '_');
    return `${receipt.receipt_number}_${memberName}_${date}.pdf`;
  }
}

// Utility function for batch PDF generation
export async function generateMultipleReceiptPDFs(receipts: Receipt[]): Promise<Blob[]> {
  const pdfPromises = receipts.map(receipt => 
    ReceiptPDFGenerator.generateReceiptPDF({ receipt })
  );
  
  return Promise.all(pdfPromises);
}

// Utility function to create a ZIP file of multiple receipts
export async function downloadReceiptsAsZip(receipts: Receipt[]): Promise<void> {
  // This would require additional ZIP library
  // For now, we'll download them individually
  for (const receipt of receipts) {
    await ReceiptPDFGenerator.downloadReceiptPDF(receipt);
    // Add small delay to prevent browser blocking multiple downloads
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}