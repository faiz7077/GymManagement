import { z } from 'zod';

// Partial member validation schema - only validates basic member information
export const partialMemberSchema = z.object({
  customMemberId: z.string().optional().transform(val => val || undefined),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  telephoneNo: z.string().nullable().optional().transform(val => val || undefined),
  mobileNo: z.string().min(10, 'Mobile number must be at least 10 digits').regex(/^\d+$/, 'Mobile number must contain only digits'),
  occupation: z.string().min(2, 'Occupation is required'),
  maritalStatus: z.enum(['married', 'unmarried']).default('unmarried'),
  anniversaryDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : undefined)]).optional(),
  bloodGroup: z.string().nullable().optional().transform(val => val || undefined),
  sex: z.enum(['male', 'female']),
  dateOfBirth: z.union([
    z.date(),
    z.string().transform(str => new Date(str))
  ], {
    required_error: 'Date of birth is required',
  }),
  alternateNo: z.string().nullable().optional().transform(val => val || undefined),
  email: z.string().email('Invalid email address'),
  memberImage: z.string().nullable().optional().transform(val => val || undefined),
  idProofImage: z.string().nullable().optional().transform(val => val || undefined),
  dateOfRegistration: z.union([
    z.date(),
    z.string().transform(str => new Date(str))
  ], {
    required_error: 'Date of registration is required',
  }),
  medicalIssues: z.string().nullable().optional().transform(val => val || undefined),
  goals: z.string().nullable().optional().transform(val => val || undefined),
  status: z.enum(['partial', 'active', 'inactive', 'frozen']).default('partial'),
});

export type PartialMemberFormData = z.infer<typeof partialMemberSchema>;

// Interface for partial member data to be saved to database
export interface PartialMemberData {
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
  medicalIssues?: string;
  goals?: string;
  status: 'partial' | 'active' | 'inactive' | 'frozen';
}

// Validation function for partial member data
export const validatePartialMember = (data: any): { isValid: boolean; errors?: any; data?: PartialMemberFormData } => {
  try {
    const validatedData = partialMemberSchema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: error.errors };
    }
    return { isValid: false, errors: [{ message: 'Unknown validation error' }] };
  }
};