// import jsPDF from 'jspdf';
// import { format } from 'date-fns';
// import { Receipt } from './database';

// interface EnhancedReceipt extends Receipt {
//   tax_breakdown?: Array<{
//     id: string;
//     name: string;
//     rate: number;
//     amount: number;
//     type: 'inclusive' | 'exclusive';
//   }>;
//   tax_type?: 'inclusive' | 'exclusive' | null;
//   total_tax_amount?: number;
//   base_amount_before_tax?: number;
// }

// export interface PDFGenerationOptions {
//   receipt: EnhancedReceipt;
//   gymName?: string;
//   gymAddress?: string;
//   gymPhone?: string;
//   gymEmail?: string;
// }

// // Helper function to convert number to words
// function numberToWords(num: number): string {
//   const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
//   const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
//   const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

//   if (num === 0) return 'Zero';
  
//   const convert = (n: number): string => {
//     if (n < 10) return ones[n];
//     if (n < 20) return teens[n - 10];
//     if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
//     if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
//     if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
//     if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
//     return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
//   };

//   const rupees = Math.floor(num);
//   const paise = Math.round((num - rupees) * 100);
  
//   let result = convert(rupees) + ' Rupees';
//   if (paise > 0) {
//     result += ' and ' + convert(paise) + ' Paise';
//   }
//   return result + ' Only';
// }

// export class ReceiptPDFGenerator {
//   private static readonly DEFAULT_GYM_INFO = {
//     name: 'PRIME FITNESS and HEALTH POINT',
//     address: '71 Tarani Colony, B/h Forest Office',
//     phone: '8109750604',
//     email: 'PRIMEFITNESSPOINT@GMAIL.COM'
//   };

//   static async generateReceiptPDF(options: PDFGenerationOptions): Promise<Blob> {
//     const { receipt } = options;
//     const gymInfo = {
//       ...this.DEFAULT_GYM_INFO,
//       name: options.gymName || this.DEFAULT_GYM_INFO.name,
//       address: options.gymAddress || this.DEFAULT_GYM_INFO.address,
//       phone: options.gymPhone || this.DEFAULT_GYM_INFO.phone,
//       email: options.gymEmail || this.DEFAULT_GYM_INFO.email,
//     };

//     // Calculate amounts
//     const packageFee = receipt.package_fee || 0;
//     const registrationFee = receipt.registration_fee || 0;
//     const discount = receipt.discount || 0;
//     const cgst = receipt.cgst || 0;
//     const sgst = receipt.sigst || 0;
//     const totalGST = cgst + sgst;
    
//     // Calculate total
//     const subtotal = packageFee + registrationFee - discount;
//     const totalAmount = subtotal + totalGST;
    
//     // Get paid and balance amounts
//     const paidAmount = receipt.amount_paid || receipt.amount || totalAmount;
//     const balanceAmount = receipt.due_amount || Math.max(0, totalAmount - paidAmount);

//     // Create PDF
//     const pdf = new jsPDF('p', 'mm', 'a4');
//     const pageWidth = pdf.internal.pageSize.getWidth();

//     pdf.setFont('helvetica', 'normal');
//     pdf.setFontSize(11);
//     const lineHeight = 6;
//     let y = 20;

//     // === HEADER ===
//     pdf.setFont('helvetica', 'bold');
//     pdf.text(gymInfo.name, 20, y);
//     pdf.setFont('helvetica', 'normal');
//     y += lineHeight;
//     pdf.text(gymInfo.address, 20, y);
//     y += lineHeight;
//     pdf.text(gymInfo.phone, 20, y);
//     y += lineHeight;
//     pdf.text(gymInfo.email, 20, y);

//     // Right side details
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Receipt No:', pageWidth - 70, 20);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(receipt.receipt_number || '---', pageWidth - 40, 20);

//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Date:', pageWidth - 70, 26);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(format(new Date(receipt.created_at), 'dd-MMM-yyyy'), pageWidth - 40, 26);

//     y += 12;

