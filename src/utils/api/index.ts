import { DatabaseService } from './service';
import { convertMemberToLegacy, convertStaffToLegacy } from './converters';
import { LegacyMember, LegacyStaff, Member, Staff } from './interfaces';
import { formatDateForDatabase } from '../dateUtils';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { LegacyInvoice } from '../database';
import { LegacyInvoice } from '../database';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { Receipt } from '../database';
import { LegacyStaffAttendance } from '../database';
import { LegacyAttendance } from '../database';

// Re-export all interfaces so they can be imported from a single place
export * from './interfaces';
// Frontend-friendly database service with camelCase conversion
export const db = {
    // Authentication
    authenticateUser: DatabaseService.authenticateUser,
  
    // Users
    getAllUsers: DatabaseService.getAllUsers,
    createUser: DatabaseService.createUser,
  
    // Members (with camelCase conversion)
    getAllMembers: async (): Promise<LegacyMember[]> => {
      const members = await DatabaseService.getAllMembers();
      return members.map(convertMemberToLegacy);
    },
  
    getAllMembersWithDueAmounts: async (): Promise<(LegacyMember & { dueAmount: number; unpaidInvoices: number })[]> => {
      const members = await DatabaseService.getAllMembersWithDueAmounts();
      
      // Debug: Log members with due amounts
      const membersWithDue = members.filter(m => (m.due_amount || 0) > 0);
      if (membersWithDue.length > 0) {
        console.log('🔍 Database returned members with due amounts:', membersWithDue.map(m => ({
          name: m.name,
          id: m.id,
          due_amount: m.due_amount,
          paid_amount: m.paid_amount,
          membership_fees: m.membership_fees
        })));
      }
      
      return members.map(member => ({
        ...convertMemberToLegacy(member),
        dueAmount: member.due_amount || 0,
        unpaidInvoices: member.unpaid_invoices || 0
      }));
    },
  
    getMemberById: async (id: string): Promise<LegacyMember | null> => {
      const member = await DatabaseService.getMemberById(id);
      return member ? convertMemberToLegacy(member) : null;
    },
  
    createMember: async (memberData: Omit<LegacyMember, 'id' | 'createdAt' | 'updatedAt'>, autoGenerateReceipt: boolean = true): Promise<boolean> => {
      const id = await DatabaseService.generateId();
      const receiptNo = autoGenerateReceipt && memberData.membershipFees > 0 ? await DatabaseService.generateReceiptNumber() : null;
  
      // Calculate total payable amount
      const registrationFee = memberData.registrationFee || 0;
      const packageFee = memberData.packageFee || memberData.membershipFees || 0;
      const discount = memberData.discount || 0;
      const totalPayable = registrationFee + packageFee - discount;
  
      const subscriptionStartDate = memberData.subscriptionStartDate ?
        (typeof memberData.subscriptionStartDate === 'string' ?
          memberData.subscriptionStartDate.split('T')[0] :
          formatDateForDatabase(memberData.subscriptionStartDate)) :
        formatDateForDatabase(new Date());
  
      const convertedData = {
        id,
        custom_member_id: memberData.customMemberId || null,
        name: memberData.name || 'Unknown',
        address: memberData.address || 'Not specified',
        telephone_no: memberData.telephoneNo || null,
        mobile_no: memberData.mobileNo || '0000000000',
        occupation: memberData.occupation || 'Not specified',
        marital_status: memberData.maritalStatus || 'unmarried',
        anniversary_date: memberData.anniversaryDate ?
          (typeof memberData.anniversaryDate === 'string' ?
            memberData.anniversaryDate.split('T')[0] :
            formatDateForDatabase(memberData.anniversaryDate)) : null,
        blood_group: memberData.bloodGroup || null,
        sex: memberData.sex || 'male',
        date_of_birth: memberData.dateOfBirth ?
          (typeof memberData.dateOfBirth === 'string' ?
            memberData.dateOfBirth.split('T')[0] :
            formatDateForDatabase(memberData.dateOfBirth)) :
          formatDateForDatabase(new Date()),
        alternate_no: memberData.alternateNo || null,
        email: memberData.email || 'noemail@example.com',
        member_image: memberData.memberImage || null,
        id_proof_image: memberData.idProofImage || null,
        date_of_registration: memberData.dateOfRegistration ?
          (typeof memberData.dateOfRegistration === 'string' ?
            memberData.dateOfRegistration.split('T')[0] :
            formatDateForDatabase(memberData.dateOfRegistration)) :
          formatDateForDatabase(new Date()),
        receipt_no: receiptNo,
        payment_mode: memberData.paymentMode || 'cash',
        plan_type: memberData.planType || 'monthly',
        services: JSON.stringify(memberData.services || ['gym']),
        membership_fees: memberData.membershipFees || packageFee,
        registration_fee: registrationFee,
        package_fee: packageFee,
        discount: discount,
        paid_amount: memberData.paidAmount || 0,
        subscription_start_date: subscriptionStartDate,
        subscription_end_date: memberData.subscriptionEndDate ?
          (typeof memberData.subscriptionEndDate === 'string' ?
            memberData.subscriptionEndDate.split('T')[0] :
            memberData.subscriptionEndDate) : '',
        medical_issues: memberData.medicalIssues || null,
        goals: memberData.goals || null,
        status: memberData.status || 'active',
        created_at: new Date().toISOString()
      };
      console.log('Database conversion - converted data:', convertedData);
  
      const memberCreated = await DatabaseService.createMember(convertedData);
  
      // Create invoice if member creation was successful and total payable > 0
      if (memberCreated && totalPayable > 0) {
        try {
          const invoiceId = await DatabaseService.generateId();
          const invoiceNumber = await DatabaseService.generateInvoiceNumber();
  
          const invoiceData = {
            id: invoiceId,
            invoice_number: invoiceNumber,
            member_id: id,
            member_name: memberData.name,
            registration_fee: registrationFee,
            package_fee: packageFee,
            discount: discount,
            total_amount: totalPayable,
            paid_amount: 0,
            status: 'unpaid',
            due_date: convertedData.subscription_end_date,
            created_at: new Date().toISOString()
          };
  
          await DatabaseService.createInvoice(invoiceData);
          console.log('Invoice created for member:', memberData.name, 'Amount:', totalPayable);
  
          // Receipt creation is handled by the database layer (createMember method)
          // to prevent duplicate receipts. The database layer has proper duplicate checking.
          console.log('📝 Receipt creation handled by database layer to prevent duplicates');
        } catch (error) {
          console.error('Failed to create invoice or receipt:', error);
          // Don't fail member creation if invoice/receipt generation fails
        }
      }
  
      return memberCreated;
    },
  
    updateMember: async (id: string, memberData: Partial<LegacyMember>): Promise<boolean> => {
      const convertedData: unknown = {};
  
      if (memberData.customMemberId !== undefined) convertedData.custom_member_id = memberData.customMemberId || null;
      if (memberData.name !== undefined) convertedData.name = memberData.name;
      if (memberData.address !== undefined) convertedData.address = memberData.address;
      if (memberData.telephoneNo !== undefined) convertedData.telephone_no = memberData.telephoneNo || null;
      if (memberData.mobileNo !== undefined) convertedData.mobile_no = memberData.mobileNo;
      if (memberData.occupation !== undefined) convertedData.occupation = memberData.occupation;
      if (memberData.maritalStatus !== undefined) convertedData.marital_status = memberData.maritalStatus;
      if (memberData.anniversaryDate !== undefined) {
        convertedData.anniversary_date = memberData.anniversaryDate ?
          (typeof memberData.anniversaryDate === 'string' ?
            memberData.anniversaryDate.split('T')[0] :
            memberData.anniversaryDate) : null;
      }
      if (memberData.bloodGroup !== undefined) convertedData.blood_group = memberData.bloodGroup || null;
      if (memberData.sex !== undefined) convertedData.sex = memberData.sex;
      if (memberData.dateOfBirth !== undefined) {
        convertedData.date_of_birth = memberData.dateOfBirth ?
          (typeof memberData.dateOfBirth === 'string' ?
            memberData.dateOfBirth.split('T')[0] :
            memberData.dateOfBirth) : null;
      }
      if (memberData.alternateNo !== undefined) convertedData.alternate_no = memberData.alternateNo || null;
      if (memberData.email !== undefined) convertedData.email = memberData.email;
      if (memberData.memberImage !== undefined) convertedData.member_image = memberData.memberImage || null;
      if (memberData.idProofImage !== undefined) convertedData.id_proof_image = memberData.idProofImage || null;
      if (memberData.dateOfRegistration !== undefined) {
        convertedData.date_of_registration = memberData.dateOfRegistration ?
          (typeof memberData.dateOfRegistration === 'string' ?
            memberData.dateOfRegistration.split('T')[0] :
            memberData.dateOfRegistration) : null;
      }
      if (memberData.paymentMode !== undefined) convertedData.payment_mode = memberData.paymentMode;
      if (memberData.planType !== undefined) convertedData.plan_type = memberData.planType;
      if (memberData.services !== undefined) convertedData.services = JSON.stringify(memberData.services);
      if (memberData.membershipFees !== undefined) convertedData.membership_fees = memberData.membershipFees;
      if (memberData.registrationFee !== undefined) convertedData.registration_fee = memberData.registrationFee;
      if (memberData.packageFee !== undefined) convertedData.package_fee = memberData.packageFee;
      if (memberData.discount !== undefined) convertedData.discount = memberData.discount;
      if (memberData.paidAmount !== undefined) convertedData.paid_amount = memberData.paidAmount;
      if (memberData.subscriptionStartDate !== undefined) {
        convertedData.subscription_start_date = memberData.subscriptionStartDate ?
          (typeof memberData.subscriptionStartDate === 'string' ?
            memberData.subscriptionStartDate.split('T')[0] :
            memberData.subscriptionStartDate) : null;
      }
      if (memberData.subscriptionEndDate !== undefined) {
        convertedData.subscription_end_date = memberData.subscriptionEndDate ?
          (typeof memberData.subscriptionEndDate === 'string' ?
            memberData.subscriptionEndDate.split('T')[0] :
            memberData.subscriptionEndDate) : null;
      }
      if (memberData.subscriptionStatus !== undefined) convertedData.subscription_status = memberData.subscriptionStatus;
      if (memberData.medicalIssues !== undefined) convertedData.medical_issues = memberData.medicalIssues || null;
      if (memberData.goals !== undefined) convertedData.goals = memberData.goals || null;
      if (memberData.status !== undefined) convertedData.status = memberData.status;
  
      return await DatabaseService.updateMember(id, convertedData);
    },
  
    deleteMember: DatabaseService.deleteMember,
  
    //Attendance
    getAllAttendance: async (): Promise<LegacyAttendance[]> => {
      const records = await DatabaseService.getAllAttendance();
      const convertedRecords = records.map(convertAttendanceToLegacy);
  
      // For records without profile images, try to get them from members table
      const recordsWithImages = await Promise.all(
        convertedRecords.map(async (record) => {
          if (!record.profileImage && record.memberId) {
            try {
              const member = await DatabaseService.getMemberById(record.memberId);
              if (member && member.profile_image) {
                return { ...record, profileImage: member.profile_image };
              }
            } catch (error) {
              console.error('Error fetching member profile image:', error);
            }
          }
          return record;
        })
      );
  
      return recordsWithImages;
    },
  
    checkIn: async (memberId: string, memberName: string, profileImage?: string): Promise<boolean> => {
      const id = await DatabaseService.generateId();
      const attendanceData = {
        id,
        member_id: memberId,
        member_name: memberName,
        check_in: new Date().toISOString(),
        date: formatDateForDatabase(new Date()), // YYYY-MM-DD format
        profile_image: profileImage || null,
      };
      console.log('Creating attendance record:', attendanceData); // Debug log
      return await DatabaseService.createAttendance(attendanceData);
    },
  
    checkOut: async (attendanceId: string): Promise<boolean> => {
      const attendanceData = {
        check_out: new Date().toISOString(),
      };
      return await DatabaseService.updateAttendance(attendanceId, attendanceData);
    },
  
    // Staff Attendance (with camelCase conversion)
    getAllStaffAttendance: async (): Promise<LegacyStaffAttendance[]> => {
      const records = await DatabaseService.getAllStaffAttendance();
      const convertedRecords = records.map(convertStaffAttendanceToLegacy);
  
      // For records without profile images, try to get them from staff table
      const recordsWithImages = await Promise.all(
        convertedRecords.map(async (record) => {
          if (!record.profileImage && record.staffId) {
            try {
              const staff = await DatabaseService.getStaffById(record.staffId);
              if (staff && staff.profile_image) {
                return {
                  ...record,
                  profileImage: staff.profile_image,
                  role: staff.role,
                  shift: staff.shift
                };
              }
            } catch (error) {
              console.error('Error fetching staff profile image:', error);
            }
          }
          return record;
        })
      );
  
      return recordsWithImages;
    },
  
    checkInStaff: async (staffId: string, staffName: string, profileImage?: string, role?: string, shift?: string): Promise<boolean> => {
      const id = await DatabaseService.generateId();
      const attendanceData = {
        id,
        staff_id: staffId,
        staff_name: staffName,
        check_in: new Date().toISOString(),
        date: formatDateForDatabase(new Date()), // YYYY-MM-DD format
        profile_image: profileImage || null,
        role: role || null,
        shift: shift || null,
      };
      console.log('Creating staff attendance record:', attendanceData);
      return await DatabaseService.createStaffAttendance(attendanceData);
    },
  
    checkOutStaff: async (attendanceId: string): Promise<boolean> => {
      const attendanceData = {
        check_out: new Date().toISOString(),
      };
      return await DatabaseService.updateStaffAttendance(attendanceId, attendanceData);
    },
  
    // Staff (with camelCase conversion)
    getAllStaff: async (): Promise<LegacyStaff[]> => {
      const staff = await DatabaseService.getAllStaff();
      return staff.map(convertStaffToLegacy);
    },
  
    getStaffById: async (id: string): Promise<LegacyStaff | null> => {
      const staff = await DatabaseService.getStaffById(id);
      return staff ? convertStaffToLegacy(staff) : null;
    },
  
    createStaff: async (staffData: Omit<LegacyStaff, 'id' | 'createdAt' | 'updatedAt'>, autoGenerateReceipt: boolean = true): Promise<boolean> => {
      console.log('Frontend - received staff data:', staffData);
      const id = await DatabaseService.generateId();
      console.log('Generated ID:', id);
  
      const convertedData = {
        id,
        name: staffData.name,
        email: staffData.email,
        phone: staffData.phone,
        address: staffData.address,
        emergency_contact: staffData.emergencyContact,
        emergency_phone: staffData.emergencyPhone,
        date_of_birth: staffData.dateOfBirth,
        joining_date: staffData.joiningDate,
        role: staffData.role,
        salary: staffData.salary,
        status: staffData.status,
        profile_image: staffData.profileImage,
        id_card_image: staffData.idCardImage,
        specialization: staffData.specialization,
        shift: staffData.shift,
        created_at: new Date().toISOString()
      };
      console.log('Database conversion - converted staff data:', convertedData);
  
      const result = await DatabaseService.createStaff(convertedData);
      console.log('DatabaseService.createStaff result:', result);
  
      // Auto-generate salary receipt if staff creation was successful and salary > 0
      if (result && autoGenerateReceipt && staffData.salary > 0) {
        try {
          const receipt = await db.createStaffSalaryReceipt(convertedData, staffData.salary, 'System', 'salary');
          if (receipt) {
            console.log('Initial salary receipt auto-generated for staff:', staffData.name, 'Receipt:', receipt.receipt_number);
          }
        } catch (error) {
          console.error('Failed to auto-generate salary receipt:', error);
          // Don't fail staff creation if receipt generation fails
        }
      }
  
      return result;
    },
  
    updateStaff: async (id: string, staffData: Partial<LegacyStaff>, autoGenerateReceipt: boolean = true): Promise<boolean> => {
      // Get current staff data to check for salary changes
      const currentStaff = await db.getStaffById(id);
      const salaryChanged = staffData.salary !== undefined && currentStaff && staffData.salary !== currentStaff.salary;
  
      const convertedData: unknown = {};
  
      if (staffData.name !== undefined) convertedData.name = staffData.name;
      if (staffData.email !== undefined) convertedData.email = staffData.email;
      if (staffData.phone !== undefined) convertedData.phone = staffData.phone;
      if (staffData.address !== undefined) convertedData.address = staffData.address;
      if (staffData.emergencyContact !== undefined) convertedData.emergency_contact = staffData.emergencyContact;
      if (staffData.emergencyPhone !== undefined) convertedData.emergency_phone = staffData.emergencyPhone;
      if (staffData.dateOfBirth !== undefined) convertedData.date_of_birth = staffData.dateOfBirth;
      if (staffData.joiningDate !== undefined) convertedData.joining_date = staffData.joiningDate;
      if (staffData.role !== undefined) convertedData.role = staffData.role;
      if (staffData.salary !== undefined) convertedData.salary = staffData.salary;
      if (staffData.status !== undefined) convertedData.status = staffData.status;
      if (staffData.profileImage !== undefined) convertedData.profile_image = staffData.profileImage;
      if (staffData.idCardImage !== undefined) convertedData.id_card_image = staffData.idCardImage;
      if (staffData.specialization !== undefined) convertedData.specialization = staffData.specialization;
      if (staffData.shift !== undefined) convertedData.shift = staffData.shift;
  
      const result = await DatabaseService.updateStaff(id, convertedData);
  
      // Auto-generate salary update receipt if staff update was successful and salary changed
      if (result && autoGenerateReceipt && salaryChanged && staffData.salary && staffData.salary > 0 && currentStaff) {
        try {
          const updatedStaffData = { ...currentStaff, ...staffData };
          const receipt = await db.createSalaryUpdateReceipt(updatedStaffData, staffData.salary, 'System', currentStaff.salary || 0);
          if (receipt) {
            console.log('Salary update receipt auto-generated for staff:', updatedStaffData.name, 'Receipt:', receipt.receipt_number);
          }
        } catch (error) {
          console.error('Failed to auto-generate salary update receipt:', error);
          // Don't fail staff update if receipt generation fails
        }
      }
  
      return result;
    },
  
    deleteStaff: DatabaseService.deleteStaff,
  
    // Receipts
    getAllReceipts: async (): Promise<Receipt[]> => {
      try {
        const receipts = await DatabaseService.getAllReceipts();
        // Sort receipts by creation date in descending order (newest first)
        return receipts.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
      } catch (error) {
        console.error('Error getting sorted receipts:', error);
        return [];
      }
    },
    getMemberReceipts: async (): Promise<Receipt[]> => {
      try {
        const result = await window.electronAPI.getMemberReceipts();
        const receipts = result.success ? result.data : [];
        // Sort receipts by creation date in descending order (newest first)
        return receipts.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
      } catch (error) {
        console.error('Error getting member receipts:', error);
        return [];
      }
    },
    getReceiptsByMemberId: async (memberId: string): Promise<Receipt[]> => {
      try {
        const receipts = await DatabaseService.getReceiptsByMemberId(memberId);
        // Sort receipts by creation date in descending order (newest first)
        return receipts.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
      } catch (error) {
        console.error('Error getting sorted receipts by member:', error);
        return [];
      }
    },
    createReceipt: async (receiptData: Omit<Receipt, 'id'>): Promise<boolean> => {
      const id = await DatabaseService.generateId();
      const receiptWithId = {
        ...receiptData,
        id,
      };
  
      console.log('Creating receipt with enhanced data:', receiptWithId);
      console.log('Member ID check:', receiptWithId.member_id);
      console.log('Receipt category:', receiptWithId.receipt_category);
  
      // Validate member_id before sending to backend
      if (receiptWithId.receipt_category === 'member' && !receiptWithId.member_id) {
        console.error('Missing member_id for member receipt');
        throw new Error('Member ID is required for member receipts');
      }
  
      const result = await DatabaseService.createReceipt(receiptWithId);
  
      // If receipt was created successfully, also save PDF to system
      if (result) {
        try {
          // Import PDF generator dynamically to avoid circular imports
          const { ReceiptPDFGenerator } = await import('@/utils/pdfUtils');
  
          // Generate PDF
          const pdfBlob = await ReceiptPDFGenerator.generateReceiptPDF({
            receipt: receiptWithId as Receipt
          });
          const arrayBuffer = await pdfBlob.arrayBuffer();
  
          // Save PDF to system
          await DatabaseService.saveReceiptPDF(receiptWithId as Receipt, arrayBuffer);
          console.log('Receipt PDF saved to system for:', receiptWithId.member_name);
        } catch (pdfError) {
          console.error('Failed to save receipt PDF to system:', pdfError);
          // Don't fail the receipt creation if PDF save fails
        }
      }
  
      // Handle both boolean (old behavior) and object (new behavior) returns
      return typeof result === 'boolean' ? result : !!result;
    },
    updateReceipt: DatabaseService.updateReceipt,
    deleteReceipt: DatabaseService.deleteReceipt,
  
    // Sync member and receipt data
    syncMemberReceiptData: async (memberId: string): Promise<boolean> => {
      try {
        const result = await window.electronAPI.recalculateMemberTotals(memberId);
        return !!result;
      } catch (error) {
        console.error('Error syncing member receipt data:', error);
        return false;
      }
    },
  
    // Fix existing receipts that have NULL or incorrect amount_paid/due_amount values
    fixReceiptAmounts: async (): Promise<{ success: boolean; fixedCount?: number; error?: string }> => {
      try {
        const result = await window.electronAPI.fixReceiptAmounts();
        return result;
      } catch (error) {
        console.error('Error fixing receipt amounts:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Invoice operations
    getAllInvoices: async (): Promise<LegacyInvoice[]> => {
      const invoices = await DatabaseService.getAllInvoices();
      return invoices.map(convertInvoiceToLegacy);
    },
  
    getInvoicesByMemberId: async (memberId: string): Promise<LegacyInvoice[]> => {
      const invoices = await DatabaseService.getInvoicesByMemberId(memberId);
      return invoices.map(convertInvoiceToLegacy);
    },
  
    getMemberDueAmount: async (memberId: string): Promise<{ dueAmount: number; unpaidInvoices: number }> => {
      try {
        const result = await window.electronAPI.getMemberDueAmount(memberId);
        if (result.success) {
          return { dueAmount: result.dueAmount || 0, unpaidInvoices: 0 };
        }
        return { dueAmount: 0, unpaidInvoices: 0 };
      } catch (error) {
        console.error('Get member due amount error:', error);
        return { dueAmount: 0, unpaidInvoices: 0 };
      }
    },
  
    payMemberDueAmount: async (memberId: string, paymentAmount: number, paymentType: string = 'cash', createdBy: string = 'System'): Promise<unknown> => {
      return await DatabaseService.payMemberDueAmount(memberId, paymentAmount, paymentType, createdBy);
    },
  
    updateInvoicePayment: async (invoiceId: string, paidAmount: number): Promise<boolean> => {
      return await DatabaseService.updateInvoicePayment(invoiceId, paidAmount);
    },
  
    // Auto-generate receipt for membership
    createMembershipReceipt: async (memberData: unknown, createdBy: string, receiptType: 'new' | 'update' | 'renewal' = 'new'): Promise<boolean> => {
      try {
        const data = memberData as Record<string, unknown>;
        // Calculate total amount from fee structure
        const registrationFee = (data.registration_fee as number) || (data.registrationFee as number) || 0;
        const packageFee = (data.package_fee as number) || (data.packageFee as number) || (data.membership_fees as number) || (data.membershipFees as number) || 0;
        const discount = (data.discount as number) || 0;
  
        // Calculate total amount from fee structure for all receipt types
        const totalAmount = Math.max(0, registrationFee + packageFee - discount);
  
        console.log('Creating membership receipt:', { 
          receiptType, 
          totalAmount, 
          registrationFee, 
          packageFee, 
          discount,
          memberData: data
        }); // Debug log
  
        // Don't create receipt if amount is 0
        if (totalAmount <= 0) {
          console.log('Skipping receipt creation - amount is 0 or negative:', totalAmount);
          return false;
        }
  
        const receiptNumber = await DatabaseService.generateReceiptNumber();
  
        // Generate description based on receipt type
        let description = '';
        const planType = (data.plan_type as string) || (data.planType as string) || 'membership';
  
        switch (receiptType) {
          case 'new':
            description = `New membership registration - ${planType} plan`;
            break;
          case 'update':
            description = `Membership plan update - ${planType} plan`;
            break;
          case 'renewal':
            description = `Membership renewal - ${planType} plan`;
            break;
          default:
            description = `Membership payment - ${planType} plan`;
        }
  
        // Calculate amount_paid and due_amount
        const amountPaid = (data.paidAmount as number) || (data.paid_amount as number) || totalAmount;
        const dueAmount = Math.max(0, totalAmount - amountPaid);
  
  
  
        const receiptData = {
          receipt_number: receiptNumber,
          member_id: (data.id as string) || (data.member_id as string) || '',
          member_name: (data.name as string) || '',
          amount: totalAmount, // Total amount due
          amount_paid: amountPaid, // Amount actually paid
          due_amount: dueAmount, // Remaining amount due
          payment_type: ((data.payment_mode as string) || (data.paymentMode as string) || 'cash') as 'cash' | 'upi' | 'bank_transfer' | 'card',
          description: description,
          receipt_category: 'member' as const,
          created_at: new Date().toISOString(),
          created_by: createdBy,
          // Include all member fee structure data
          custom_member_id: (data.custom_member_id as string) || (data.customMemberId as string) || '',
          subscription_start_date: (data.subscription_start_date as string) || (data.subscriptionStartDate as string) || '',
          subscription_end_date: (data.subscription_end_date as string) || (data.subscriptionEndDate as string) || '',
          plan_type: planType,
          payment_mode: (data.payment_mode as string) || (data.paymentMode as string) || '',
          mobile_no: (data.mobile_no as string) || (data.mobileNo as string) || '',
          package_fee: packageFee,
          registration_fee: registrationFee,
          discount: discount,
          email: (data.email as string) || '',
          cgst: 0, // Can be calculated if needed
          sigst: 0, // Can be calculated if needed
        };
  
        // Validate required fields before creating receipt
        console.log('Receipt data validation:', {
          receipt_number: receiptData.receipt_number,
          member_id: receiptData.member_id,
          member_name: receiptData.member_name,
          amount: receiptData.amount,
          payment_type: receiptData.payment_type
        });
  
        if (!receiptData.receipt_number || !receiptData.member_id || !receiptData.member_name || !receiptData.amount || !receiptData.payment_type) {
          console.error('Missing required receipt fields:', receiptData);
          return false;
        }
  
        const receiptCreated = await db.createReceipt(receiptData);
  
        // If receipt was created successfully, also save PDF to system
        if (receiptCreated) {
          try {
            // Import PDF generator dynamically to avoid circular imports
            const { ReceiptPDFGenerator } = await import('@/utils/pdfUtils');
  
            // Generate PDF
            const pdfBlob = await ReceiptPDFGenerator.generateReceiptPDF({
              receipt: receiptData as Receipt
            });
            const arrayBuffer = await pdfBlob.arrayBuffer();
  
            // Save PDF to system
            await DatabaseService.saveReceiptPDF(receiptData as Receipt, arrayBuffer);
            console.log(`${receiptType} receipt PDF saved to system for:`, (data.name as string));
          } catch (pdfError) {
            console.error('Failed to save receipt PDF to system:', pdfError);
            // Don't fail the receipt creation if PDF save fails
          }
        }
  
        return receiptCreated;
      } catch (error) {
        console.error('Error creating membership receipt:', error);
        return false;
      }
    },
  
    // Create receipt for plan updates
    createPlanUpdateReceipt: async (memberData: unknown, createdBy: string): Promise<boolean> => {
      return await db.createMembershipReceipt(memberData, createdBy, 'update');
    },
  
    // Create receipt for membership renewals
    createRenewalReceipt: async (memberData: unknown, createdBy: string): Promise<boolean> => {
      return await db.createMembershipReceipt(memberData, createdBy, 'renewal');
    },
  
    // Helper function to normalize staff data for PDF generation
    normalizeStaffDataForPDF: (staffData: unknown) => {
      return {
        ...staffData,
        joiningDate: staffData.joiningDate || staffData.joining_date,
        dateOfBirth: staffData.dateOfBirth || staffData.date_of_birth,
        emergencyContact: staffData.emergencyContact || staffData.emergency_contact,
        emergencyPhone: staffData.emergencyPhone || staffData.emergency_phone,
        profileImage: staffData.profileImage || staffData.profile_image,
        idCardImage: staffData.idCardImage || staffData.id_card_image
      };
    },
  
    // Staff Salary Receipt Functions
    createStaffSalaryReceipt: async (staffData: unknown, salaryAmount: number, createdBy: string, receiptType: 'salary' | 'bonus' | 'adjustment' = 'salary'): Promise<Receipt | null> => {
      try {
        // Generate description based on receipt type
        let description = '';
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
        switch (receiptType) {
          case 'salary':
            description = `Salary payment for ${currentMonth} - ${staffData.role || 'Staff'}`;
            break;
          case 'bonus':
            description = `Bonus payment for ${currentMonth} - ${staffData.role || 'Staff'}`;
            break;
          case 'adjustment':
            description = `Salary adjustment for ${currentMonth} - ${staffData.role || 'Staff'}`;
            break;
          default:
            description = `Staff payment for ${currentMonth} - ${staffData.role || 'Staff'}`;
        }
  
        let result;
  
        // Call the appropriate electron backend function based on receipt type
        switch (receiptType) {
          case 'salary':
            result = await window.electronAPI.createStaffSalaryReceipt(
              staffData.id,
              staffData.name,
              salaryAmount,
              'bank_transfer',
              description,
              createdBy
            );
            break;
          case 'bonus':
            result = await window.electronAPI.createBonusReceipt(
              staffData.id,
              staffData.name,
              salaryAmount,
              'bank_transfer',
              description,
              createdBy
            );
            break;
          case 'adjustment':
            // For adjustment, we need the old salary, but we'll use 0 as placeholder
            result = await window.electronAPI.createSalaryUpdateReceipt(
              staffData.id,
              staffData.name,
              0, // old salary placeholder
              salaryAmount,
              createdBy
            );
            break;
          default:
            result = await window.electronAPI.createStaffSalaryReceipt(
              staffData.id,
              staffData.name,
              salaryAmount,
              'bank_transfer',
              description,
              createdBy
            );
        }
  
        if (result && result.success && result.data) {
          const receiptData = result.data;
  
          // Generate and save PDF
          try {
            const { StaffSalaryPDFGenerator } = await import('@/utils/staffSalaryPdfUtils');
            const normalizedStaffData = db.normalizeStaffDataForPDF(staffData);
  
            const pdfBlob = await StaffSalaryPDFGenerator.generateSalaryReceiptPDF({
              receipt: receiptData,
              staff: normalizedStaffData,
              salaryDetails: {
                baseSalary: salaryAmount,
                month: currentMonth,
                receiptType
              }
            });
            const arrayBuffer = await pdfBlob.arrayBuffer();
  
            await DatabaseService.saveReceiptPDF(receiptData, arrayBuffer);
            console.log(`${receiptType} receipt PDF saved to system for staff:`, staffData.name);
          } catch (pdfError) {
            console.error('Failed to save staff salary receipt PDF to system:', pdfError);
          }
  
          return receiptData;
        }
  
        return null;
      } catch (error) {
        console.error('Error creating staff salary receipt:', error);
        return null;
      }
    },
  
    // Create receipt for salary updates
    createSalaryUpdateReceipt: async (staffData: unknown, newSalary: number, createdBy: string, oldSalary: number = 0): Promise<Receipt | null> => {
      try {
        const result = await window.electronAPI.createSalaryUpdateReceipt(
          staffData.id,
          staffData.name,
          oldSalary,
          newSalary,
          createdBy
        );
  
        if (result && result.success && result.data) {
          const receiptData = result.data;
  
          // Generate and save PDF
          try {
            const { StaffSalaryPDFGenerator } = await import('@/utils/staffSalaryPdfUtils');
            const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const normalizedStaffData = db.normalizeStaffDataForPDF(staffData);
  
            const pdfBlob = await StaffSalaryPDFGenerator.generateSalaryReceiptPDF({
              receipt: receiptData,
              staff: normalizedStaffData,
              salaryDetails: {
                baseSalary: newSalary,
                month: currentMonth,
                receiptType: 'adjustment'
              }
            });
            const arrayBuffer = await pdfBlob.arrayBuffer();
  
            await DatabaseService.saveReceiptPDF(receiptData, arrayBuffer);
            console.log('Salary update receipt PDF saved to system for staff:', staffData.name);
          } catch (pdfError) {
            console.error('Failed to save salary update receipt PDF to system:', pdfError);
          }
  
          return receiptData;
        }
  
        return null;
      } catch (error) {
        console.error('Error creating salary update receipt:', error);
        return null;
      }
    },
  
    // Create receipt for bonus payments
    createBonusReceipt: async (staffData: unknown, bonusAmount: number, createdBy: string): Promise<Receipt | null> => {
      try {
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const description = `Bonus payment for ${currentMonth} - ${staffData.role || 'Staff'}`;
  
        const result = await window.electronAPI.createBonusReceipt(
          staffData.id,
          staffData.name,
          bonusAmount,
          'bank_transfer',
          description,
          createdBy
        );
  
        if (result && result.success && result.data) {
          const receiptData = result.data;
  
          // Generate and save PDF
          try {
            const { StaffSalaryPDFGenerator } = await import('@/utils/staffSalaryPdfUtils');
            const normalizedStaffData = db.normalizeStaffDataForPDF(staffData);
  
            const pdfBlob = await StaffSalaryPDFGenerator.generateSalaryReceiptPDF({
              receipt: receiptData,
              staff: normalizedStaffData,
              salaryDetails: {
                baseSalary: bonusAmount,
                month: currentMonth,
                receiptType: 'bonus'
              }
            });
            const arrayBuffer = await pdfBlob.arrayBuffer();
  
            await DatabaseService.saveReceiptPDF(receiptData, arrayBuffer);
            console.log('Bonus receipt PDF saved to system for staff:', staffData.name);
          } catch (pdfError) {
            console.error('Failed to save bonus receipt PDF to system:', pdfError);
          }
  
          return receiptData;
        }
  
        return null;
      } catch (error) {
        console.error('Error creating bonus receipt:', error);
        return null;
      }
    },
  
    // Get receipts for staff
    getStaffReceipts: async (staffName?: string): Promise<Receipt[]> => {
      try {
        const result = await window.electronAPI.getStaffReceipts(staffName);
        return result.success ? result.data : [];
      } catch (error) {
        console.error('Error getting staff receipts:', error);
        return [];
      }
    },
  
    // Get receipts for a specific staff member
    getReceiptsByStaffId: async (staffId: string): Promise<Receipt[]> => {
      try {
        const result = await window.electronAPI.getReceiptsByMember(staffId);
        return result.success ? result.data || [] : [];
      } catch (error) {
        console.error('Get receipts by staff error:', error);
        return [];
      }
    },
  
    // Enquiries
    getAllEnquiries: DatabaseService.getAllEnquiries,
    createEnquiry: DatabaseService.createEnquiry,
  
    // File system operations
    saveReceiptPDF: DatabaseService.saveReceiptPDF,
    getReceiptsDirectory: DatabaseService.getReceiptsDirectory,
    openReceiptsFolder: DatabaseService.openReceiptsFolder,
    getReceiptFilePath: DatabaseService.getReceiptFilePath,
  
  
  
  
  
    // Utilities
    generateId: DatabaseService.generateId,
    generateReceiptNumber: DatabaseService.generateReceiptNumber,
    generateInvoiceNumber: DatabaseService.generateInvoiceNumber,
  
  
  
    // Subscription status
    updateAllSubscriptionStatuses: async (): Promise<boolean> => {
      try {
        const result = await window.electronAPI.updateAllSubscriptionStatuses();
        return result.success;
      } catch (error) {
        console.error('Update subscription statuses error:', error);
        return false;
      }
    },
  
    // Renewal workflow
    renewMembership: async (memberId: string, planType: string, membershipFees: number, createdBy: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await window.electronAPI.renewMembership(memberId, planType, membershipFees, createdBy);
        return result;
      } catch (error) {
        console.error('Renew membership error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
  
    // Update member receipts info
    updateMemberReceiptsInfo: async (memberId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await window.electronAPI.updateMemberReceiptsInfo(memberId);
        return result;
      } catch (error) {
        console.error('Update member receipts info error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
  
    // Trigger member data refresh for other pages
    triggerMemberRefresh: () => {
      // Dispatch a custom event to notify other components that member data has been updated
      window.dispatchEvent(new CustomEvent('memberDataUpdated'));
    },
  
    // Force refresh all member due amounts
    refreshAllMemberDueAmounts: async (): Promise<boolean> => {
      try {
        // Get all members and recalculate their totals
        const members = await db.getAllMembers();
        for (const member of members) {
          await db.syncMemberReceiptData(member.id);
        }
        
        // Trigger refresh event
        db.triggerMemberRefresh();
        return true;
      } catch (error) {
        console.error('Error refreshing all member due amounts:', error);
        return false;
      }
    },
  
    // Calculate subscription end date
    calculateSubscriptionEndDate: (startDate: string, planType: string): string => {
      const start = new Date(startDate);
      const endDate = new Date(start);
  
      switch (planType) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'half_yearly':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1);
      }
  
      return formatDateForDatabase(endDate);
    },
  
    // Get days until expiration
    getDaysUntilExpiration: (subscriptionEndDate: string): number => {
      const today = new Date();
      const endDate = new Date(subscriptionEndDate);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
  
  
  };
  