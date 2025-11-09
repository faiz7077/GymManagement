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
  private static readonly DEFAULT_GYM_INFO = {
    name: 'PRIME FITNESS and HEALTH POINT',
    address: '71 Tarani Colony, B/h Forest Office',
    phone: '8109750604',
    email: 'PRIMEFITNESSPOINT@GMAIL.COM'
  };

  // Helper method to load logo as base64
  private static async loadLogoAsBase64(): Promise<string | null> {
    try {
      const response = await fetch('/Mono-1.png');
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  }

  // Helper function to convert number to words
  private static numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let result = convert(rupees) + ' Rupees';
    if (paise > 0) {
      result += ' and ' + convert(paise) + ' Paise';
    }
    return result + ' Only';
  }

  static async generateSalaryReceiptPDF(data: SalaryReceiptData): Promise<Blob> {
    const { receipt, staff, salaryDetails } = data;
    const gymInfo = this.DEFAULT_GYM_INFO;

    // Calculate amounts
    const baseSalary = salaryDetails.baseSalary || 0;
    const bonus = salaryDetails.bonus || 0;
    const deductions = salaryDetails.deductions || 0;
    const totalAmount = salaryDetails.finalAmount || receipt.amount || (baseSalary + bonus - deductions);

    // Load logo
    const logoBase64 = await this.loadLogoAsBase64();

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const lineHeight = 6;
    let y = 20;

    // === HEADER WITH LOGO ON LEFT ===
    const headerStartY = y;
    
    if (logoBase64) {
      try {
        // Add logo on the left (28mm width, auto height)
        // Offset logo up by 5mm to align with gym name text
        const logoWidth = 28;
        const logoX = 15;
        const logoY = y - 5; // Move logo up to align with text baseline
        pdf.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, 0, undefined, 'FAST');
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }

    // Gym info in center (starting after logo)
    const gymInfoX = 50;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(gymInfo.name, gymInfoX, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    y += lineHeight + 2;
    pdf.text(gymInfo.address, gymInfoX, y);
    y += lineHeight;
    pdf.text(gymInfo.phone, gymInfoX, y);
    y += lineHeight;
    pdf.text(gymInfo.email, gymInfoX, y);

    // Right-side header info (receipt number and date)
    pdf.setFont('helvetica', 'bold');
    pdf.text('Receipt No:', pageWidth - 70, headerStartY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.receipt_number || '---', pageWidth - 40, headerStartY);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Date:', pageWidth - 70, headerStartY + 6);
    pdf.setFont('helvetica', 'normal');
    const receiptDate = receipt.created_at ? new Date(receipt.created_at) : new Date();
    pdf.text(format(receiptDate, 'dd-MMM-yyyy'), pageWidth - 40, headerStartY + 6);

    y += 12;

    // === STAFF INFO ===
    pdf.setDrawColor(0);
    pdf.rect(15, y, pageWidth - 30, 16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Name:', 20, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(staff.name || 'N/A', 40, y + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Staff ID:', pageWidth / 2, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`#${staff.id.substring(0, 8)}`, pageWidth / 2 + 25, y + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Mail ID:', 20, y + 12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(staff.email || 'NA', 40, y + 12);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Mobile No:', pageWidth / 2, y + 12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(staff.phone || 'N/A', pageWidth / 2 + 25, y + 12);

    y += 22;

    // === SALARY DETAILS SECTION (TWO COLUMNS) ===
    const boxStartY = y;
    pdf.rect(15, boxStartY, (pageWidth - 30) / 2, 90);
    pdf.rect(15 + (pageWidth - 30) / 2, boxStartY, (pageWidth - 30) / 2, 90);

    const leftX = 20;
    const rightX = pageWidth / 2 + 5;
    const lineGap = 8;
    let leftY = boxStartY + 8;

    // LEFT COLUMN - Salary Details
    pdf.setFont('helvetica', 'bold');
    pdf.text('Salary Period:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(salaryDetails.month, leftX + 35, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Role:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(staff.role.charAt(0).toUpperCase() + staff.role.slice(1), leftX + 35, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Joining Date:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    const joiningDate = staff.joiningDate ? new Date(staff.joiningDate) : null;
    pdf.text(joiningDate && isValid(joiningDate) ? format(joiningDate, 'dd-MMM-yyyy') : 'N/A', leftX + 35, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Receipt Type:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    const receiptTypeText = salaryDetails.receiptType.charAt(0).toUpperCase() + salaryDetails.receiptType.slice(1);
    pdf.text(receiptTypeText, leftX + 35, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Pay Mode:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text((receipt.payment_type || 'Cash').toUpperCase(), leftX + 35, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Pay Details:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    const payDetailsStartX = leftX + 35;
    const maxPayDetailsWidth = (pageWidth / 2) - payDetailsStartX - 10;
    const payDetailsText = receipt.description || 'N/A';
    let payDetailsLines = pdf.splitTextToSize(payDetailsText, maxPayDetailsWidth);
    
    // Limit to 2 lines max and truncate if needed
    if (payDetailsLines.length > 2) {
      payDetailsLines = [payDetailsLines[0], payDetailsLines[1].substring(0, 30) + '...'];
    }
    
    pdf.text(payDetailsLines, payDetailsStartX, leftY);
    leftY += lineGap * payDetailsLines.length;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Paid By:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.created_by || 'Admin', leftX + 35, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amt In Word:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const amountInWords = this.numberToWords(totalAmount);
    const wordLines = pdf.splitTextToSize(amountInWords, 70);
    pdf.text(wordLines, leftX + 35, leftY);
    pdf.setFontSize(11);

    // Calculate remaining space in box and ensure Note fits inside
    const boxMaxY = boxStartY + 90 - 5; // 5mm padding from bottom
    const spaceForNote = boxMaxY - leftY;
    const wordLinesSpace = lineGap * wordLines.length;
    
    // Use smaller spacing if needed to fit Note inside box
    if (leftY + wordLinesSpace + lineGap * 1.5 > boxMaxY) {
      leftY += Math.min(wordLinesSpace, spaceForNote - lineGap * 1.5);
    } else {
      leftY += wordLinesSpace;
    }
    
    // Add extra padding before Note field
    leftY += lineGap * 0.5;
    
    // Only add Note if it fits inside the box
    if (leftY + lineGap <= boxMaxY) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Note:', leftX, leftY);
      pdf.setFont('helvetica', 'normal');
      pdf.text('N/A', leftX + 20, leftY);
    }

    // RIGHT COLUMN - Amount Breakdown
    const labelX = rightX + 5;
    let ry = boxStartY + 8;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Base Salary', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.text(baseSalary.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bonus', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.text(bonus.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Deductions', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.text(deductions.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap * 2;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.text(totalAmount.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    y = boxStartY + 100;

    // === TERMS ===
    pdf.setFont('helvetica', 'bold');
    pdf.text('Terms and Conditions:', 20, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('1) This is a salary receipt for the mentioned period.', 20, y + 6);
    pdf.text('2) Please verify all details and report any discrepancies within 7 days.', 20, y + 12);
    pdf.text('3) This receipt is valid for tax and accounting purposes.', 20, y + 18);

    pdf.setDrawColor(150);
    pdf.line(15, 285, pageWidth - 15, 285);

    return pdf.output('blob');
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
