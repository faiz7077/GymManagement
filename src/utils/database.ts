// BACKUP OF ORIGINAL database.ts FILE
// This file contains the complete original database implementation before modularization
// Date: 2025-01-30

// Database service for renderer process
// This replaces the localStorage implementation with SQLite via Electron IPC

import { TransactionReportData } from './api/types';
// import { BodyMeasurement } from './api/interfaces';
import { formatDateForDatabase } from './dateUtils';

// Database interfaces (snake_case - matches database schema)
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'trainer' | 'receptionist';
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface Member {
  id: string;
  custom_member_id?: string;
  name: string;
  address: string;
  telephone_no?: string;
  mobile_no: string;
  occupation: string;
  marital_status: 'married' | 'unmarried';
  anniversary_date?: string;
  blood_group?: string;
  sex: 'male' | 'female';
  date_of_birth: string;
  alternate_no?: string;
  email: string;
  member_image?: string;
  id_proof_image?: string;
  date_of_registration: string;
  receipt_no?: string;
  payment_mode: 'cash' | 'upi' | 'bank_transfer';
  plan_type: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';
  services: string; // JSON string of selected services
  membership_fees: number;
  registration_fee: number;
  package_fee: number;
  discount: number;
  subscription_start_date: string;
  subscription_end_date: string;
  subscription_status?: 'active' | 'expiring_soon' | 'expired';
  medical_issues?: string;
  goals?: string;
  status: 'active' | 'inactive' | 'frozen';
  created_at: string;
  updated_at: string;
}

export interface DeletedMember {
  id: string;
  original_member_id: string;
  custom_member_id?: string;
  name: string;
  email?: string;
  address?: string;
  telephone_no?: string;
  mobile_no?: string;
  occupation?: string;
  marital_status?: string;
  anniversary_date?: string;
  blood_group?: string;
  sex?: string;
  date_of_birth?: string;
  alternate_no?: string;
  member_image?: string;
  id_proof_image?: string;
  date_of_registration?: string;
  receipt_no?: string;
  payment_mode?: string;
  plan_type?: string;
  services?: string;
  membership_fees?: number;
  registration_fee?: number;
  package_fee?: number;
  discount?: number;
  paid_amount?: number;
  subscription_start_date?: string;
  subscription_end_date?: string;
  subscription_status?: string;
  medical_issues?: string;
  goals?: string;
  height?: number;
  weight?: number;
  status?: string;
  original_created_at?: string;
  original_updated_at?: string;
  deleted_at: string;
  deleted_by: string;
  deletion_reason?: string;
}

// Frontend interface (camelCase - for React components)
export interface LegacyMember {
  paid_amount: any;
  due_amount: any;
  dueAmount: unknown;
  amount_paid: unknown;
  notes: unknown;
  phone: unknown;
  profileImage: unknown;
  weight: unknown;
  height: unknown;
  id: string;
  customMemberId?: string;
  name: string;
  address: string;
  telephoneNo?: string;
  mobileNo: string;
  occupation: string;
  maritalStatus: 'married' | 'unmarried';
  anniversaryDate?: string;
  bloodGroup?: string;
  sex: 'male' | 'female';
  dateOfBirth: string;
  alternateNo?: string;
  email: string;
  memberImage?: string;
  idProofImage?: string;
  dateOfRegistration: string;
  receiptNo?: string;
  paymentMode: 'cash' | 'upi' | 'bank_transfer';
  planType: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';
  services: string[]; // Array of selected services
  membershipFees: number;
  registrationFee: number;
  packageFee: number;
  discount: number;
  paidAmount: number;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  subscriptionStatus?: 'active' | 'expiring_soon' | 'expired';
  medicalIssues?: string;
  goals?: string;
  status: 'active' | 'inactive' | 'frozen';
  createdAt: string;
  updatedAt: string;
}
export interface LegacyAttendance {
  id: string;
  memberId: string;
  customMemberId?: string;
  memberName: string;
  checkIn: string;
  checkOut?: string;
  date: string;
  profileImage?: string;
}

export interface LegacyStaffAttendance {
  id: string;
  staffId: string;
  staffName: string;
  checkIn: string;
  checkOut?: string;
  date: string;
  profileImage?: string;
  role?: string;
  shift?: string;
}
export interface Enquiry {
  id: string;
  enquiry_number?: string; // Auto-generated enquiry number
  name: string;
  address: string;
  telephone_no?: string;
  mobile_no: string;
  occupation: string;
  sex: 'male' | 'female';
  ref_person_name?: string;
  date_of_enquiry: string;
  interested_in: string[]; // ['aerobics', 'gym', 'slimming']
  membership_fees?: number; // One year non-refundable
  payment_mode: 'cash' | 'cheque';
  payment_frequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  status: 'new' | 'contacted' | 'follow_up' | 'converted' | 'closed';
  notes?: string;
  follow_up_date?: string;
  converted_to_member_id?: string; // Links to member record when converted
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Frontend interface (camelCase - for React components)
export interface LegacyEnquiry {
  id: string;
  enquiryNumber?: string;
  name: string;
  address: string;
  telephoneNo?: string;
  mobileNo: string;
  occupation: string;
  sex: 'male' | 'female';
  refPersonName?: string;
  dateOfEnquiry: string;
  interestedIn: string[];
  membershipFees?: number;
  paymentMode: 'cash' | 'cheque';
  paymentFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  status: 'new' | 'contacted' | 'follow_up' | 'converted' | 'closed';
  notes?: string;
  followUpDate?: string;
  convertedToMemberId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  member_id: string;
  member_name: string;
  amount: number; // Total amount calculated as: registration_fee + package_fee - discount
  amount_paid?: number; // Amount actually paid by the member
  due_amount?: number; // Remaining amount due (amount - amount_paid)
  payment_type: 'cash' | 'card' | 'upi' | 'bank_transfer';
  description: string;
  receipt_category?: 'member' | 'staff_salary' | 'staff_bonus' | 'staff_salary_update';
  transaction_type: 'payment' | 'partial_payment' | 'renewal' | 'adjustment';
  created_at: string;
  created_by: string;
  // Member information for receipt printing
  custom_member_id?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  plan_type?: string;
  payment_mode?: string;
  mobile_no?: string;
  email?: string;
  // Fee breakdown
  package_fee?: number;
  registration_fee?: number;
  discount?: number;
  cgst?: number;
  sigst?: number;
}

export interface BodyMeasurement {
  id: string;
  member_id: string;
  custom_member_id?: string;
  weight: number;
  height: number;
  bmi: number;
  body_fat?: number;
  muscle?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  notes?: string;
  created_at: string;
  recorded_by: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  custom_member_id?: string;
  member_name: string;
  check_in: string;
  check_out?: string;
  date: string;
  profile_image?: string;
}

export interface StaffAttendance {
  id: string;
  staff_id: string;
  staff_name: string;
  check_in: string;
  check_out?: string;
  date: string;
  profile_image?: string;
  role?: string;
  shift?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  created_by: string;
  receipt?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  date_of_birth: string;
  joining_date: string;
  role: 'trainer' | 'receptionist' | 'manager';
  salary: number;
  status: 'active' | 'inactive';
  profile_image?: string;
  id_card_image?: string;
  specialization?: string; // For trainers
  shift?: string; // morning, evening, night
  created_at: string;
  updated_at: string;
}

// Frontend interface (camelCase - for React components)
export interface LegacyStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  dateOfBirth: string;
  joiningDate: string;
  role: 'trainer' | 'receptionist' | 'manager';
  salary: number;
  status: 'active' | 'inactive';
  profileImage?: string;
  idCardImage?: string;
  specialization?: string;
  shift?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSalary {
  id: string;
  staff_id: string;
  staff_name: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  final_amount: number;
  month: string;
  year: number;
  paid_date?: string;
  status: 'pending' | 'paid';
}

export interface Invoice {
  id: string;
  invoice_number: string;
  member_id: string;
  member_name: string;
  registration_fee: number;
  package_fee: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  status: 'unpaid' | 'partial' | 'paid';
  due_date?: string;
  plan_type: string;
  subscription_start_date: string;
  subscription_end_date: string;
  created_at: string;
  updated_at: string;
}



export interface LegacyInvoice {
  id: string;
  invoiceNumber: string;
  memberId: string;
  memberName: string;
  registrationFee: number;
  packageFee: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'unpaid' | 'partial' | 'paid';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Convert between database format (snake_case) and frontend format (camelCase)
const convertMemberToLegacy = (member: unknown): LegacyMember => {
  // Helper function to safely convert dates
  const safeDate = (dateValue: any): string => {
    if (!dateValue) return new Date().toISOString();

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date found in member:', dateValue, 'using current date instead');
        return new Date().toISOString();
      }
      return dateValue;
    } catch (error) {
      console.warn('Date conversion error:', error, 'for value:', dateValue);
      return new Date().toISOString();
    }
  };

