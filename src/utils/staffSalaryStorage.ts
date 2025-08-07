import { Receipt, LegacyStaff, db } from './database';
import { StaffSalaryPDFGenerator } from './staffSalaryPdfUtils';

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

export class StaffSalaryStorageManager {
  /**
   * Saves a staff salary receipt as PDF to the system
   */
  static async saveSalaryReceiptPDF(data: SalaryReceiptData): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Generate PDF
      const pdfBlob = await StaffSalaryPDFGenerator.generateSalaryReceiptPDF(data);
      const arrayBuffer = await pdfBlob.arrayBuffer();

      // Save to system using the same receipt storage system
      const result = await db.saveReceiptPDF(data.receipt, arrayBuffer);

      return {
        success: result.success,
        filePath: result.filePath,
        error: result.error
      };
    } catch (error) {
      console.error('Error saving salary receipt PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets all salary receipts for a specific staff member
   */
  static async getStaffSalaryReceipts(staffId: string): Promise<Receipt[]> {
    try {
      const receipts = await db.getReceiptsByStaffId(staffId);
      // Filter for staff salary receipts (you might want to add a category field to distinguish)
      return receipts.filter(receipt =>
        receipt.description?.includes('Salary') ||
        receipt.description?.includes('Bonus') ||
        receipt.description?.includes('adjustment')
      );
    } catch (error) {
      console.error('Error getting staff salary receipts:', error);
      return [];
    }
  }

  /**
   * Gets all salary receipts across all staff
   */
  static async getAllSalaryReceipts(): Promise<Receipt[]> {
    try {
      const allReceipts = await db.getAllReceipts();
      // Filter for staff salary receipts
      return allReceipts.filter(receipt =>
        receipt.description?.includes('Salary') ||
        receipt.description?.includes('Bonus') ||
        receipt.description?.includes('adjustment')
      );
    } catch (error) {
      console.error('Error getting all salary receipts:', error);
      return [];
    }
  }

  /**
   * Creates a monthly salary receipt for a staff member
   */
  static async createMonthlySalaryReceipt(
    staff: LegacyStaff,
    salaryDetails: {
      baseSalary: number;
      bonus?: number;
      deductions?: number;
      month?: string;
    },
    createdBy: string
  ): Promise<{ success: boolean; receipt?: Receipt; error?: string }> {
    try {
      const month = salaryDetails.month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const finalAmount = salaryDetails.baseSalary + (salaryDetails.bonus || 0) - (salaryDetails.deductions || 0);

      const receiptCreated = await db.createStaffSalaryReceipt(staff, finalAmount, createdBy, 'salary');

      if (receiptCreated) {
        // Get the created receipt
        const receipts = await db.getReceiptsByStaffId(staff.id);
        const latestReceipt = receipts[0]; // Most recent receipt

        if (latestReceipt) {
          // Generate and save PDF
          const salaryReceiptData: SalaryReceiptData = {
            receipt: latestReceipt,
            staff,
            salaryDetails: {
              baseSalary: salaryDetails.baseSalary,
              bonus: salaryDetails.bonus,
              deductions: salaryDetails.deductions,
              finalAmount,
              month,
              receiptType: 'salary'
            }
          };

          await this.saveSalaryReceiptPDF(salaryReceiptData);

          return { success: true, receipt: latestReceipt };
        }
      }

      return { success: false, error: 'Failed to create salary receipt' };
    } catch (error) {
      console.error('Error creating monthly salary receipt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Creates a bonus receipt for a staff member
   */
  static async createBonusReceipt(
    staff: LegacyStaff,
    bonusAmount: number,
    description: string,
    createdBy: string
  ): Promise<{ success: boolean; receipt?: Receipt; error?: string }> {
    try {
      const receiptCreated = await db.createBonusReceipt(staff, bonusAmount, createdBy);

      if (receiptCreated) {
        const receipts = await db.getReceiptsByStaffId(staff.id);
        const latestReceipt = receipts[0];

        if (latestReceipt) {
          const salaryReceiptData: SalaryReceiptData = {
            receipt: latestReceipt,
            staff,
            salaryDetails: {
              baseSalary: 0,
              bonus: bonusAmount,
              finalAmount: bonusAmount,
              month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              receiptType: 'bonus'
            }
          };

          await this.saveSalaryReceiptPDF(salaryReceiptData);

          return { success: true, receipt: latestReceipt };
        }
      }

      return { success: false, error: 'Failed to create bonus receipt' };
    } catch (error) {
      console.error('Error creating bonus receipt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets salary statistics for a staff member
   */
  static async getStaffSalaryStats(staffId: string): Promise<{
    totalPaid: number;
    totalReceipts: number;
    lastPayment?: Receipt;
    monthlyBreakdown: { month: string; amount: number; receipts: number }[];
  }> {
    try {
      const receipts = await this.getStaffSalaryReceipts(staffId);

      const totalPaid = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
      const totalReceipts = receipts.length;
      const lastPayment = receipts[0]; // Most recent

      // Group by month
      const monthlyMap = new Map<string, { amount: number; receipts: number }>();

      receipts.forEach(receipt => {
        const month = new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const existing = monthlyMap.get(month) || { amount: 0, receipts: 0 };
        monthlyMap.set(month, {
          amount: existing.amount + receipt.amount,
          receipts: existing.receipts + 1
        });
      });

      const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        amount: data.amount,
        receipts: data.receipts
      }));

      return {
        totalPaid,
        totalReceipts,
        lastPayment,
        monthlyBreakdown
      };
    } catch (error) {
      console.error('Error getting staff salary stats:', error);
      return {
        totalPaid: 0,
        totalReceipts: 0,
        monthlyBreakdown: []
      };
    }
  }

  /**
   * Gets overall salary statistics for all staff
   */
  static async getOverallSalaryStats(): Promise<{
    totalStaffPaid: number;
    totalAmountPaid: number;
    totalReceipts: number;
    monthlyTotals: { month: string; amount: number; staff: number }[];
  }> {
    try {
      const allSalaryReceipts = await this.getAllSalaryReceipts();
      const allStaff = await db.getAllStaff();

      const totalAmountPaid = allSalaryReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
      const totalReceipts = allSalaryReceipts.length;

      // Count unique staff who have received payments
      const paidStaffIds = new Set(allSalaryReceipts.map(receipt => receipt.member_id));
      const totalStaffPaid = paidStaffIds.size;

      // Group by month
      const monthlyMap = new Map<string, { amount: number; staff: Set<string> }>();

      allSalaryReceipts.forEach(receipt => {
        const month = new Date(receipt.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const existing = monthlyMap.get(month) || { amount: 0, staff: new Set<string>() };
        existing.amount += receipt.amount;
        existing.staff.add(receipt.member_id);
        monthlyMap.set(month, existing);
      });

      const monthlyTotals = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        amount: data.amount,
        staff: data.staff.size
      }));

      return {
        totalStaffPaid,
        totalAmountPaid,
        totalReceipts,
        monthlyTotals
      };
    } catch (error) {
      console.error('Error getting overall salary stats:', error);
      return {
        totalStaffPaid: 0,
        totalAmountPaid: 0,
        totalReceipts: 0,
        monthlyTotals: []
      };
    }
  }

  /**
   * Batch process salary payments for multiple staff
   */
  static async batchProcessSalaries(
    staffSalaries: Array<{
      staff: LegacyStaff;
      salaryDetails: {
        baseSalary: number;
        bonus?: number;
        deductions?: number;
      };
    }>,
    createdBy: string
  ): Promise<{
    successful: number;
    failed: number;
    errors: string[];
    receipts: Receipt[];
  }> {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];
    const receipts: Receipt[] = [];

    for (const { staff, salaryDetails } of staffSalaries) {
      try {
        const result = await this.createMonthlySalaryReceipt(staff, salaryDetails, createdBy);
        if (result.success && result.receipt) {
          successful++;
          receipts.push(result.receipt);
        } else {
          failed++;
          errors.push(`${staff.name}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        failed++;
        errors.push(`${staff.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { successful, failed, errors, receipts };
  }
}

// Export convenience functions
export const saveSalaryReceiptPDF = StaffSalaryStorageManager.saveSalaryReceiptPDF;
export const getStaffSalaryReceipts = StaffSalaryStorageManager.getStaffSalaryReceipts;
export const createMonthlySalaryReceipt = StaffSalaryStorageManager.createMonthlySalaryReceipt;
export const createBonusReceipt = StaffSalaryStorageManager.createBonusReceipt;
export const getStaffSalaryStats = StaffSalaryStorageManager.getStaffSalaryStats;
export const getOverallSalaryStats = StaffSalaryStorageManager.getOverallSalaryStats;