//     // === MEMBER INFO ===
//     pdf.setDrawColor(0);
//     pdf.rect(15, y, pageWidth - 30, 16);
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Name:', 20, y + 6);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(receipt.member_name || 'N/A', 40, y + 6);

//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Member ID:', pageWidth / 2, y + 6);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(receipt.custom_member_id || receipt.member_id || 'N/A', pageWidth / 2 + 25, y + 6);

//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Mail ID:', 20, y + 12);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(receipt.email || 'NA', 40, y + 12);

//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Mobile No:', pageWidth / 2, y + 12);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(receipt.mobile_no || 'N/A', pageWidth / 2 + 25, y + 12);

//     y += 22;

//     // === PACKAGE DETAILS SECTION ===
//     const boxStartY = y;
//     pdf.rect(15, boxStartY, (pageWidth - 30) / 2, 90);
//     pdf.rect(15 + (pageWidth - 30) / 2, boxStartY, (pageWidth - 30) / 2, 90);

//     const leftX = 20;
//     const rightX = pageWidth / 2 + 5;
//     const lineGap = 8;
//     let leftY = boxStartY + 8;

//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Package:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(receipt.plan_type || 'Gym', leftX + 30, leftY);

//     leftY += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Duration:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     const planType = receipt.plan_type || 'monthly';
//     const durationMap: Record<string, string> = {
//       'monthly': 'Month',
//       'quarterly': 'Quarter',
//       'half_yearly': 'Half Year',
//       'yearly': 'Year'
//     };
//     pdf.text(durationMap[planType] || 'Month', leftX + 30, leftY);

//     leftY += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Start Date:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(receipt.subscription_start_date ? format(new Date(receipt.subscription_start_date), 'dd-MMM-yyyy') : 'N/A', leftX + 30, leftY);

//     leftY += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('End Date:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(receipt.subscription_end_date ? format(new Date(receipt.subscription_end_date), 'dd-MMM-yyyy') : 'N/A', leftX + 30, leftY);

//     leftY += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Next Pay Date:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(receipt.subscription_end_date ? format(new Date(receipt.subscription_end_date), 'dd-MMM-yyyy') : 'N/A', leftX + 30, leftY);

//     leftY += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Pay Mode:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text((receipt.payment_mode || receipt.payment_type || 'Cash').toUpperCase(), leftX + 30, leftY);

//     leftY += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Pay Details:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     // Calculate max width: from text start position to middle divider line minus padding
//     const payDetailsStartX = leftX + 30;
//     const maxPayDetailsWidth = (pageWidth / 2) - payDetailsStartX - 10;
//     const payDetailsLines = pdf.splitTextToSize(receipt.description || 'N/A', maxPayDetailsWidth);
//     pdf.text(payDetailsLines, payDetailsStartX, leftY);

//     // Adjust spacing based on number of lines in Pay Details
//     leftY += lineGap * Math.max(1, payDetailsLines.length);
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Executive:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(receipt.created_by || 'Admin', leftX + 30, leftY);

//     leftY += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Instructor:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text('N/A', leftX + 30, leftY);

//     leftY += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Amt In Word:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     pdf.setFontSize(9);
//     const amountInWords = numberToWords(totalAmount);
//     const wordLines = pdf.splitTextToSize(amountInWords, 70);
//     pdf.text(wordLines, leftX + 30, leftY);
//     pdf.setFontSize(11);

//     leftY += lineGap * 2;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Note:', leftX, leftY);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text('N/A', leftX + 20, leftY);

//     // === FEES TABLE (RIGHT SIDE) ===
//     const labelX = rightX + 5;
//     let ry = boxStartY + 8;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Package Fees', labelX, ry);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(packageFee.toFixed(2), pageWidth - 20, ry, { align: 'right' });

//     ry += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Reg. Fee', labelX, ry);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(registrationFee.toFixed(2), pageWidth - 20, ry, { align: 'right' });

//     ry += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Discount', labelX, ry);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(discount.toFixed(2), pageWidth - 20, ry, { align: 'right' });

