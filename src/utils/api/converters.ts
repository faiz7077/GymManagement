// Convert between database format (snake_case) and frontend format (camelCase)
import { LegacyEnquiry } from '../database';
import { LegacyInvoice } from '../database';
import { LegacyStaffAttendance } from '../database';
import { StaffAttendance } from '../database';
import { LegacyAttendance } from '../database';
import { Attendance } from '../database';
import { Member, LegacyMember, Staff, LegacyStaff /*, etc */ } from './interfaces'

// Helper function to safely convert dates
const safeDate = (dateValue: any): string => {
  if (!dateValue) return new Date().toISOString();
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date found:', dateValue, 'using current date instead');
      return new Date().toISOString();
    }
    return dateValue;
  } catch (error) {
    console.warn('Date conversion error:', error, 'for value:', dateValue);
    return new Date().toISOString();
  }
};

export const convertMemberToLegacy = (member: unknown): LegacyMember => {
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
      unpaidInvoices: member.unpaid_invoices || 0
    };
  
    // Debug log for troubleshooting data conversion
    if (member.name && (member.paid_amount > 0 || member.due_amount > 0)) {
      console.log(`Member conversion for ${member.name}:`, {
        original_paid_amount: member.paid_amount,
        original_due_amount: member.due_amount,
        converted_paidAmount: converted.paidAmount,
        converted_dueAmount: converted.dueAmount
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
  
  const convertEnquiryToLegacy = (enquiry: unknown): LegacyEnquiry => ({
    id: enquiry.id,
    enquiryNumber: enquiry.enquiry_number,
    name: enquiry.name,
    address: enquiry.address,
    telephoneNo: enquiry.telephone_no,
    mobileNo: enquiry.mobile_no,
    occupation: enquiry.occupation,
    sex: enquiry.sex,
    refPersonName: enquiry.ref_person_name,
    dateOfEnquiry: enquiry.date_of_enquiry,
    interestedIn: enquiry.interested_in ? (typeof enquiry.interested_in === 'string' ? JSON.parse(enquiry.interested_in) : enquiry.interested_in) : [],
    membershipFees: enquiry.membership_fees,
    paymentMode: enquiry.payment_mode,
    paymentFrequency: enquiry.payment_frequency,
    status: enquiry.status,
    notes: enquiry.notes,
    followUpDate: enquiry.follow_up_date,
    convertedToMemberId: enquiry.converted_to_member_id,
    createdAt: enquiry.created_at,
    updatedAt: enquiry.updated_at,
    createdBy: enquiry.created_by
  });
  
  export const convertStaffToLegacy = (staff: unknown): LegacyStaff => ({
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
  