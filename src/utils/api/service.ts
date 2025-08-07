import { User, Member, Receipt, Enquiry, Staff, Invoice, Attendance, StaffAttendance } from "../database";

export class DatabaseService {
    // Authentication
    static async authenticateUser(username: string, password: string): Promise<User | null> {
      try {
        const result = await window.electronAPI.login(username, password);
        return result.success ? result.user || null : null;
      } catch (error) {
        console.error('Authentication error:', error);
        return null;
      }
    }
  
    // Users
    static async getAllUsers(): Promise<User[]> {
      try {
        const result = await window.electronAPI.getAllUsers();
        return result.success ? result.data || [] : [];
      } catch (error) {
        console.error('Get users error:', error);
        return [];
      }
    }
  
    static async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<boolean> {
      try {
        const id = await window.electronAPI.generateId();
        const userWithId = {
          ...userData,
          id,
          created_at: new Date().toISOString()
        };
        const result = await window.electronAPI.createUser(userWithId);
        return result.success;
      } catch (error) {
        console.error('Create user error:', error);
        return false;
      }
    }
  
    // Members (returns database format)
    static async getAllMembers(): Promise<Member[]> {
      try {
        const result = await window.electronAPI.getAllMembers();
        return result.success ? result.data || [] : [];
      } catch (error) {
        console.error('Get members error:', error);
        return [];
      }
    }
  
    static async getAllMembersWithDueAmounts(): Promise<unknown[]> {
      try {
        const result = await window.electronAPI.getAllMembersWithDueAmounts();
        return result.success ? result.data || [] : [];
      } catch (error) {
        console.error('Get all members with due amounts error:', error);
        return [];
      }
    }
  
    static async getMemberById(id: string): Promise<Member | null> {
      try {
        const result = await window.electronAPI.getMemberById(id);
        return result.success ? result.data || null : null;
      } catch (error) {
        console.error('Get member error:', error);
        return null;
      }
    }
  