//     ry += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('GST', labelX, ry);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(totalGST.toFixed(2), pageWidth - 20, ry, { align: 'right' });

//     ry += lineGap;
//     pdf.setFont('helvetica', 'normal');
//     pdf.text('CGST', labelX + 5, ry);
//     pdf.text(cgst.toFixed(2), pageWidth - 20, ry, { align: 'right' });

//     ry += lineGap;
//     pdf.text('SGST', labelX + 5, ry);
//     pdf.text(sgst.toFixed(2), pageWidth - 20, ry, { align: 'right' });

//     ry += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Total', labelX, ry);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(totalAmount.toFixed(2), pageWidth - 20, ry, { align: 'right' });

//     ry += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Paid Fees', labelX, ry);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(paidAmount.toFixed(2), pageWidth - 20, ry, { align: 'right' });

//     ry += lineGap;
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Due Amount', labelX, ry);
//     pdf.setFont('helvetica', 'normal');
//     pdf.setTextColor(balanceAmount > 0 ? 220 : 0, balanceAmount > 0 ? 38 : 0, balanceAmount > 0 ? 38 : 0);
//     pdf.text(balanceAmount.toFixed(2), pageWidth - 20, ry, { align: 'right' });
//     pdf.setTextColor(0, 0, 0);

//     y = boxStartY + 100;

//     // === TERMS AND CONDITIONS ===
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Terms and Conditions:', 20, y);
//     pdf.setFont('helvetica', 'normal');
//     pdf.setFontSize(9);
//     pdf.text('1) Once Fees Paid Not Be Refundable, No Freezing, No Extension, No Transfer.', 20, y + 6);
//     pdf.text("2) Don't Carry Your Valuables In Gym, Gym Will Not Be Responsible For Any Losses In Gym Premises.", 20, y + 12);
//     pdf.text('3) Gym Also Will Not Be Responsible For Any Accident In Gym Premises.', 20, y + 18);

//     // Footer line
//     pdf.setDrawColor(150);
//     pdf.line(15, 285, pageWidth - 15, 285);

//     return pdf.output('blob');
//   }

//   static async downloadReceiptPDF(receipt: Receipt, options?: Partial<PDFGenerationOptions>): Promise<void> {
//     const pdfBlob = await this.generateReceiptPDF({ receipt, ...options });
//     const url = URL.createObjectURL(pdfBlob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `${receipt.receipt_number}_${receipt.member_name.replace(/\s+/g, '_')}.pdf`;
//     link.click();
//     URL.revokeObjectURL(url);
//   }

//   static getReceiptFileName(receipt: Receipt): string {
//     const date = format(new Date(receipt.created_at), 'yyyy-MM-dd');
//     const memberName = receipt.member_name.replace(/[^a-zA-Z0-9]/g, '_');
//     return `${receipt.receipt_number}_${memberName}_${date}.pdf`;
//   }
// }

// export async function generateMultipleReceiptPDFs(receipts: Receipt[]): Promise<Blob[]> {
//   const pdfPromises = receipts.map((receipt) =>
//     ReceiptPDFGenerator.generateReceiptPDF({ receipt })
//   );
//   return Promise.all(pdfPromises);
// }

// export async function downloadReceiptsAsZip(receipts: Receipt[]): Promise<void> {
//   for (const receipt of receipts) {
//     await ReceiptPDFGenerator.downloadReceiptPDF(receipt);
//     await new Promise(resolve => setTimeout(resolve, 500));
//   }
// }
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { Receipt } from './database';

interface EnhancedReceipt extends Receipt {
  tax_breakdown?: Array<{
    id: string;
    name: string;
    rate: number;
    amount: number;
    type: 'inclusive' | 'exclusive';
  }>;
  tax_type?: 'inclusive' | 'exclusive' | null;
  total_tax_amount?: number;
  base_amount_before_tax?: number;
}

export interface PDFGenerationOptions {
  receipt: EnhancedReceipt;
  gymName?: string;
  gymAddress?: string;
  gymPhone?: string;
  gymEmail?: string;
}