  const converted = {
    id: member.id || '',
    customMemberId: member.custom_member_id || undefined,
    name: member.name || '',
    address: member.address || '',
    telephoneNo: member.telephone_no || undefined,
    mobileNo: member.mobile_no || '',
    occupation: member.occupation || '',
    maritalStatus: member.marital_status || 'unmarried',
    anniversaryDate: member.anniversary_date || undefined,
    bloodGroup: member.blood_group || undefined,
    sex: member.sex || 'male',
    dateOfBirth: safeDate(member.date_of_birth),
    alternateNo: member.alternate_no || undefined,
    email: member.email || '',
    memberImage: member.member_image || undefined,
    idProofImage: member.id_proof_image || undefined,
    dateOfRegistration: safeDate(member.date_of_registration),
    receiptNo: member.receipt_no || undefined,
    paymentMode: member.payment_mode || 'cash',
    planType: member.plan_type || 'monthly',
    services: member.services ? (typeof member.services === 'string' ? JSON.parse(member.services) : member.services) : [],
    membershipFees: member.membership_fees || 0,
    registrationFee: member.registration_fee || 0,
    packageFee: member.package_fee || member.membership_fees || 0,
    discount: member.discount || 0,
    paidAmount: member.paid_amount || 0,
    subscriptionStartDate: safeDate(member.subscription_start_date || member.date_of_registration),
    subscriptionEndDate: member.subscription_end_date || '',
    subscriptionStatus: member.subscription_status || 'active',
    medicalIssues: member.medical_issues || undefined,
    goals: member.goals || undefined,
    status: member.status || 'active',
    createdAt: safeDate(member.created_at),
    updatedAt: safeDate(member.updated_at),
    notes: undefined,
    phone: undefined,
    profileImage: undefined,
    weight: undefined,
    height: undefined,
    // Include due amount fields for consistency
    dueAmount: member.due_amount || 0,
    due_amount: member.due_amount || 0,
    unpaidInvoices: member.unpaid_invoices || 0,
    // Include trainer assignment fields
    assignedTrainerId: member.assigned_trainer_id || undefined,
    assigned_trainer_id: member.assigned_trainer_id || undefined,
    assignedTrainerName: member.assigned_trainer_name || undefined,
    assigned_trainer_name: member.assigned_trainer_name || undefined
  };

  // Debug log for troubleshooting data conversion
  if (member.name && (member.paid_amount > 0 || member.due_amount > 0)) {
    console.log(`💰 Member conversion for ${member.name}:`, {
      original_paid_amount: member.paid_amount,
      original_due_amount: member.due_amount,
      converted_paidAmount: converted.paidAmount,
      converted_dueAmount: converted.dueAmount,
      membershipFees: member.membership_fees,
      registrationFee: member.registration_fee,
      packageFee: member.package_fee,
      discount: member.discount
    });
  }

  return converted;
};
const convertAttendanceToLegacy = (attendance: Attendance): LegacyAttendance => ({
  id: attendance.id,
  memberId: attendance.member_id,
  customMemberId: attendance.custom_member_id,
  memberName: attendance.member_name,
  checkIn: attendance.check_in,
  checkOut: attendance.check_out,
  date: attendance.date,
  profileImage: attendance.profile_image
});

const convertStaffAttendanceToLegacy = (attendance: StaffAttendance): LegacyStaffAttendance => ({
  id: attendance.id,
  staffId: attendance.staff_id,
  staffName: attendance.staff_name,
  checkIn: attendance.check_in,
  checkOut: attendance.check_out,
  date: attendance.date,
  profileImage: attendance.profile_image,
  role: attendance.role,
  shift: attendance.shift
});

const convertInvoiceToLegacy = (invoice: unknown): LegacyInvoice => ({
  id: invoice.id,
  invoiceNumber: invoice.invoice_number,
  memberId: invoice.member_id,
  memberName: invoice.member_name,
  registrationFee: invoice.registration_fee,
  packageFee: invoice.package_fee,
  discount: invoice.discount,
  totalAmount: invoice.total_amount,
  paidAmount: invoice.paid_amount,
  status: invoice.status,
  dueDate: invoice.due_date,
  createdAt: invoice.created_at,
  updatedAt: invoice.updated_at
});

const convertEnquiryToLegacy = (enquiry: unknown): LegacyEnquiry => {
  // Helper function to safely convert dates
  const safeDate = (dateValue: any): string => {
    if (!dateValue) return new Date().toISOString();

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date found in enquiry:', dateValue, 'using current date instead');
        return new Date().toISOString();
      }
      return dateValue;
    } catch (error) {
      console.warn('Date conversion error:', error, 'for value:', dateValue);
      return new Date().toISOString();
    }
  };

  return {
    id: enquiry.id,
    enquiryNumber: enquiry.enquiry_number,
    name: enquiry.name,
    address: enquiry.address,
    telephoneNo: enquiry.telephone_no,
    mobileNo: enquiry.mobile_no,
    occupation: enquiry.occupation,
    sex: enquiry.sex,
    refPersonName: enquiry.ref_person_name,
    dateOfEnquiry: safeDate(enquiry.date_of_enquiry),
    interestedIn: (() => {
      try {
        if (!enquiry.interested_in) return [];
        if (typeof enquiry.interested_in === 'string') {
          const parsed = JSON.parse(enquiry.interested_in);
          return Array.isArray(parsed) ? parsed : [];
        }
        return Array.isArray(enquiry.interested_in) ? enquiry.interested_in : [];
      } catch (error) {
        console.warn('Error parsing interestedIn field:', error);
        return [];
      }
    })(),
    membershipFees: enquiry.membership_fees,
    paymentMode: enquiry.payment_mode,
    paymentFrequency: enquiry.payment_frequency,
    status: enquiry.status,
    notes: enquiry.notes,
    followUpDate: enquiry.follow_up_date ? safeDate(enquiry.follow_up_date) : undefined,
    convertedToMemberId: enquiry.converted_to_member_id,
    createdAt: safeDate(enquiry.created_at),
    updatedAt: safeDate(enquiry.updated_at),
    createdBy: enquiry.created_by
  };
};

const convertStaffToLegacy = (staff: unknown): LegacyStaff => ({
  id: staff.id,
  name: staff.name,
  email: staff.email,
  phone: staff.phone,
  address: staff.address,
  emergencyContact: staff.emergency_contact,
  emergencyPhone: staff.emergency_phone,
  dateOfBirth: staff.date_of_birth,
  joiningDate: staff.joining_date,
  role: staff.role,
  salary: staff.salary,
  status: staff.status,
  profileImage: staff.profile_image,
  idCardImage: staff.id_card_image,
  specialization: staff.specialization,
  shift: staff.shift,
  createdAt: staff.created_at,
  updatedAt: staff.updated_at
});
// Storage keys (kept for compatibility)
export const STORAGE_KEYS = {
  USERS: 'gym_users',
  CURRENT_USER: 'gym_current_user',
  MEMBERS: 'gym_members',
  ENQUIRIES: 'gym_enquiries',
  RECEIPTS: 'gym_receipts',
  BODY_MEASUREMENTS: 'gym_body_measurements',
  ATTENDANCE: 'gym_attendance',
  EXPENSES: 'gym_expenses',
  STAFF_SALARIES: 'gym_staff_salaries',
  SETTINGS: 'gym_settings',
  RECEIPT_COUNTER: 'gym_receipt_counter'
};