    static async createMember(memberData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.createMember(memberData);
        return result.success;
      } catch (error) {
        console.error('Create member error:', error);
        return false;
      }
    }
  
    static async updateMember(id: string, memberData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.updateMember(id, memberData);
        return result.success;
      } catch (error) {
        console.error('Update member error:', error);
        return false;
      }
    }
  
    static async deleteMember(id: string): Promise<boolean> {
      try {
        const result = await window.electronAPI.deleteMember(id);
        return result.success;
      } catch (error) {
        console.error('Delete member error:', error);
        return false;
      }
    }
  
    static async getMemberDueAmount(memberId: string): Promise<{ dueAmount: number; unpaidInvoices: number }> {
      try {
        const result = await window.electronAPI.getMemberDueAmount(memberId);
        return result.success ? result.data || { dueAmount: 0, unpaidInvoices: 0 } : { dueAmount: 0, unpaidInvoices: 0 };
      } catch (error) {
        console.error('Get member due amount error:', error);
        return { dueAmount: 0, unpaidInvoices: 0 };
      }
    }
  
    static async payMemberDueAmount(memberId: string, paymentAmount: number, paymentType: string = 'cash', createdBy: string = 'System'): Promise<unknown> {
      try {
        const result = await window.electronAPI.payMemberDueAmount(memberId, paymentAmount, paymentType, createdBy);
        return result.success ? result.data : false;
      } catch (error) {
        console.error('Pay member due amount error:', error);
        return false;
      }
    }
  
    //Attendance
    static async getAllAttendance(): Promise<Attendance[]> {
      try {
        const result = await window.electronAPI.getAllAttendance();
        return result.success ? result.data || [] : [];
      } catch (error) {
        console.error('Get attendance error:', error);
        return [];
      }
    }
  
    static async createAttendance(attendanceData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.createAttendance(attendanceData);
        return result.success;
      } catch (error) {
        console.error('Create attendance error:', error);
        return false;
      }
    }
  
    static async updateAttendance(id: string, attendanceData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.updateAttendance(id, attendanceData);
        return result.success;
      } catch (error) {
        console.error('Update attendance error:', error);
        return false;
      }
    }
  
    // Staff Attendance
    static async getAllStaffAttendance(): Promise<StaffAttendance[]> {
      try {
        const result = await window.electronAPI.getAllStaffAttendance();
        return result.success ? result.data || [] : [];
      } catch (error) {
        console.error('Get staff attendance error:', error);
        return [];
      }
    }
  
    static async createStaffAttendance(attendanceData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.createStaffAttendance(attendanceData);
        return result.success;
      } catch (error) {
        console.error('Create staff attendance error:', error);
        return false;
      }
    }
  
    static async updateStaffAttendance(id: string, attendanceData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.updateStaffAttendance(id, attendanceData);
        return result.success;
      } catch (error) {
        console.error('Update staff attendance error:', error);
        return false;
      }
    }
  
    // Staff (returns database format)
    static async getAllStaff(): Promise<Staff[]> {
      try {
        const result = await window.electronAPI.getAllStaff();
        return result.success ? result.data || [] : [];
      } catch (error) {
        console.error('Get staff error:', error);
        return [];
      }
    }
  
    static async getStaffById(id: string): Promise<Staff | null> {
      try {
        const result = await window.electronAPI.getStaffById(id);
        return result.success ? result.data || null : null;
      } catch (error) {
        console.error('Get staff error:', error);
        return null;
      }
    }
  
    static async createStaff(staffData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.createStaff(staffData);
        return result.success;
      } catch (error) {
        console.error('Create staff error:', error);
        return false;
      }
    }
  
    static async updateStaff(id: string, staffData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.updateStaff(id, staffData);
        return result.success;
      } catch (error) {
        console.error('Update staff error:', error);
        return false;
      }
    }
  
    static async deleteStaff(id: string): Promise<boolean> {
      try {
        const result = await window.electronAPI.deleteStaff(id);
        return result.success;
      } catch (error) {
        console.error('Delete staff error:', error);
        return false;
      }
    }
  
    // Receipts (returns database format)
    static async getAllReceipts(): Promise<Receipt[]> {
      try {
        const result = await window.electronAPI.getAllReceipts();
        return result.success ? result.data || [] : [];
      } catch (error) {
        console.error('Get receipts error:', error);
        return [];
      }
    }
  
    static async getReceiptsByMemberId(memberId: string): Promise<Receipt[]> {
      try {
        const result = await window.electronAPI.getReceiptsByMember(memberId);
        const receipts = result.success ? result.data || [] : [];
        // Sort receipts by creation date in descending order (newest first)
        return receipts.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
      } catch (error) {
        console.error('Get receipts by member error:', error);
        return [];
      }
    }
  
    static async createReceipt(receiptData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.createReceipt(receiptData);
        return result.success;
      } catch (error) {
        console.error('Create receipt error:', error);
        return false;
      }
    }
  
    static async updateReceipt(id: string, receiptData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.updateReceipt(id, receiptData);
        return result.success;
      } catch (error) {
        console.error('Update receipt error:', error);
        return false;
      }
    }
  
    static async deleteReceipt(id: string): Promise<boolean> {
      try {
        const result = await window.electronAPI.deleteReceipt(id);
        return result.success;
      } catch (error) {
        console.error('Delete receipt error:', error);
        return false;
      }
    }
  
    // Enquiries
    static async getAllEnquiries(): Promise<LegacyEnquiry[]> {
      try {
        const result = await window.electronAPI.getAllEnquiries();
        const enquiries = result.success ? result.data || [] : [];
        return enquiries.map(convertEnquiryToLegacy);
      } catch (error) {
        console.error('Get enquiries error:', error);
        return [];
      }
    }
  
    static async getEnquiryById(id: string): Promise<LegacyEnquiry | null> {
      try {
        const result = await window.electronAPI.getEnquiryById(id);
        return result.success && result.data ? convertEnquiryToLegacy(result.data) : null;
      } catch (error) {
        console.error('Get enquiry error:', error);
        return null;
      }
    }
  
    static async createEnquiry(enquiryData: Omit<LegacyEnquiry, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
      try {
        const id = await window.electronAPI.generateId();
        const enquiryNumber = await window.electronAPI.generateEnquiryNumber();
        
        // Convert to database format
        const dbEnquiryData = {
          id,
          enquiry_number: enquiryNumber,
          name: enquiryData.name,
          address: enquiryData.address,
          telephone_no: enquiryData.telephoneNo,
          mobile_no: enquiryData.mobileNo,
          occupation: enquiryData.occupation,
          sex: enquiryData.sex,
          ref_person_name: enquiryData.refPersonName,
          date_of_enquiry: enquiryData.dateOfEnquiry,
          interested_in: JSON.stringify(enquiryData.interestedIn),
          membership_fees: enquiryData.membershipFees,
          payment_mode: enquiryData.paymentMode,
          payment_frequency: enquiryData.paymentFrequency,
          status: enquiryData.status || 'new',
          notes: enquiryData.notes,
          follow_up_date: enquiryData.followUpDate,
          converted_to_member_id: enquiryData.convertedToMemberId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: enquiryData.createdBy
        };
  
        const result = await window.electronAPI.createEnquiry(dbEnquiryData);
        return result.success;
      } catch (error) {
        console.error('Create enquiry error:', error);
        return false;
      }
    }
  
    static async updateEnquiry(id: string, enquiryData: Partial<LegacyEnquiry>): Promise<boolean> {
      try {
        // Convert to database format
        const dbEnquiryData = {
          name: enquiryData.name,
          address: enquiryData.address,
          telephone_no: enquiryData.telephoneNo,
          mobile_no: enquiryData.mobileNo,
          occupation: enquiryData.occupation,
          sex: enquiryData.sex,
          ref_person_name: enquiryData.refPersonName,
          date_of_enquiry: enquiryData.dateOfEnquiry,
          interested_in: enquiryData.interestedIn ? JSON.stringify(enquiryData.interestedIn) : undefined,
          membership_fees: enquiryData.membershipFees,
          payment_mode: enquiryData.paymentMode,
          payment_frequency: enquiryData.paymentFrequency,
          status: enquiryData.status,
          notes: enquiryData.notes,
          follow_up_date: enquiryData.followUpDate,
          converted_to_member_id: enquiryData.convertedToMemberId,
          updated_at: new Date().toISOString(),
          created_by: enquiryData.createdBy
        };
  
        const result = await window.electronAPI.updateEnquiry(id, dbEnquiryData);
        return result.success;
      } catch (error) {
        console.error('Update enquiry error:', error);
        return false;
      }
    }
  
    static async deleteEnquiry(id: string): Promise<boolean> {
      try {
        const result = await window.electronAPI.deleteEnquiry(id);
        return result.success;
      } catch (error) {
        console.error('Delete enquiry error:', error);
        return false;
      }
    }
  
    static async convertEnquiryToMember(enquiryId: string, memberData: Omit<LegacyMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; memberId?: string; error?: string }> {
      try {
        const result = await window.electronAPI.convertEnquiryToMember(enquiryId, memberData);
        return result;
      } catch (error) {
        console.error('Convert enquiry to member error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  
    static async generateEnquiryNumber(): Promise<string> {
      try {
        return await window.electronAPI.generateEnquiryNumber();
      } catch (error) {
        console.error('Generate enquiry number error:', error);
        return `ENQ${Date.now()}`;
      }
    }
  
    // File system operations
    static async saveReceiptPDF(receiptData: Receipt, pdfBuffer: ArrayBuffer): Promise<{ success: boolean; filePath?: string; filename?: string; error?: string }> {
      try {
        return await window.electronAPI.saveReceiptPDF(receiptData, pdfBuffer);
      } catch (error) {
        console.error('Save receipt PDF error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  
    static async getReceiptsDirectory(): Promise<{ success: boolean; path?: string; error?: string }> {
      try {
        return await window.electronAPI.getReceiptsDirectory();
      } catch (error) {
        console.error('Get receipts directory error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  
    static async openReceiptsFolder(): Promise<{ success: boolean; error?: string }> {
      try {
        return await window.electronAPI.openReceiptsFolder();
      } catch (error) {
        console.error('Open receipts folder error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  
    static async getReceiptFilePath(receiptData: Receipt): Promise<{ success: boolean; filePath?: string; filename?: string; exists?: boolean; error?: string }> {
      try {
        return await window.electronAPI.getReceiptFilePath(receiptData);
      } catch (error) {
        console.error('Get receipt file path error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  
    // Utility functions
    static async generateId(): Promise<string> {
      try {
        return await window.electronAPI.generateId();
      } catch (error) {
        console.error('Generate ID error:', error);
        return Date.now().toString() + Math.random().toString(36).substring(2, 11);
      }
    }
  
    static async generateReceiptNumber(): Promise<string> {
      try {
        return await window.electronAPI.generateReceiptNumber();
      } catch (error) {
        console.error('Generate receipt number error:', error);
        return `RCP${Date.now()}`;
      }
    }
  
    static async generateInvoiceNumber(): Promise<string> {
      try {
        return await window.electronAPI.generateInvoiceNumber();
      } catch (error) {
        console.error('Generate invoice number error:', error);
        return `INV${Date.now()}`;
      }
    }
  
    static async createInvoice(invoiceData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.createInvoice(invoiceData);
        return result.success || result;
      } catch (error) {
        console.error('Create invoice error:', error);
        return false;
      }
    }
  
    static async getAllInvoices(): Promise<Invoice[]> {
      try {
        const result = await window.electronAPI.getAllInvoices();
        return result.success ? result.data || [] : [];
      } catch (error) {
        console.error('Get invoices error:', error);
        return [];
      }
    }
  
    static async getInvoiceById(id: string): Promise<Invoice | null> {
      try {
        const result = await window.electronAPI.getInvoiceById(id);
        return result.success ? result.data || null : null;
      } catch (error) {
        console.error('Get invoice error:', error);
        return null;
      }
    }
  
    static async updateInvoice(id: string, invoiceData: unknown): Promise<boolean> {
      try {
        const result = await window.electronAPI.updateInvoice(id, invoiceData);
        return result.success;
      } catch (error) {
        console.error('Update invoice error:', error);
        return false;
      }
    }
  
    static async getInvoicesByMember(memberId: string): Promise<Invoice[]> {
      try {
        const result = await window.electronAPI.getInvoicesByMember(memberId);
        return result.success ? result.data || [] : [];
      } catch (error) {
        console.error('Get invoices by member error:', error);
        return [];
      }
    }
  
  
  }