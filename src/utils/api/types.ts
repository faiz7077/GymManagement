// src/utils/api/types.ts

import { User, Member, Receipt, Enquiry, Staff, Invoice, Attendance, StaffAttendance } from './interfaces';

export interface TransactionReportData {
  userId: string;
  name: string;
  transactionNo: string;
  feesDeposit: number;
  depositDate: string;
  startingDate: string;
  endingDate: string;
}


declare global {
    interface Window {
      electronAPI: {
        // Authentication
        login: (username: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  
        // Users
        getAllUsers: () => Promise<{ success: boolean; data?: User[]; error?: string }>;
        createUser: (userData: Omit<User, 'id' | 'created_at'> & { id: string; created_at: string }) => Promise<{ success: boolean; error?: string }>;
  
        // Members
        getAllMembers: () => Promise<{ success: boolean; data?: Member[]; error?: string }>;
        getMemberById: (id: string) => Promise<{ success: boolean; data?: Member; error?: string }>;
        createMember: (memberData: Omit<Member, 'id' | 'created_at' | 'updated_at'> & { id: string; created_at: string }) => Promise<{ success: boolean; error?: string }>;
        updateMember: (id: string, memberData: Partial<Member>) => Promise<{ success: boolean; error?: string }>;
        deleteMember: (id: string) => Promise<{ success: boolean; error?: string }>;
  
        // Attendance 
        getAllAttendance: () => Promise<{ success: boolean; data?: Attendance[]; error?: string }>;
        createAttendance: (attendanceData: Omit<Attendance, 'id'> & { id: string }) => Promise<{ success: boolean; error?: string }>;
        updateAttendance: (id: string, attendanceData: Partial<Attendance>) => Promise<{ success: boolean; error?: string }>;
  
        // Staff Attendance
        getAllStaffAttendance: () => Promise<{ success: boolean; data?: StaffAttendance[]; error?: string }>;
        createStaffAttendance: (attendanceData: Omit<StaffAttendance, 'id'> & { id: string }) => Promise<{ success: boolean; error?: string }>;
        updateStaffAttendance: (id: string, attendanceData: Partial<StaffAttendance>) => Promise<{ success: boolean; error?: string }>;
  
        // Staff
        getAllStaff: () => Promise<{ success: boolean; data?: Staff[]; error?: string }>;
        getStaffById: (id: string) => Promise<{ success: boolean; data?: Staff; error?: string }>;
        createStaff: (staffData: Omit<Staff, 'id' | 'created_at' | 'updated_at'> & { id: string; created_at: string }) => Promise<{ success: boolean; error?: string }>;
        updateStaff: (id: string, staffData: Partial<Staff>) => Promise<{ success: boolean; error?: string }>;
        deleteStaff: (id: string) => Promise<{ success: boolean; error?: string }>;
  
        // Receipts
        getAllReceipts: () => Promise<{ success: boolean; data?: Receipt[]; error?: string }>;
        getMemberReceipts: () => Promise<{ success: boolean; data?: Receipt[]; error?: string }>;
        getReceiptsByMember: (memberId: string) => Promise<{ success: boolean; data?: Receipt[]; error?: string }>;
        createReceipt: (receiptData: Omit<Receipt, 'id'> & { id: string }) => Promise<{ success: boolean; error?: string }>;
        updateReceipt: (id: string, receiptData: Partial<Receipt>) => Promise<{ success: boolean; error?: string }>;
        deleteReceipt: (id: string) => Promise<{ success: boolean; error?: string }>;
  
        // Enquiries
        getAllEnquiries: () => Promise<{ success: boolean; data?: Enquiry[]; error?: string }>;
        getEnquiryById: (id: string) => Promise<{ success: boolean; data?: Enquiry; error?: string }>;
        createEnquiry: (enquiryData: Omit<Enquiry, 'id'> & { id: string }) => Promise<{ success: boolean; error?: string }>;
        updateEnquiry: (id: string, enquiryData: Partial<Enquiry>) => Promise<{ success: boolean; error?: string }>;
        deleteEnquiry: (id: string) => Promise<{ success: boolean; error?: string }>;
        convertEnquiryToMember: (enquiryId: string, memberData: unknown) => Promise<{ success: boolean; memberId?: string; error?: string }>;
        generateEnquiryNumber: () => Promise<string>;
        getMonthlyTransactionReport: (month: number, year: number) => Promise<{ success: boolean; data?: TransactionReportData[]; error?: string }>;
  
        // File system operations
        saveReceiptPDF: (receiptData: Receipt, pdfBuffer: ArrayBuffer) => Promise<{ success: boolean; filePath?: string; filename?: string; error?: string }>;
        getReceiptsDirectory: () => Promise<{ success: boolean; path?: string; error?: string }>;
        openReceiptsFolder: () => Promise<{ success: boolean; error?: string }>;
        getReceiptFilePath: (receiptData: Receipt) => Promise<{ success: boolean; filePath?: string; filename?: string; exists?: boolean; error?: string }>;
  
        // Utilities
        generateId: () => Promise<string>;
        generateReceiptNumber: () => Promise<string>;
        generateInvoiceNumber: () => Promise<string>;
  
        // Invoices
        createInvoice: (invoiceData: unknown) => Promise<{ success: boolean; error?: string }>;
        getAllInvoices: () => Promise<{ success: boolean; data?: Invoice[]; error?: string }>;
        getInvoiceById: (id: string) => Promise<{ success: boolean; data?: Invoice; error?: string }>;
        updateInvoice: (id: string, invoiceData: Partial<Invoice>) => Promise<{ success: boolean; error?: string }>;
        getInvoicesByMember: (memberId: string) => Promise<{ success: boolean; data?: Invoice[]; error?: string }>;
  
  
  
        // Renewal
        renewMembership: (memberId: string, planType: string, membershipFees: number, createdBy: string) => Promise<{ success: boolean; error?: string }>;
  
        // Update member receipts info
        updateMemberReceiptsInfo: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  
        // Pay member due amounts
        payMemberDueAmount: (memberId: string, paymentAmount: number, paymentType?: string, createdBy?: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  
        // Get member due amounts
        getAllMembersWithDueAmounts: () => Promise<{ success: boolean; data?: unknown[]; error?: string }>;
        getMemberDueAmount: (memberId: string) => Promise<{ success: boolean; data?: { dueAmount: number; unpaidInvoices: number }; error?: string }>;
        
      };
    }
  }