// Financial Service - Simplified receipt management for gym system
// Focuses on core receipt functionality: package + registration - discount

import { db, Invoice, Receipt, Member } from './database';

export interface InvoiceData {
  member_id: string;
  member_name: string;
  registration_fee: number;
  package_fee: number;
  discount: number;
  plan_type: string;
  subscription_start_date: string;
  subscription_end_date: string;
  due_date?: string;
}

export interface PaymentData {
  invoice_id: string;
  member_id: string;
  amount: number; // Actual money paid
  payment_type: 'cash' | 'card' | 'upi' | 'bank_transfer';
  description: string;
  created_by: string;
}

export interface ReceiptCreationData {
  member_id: string;
  member_name: string;
  registration_fee: number;
  package_fee: number;
  discount: number;
  plan_type: string;
  subscription_start_date: string;
  subscription_end_date: string;
  payment_type: 'cash' | 'card' | 'upi' | 'bank_transfer';
  transaction_type: 'payment' | 'partial_payment' | 'renewal' | 'adjustment';
  created_by: string;
}

export class FinancialService {
  
  /**
   * Create an invoice for a member's subscription
   * Invoices represent what the member owes
   */
  static async createInvoice(invoiceData: InvoiceData): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
    try {
      const invoiceNumber = await db.generateInvoiceNumber();
      const totalAmount = invoiceData.registration_fee + invoiceData.package_fee - invoiceData.discount;
      
      const invoice: Omit<Invoice, 'id'> = {
        invoice_number: invoiceNumber,
        member_id: invoiceData.member_id,
        member_name: invoiceData.member_name,
        registration_fee: invoiceData.registration_fee,
        package_fee: invoiceData.package_fee,
        discount: invoiceData.discount,
        total_amount: totalAmount,
        paid_amount: 0, // Initially unpaid
        status: 'unpaid',
        plan_type: invoiceData.plan_type,
        subscription_start_date: invoiceData.subscription_start_date,
        subscription_end_date: invoiceData.subscription_end_date,
        due_date: invoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const success = await db.createInvoice(invoice);
      
      if (success) {
        return { success: true, invoice: invoice as Invoice };
      } else {
        return { success: false, error: 'Failed to create invoice' };
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Process a payment against an invoice
   * Receipts represent actual money received
   */
  static async processPayment(paymentData: PaymentData): Promise<{ success: boolean; receipt?: Receipt; error?: string }> {
    try {
      // Get the invoice to validate payment
      const invoice = await this.getInvoiceById(paymentData.invoice_id);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Calculate remaining amount due
      const remainingAmount = invoice.total_amount - invoice.paid_amount;
      
      if (paymentData.amount > remainingAmount) {
        return { success: false, error: `Payment amount (₹${paymentData.amount}) exceeds remaining balance (₹${remainingAmount})` };
      }

      // Create receipt for the actual payment
      const receiptNumber = await db.generateReceiptNumber();
      const receipt: Omit<Receipt, 'id'> = {
        receipt_number: receiptNumber,
        member_id: paymentData.member_id,
        member_name: invoice.member_name,
        invoice_id: paymentData.invoice_id,
        amount: paymentData.amount, // Actual money paid
        payment_type: paymentData.payment_type,
        description: paymentData.description,
        transaction_type: paymentData.amount === remainingAmount ? 'payment' : 'partial_payment',
        receipt_category: 'member',
        created_at: new Date().toISOString(),
        created_by: paymentData.created_by,
        // Display fields from invoice
        plan_type: invoice.plan_type,
        subscription_start_date: invoice.subscription_start_date,
        subscription_end_date: invoice.subscription_end_date,
        display_registration_fee: invoice.registration_fee,
        display_package_fee: invoice.package_fee,
        display_discount: invoice.discount,
        display_total_amount: invoice.total_amount,
      };

      const receiptCreated = await db.createReceipt(receipt);
      
      if (receiptCreated) {
        // Update invoice paid amount and status
        const newPaidAmount = invoice.paid_amount + paymentData.amount;
        const newStatus = newPaidAmount >= invoice.total_amount ? 'paid' : 
                         newPaidAmount > 0 ? 'partial' : 'unpaid';

        await this.updateInvoice(paymentData.invoice_id, {
          paid_amount: newPaidAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        });

        return { success: true, receipt: receipt as Receipt };
      } else {
        return { success: false, error: 'Failed to create receipt' };
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create a simple receipt with automatic calculation
   * Amount = registration_fee + package_fee - discount
   */
  static async createSimpleReceipt(receiptData: ReceiptCreationData): Promise<{ success: boolean; receipt?: Receipt; error?: string }> {
    try {
      const receiptNumber = await db.generateReceiptNumber();
      
      // Calculate total amount: registration + package - discount
      const totalAmount = Math.max(0, receiptData.registration_fee + receiptData.package_fee - receiptData.discount);
      
      // Generate description based on transaction type
      let description = '';
      switch (receiptData.transaction_type) {
        case 'renewal':
          description = `Membership renewal - ${receiptData.plan_type} plan - ${receiptData.member_name}`;
          break;
        case 'adjustment':
          description = `Fee adjustment - ${receiptData.plan_type} plan - ${receiptData.member_name}`;
          break;
        case 'partial_payment':
          description = `Partial payment - ${receiptData.plan_type} plan - ${receiptData.member_name}`;
          break;
        default:
          description = `Payment for ${receiptData.plan_type} plan - ${receiptData.member_name}`;
      }

      const receipt: Omit<Receipt, 'id'> = {
        receipt_number: receiptNumber,
        member_id: receiptData.member_id,
        member_name: receiptData.member_name,
        amount: totalAmount,
        payment_type: receiptData.payment_type,
        description: description,
        transaction_type: receiptData.transaction_type,
        receipt_category: 'member',
        created_at: new Date().toISOString(),
        created_by: receiptData.created_by,
        // Member information
        plan_type: receiptData.plan_type,
        subscription_start_date: receiptData.subscription_start_date,
        subscription_end_date: receiptData.subscription_end_date,
        // Fee breakdown
        registration_fee: receiptData.registration_fee,
        package_fee: receiptData.package_fee,
        discount: receiptData.discount,
        cgst: 0,
        sigst: 0,
      };

      const success = await db.createReceipt(receipt);
      
      if (success) {
        return { success: true, receipt: receipt as Receipt };
      } else {
        return { success: false, error: 'Failed to create receipt' };
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Create a complete membership transaction (Invoice + Payment)
   * This is the main method for new memberships and renewals
   */
  static async createMembershipTransaction(
    memberData: {
      member_id: string;
      member_name: string;
      registration_fee: number;
      package_fee: number;
      discount: number;
      plan_type: string;
      subscription_start_date: string;
      subscription_end_date: string;
    },
    paymentData: {
      amount: number;
      payment_type: 'cash' | 'card' | 'upi' | 'bank_transfer';
      created_by: string;
    }
  ): Promise<{ success: boolean; invoice?: Invoice; receipt?: Receipt; error?: string }> {
    try {
      // Step 1: Create invoice
      const invoiceResult = await this.createInvoice({
        ...memberData,
        due_date: new Date().toISOString() // Due immediately for gym memberships
      });

      if (!invoiceResult.success || !invoiceResult.invoice) {
        return { success: false, error: invoiceResult.error || 'Failed to create invoice' };
      }

      // Step 2: Process payment
      const paymentResult = await this.processPayment({
        invoice_id: invoiceResult.invoice.id,
        member_id: memberData.member_id,
        amount: paymentData.amount,
        payment_type: paymentData.payment_type,
        description: `Payment for ${memberData.plan_type} membership - ${memberData.member_name}`,
        created_by: paymentData.created_by
      });

      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error || 'Failed to process payment' };
      }

      return {
        success: true,
        invoice: invoiceResult.invoice,
        receipt: paymentResult.receipt
      };
    } catch (error) {
      console.error('Error creating membership transaction:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Calculate financial summary for reporting (simplified)
   */
  static async getFinancialSummary(startDate?: string, endDate?: string): Promise<{
    totalRevenue: number;
    totalReceipts: number;
    averageReceiptAmount: number;
    totalInvoices: number;
    paidInvoices: number;
    partialInvoices: number;
    unpaidInvoices: number;
  }> {
    try {
      // This would need to be implemented with proper database queries
      // For now, return a basic structure
      return {
        totalRevenue: 0,
        totalReceipts: 0,
        averageReceiptAmount: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        partialInvoices: 0,
        unpaidInvoices: 0
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      return {
        totalRevenue: 0,
        totalReceipts: 0,
        averageReceiptAmount: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        partialInvoices: 0,
        unpaidInvoices: 0
      };
    }
  }

  // Helper methods
  private static async getInvoiceById(id: string): Promise<Invoice | null> {
    return await db.getInvoiceById(id);
  }

  private static async updateInvoice(id: string, data: Partial<Invoice>): Promise<boolean> {
    return await db.updateInvoice(id, data);
  }


}

export default FinancialService;