// Declare global electronAPI
declare global {
  interface Window {
    electronAPI: {
      // Authentication
      login: (username: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;

      // Users
      getAllUsers: () => Promise<{ success: boolean; data?: User[]; error?: string }>;
      createUser: (userData: Omit<User, 'id' | 'created_at'> & { id: string; created_at: string }) => Promise<{ success: boolean; error?: string }>;
      updateUser: (userId: string, userData: Partial<Pick<User, 'name' | 'email' | 'phone' | 'password'>>) => Promise<{ success: boolean; error?: string }>;
      updateUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;

      // Role Permissions
      getAllRolePermissions: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      getRolePermissions: (role: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      setRolePermission: (role: string, permission: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;

      // Trainer Assignments
      getActiveTrainers: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      getTrainersWithCounts: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      getTrainerWithCount: (trainerId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      getMembersByTrainer: (trainerId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      assignTrainerToMember: (memberId: string, trainerId: string, trainerName: string) => Promise<{ success: boolean; error?: string }>;
      removeTrainerFromMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;

      // Members
      getAllMembers: () => Promise<{ success: boolean; data?: Member[]; error?: string }>;
      getMemberById: (id: string) => Promise<{ success: boolean; data?: Member; error?: string }>;
      createMember: (memberData: Omit<Member, 'id' | 'created_at' | 'updated_at'> & { id: string; created_at: string }) => Promise<{ success: boolean; error?: string }>;
      updateMember: (id: string, memberData: Partial<Member>) => Promise<{ success: boolean; error?: string }>;
      deleteMember: (id: string, deletedBy?: string, deletionReason?: string) => Promise<{ success: boolean; error?: string }>;

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
      getMemberReceiptHistory: (memberId: string) => Promise<{ success: boolean; data?: Receipt[]; error?: string }>;
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

      // File system operations
      saveReceiptPDF: (receiptData: Receipt, pdfBuffer: ArrayBuffer) => Promise<{ success: boolean; filePath?: string; filename?: string; error?: string }>;
      getReceiptsDirectory: () => Promise<{ success: boolean; path?: string; error?: string }>;
      openReceiptsFolder: () => Promise<{ success: boolean; error?: string }>;
      getReceiptFilePath: (receiptData: Receipt) => Promise<{ success: boolean; filePath?: string; filename?: string; exists?: boolean; error?: string }>;

      // Partial Members
      savePartialMember: (partialData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      isPartialMember: (memberId: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
      completePartialMember: (memberId: string, membershipData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      getPartialMembers: () => Promise<{ success: boolean; data?: any[]; error?: string }>;

      // Utilities
      generateId: () => Promise<string>;
      generateReceiptNumber: () => Promise<string>;
      generateInvoiceNumber: () => Promise<string>;
      generateMemberNumber: () => Promise<string>;
      updateMemberNumber: (memberId: string, newMemberNumber: string) => Promise<{ success: boolean; error?: string }>;
      checkMemberNumberAvailable: (memberNumber: string, excludeMemberId?: string) => Promise<{ available: boolean; error?: string }>;

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
      updateMemberReceiptsFeeStructure: (memberId: string) => Promise<{ success: boolean; updatedReceipts?: number; error?: string }>;

      // Pay member due amounts
      payMemberDueAmount: (memberId: string, paymentAmount: number, paymentType?: string, createdBy?: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;

      // Get member due amounts
      getAllMembersWithDueAmounts: () => Promise<{ success: boolean; data?: unknown[]; error?: string }>;
      getMemberDueAmount: (memberId: string) => Promise<{ success: boolean; data?: { dueAmount: number; unpaidInvoices: number }; error?: string }>;

      // WhatsApp Automation
      getAllWhatsAppMessages: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      getPendingWhatsAppMessages: () => Promise<any[]>;
      retryWhatsAppMessage: (messageId: string) => Promise<{ success: boolean; error?: string }>;
      triggerBirthdayMessages: () => Promise<{ success: boolean; data?: number; error?: string }>;
      triggerExpiryReminders: () => Promise<{ success: boolean; data?: number; error?: string }>;
      triggerAttendanceReminders: () => Promise<{ success: boolean; data?: number; error?: string }>;
      processPendingWhatsAppMessages: () => Promise<{ success: boolean; data?: number; error?: string }>;
      sendWhatsAppMessage: (messageData: { phone: string; message: string; memberName: string }) => Promise<{ success: boolean; error?: string }>;
      updateWhatsAppMessageStatus: (messageId: string, status: string, sentAt?: string, errorMessage?: string) => Promise<{ success: boolean; error?: string }>;
      getTodaysBirthdayMembers: () => Promise<{ success: boolean; data?: any[]; error?: string }>;

      // Expenses
      getAllExpenses: () => Promise<{ success: boolean; data?: Expense[]; error?: string }>;
      getExpenseById: (id: string) => Promise<{ success: boolean; data?: Expense; error?: string }>;
      createExpense: (expenseData: Expense) => Promise<{ success: boolean; error?: string }>;
      updateExpense: (id: string, expenseData: Partial<Expense>) => Promise<{ success: boolean; error?: string }>;
      deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
      getExpensesByCategory: (category: string) => Promise<{ success: boolean; data?: Expense[]; error?: string }>;
      getExpensesByDateRange: (startDate: string, endDate: string) => Promise<{ success: boolean; data?: Expense[]; error?: string }>;
      getMonthlyExpenseReport: (year: number, month: number) => Promise<{ success: boolean; data?: any; error?: string }>;

      // Master Settings
      masterPackagesGetAll: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      masterPackagesCreate: (packageData: any) => Promise<{ success: boolean; error?: string }>;
      masterPackagesUpdate: (id: number, packageData: any) => Promise<{ success: boolean; error?: string }>;
      masterPackagesDelete: (id: number) => Promise<{ success: boolean; error?: string }>;

      masterTaxSettingsGetAll: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      masterTaxSettingsCreate: (taxData: any) => Promise<{ success: boolean; error?: string }>;
      masterTaxSettingsUpdate: (id: number, taxData: any) => Promise<{ success: boolean; error?: string }>;
      masterTaxSettingsDelete: (id: number) => Promise<{ success: boolean; error?: string }>;

      masterExpenseCategoriesGetAll: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      masterExpenseCategoriesCreate: (categoryData: any) => Promise<{ success: boolean; error?: string }>;
      masterExpenseCategoriesUpdate: (id: number, categoryData: any) => Promise<{ success: boolean; error?: string }>;
      masterExpenseCategoriesDelete: (id: number) => Promise<{ success: boolean; error?: string }>;

      masterOccupationsGetAll: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      masterOccupationsCreate: (occupationData: any) => Promise<{ success: boolean; error?: string }>;
      masterOccupationsUpdate: (id: number, occupationData: any) => Promise<{ success: boolean; error?: string }>;
      masterOccupationsDelete: (id: number) => Promise<{ success: boolean; error?: string }>;

      masterPaymentTypesGetAll: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      masterPaymentTypesCreate: (paymentData: any) => Promise<{ success: boolean; error?: string }>;
      masterPaymentTypesUpdate: (id: number, paymentData: any) => Promise<{ success: boolean; error?: string }>;
      masterPaymentTypesDelete: (id: number) => Promise<{ success: boolean; error?: string }>;

      masterBodyMeasurementFieldsGetAll: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
      masterBodyMeasurementFieldsCreate: (fieldData: any) => Promise<{ success: boolean; error?: string }>;
      masterBodyMeasurementFieldsUpdate: (id: number, fieldData: any) => Promise<{ success: boolean; error?: string }>;
      masterBodyMeasurementFieldsDelete: (id: number) => Promise<{ success: boolean; error?: string }>;

      // Receipt Tax Operations
      createReceiptWithTaxes: (receiptData: any, taxMappings: any[]) => Promise<{ success: boolean; receiptCreated?: boolean; taxMappingsCreated?: number; error?: string }>;
      updateReceiptWithTaxes: (receiptId: string, receiptData: any, taxMappings: any[]) => Promise<{ success: boolean; receiptUpdated?: boolean; taxMappingsCreated?: number; error?: string }>;
      getReceiptWithTaxes: (receiptId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      getReceiptTaxMappings: (receiptId: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      getTaxCollectionReport: (startDate: string, endDate: string, taxType?: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      getMonthlyTaxReport: (year: number, month: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;

      // Deleted Members
      getAllDeletedMembers: () => Promise<{ success: boolean; data?: DeletedMember[]; error?: string }>;
      getDeletedMemberById: (id: string) => Promise<{ success: boolean; data?: DeletedMember; error?: string }>;
      restoreDeletedMember: (deletedMemberId: string) => Promise<{ success: boolean; memberId?: string; error?: string }>;
      permanentlyDeleteMember: (deletedMemberId: string) => Promise<{ success: boolean; error?: string }>;

      // System Information
      getDatabasePath: () => Promise<{ success: boolean; path?: string; error?: string }>;
      openDatabaseFolder: () => Promise<{ success: boolean; error?: string }>;

    };
  }
}

class DatabaseService {
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

  static async updateUser(userId: string, userData: Partial<Pick<User, 'name' | 'email' | 'phone' | 'password'>>): Promise<boolean> {
    try {
      const result = await window.electronAPI.updateUser(userId, userData);
      return result.success;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  }

  static async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const result = await window.electronAPI.updateUserPassword(userId, newPassword);
      return result.success;
    } catch (error) {
      console.error('Update user password error:', error);
      return false;
    }
  }

  // Role Permissions
  static async getAllRolePermissions(): Promise<any[]> {
    try {
      const result = await window.electronAPI.getAllRolePermissions();
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get all role permissions error:', error);
      return [];
    }
  }

  static async getRolePermissions(role: string): Promise<any[]> {
    try {
      const result = await window.electronAPI.getRolePermissions(role);
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get role permissions error:', error);
      return [];
    }
  }

  static async setRolePermission(role: string, permission: string, enabled: boolean): Promise<boolean> {
    try {
      const result = await window.electronAPI.setRolePermission(role, permission, enabled);
      return result.success;
    } catch (error) {
      console.error('Set role permission error:', error);
      return false;
    }
  }

  // Trainer Assignments
  static async getActiveTrainers(): Promise<any[]> {
    try {
      const result = await window.electronAPI.getActiveTrainers();
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get active trainers error:', error);
      return [];
    }
  }

  static async getTrainersWithCounts(): Promise<any[]> {
    try {
      const result = await window.electronAPI.getTrainersWithCounts();
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get trainers with counts error:', error);
      return [];
    }
  }

  static async getTrainerWithCount(trainerId: string): Promise<any | null> {
    try {
      const result = await window.electronAPI.getTrainerWithCount(trainerId);
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Get trainer with count error:', error);
      return null;
    }
  }

  static async getMembersByTrainer(trainerId: string): Promise<any[]> {
    try {
      const result = await window.electronAPI.getMembersByTrainer(trainerId);
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get members by trainer error:', error);
      return [];
    }
  }

  static async assignTrainerToMember(memberId: string, trainerId: string, trainerName: string): Promise<boolean> {
    try {
      const result = await window.electronAPI.assignTrainerToMember(memberId, trainerId, trainerName);
      return result.success;
    } catch (error) {
      console.error('Assign trainer to member error:', error);
      return false;
    }
  }

  static async removeTrainerFromMember(memberId: string): Promise<boolean> {
    try {
      const result = await window.electronAPI.removeTrainerFromMember(memberId);
      return result.success;
    } catch (error) {
      console.error('Remove trainer from member error:', error);
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

  static async deleteMember(id: string, deletedBy?: string, deletionReason?: string): Promise<boolean> {
    try {
      const result = await window.electronAPI.deleteMember(id, deletedBy, deletionReason);
      return result.success;
    } catch (error) {
      console.error('Delete member error:', error);
      return false;
    }
  }

  // Deleted Members
  static async getAllDeletedMembers(): Promise<DeletedMember[]> {
    try {
      const result = await window.electronAPI.getAllDeletedMembers();
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get deleted members error:', error);
      return [];
    }
  }

  static async getDeletedMemberById(id: string): Promise<DeletedMember | null> {
    try {
      const result = await window.electronAPI.getDeletedMemberById(id);
      return result.success ? result.data || null : null;
    } catch (error) {
      console.error('Get deleted member by ID error:', error);
      return null;
    }
  }

  static async restoreDeletedMember(deletedMemberId: string): Promise<{ success: boolean; memberId?: string; error?: string }> {
    try {
      const result = await window.electronAPI.restoreDeletedMember(deletedMemberId);
      return result;
    } catch (error) {
      console.error('Restore deleted member error:', error);
      return { success: false, error: error.message };
    }
  }

  static async permanentlyDeleteMember(deletedMemberId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await window.electronAPI.permanentlyDeleteMember(deletedMemberId);
      return result;
    } catch (error) {
      console.error('Permanently delete member error:', error);
      return { success: false, error: error.message };
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
      return result;
    } catch (error) {
      console.error('Pay member due amount error:', error);
      return { success: false, error: error.message };
    }
  }

  static async findMemberByMobile(mobileNumber: string): Promise<unknown> {
    try {
      const result = await window.electronAPI.findMemberByMobile(mobileNumber);
      return result;
    } catch (error) {
      console.error('Find member by mobile error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getMemberPaymentHistory(memberId: string): Promise<unknown> {
    try {
      const result = await window.electronAPI.getMemberPaymentHistory(memberId);
      return result;
    } catch (error) {
      console.error('Get member payment history error:', error);
      return { success: false, error: error.message };
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

  static async getMemberReceiptHistory(memberId: string): Promise<Receipt[]> {
    try {
      const result = await window.electronAPI.getMemberReceiptHistory(memberId);
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get member receipt history error:', error);
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

  static async getReceiptHistory(originalReceiptId: string): Promise<Receipt[]> {
    try {
      const result = await window.electronAPI.getReceiptHistory(originalReceiptId);
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get receipt history error:', error);
      return [];
    }
  }

  // Track ongoing receipt creation to prevent duplicates
  private static ongoingReceiptCreation = new Set<string>();

  static async createMemberUpdateReceipt(
    memberId: string,
    newMemberData: Partial<LegacyMember>,
    originalMemberData: LegacyMember,
    createdBy: string
  ): Promise<boolean> {
    try {
      console.log('💰 Creating member update receipt for:', memberId);

      // Check if we're already creating a receipt for this member
      const receiptKey = `${memberId}_${Date.now().toString().slice(-6)}`; // Use last 6 digits of timestamp
      if (this.ongoingReceiptCreation.has(memberId)) {
        console.log('💰 Receipt creation already in progress for member:', memberId);
        return true;
      }

      // Mark as in progress
      this.ongoingReceiptCreation.add(memberId);

      // Clean up after 30 seconds
      setTimeout(() => {
        this.ongoingReceiptCreation.delete(memberId);
      }, 30000);

      // Calculate the new totals
      const newTotalAmount = (newMemberData.registrationFee || originalMemberData.registrationFee || 0) +
        (newMemberData.packageFee || originalMemberData.packageFee || newMemberData.membershipFees || originalMemberData.membershipFees || 0) -
        (newMemberData.discount || originalMemberData.discount || 0);

      const newPaidAmount = newMemberData.paidAmount || originalMemberData.paidAmount || 0;
      const newDueAmount = Math.max(0, newTotalAmount - newPaidAmount);

      // Calculate the original totals for comparison
      const originalTotalAmount = (originalMemberData.registrationFee || 0) +
        (originalMemberData.packageFee || originalMemberData.membershipFees || 0) -
        (originalMemberData.discount || 0);

      const originalPaidAmount = originalMemberData.paidAmount || 0;

      // Calculate the difference in paid amount
      const paidAmountDifference = newPaidAmount - originalPaidAmount;

      console.log('💰 Payment calculation:', {
        originalTotal: originalTotalAmount,
        newTotal: newTotalAmount,
        originalPaid: originalPaidAmount,
        newPaid: newPaidAmount,
        difference: paidAmountDifference,
        newDue: newDueAmount
      });

      // Only create receipt if there's a meaningful change
      if (Math.abs(paidAmountDifference) < 0.01 && Math.abs(newTotalAmount - originalTotalAmount) < 0.01) {
        console.log('💰 No significant payment changes, skipping receipt creation');
        return true;
      }

      // Determine the type of change for better description
      let changeDescription = 'Member payment update';
      if (paidAmountDifference > 0) {
        changeDescription = `Additional payment of ₹${paidAmountDifference.toFixed(2)}`;
      } else if (paidAmountDifference < 0) {
        changeDescription = `Payment adjustment (refund) of ₹${Math.abs(paidAmountDifference).toFixed(2)}`;
      } else if (newTotalAmount !== originalTotalAmount) {
        changeDescription = `Fee structure update - Total changed from ₹${originalTotalAmount.toFixed(2)} to ₹${newTotalAmount.toFixed(2)}`;
      }

      // Generate receipt data
      const receiptId = await window.electronAPI.generateId();
      const receiptNumber = await window.electronAPI.generateReceiptNumber();

      const receiptData = {
        id: receiptId,
        receipt_number: receiptNumber,
        member_id: memberId,
        member_name: newMemberData.name || originalMemberData.name,
        custom_member_id: newMemberData.customMemberId || originalMemberData.customMemberId,
        amount: newTotalAmount,
        amount_paid: paidAmountDifference > 0 ? paidAmountDifference : 0, // Only positive differences (additional payments)
        due_amount: newDueAmount,
        payment_type: newMemberData.paymentMode || originalMemberData.paymentMode || 'cash',
        description: changeDescription,
        receipt_category: 'member',
        transaction_type: 'update',
        subscription_start_date: newMemberData.subscriptionStartDate || originalMemberData.subscriptionStartDate,
        subscription_end_date: newMemberData.subscriptionEndDate || originalMemberData.subscriptionEndDate,
        plan_type: newMemberData.planType || originalMemberData.planType,
        payment_mode: newMemberData.paymentMode || originalMemberData.paymentMode,
        mobile_no: newMemberData.mobileNo || originalMemberData.mobileNo,
        package_fee: newMemberData.packageFee || newMemberData.membershipFees || originalMemberData.packageFee || originalMemberData.membershipFees || 0,
        registration_fee: newMemberData.registrationFee || originalMemberData.registrationFee || 0,
        discount: newMemberData.discount || originalMemberData.discount || 0,
        email: newMemberData.email || originalMemberData.email,
        cgst: 0, // Calculate if needed
        sigst: 0, // Calculate if needed
        created_at: new Date().toISOString(),
        created_by: createdBy
      };

      console.log('💰 Creating receipt with data:', receiptData);

      const result = await window.electronAPI.createReceipt(receiptData);

      if (result.success) {
        console.log('✅ Member update receipt created successfully');
        return true;
      } else {
        throw new Error(result.error || 'Failed to create member update receipt');
      }
    } catch (error) {
      console.error('❌ Create member update receipt error:', error);
      return false;
    } finally {
      // Clean up the flag
      this.ongoingReceiptCreation.delete(memberId);
    }
  }

  static async createReceiptVersion(originalReceiptId: string, receiptData: Partial<Receipt>): Promise<boolean> {
    try {
      console.log('🔄 Creating new receipt version for:', originalReceiptId);

      // Get the original receipt data
      const originalReceipt = await this.getReceiptById(originalReceiptId);
      if (!originalReceipt) {
        throw new Error('Original receipt not found');
      }

      // Create new receipt with updated data
      const newReceiptId = await window.electronAPI.generateId();
      const newReceiptNumber = await window.electronAPI.generateReceiptNumber();

      const newReceiptData = {
        id: newReceiptId,
        receipt_number: newReceiptNumber,
        member_id: receiptData.member_id || originalReceipt.member_id,
        member_name: receiptData.member_name || originalReceipt.member_name,
        custom_member_id: receiptData.custom_member_id || originalReceipt.custom_member_id,
        amount: receiptData.amount || originalReceipt.amount,
        amount_paid: receiptData.amount_paid || originalReceipt.amount_paid,
        due_amount: receiptData.due_amount !== undefined ? receiptData.due_amount : originalReceipt.due_amount,
        payment_type: receiptData.payment_type || originalReceipt.payment_type,
        description: receiptData.description || originalReceipt.description,
        receipt_category: receiptData.receipt_category || originalReceipt.receipt_category,
        cgst: receiptData.cgst !== undefined ? receiptData.cgst : originalReceipt.cgst,
        sigst: receiptData.sigst !== undefined ? receiptData.sigst : originalReceipt.sigst,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: receiptData.created_by || 'System',
        // Add versioning fields
        original_receipt_id: originalReceiptId,
        version_number: (originalReceipt.version_number || 1) + 1,
        is_current_version: true
      };

      // Create the new receipt
      const createResult = await window.electronAPI.createReceiptVersion(newReceiptData);

      if (createResult.success) {
        // Mark the original receipt as superseded
        await window.electronAPI.markReceiptAsSuperseded(originalReceiptId);

        console.log('✅ Receipt version created successfully');
        return true;
      } else {
        throw new Error(createResult.error || 'Failed to create receipt version');
      }
    } catch (error) {
      console.error('Create receipt version error:', error);
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

  static async createEnquiry(enquiryData: Omit<LegacyEnquiry, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔵 DatabaseService.createEnquiry - Input data:', enquiryData);

      // Validate required fields
      if (!enquiryData.mobileNo || enquiryData.mobileNo.trim() === '') {
        console.error('❌ Mobile number is required but missing or empty');
        throw new Error('Mobile number is required');
      }

      if (!enquiryData.name || enquiryData.name.trim() === '') {
        console.error('❌ Name is required but missing or empty');
        throw new Error('Name is required');
      }

      if (!enquiryData.address || enquiryData.address.trim() === '') {
        console.error('❌ Address is required but missing or empty');
        throw new Error('Address is required');
      }

      const id = await window.electronAPI.generateId();
      const enquiryNumber = await window.electronAPI.generateEnquiryNumber();

      // Convert to database format
      const dbEnquiryData = {
        id,
        enquiry_number: enquiryNumber,
        name: enquiryData.name.trim(),
        address: enquiryData.address.trim(),
        telephone_no: enquiryData.telephoneNo?.trim() || null,
        mobile_no: enquiryData.mobileNo.trim(), // This should not be null/undefined
        occupation: enquiryData.occupation.trim(),
        sex: enquiryData.sex,
        ref_person_name: enquiryData.refPersonName?.trim() || null,
        date_of_enquiry: enquiryData.dateOfEnquiry,
        interested_in: JSON.stringify(enquiryData.interestedIn),
        membership_fees: enquiryData.membershipFees,
        payment_mode: enquiryData.paymentMode,
        payment_frequency: enquiryData.paymentFrequency,
        status: enquiryData.status || 'new',
        notes: enquiryData.notes?.trim() || null,
        follow_up_date: enquiryData.followUpDate || null,
        converted_to_member_id: enquiryData.convertedToMemberId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: enquiryData.createdBy?.trim() || 'System'
      };

      console.log('🔵 DatabaseService.createEnquiry - Transformed data:', dbEnquiryData);
      console.log('🔵 Mobile number check:', {
        original: enquiryData.mobileNo,
        transformed: dbEnquiryData.mobile_no,
        type: typeof dbEnquiryData.mobile_no,
        isNull: dbEnquiryData.mobile_no === null,
        isUndefined: dbEnquiryData.mobile_no === undefined,
        isEmpty: dbEnquiryData.mobile_no === ''
      });

      // Final validation before sending to electron
      if (!dbEnquiryData.mobile_no || dbEnquiryData.mobile_no === '') {
        console.error('❌ Final validation failed: mobile_no is still empty after transformation');
        throw new Error('Mobile number validation failed');
      }

      // Validate all required fields match database constraints
      const requiredFields = ['name', 'address', 'mobile_no', 'occupation', 'sex', 'date_of_enquiry', 'interested_in', 'payment_mode', 'payment_frequency', 'status'];
      for (const field of requiredFields) {
        if (!dbEnquiryData[field] || (typeof dbEnquiryData[field] === 'string' && dbEnquiryData[field].trim() === '')) {
          console.error(`❌ Required field ${field} is missing or empty:`, dbEnquiryData[field]);
          throw new Error(`Required field ${field} is missing`);
        }
      }

      // Validate enum constraints
      const validPaymentModes = ['cash', 'cheque'];
      if (!validPaymentModes.includes(dbEnquiryData.payment_mode)) {
        console.error(`❌ Invalid payment_mode: ${dbEnquiryData.payment_mode}. Must be one of:`, validPaymentModes);
        throw new Error(`Invalid payment mode: ${dbEnquiryData.payment_mode}`);
      }

      const validPaymentFrequencies = ['monthly', 'quarterly', 'half_yearly', 'yearly'];
      if (!validPaymentFrequencies.includes(dbEnquiryData.payment_frequency)) {
        console.error(`❌ Invalid payment_frequency: ${dbEnquiryData.payment_frequency}. Must be one of:`, validPaymentFrequencies);
        throw new Error(`Invalid payment frequency: ${dbEnquiryData.payment_frequency}`);
      }

      const validSexValues = ['male', 'female'];
      if (!validSexValues.includes(dbEnquiryData.sex)) {
        console.error(`❌ Invalid sex: ${dbEnquiryData.sex}. Must be one of:`, validSexValues);
        throw new Error(`Invalid sex value: ${dbEnquiryData.sex}`);
      }

      const validStatuses = ['new', 'contacted', 'follow_up', 'converted', 'closed'];
      if (!validStatuses.includes(dbEnquiryData.status)) {
        console.error(`❌ Invalid status: ${dbEnquiryData.status}. Must be one of:`, validStatuses);
        throw new Error(`Invalid status: ${dbEnquiryData.status}`);
      }

      console.log('✅ All validations passed, sending to electron...');
      const result = await window.electronAPI.createEnquiry(dbEnquiryData);
      return { success: result.success };
    } catch (error) {
      console.error('Create enquiry error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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

  // WhatsApp Automation static methods
  static async getAllWhatsAppMessages(): Promise<any[]> {
    try {
      const result = await window.electronAPI.getAllWhatsAppMessages();
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get all WhatsApp messages error:', error);
      return [];
    }
  }

  static async retryWhatsAppMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await window.electronAPI.retryWhatsAppMessage(messageId);
      return result;
    } catch (error) {
      console.error('Retry WhatsApp message error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async triggerBirthdayMessages(): Promise<number> {
    try {
      const result = await window.electronAPI.triggerBirthdayMessages();
      return result.success ? result.data || 0 : 0;
    } catch (error) {
      console.error('Trigger birthday messages error:', error);
      return 0;
    }
  }

  static async getTodaysBirthdayMembers(): Promise<any[]> {
    try {
      const result = await window.electronAPI.getTodaysBirthdayMembers();
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get today\'s birthday members error:', error);
      return [];
    }
  }

  static async triggerExpiryReminders(): Promise<number> {
    try {
      const result = await window.electronAPI.triggerExpiryReminders();
      return result.success ? result.data || 0 : 0;
    } catch (error) {
      console.error('Trigger expiry reminders error:', error);
      return 0;
    }
  }

  static async triggerAttendanceReminders(): Promise<number> {
    try {
      const result = await window.electronAPI.triggerAttendanceReminders();
      return result.success ? result.data || 0 : 0;
    } catch (error) {
      console.error('Trigger attendance reminders error:', error);
      return 0;
    }
  }

  static async processPendingWhatsAppMessages(): Promise<number> {
    try {
      const result = await window.electronAPI.processPendingWhatsAppMessages();
      return result.success ? result.data || 0 : 0;
    } catch (error) {
      console.error('Process pending WhatsApp messages error:', error);
      return 0;
    }
  }

  static async getPendingWhatsAppMessages(): Promise<any[]> {
    try {
      const result = await window.electronAPI.getPendingWhatsAppMessages();
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get pending WhatsApp messages error:', error);
      return [];
    }
  }

  static async updateWhatsAppMessageStatus(messageId: string, status: string, sentAt?: string, errorMessage?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await window.electronAPI.updateWhatsAppMessageStatus(messageId, status, sentAt, errorMessage);
      return result;
    } catch (error) {
      console.error('Update WhatsApp message status error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getSetting(key: string): Promise<string | null> {
    try {
      const result = await window.electronAPI.getSetting(key);
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Get setting error:', error);
      return null;
    }
  }

  static async setSetting(key: string, value: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await window.electronAPI.setSetting(key, value);
      return result;
    } catch (error) {
      console.error('Set setting error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getWhatsAppTemplate(messageType: string): Promise<string | null> {
    try {
      const result = await window.electronAPI.getWhatsAppTemplate(messageType);
      return result.success ? result.template : null;
    } catch (error) {
      console.error('Error getting WhatsApp template:', error);
      return null;
    }
  }

  static async updateWhatsAppTemplate(messageType: string, templateContent: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await window.electronAPI.updateWhatsAppTemplate(messageType, templateContent);
      return result;
    } catch (error) {
      console.error('Update WhatsApp template error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async createWhatsAppMessage(messageData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await window.electronAPI.createWhatsAppMessage(messageData);
      return result;
    } catch (error) {
      console.error('Create WhatsApp message error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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

  static async generateMemberNumber(): Promise<string> {
    try {
      return await window.electronAPI.generateMemberNumber();
    } catch (error) {
      console.error('Generate member number error:', error);
      return Date.now().toString();
    }
  }

  static async updateMemberNumber(memberId: string, newMemberNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await window.electronAPI.updateMemberNumber(memberId, newMemberNumber);
    } catch (error) {
      console.error('Update member number error:', error);
      return { success: false, error: error.message };
    }
  }

  static async checkMemberNumberAvailable(memberNumber: string, excludeMemberId?: string): Promise<{ available: boolean; error?: string }> {
    try {
      return await window.electronAPI.checkMemberNumberAvailable(memberNumber, excludeMemberId);
    } catch (error) {
      console.error('Check member number availability error:', error);
      return { available: false, error: error.message };
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

  // Expense methods
  static async getAllExpenses(): Promise<Expense[]> {
    try {
      const result = await window.electronAPI.getAllExpenses();
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get all expenses error:', error);
      return [];
    }
  }

  static async getExpenseById(id: string): Promise<Expense | null> {
    try {
      const result = await window.electronAPI.getExpenseById(id);
      return result.success && result.data ? result.data : null;
    } catch (error) {
      console.error('Get expense by ID error:', error);
      return null;
    }
  }

  static async createExpense(expenseData: Omit<Expense, 'id'>): Promise<boolean> {
    try {
      const id = await window.electronAPI.generateId();
      const expenseWithId = {
        ...expenseData,
        id
      };
      const result = await window.electronAPI.createExpense(expenseWithId);
      return result.success;
    } catch (error) {
      console.error('Create expense error:', error);
      return false;
    }
  }

  static async updateExpense(id: string, expenseData: Partial<Expense>): Promise<boolean> {
    try {
      const result = await window.electronAPI.updateExpense(id, expenseData);
      return result.success;
    } catch (error) {
      console.error('Update expense error:', error);
      return false;
    }
  }

  static async deleteExpense(id: string): Promise<boolean> {
    try {
      const result = await window.electronAPI.deleteExpense(id);
      return result.success;
    } catch (error) {
      console.error('Delete expense error:', error);
      return false;
    }
  }

  static async getExpensesByCategory(category: string): Promise<Expense[]> {
    try {
      const result = await window.electronAPI.getExpensesByCategory(category);
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get expenses by category error:', error);
      return [];
    }
  }

  static async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    try {
      const result = await window.electronAPI.getExpensesByDateRange(startDate, endDate);
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Get expenses by date range error:', error);
      return [];
    }
  }

  static async getMonthlyExpenseReport(year: number, month: number): Promise<any> {
    try {
      const result = await window.electronAPI.getMonthlyExpenseReport(year, month);
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Get monthly expense report error:', error);
      return null;
    }
  }


}

// Frontend-friendly database service with camelCase conversion
export const db = {
  // Authentication
  authenticateUser: DatabaseService.authenticateUser,

  // Users
  getAllUsers: DatabaseService.getAllUsers,
  createUser: DatabaseService.createUser,
  updateUser: DatabaseService.updateUser,
  updateUserPassword: DatabaseService.updateUserPassword,

  // Role Permissions
  getAllRolePermissions: DatabaseService.getAllRolePermissions,
  getRolePermissions: DatabaseService.getRolePermissions,
  setRolePermission: DatabaseService.setRolePermission,

  // Trainer Assignments
  getActiveTrainers: DatabaseService.getActiveTrainers,
  getTrainersWithCounts: DatabaseService.getTrainersWithCounts,
  getTrainerWithCount: DatabaseService.getTrainerWithCount,
  getMembersByTrainer: DatabaseService.getMembersByTrainer,
  assignTrainerToMember: DatabaseService.assignTrainerToMember,
  removeTrainerFromMember: DatabaseService.removeTrainerFromMember,

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
      assigned_trainer_id: (memberData as any).assignedTrainerId || (memberData as any).assigned_trainer_id || null,
      assigned_trainer_name: (memberData as any).assignedTrainerName || (memberData as any).assigned_trainer_name || null,
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
    
    // Handle trainer assignment fields
    if ((memberData as any).assignedTrainerId !== undefined) {
      convertedData.assigned_trainer_id = (memberData as any).assignedTrainerId || null;
    }
    if ((memberData as any).assigned_trainer_id !== undefined) {
      convertedData.assigned_trainer_id = (memberData as any).assigned_trainer_id || null;
    }
    if ((memberData as any).assignedTrainerName !== undefined) {
      convertedData.assigned_trainer_name = (memberData as any).assignedTrainerName || null;
    }
    if ((memberData as any).assigned_trainer_name !== undefined) {
      convertedData.assigned_trainer_name = (memberData as any).assigned_trainer_name || null;
    }

    return await DatabaseService.updateMember(id, convertedData);
  },

  deleteMember: DatabaseService.deleteMember,

  // Deleted Members
  getAllDeletedMembers: DatabaseService.getAllDeletedMembers,
  getDeletedMemberById: DatabaseService.getDeletedMemberById,
  restoreDeletedMember: DatabaseService.restoreDeletedMember,
  permanentlyDeleteMember: DatabaseService.permanentlyDeleteMember,

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
    
    // Get member data to fetch custom_member_id
    const member = await db.getMemberById(memberId);
    const customMemberId = member?.customMemberId || null;
    
    const attendanceData = {
      id,
      member_id: memberId,
      custom_member_id: customMemberId,
      member_name: memberName,
      check_in: new Date().toISOString(),
      check_out: null, // Initially null
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

  getMemberReceiptHistory: async (memberId: string): Promise<Receipt[]> => {
    try {
      const receipts = await DatabaseService.getMemberReceiptHistory(memberId);
      return receipts;
    } catch (error) {
      console.error('Get member receipt history error:', error);
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
  createMemberUpdateReceipt: DatabaseService.createMemberUpdateReceipt,
  createReceiptVersion: DatabaseService.createReceiptVersion,
  getReceiptHistory: DatabaseService.getReceiptHistory,
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
    return await DatabaseService.getMemberDueAmount(memberId);
  },

  payMemberDueAmount: async (memberId: string, paymentAmount: number, paymentType: string = 'cash', createdBy: string = 'System'): Promise<unknown> => {
    return await DatabaseService.payMemberDueAmount(memberId, paymentAmount, paymentType, createdBy);
  },

  findMemberByMobile: async (mobileNumber: string): Promise<unknown> => {
    return await DatabaseService.findMemberByMobile(mobileNumber);
  },

  getMemberPaymentHistory: async (memberId: string): Promise<unknown> => {
    return await DatabaseService.getMemberPaymentHistory(memberId);
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
  getEnquiryById: DatabaseService.getEnquiryById,
  createEnquiry: DatabaseService.createEnquiry,
  updateEnquiry: DatabaseService.updateEnquiry,
  deleteEnquiry: DatabaseService.deleteEnquiry,
  convertEnquiryToMember: DatabaseService.convertEnquiryToMember,
  generateEnquiryNumber: DatabaseService.generateEnquiryNumber,
  getMonthlyTransactionReport: DatabaseService.getMonthlyTransactionReport,

  // Body Measurements
  createBodyMeasurement: async (measurementData: BodyMeasurement): Promise<{ success: boolean; error?: string; data?: BodyMeasurement }> => {
    try {
      const result = await window.electronAPI.createBodyMeasurement(measurementData);
      return result as { success: boolean; error?: string; data?: BodyMeasurement };
    } catch (error) {
      console.error('Create body measurement error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  getAllBodyMeasurements: async (): Promise<BodyMeasurement[]> => {
    try {
      const result = await window.electronAPI.getAllBodyMeasurements() as { success: boolean; data: BodyMeasurement[]; error?: string };
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Get all body measurements error:', error);
      return [];
    }
  },
  getBodyMeasurementsByMember: async (memberId: string): Promise<BodyMeasurement[]> => {
    try {
      const result = await window.electronAPI.getBodyMeasurementsByMember(memberId) as { success: boolean; data: BodyMeasurement[]; error?: string };
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Get body measurements by member error:', error);
      return [];
    }
  },
  updateBodyMeasurement: async (id: string, measurementData: Partial<BodyMeasurement>): Promise<{ success: boolean; error?: string; data?: BodyMeasurement }> => {
    try {
      const result = await window.electronAPI.updateBodyMeasurement(id, measurementData) as { success: boolean; error?: string; data?: BodyMeasurement };
      return result;
    } catch (error) {
      console.error('Update body measurement error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  deleteBodyMeasurement: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await window.electronAPI.deleteBodyMeasurement(id) as { success: boolean; error?: string };
      return result;
    } catch (error) {
      console.error('Delete body measurement error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // WhatsApp Automation
  getAllWhatsAppMessages: DatabaseService.getAllWhatsAppMessages,
  getPendingWhatsAppMessages: DatabaseService.getPendingWhatsAppMessages,
  retryWhatsAppMessage: DatabaseService.retryWhatsAppMessage,
  triggerBirthdayMessages: DatabaseService.triggerBirthdayMessages,
  triggerExpiryReminders: DatabaseService.triggerExpiryReminders,
  triggerAttendanceReminders: DatabaseService.triggerAttendanceReminders,
  processPendingWhatsAppMessages: DatabaseService.processPendingWhatsAppMessages,
  updateWhatsAppMessageStatus: DatabaseService.updateWhatsAppMessageStatus,
  getTodaysBirthdayMembers: DatabaseService.getTodaysBirthdayMembers,

  // Expenses
  getAllExpenses: DatabaseService.getAllExpenses,
  getExpenseById: DatabaseService.getExpenseById,
  createExpense: DatabaseService.createExpense,
  updateExpense: DatabaseService.updateExpense,
  deleteExpense: DatabaseService.deleteExpense,
  getExpensesByCategory: DatabaseService.getExpensesByCategory,
  getExpensesByDateRange: DatabaseService.getExpensesByDateRange,
  getMonthlyExpenseReport: DatabaseService.getMonthlyExpenseReport,

  // Settings
  getSetting: DatabaseService.getSetting,
  setSetting: DatabaseService.setSetting,
  getWhatsAppTemplate: DatabaseService.getWhatsAppTemplate,
  updateWhatsAppTemplate: DatabaseService.updateWhatsAppTemplate,
  createWhatsAppMessage: DatabaseService.createWhatsAppMessage,

  // File system operations
  saveReceiptPDF: DatabaseService.saveReceiptPDF,
  getReceiptsDirectory: DatabaseService.getReceiptsDirectory,
  openReceiptsFolder: DatabaseService.openReceiptsFolder,
  getReceiptFilePath: DatabaseService.getReceiptFilePath,





  // Utilities
  generateId: DatabaseService.generateId,
  generateReceiptNumber: DatabaseService.generateReceiptNumber,
  generateInvoiceNumber: DatabaseService.generateInvoiceNumber,
  generateMemberNumber: DatabaseService.generateMemberNumber,
  updateMemberNumber: DatabaseService.updateMemberNumber,
  checkMemberNumberAvailable: DatabaseService.checkMemberNumberAvailable,



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

  // Update member receipts with new fee structure
  updateMemberReceiptsFeeStructure: async (memberId: string): Promise<{ success: boolean; updatedReceipts?: number; error?: string }> => {
    try {
      const result = await window.electronAPI.updateMemberReceiptsFeeStructure(memberId);
      return result;
    } catch (error) {
      console.error('Update member receipts fee structure error:', error);
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
      console.log('🔄 Refreshing all member due amounts...');

      // Get all members and recalculate their totals
      const members = await db.getAllMembers();
      console.log(`🔄 Found ${members.length} members to refresh`);

      for (const member of members) {
        try {
          await db.syncMemberReceiptData(member.id);
          console.log(`✅ Refreshed due amounts for ${member.name}`);
        } catch (error) {
          console.error(`❌ Failed to refresh due amounts for ${member.name}:`, error);
        }
      }

      // Trigger refresh event
      db.triggerMemberRefresh();
      console.log('✅ All member due amounts refreshed');
      return true;
    } catch (error) {
      console.error('Error refreshing all member due amounts:', error);
      return false;
    }
  },

  // Calculate subscription end date
  calculateSubscriptionEndDate: (startDate: string, planType: string): string => {
    const start = new Date(startDate);
    let endDate = new Date(start);

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

  // Verify due amount calculation consistency
  verifyDueAmountConsistency: async (memberId: string): Promise<{
    isConsistent: boolean;
    memberListDue: number;
    directCallDue: number;
    receiptsCalculation: {
      totalPaid: number;
      totalDue: number;
      totalAmount: number;
    };
    memberFeeStructure: {
      registrationFee: number;
      packageFee: number;
      discount: number;
      totalFees: number;
    };
  }> => {
    try {
      // Get member from the list (as returned by getAllMembersWithDueAmounts)
      const allMembers = await db.getAllMembersWithDueAmounts();
      const memberFromList = allMembers.find(m => m.id === memberId);

      // Get due amount via direct call
      const directDue = await db.getMemberDueAmount(memberId);

      // Get receipts and calculate manually
      const receipts = await db.getReceiptsByMemberId(memberId);
      const totalPaidFromReceipts = receipts.reduce((sum, receipt) =>
        sum + (receipt.amount_paid || receipt.amount || 0), 0);
      const totalDueFromReceipts = receipts.reduce((sum, receipt) =>
        sum + (receipt.due_amount || 0), 0);

      const memberListDue = memberFromList ? (memberFromList.dueAmount || memberFromList.due_amount || 0) : 0;
      const directCallDue = directDue.dueAmount;

      const memberFeeStructure = memberFromList ? {
        registrationFee: memberFromList.registrationFee || 0,
        packageFee: memberFromList.packageFee || 0,
        discount: memberFromList.discount || 0,
        totalFees: (memberFromList.registrationFee || 0) + (memberFromList.packageFee || 0) - (memberFromList.discount || 0)
      } : { registrationFee: 0, packageFee: 0, discount: 0, totalFees: 0 };

      const receiptsCalculation = {
        totalPaid: totalPaidFromReceipts,
        totalDue: totalDueFromReceipts,
        totalAmount: totalPaidFromReceipts + totalDueFromReceipts
      };

      const isConsistent = memberListDue === directCallDue;

      return {
        isConsistent,
        memberListDue,
        directCallDue,
        receiptsCalculation,
        memberFeeStructure
      };
    } catch (error) {
      console.error('Error verifying due amount consistency:', error);
      return {
        isConsistent: false,
        memberListDue: 0,
        directCallDue: 0,
        receiptsCalculation: { totalPaid: 0, totalDue: 0, totalAmount: 0 },
        memberFeeStructure: { registrationFee: 0, packageFee: 0, discount: 0, totalFees: 0 }
      };
    }
  },

  // Master Settings methods
  masterPackagesGetAll: async () => {
    try {
      return await window.electronAPI.masterPackagesGetAll();
    } catch (error) {
      console.error('Get all packages error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterPackagesCreate: async (packageData: any) => {
    try {
      return await window.electronAPI.masterPackagesCreate(packageData);
    } catch (error) {
      console.error('Create package error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterPackagesUpdate: async (id: number, packageData: any) => {
    try {
      return await window.electronAPI.masterPackagesUpdate(id, packageData);
    } catch (error) {
      console.error('Update package error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterPackagesDelete: async (id: number) => {
    try {
      return await window.electronAPI.masterPackagesDelete(id);
    } catch (error) {
      console.error('Delete package error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterTaxSettingsGetAll: async () => {
    try {
      const result = await window.electronAPI.masterTaxSettingsGetAll();
      if (result.success && result.data) {
        // Convert database 'percentage' field to frontend 'rate' field
        const convertedData = result.data.map((tax: any) => ({
          ...tax,
          rate: tax.percentage || 0  // Map percentage to rate for frontend
        }));
        return { ...result, data: convertedData };
      }
      return result;
    } catch (error) {
      console.error('Get all tax settings error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterTaxSettingsCreate: async (taxData: any) => {
    try {
      // Convert frontend 'rate' field to database 'percentage' field
      const dbTaxData = {
        ...taxData,
        percentage: taxData.rate || 0,  // Map rate to percentage for database
      };
      delete dbTaxData.rate;  // Remove rate field to avoid confusion
      return await window.electronAPI.masterTaxSettingsCreate(dbTaxData);
    } catch (error) {
      console.error('Create tax setting error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterTaxSettingsUpdate: async (id: number, taxData: any) => {
    try {
      // Convert frontend 'rate' field to database 'percentage' field if 'rate' exists
      const dbTaxData = { ...taxData };
      if (taxData.rate !== undefined) {
        dbTaxData.percentage = taxData.rate;
        delete dbTaxData.rate;  // Remove rate field to avoid confusion
      }
      return await window.electronAPI.masterTaxSettingsUpdate(id, dbTaxData);
    } catch (error) {
      console.error('Update tax setting error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterTaxSettingsDelete: async (id: number) => {
    try {
      return await window.electronAPI.masterTaxSettingsDelete(id);
    } catch (error) {
      console.error('Delete tax setting error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterExpenseCategoriesGetAll: async () => {
    try {
      return await window.electronAPI.masterExpenseCategoriesGetAll();
    } catch (error) {
      console.error('Get all expense categories error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterExpenseCategoriesCreate: async (categoryData: any) => {
    try {
      return await window.electronAPI.masterExpenseCategoriesCreate(categoryData);
    } catch (error) {
      console.error('Create expense category error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterExpenseCategoriesUpdate: async (id: number, categoryData: any) => {
    try {
      return await window.electronAPI.masterExpenseCategoriesUpdate(id, categoryData);
    } catch (error) {
      console.error('Update expense category error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterExpenseCategoriesDelete: async (id: number) => {
    try {
      return await window.electronAPI.masterExpenseCategoriesDelete(id);
    } catch (error) {
      console.error('Delete expense category error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterOccupationsGetAll: async () => {
    try {
      return await window.electronAPI.masterOccupationsGetAll();
    } catch (error) {
      console.error('Get all occupations error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterOccupationsCreate: async (occupationData: any) => {
    try {
      return await window.electronAPI.masterOccupationsCreate(occupationData);
    } catch (error) {
      console.error('Create occupation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterOccupationsUpdate: async (id: number, occupationData: unknown) => {
    try {
      return await window.electronAPI.masterOccupationsUpdate(id, occupationData);
    } catch (error) {
      console.error('Update occupation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterOccupationsDelete: async (id: number) => {
    try {
      return await window.electronAPI.masterOccupationsDelete(id);
    } catch (error) {
      console.error('Delete occupation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterPaymentTypesGetAll: async () => {
    try {
      return await window.electronAPI.masterPaymentTypesGetAll();
    } catch (error) {
      console.error('Get all payment types error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterPaymentTypesCreate: async (paymentData: unknown) => {
    try {
      return await window.electronAPI.masterPaymentTypesCreate(paymentData);
    } catch (error) {
      console.error('Create payment type error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterPaymentTypesUpdate: async (id: number, paymentData: unknown) => {
    try {
      return await window.electronAPI.masterPaymentTypesUpdate(id, paymentData);
    } catch (error) {
      console.error('Update payment type error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterPaymentTypesDelete: async (id: number) => {
    try {
      return await window.electronAPI.masterPaymentTypesDelete(id);
    } catch (error) {
      console.error('Delete payment type error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterBodyMeasurementFieldsGetAll: async () => {
    try {
      return await window.electronAPI.masterBodyMeasurementFieldsGetAll();
    } catch (error) {
      console.error('Get all body measurement fields error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterBodyMeasurementFieldsCreate: async (fieldData: unknown) => {
    try {
      return await window.electronAPI.masterBodyMeasurementFieldsCreate(fieldData);
    } catch (error) {
      console.error('Create body measurement field error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterBodyMeasurementFieldsUpdate: async (id: number, fieldData: unknown) => {
    try {
      return await window.electronAPI.masterBodyMeasurementFieldsUpdate(id, fieldData);
    } catch (error) {
      console.error('Update body measurement field error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  masterBodyMeasurementFieldsDelete: async (id: number) => {
    try {
      return await window.electronAPI.masterBodyMeasurementFieldsDelete(id);
    } catch (error) {
      console.error('Delete body measurement field error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Partial Member Methods
  savePartialMember: async (partialData: unknown): Promise<{ success: boolean; data?: unknown; error?: string }> => {
    try {
      console.log('🔵 FRONTEND DB: Saving partial member:', partialData);
      console.log('🔵 FRONTEND DB: Calling window.electronAPI.savePartialMember...');

      const result = await window.electronAPI.savePartialMember(partialData);

      console.log('🔵 FRONTEND DB: Received result from IPC:', result);
      return result;
    } catch (error) {
      console.error('🔴 FRONTEND DB: Save partial member error:', error);
      return { success: false, error: error.message };
    }
  },

  isPartialMember: async (memberId: string): Promise<boolean> => {
    try {
      console.log('Frontend: Checking if member is partial:', memberId);
      const result = await window.electronAPI.isPartialMember(memberId);
      console.log('Frontend: Is partial member result:', result);
      return result.success ? result.data || false : false;
    } catch (error) {
      console.error('Frontend: Check partial member error:', error);
      return false;
    }
  },

  completePartialMember: async (memberId: string, membershipData: unknown): Promise<{ success: boolean; data?: unknown; error?: string }> => {
    try {
      console.log('Frontend: Completing partial member:', memberId, membershipData);
      const result = await window.electronAPI.completePartialMember(memberId, membershipData);
      console.log('Frontend: Complete partial member result:', result);
      return result;
    } catch (error) {
      console.error('Frontend: Complete partial member error:', error);
      return { success: false, error: error.message };
    }
  },

  getPartialMembers: async (): Promise<unknown[]> => {
    try {
      console.log('Frontend: Getting partial members');
      const result = await window.electronAPI.getPartialMembers();
      console.log('Frontend: Get partial members result:', result);
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Frontend: Get partial members error:', error);
      return [];
    }
  },

};

// Legacy functions for backward compatibility
export const saveToStorage = <T>(_key: string, _data: T[]): void => {
  console.warn('saveToStorage is deprecated. Use db methods instead.');
};

export const getFromStorage = async <T>(key: string): Promise<T[]> => {
  console.warn('getFromStorage is deprecated. Use db methods instead.');

  switch (key) {
    case STORAGE_KEYS.MEMBERS:
      return await db.getAllMembers() as T[];
    case STORAGE_KEYS.USERS:
      return await db.getAllUsers() as T[];
    case STORAGE_KEYS.ENQUIRIES:
      return await db.getAllEnquiries() as T[];
    default:
      return [];
  }
};

export const generateId = async (): Promise<string> => {
  return await db.generateId();
};

export const generateReceiptNumber = async (): Promise<string> => {
  return await db.generateReceiptNumber();
};

export const initializeDefaultData = (): void => {
  console.log('Default data initialization is now handled by the database service');
};

export default DatabaseService;