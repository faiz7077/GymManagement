import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validatePartialMember, partialMemberSchema } from '@/schemas/partialMemberSchema';

describe('Partial Member Validation', () => {
  describe('partialMemberSchema', () => {
    it('should validate valid partial member data', () => {
      const validData = {
        name: 'John Doe',
        address: '123 Main Street, City',
        mobileNo: '1234567890',
        occupation: 'Engineer',
        sex: 'male' as const,
        dateOfBirth: new Date('1990-01-01'),
        email: 'john@example.com',
        dateOfRegistration: new Date(),
        maritalStatus: 'unmarried' as const,
        status: 'partial' as const
      };

      const result = partialMemberSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid partial member data', () => {
      const invalidData = {
        name: 'J', // Too short
        address: '123', // Too short
        mobileNo: '123', // Too short
        occupation: 'E', // Too short
        sex: 'invalid' as any,
        dateOfBirth: 'invalid-date',
        email: 'invalid-email',
        dateOfRegistration: 'invalid-date'
      };

      const result = partialMemberSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should handle optional fields correctly', () => {
      const dataWithOptionals = {
        name: 'John Doe',
        address: '123 Main Street, City',
        mobileNo: '1234567890',
        occupation: 'Engineer',
        sex: 'male' as const,
        dateOfBirth: new Date('1990-01-01'),
        email: 'john@example.com',
        dateOfRegistration: new Date(),
        telephoneNo: '0987654321',
        alternateNo: '1122334455',
        bloodGroup: 'O+',
        memberImage: 'base64-image-data',
        idProofImage: 'base64-id-proof-data',
        medicalIssues: 'None',
        goals: 'Weight loss'
      };

      const result = partialMemberSchema.safeParse(dataWithOptionals);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.telephoneNo).toBe('0987654321');
        expect(result.data.bloodGroup).toBe('O+');
      }
    });

    it('should transform empty strings to undefined for optional fields', () => {
      const dataWithEmptyStrings = {
        name: 'John Doe',
        address: '123 Main Street, City',
        mobileNo: '1234567890',
        occupation: 'Engineer',
        sex: 'male' as const,
        dateOfBirth: new Date('1990-01-01'),
        email: 'john@example.com',
        dateOfRegistration: new Date(),
        telephoneNo: '',
        alternateNo: null,
        bloodGroup: ''
      };

      const result = partialMemberSchema.safeParse(dataWithEmptyStrings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.telephoneNo).toBeUndefined();
        expect(result.data.alternateNo).toBeUndefined();
        expect(result.data.bloodGroup).toBeUndefined();
      }
    });
  });

  describe('validatePartialMember function', () => {
    it('should return valid result for correct data', () => {
      const validData = {
        name: 'John Doe',
        address: '123 Main Street, City',
        mobileNo: '1234567890',
        occupation: 'Engineer',
        sex: 'male',
        dateOfBirth: new Date('1990-01-01'),
        email: 'john@example.com',
        dateOfRegistration: new Date()
      };

      const result = validatePartialMember(validData);
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should return invalid result with errors for incorrect data', () => {
      const invalidData = {
        name: '', // Required field empty
        mobileNo: '123', // Too short
        email: 'invalid-email'
      };

      const result = validatePartialMember(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should handle validation errors gracefully', () => {
      const result = validatePartialMember(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Required fields validation', () => {
    const baseValidData = {
      name: 'John Doe',
      address: '123 Main Street, City',
      mobileNo: '1234567890',
      occupation: 'Engineer',
      sex: 'male' as const,
      dateOfBirth: new Date('1990-01-01'),
      email: 'john@example.com',
      dateOfRegistration: new Date()
    };

    it('should require name field', () => {
      const data = { ...baseValidData, name: '' };
      const result = partialMemberSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require address field', () => {
      const data = { ...baseValidData, address: '' };
      const result = partialMemberSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require mobileNo field', () => {
      const data = { ...baseValidData, mobileNo: '' };
      const result = partialMemberSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require email field', () => {
      const data = { ...baseValidData, email: '' };
      const result = partialMemberSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require occupation field', () => {
      const data = { ...baseValidData, occupation: '' };
      const result = partialMemberSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require sex field', () => {
      const data = { ...baseValidData };
      delete (data as any).sex;
      const result = partialMemberSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require dateOfBirth field', () => {
      const data = { ...baseValidData };
      delete (data as any).dateOfBirth;
      const result = partialMemberSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require dateOfRegistration field', () => {
      const data = { ...baseValidData };
      delete (data as any).dateOfRegistration;
      const result = partialMemberSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Field format validation', () => {
    const baseValidData = {
      name: 'John Doe',
      address: '123 Main Street, City',
      mobileNo: '1234567890',
      occupation: 'Engineer',
      sex: 'male' as const,
      dateOfBirth: new Date('1990-01-01'),
      email: 'john@example.com',
      dateOfRegistration: new Date()
    };

    it('should validate mobile number format', () => {
      const invalidMobile = { ...baseValidData, mobileNo: 'abc1234567' };
      const result = partialMemberSchema.safeParse(invalidMobile);
      expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
      const invalidEmail = { ...baseValidData, email: 'not-an-email' };
      const result = partialMemberSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it('should validate sex enum values', () => {
      const invalidSex = { ...baseValidData, sex: 'other' as any };
      const result = partialMemberSchema.safeParse(invalidSex);
      expect(result.success).toBe(false);
    });

    it('should validate marital status enum values', () => {
      const invalidMaritalStatus = { ...baseValidData, maritalStatus: 'divorced' as any };
      const result = partialMemberSchema.safeParse(invalidMaritalStatus);
      expect(result.success).toBe(false);
    });
  });
});