// Helper function to convert number to words
function numberToWords(num: number): string {
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

export class ReceiptPDFGenerator {
  private static readonly DEFAULT_GYM_INFO = {
    name: 'PRIME FITNESS and HEALTH POINT',
    address: '71 Tarani Colony, B/h Forest Office',
    phone: '8109750604',
    email: 'PRIMEFITNESSPOINT@GMAIL.COM'
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

    // Amount calculations
    const packageFee = receipt.package_fee || 0;
    const registrationFee = receipt.registration_fee || 0;
    const discount = receipt.discount || 0;
    const cgst = receipt.cgst || 0;
    const sgst = receipt.sigst || 0;
    const totalGST = cgst + sgst;

    const subtotal = packageFee + registrationFee - discount;
    const totalAmount = subtotal + totalGST;
    const paidAmount = receipt.amount_paid || receipt.amount || totalAmount;
    const balanceAmount = receipt.due_amount || Math.max(0, totalAmount - paidAmount);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const lineHeight = 6;
    let y = 20;

    // === HEADER ===
    pdf.setFont('helvetica', 'bold');
    pdf.text(gymInfo.name, 20, y);
    pdf.setFont('helvetica', 'normal');
    y += lineHeight;
    pdf.text(gymInfo.address, 20, y);
    y += lineHeight;
    pdf.text(gymInfo.phone, 20, y);
    y += lineHeight;
    pdf.text(gymInfo.email, 20, y);

    // Right-side header info
    pdf.setFont('helvetica', 'bold');
    pdf.text('Receipt No:', pageWidth - 70, 20);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.receipt_number || '---', pageWidth - 40, 20);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Date:', pageWidth - 70, 26);
    pdf.setFont('helvetica', 'normal');
    pdf.text(format(new Date(receipt.created_at), 'dd-MMM-yyyy'), pageWidth - 40, 26);

    y += 12;

    // === MEMBER INFO ===
    pdf.setDrawColor(0);
    pdf.rect(15, y, pageWidth - 30, 16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Name:', 20, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.member_name || 'N/A', 40, y + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Member ID:', pageWidth / 2, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.custom_member_id || receipt.member_id || 'N/A', pageWidth / 2 + 25, y + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Mail ID:', 20, y + 12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.email || 'NA', 40, y + 12);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Mobile No:', pageWidth / 2, y + 12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.mobile_no || 'N/A', pageWidth / 2 + 25, y + 12);

    y += 22;

    // === PACKAGE SECTION ===
    const boxStartY = y;
    pdf.rect(15, boxStartY, (pageWidth - 30) / 2, 90);
    pdf.rect(15 + (pageWidth - 30) / 2, boxStartY, (pageWidth - 30) / 2, 90);

    const leftX = 20;
    const rightX = pageWidth / 2 + 5;
    const lineGap = 8;
    let leftY = boxStartY + 8;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Package:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.plan_type || 'Gym', leftX + 30, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Duration:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    const planType = receipt.plan_type || 'monthly';
    const durationMap: Record<string, string> = {
      monthly: 'Month',
      quarterly: 'Quarter',
      half_yearly: 'Half Year',
      yearly: 'Year'
    };
    pdf.text(durationMap[planType] || 'Month', leftX + 30, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Start Date:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.subscription_start_date ? format(new Date(receipt.subscription_start_date), 'dd-MMM-yyyy') : 'N/A', leftX + 30, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('End Date:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.subscription_end_date ? format(new Date(receipt.subscription_end_date), 'dd-MMM-yyyy') : 'N/A', leftX + 30, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Next Pay Date:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.subscription_end_date ? format(new Date(receipt.subscription_end_date), 'dd-MMM-yyyy') : 'N/A', leftX + 30, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Pay Mode:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text((receipt.payment_mode || receipt.payment_type || 'Cash').toUpperCase(), leftX + 30, leftY);

    // ✅ FIXED PAY DETAILS SECTION (handles long text neatly)
    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Pay Details:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    const payDetailsStartX = leftX + 30;
    const maxPayDetailsWidth = (pageWidth / 2) - payDetailsStartX - 10;

    const payDetailsText = receipt.description || 'N/A';
    let payDetailsLines = pdf.splitTextToSize(payDetailsText, maxPayDetailsWidth);
    
    // Limit to 2 lines max and truncate if needed
    if (payDetailsLines.length > 2) {
      payDetailsLines = [payDetailsLines[0], payDetailsLines[1].substring(0, 35) + '...'];
    }
    
    pdf.text(payDetailsLines, payDetailsStartX, leftY);
    leftY += lineGap * payDetailsLines.length;

    // Continue remaining lines
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receipt.created_by || 'Admin', leftX + 30, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Instructor:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text('N/A', leftX + 30, leftY);

    leftY += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amt In Word:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const amountInWords = numberToWords(totalAmount);
    const wordLines = pdf.splitTextToSize(amountInWords, 70);
    pdf.text(wordLines, leftX + 30, leftY);
    pdf.setFontSize(11);

    leftY += lineGap * 2;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Note:', leftX, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text('N/A', leftX + 20, leftY);

    // === FEES TABLE (RIGHT SIDE) ===
    const labelX = rightX + 5;
    let ry = boxStartY + 8;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Package Fees', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.text(packageFee.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Reg. Fee', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.text(registrationFee.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Discount', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.text(discount.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('GST', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.text(totalGST.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap;
    pdf.setFont('helvetica', 'normal');
    pdf.text('CGST', labelX + 5, ry);
    pdf.text(cgst.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap;
    pdf.text('SGST', labelX + 5, ry);
    pdf.text(sgst.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.text(totalAmount.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Paid Fees', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.text(paidAmount.toFixed(2), pageWidth - 20, ry, { align: 'right' });

    ry += lineGap;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Due Amount', labelX, ry);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(balanceAmount > 0 ? 220 : 0, balanceAmount > 0 ? 38 : 0, balanceAmount > 0 ? 38 : 0);
    pdf.text(balanceAmount.toFixed(2), pageWidth - 20, ry, { align: 'right' });
    pdf.setTextColor(0, 0, 0);

    y = boxStartY + 100;

    // === TERMS ===
    pdf.setFont('helvetica', 'bold');
    pdf.text('Terms and Conditions:', 20, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('1) Once Fees Paid Not Be Refundable, No Freezing, No Extension, No Transfer.', 20, y + 6);
    pdf.text("2) Don't Carry Your Valuables In Gym, Gym Will Not Be Responsible For Any Losses In Gym Premises.", 20, y + 12);
    pdf.text('3) Gym Also Will Not Be Responsible For Any Accident In Gym Premises.', 20, y + 18);

    pdf.setDrawColor(150);
    pdf.line(15, 285, pageWidth - 15, 285);

    return pdf.output('blob');
  }

  static async downloadReceiptPDF(receipt: Receipt, options?: Partial<PDFGenerationOptions>): Promise<void> {
    const pdfBlob = await this.generateReceiptPDF({ receipt, ...options });
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${receipt.receipt_number}_${receipt.member_name.replace(/\s+/g, '_')}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  static getReceiptFileName(receipt: Receipt): string {
    const date = format(new Date(receipt.created_at), 'yyyy-MM-dd');
    const memberName = receipt.member_name.replace(/[^a-zA-Z0-9]/g, '_');
    return `${receipt.receipt_number}_${memberName}_${date}.pdf`;
  }
}

export async function generateMultipleReceiptPDFs(receipts: Receipt[]): Promise<Blob[]> {
  const pdfPromises = receipts.map((receipt) =>
    ReceiptPDFGenerator.generateReceiptPDF({ receipt })
  );
  return Promise.all(pdfPromises);
}

export async function downloadReceiptsAsZip(receipts: Receipt[]): Promise<void> {
  for (const receipt of receipts) {
    await ReceiptPDFGenerator.downloadReceiptPDF(receipt);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
