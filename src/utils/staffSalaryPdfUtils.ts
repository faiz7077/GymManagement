import jsPDF from 'jspdf';
import { format, isValid } from 'date-fns';
import { Receipt, LegacyStaff } from './database';

interface SalaryReceiptData {
  receipt: Receipt;
  staff: LegacyStaff;
  salaryDetails: {
    baseSalary: number;
    month: string;
    receiptType: 'salary' | 'bonus' | 'adjustment';
    bonus?: number;
    deductions?: number;
    finalAmount?: number;
  };
}

export class StaffSalaryPDFGenerator {
  static async generateSalaryReceiptPDF(data: SalaryReceiptData): Promise<Blob> {
    const { receipt, staff, salaryDetails } = data;
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set up colors
    const primaryColor = '#2563eb'; // Blue
    const secondaryColor = '#64748b'; // Gray
    const successColor = '#16a34a'; // Green
    
    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Company Logo/Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FITNESS GYM', 20, 25);
    
    // Receipt title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const receiptTitle = salaryDetails.receiptType === 'salary' ? 'SALARY RECEIPT' : 
                        salaryDetails.receiptType === 'bonus' ? 'BONUS RECEIPT' : 
                        'SALARY ADJUSTMENT RECEIPT';
    doc.text(receiptTitle, 140, 25);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Receipt details section
    let yPos = 60;
    
    // Receipt number and date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Receipt No:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.receipt_number, 60, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 140, yPos);
    doc.setFont('helvetica', 'normal');
    const receiptDate = receipt.created_at ? new Date(receipt.created_at) : new Date();
    const formattedReceiptDate = isValid(receiptDate) ? format(receiptDate, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy');
    doc.text(formattedReceiptDate, 160, yPos);
    
    yPos += 20;
    
    // Staff details section
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos - 5, 180, 50, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Staff Details', 20, yPos + 5);
    
    yPos += 15;
    doc.setFontSize(11);
    
    // Staff name
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(staff.name, 50, yPos);
    
    // Staff role
    doc.setFont('helvetica', 'bold');
    doc.text('Role:', 120, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(staff.role.charAt(0).toUpperCase() + staff.role.slice(1), 140, yPos);
    
    yPos += 12;
    
    // Staff ID and joining date
    doc.setFont('helvetica', 'bold');
    doc.text('Staff ID:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${staff.id.substring(0, 8)}`, 50, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Joining Date:', 120, yPos);
    doc.setFont('helvetica', 'normal');
    const joiningDate = staff.joiningDate ? new Date(staff.joiningDate) : new Date();
    const formattedJoiningDate = isValid(joiningDate) ? format(joiningDate, 'dd/MM/yyyy') : 'N/A';
    doc.text(formattedJoiningDate, 160, yPos);
    
    yPos += 12;
    
    // Phone and email
    doc.setFont('helvetica', 'bold');
    doc.text('Phone:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(staff.phone, 50, yPos);
    
    if (staff.email) {
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', 120, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(staff.email, 140, yPos);
    }
    
    yPos += 25;
    
    // Payment details section
    doc.setFillColor(primaryColor);
    doc.rect(15, yPos - 5, 180, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details', 20, yPos + 5);
    
    doc.setTextColor(0, 0, 0);
    yPos += 25;
    
    // Payment breakdown
    doc.setFontSize(11);
    
    // Month/Period
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Period:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(salaryDetails.month, 70, yPos);
    
    yPos += 15;
    
    // Base salary
    doc.setFont('helvetica', 'bold');
    doc.text('Base Salary:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${salaryDetails.baseSalary.toFixed(2)}`, 70, yPos);
    
    yPos += 12;
    
    // Bonus (if applicable)
    if (salaryDetails.bonus && salaryDetails.bonus > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Bonus:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(successColor);
      doc.text(`+$${salaryDetails.bonus.toFixed(2)}`, 70, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
    }
    
    // Deductions (if applicable)
    if (salaryDetails.deductions && salaryDetails.deductions > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Deductions:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 38, 38); // Red
      doc.text(`-$${salaryDetails.deductions.toFixed(2)}`, 70, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
    }
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos + 5, 190, yPos + 5);
    yPos += 15;
    
    // Final amount
    const finalAmount = salaryDetails.finalAmount || receipt.amount;
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos - 5, 180, 20, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 20, yPos + 5);
    doc.setTextColor(successColor);
    doc.text(`$${finalAmount.toFixed(2)}`, 140, yPos + 5);
    doc.setTextColor(0, 0, 0);
    
    yPos += 30;
    
    // Payment method
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Method:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    const paymentMethod = receipt.payment_type.replace('_', ' ').toUpperCase();
    doc.text(paymentMethod, 80, yPos);
    
    yPos += 15;
    
    // Description
    if (receipt.description) {
      doc.setFont('helvetica', 'bold');
      doc.text('Description:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      
      // Handle long descriptions
      const description = receipt.description;
      const maxWidth = 120;
      const lines = doc.splitTextToSize(description, maxWidth);
      doc.text(lines, 20, yPos + 10);
      yPos += (lines.length * 5) + 15;
    }
    
    // Footer
    yPos = Math.max(yPos, 250); // Ensure minimum position
    
    // Signature section
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 80, yPos);
    doc.line(130, yPos, 190, yPos);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Signature', 25, yPos + 10);
    doc.text('Staff Signature', 145, yPos + 10);
    
    yPos += 25;
    
    // Company footer
    doc.setFillColor(248, 250, 252);
    doc.rect(0, yPos, 210, 30, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor);
    doc.text('This is a computer-generated salary receipt.', 20, yPos + 10);
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, yPos + 20);
    doc.text('FITNESS GYM - Staff Payroll System', 130, yPos + 15);
    
    // Convert to blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  static async downloadSalaryReceiptPDF(data: SalaryReceiptData): Promise<void> {
    try {
      const pdfBlob = await this.generateSalaryReceiptPDF(data);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const receiptType = data.salaryDetails.receiptType;
      const fileName = `${receiptType}_receipt_${data.receipt.receipt_number}_${data.staff.name.replace(/\s+/g, '_')}.pdf`;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log(`${receiptType} receipt downloaded:`, fileName);
    } catch (error) {
      console.error('Error downloading salary receipt PDF:', error);
      throw error;
    }
  }
}

// Export convenience functions
export const generateSalaryReceiptPDF = StaffSalaryPDFGenerator.generateSalaryReceiptPDF;
export const downloadSalaryReceiptPDF = StaffSalaryPDFGenerator.downloadSalaryReceiptPDF;