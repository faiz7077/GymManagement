// BACKUP OF ORIGINAL database.ts FILE
// This file contains the complete original database implementation before modularization
// Date: 2025-01-30

// Database service for renderer process
// This replaces the localStorage implementation with SQLite via Electron IPC

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
    plan_type: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
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
  
  // Frontend interface (camelCase - for React components)
  export interface LegacyMember {
    paid_amount: any;
    due_amount: any;
    dueAmount: any;
    amount_paid: any;
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
    planType: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
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
  