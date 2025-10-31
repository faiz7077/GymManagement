# Design Document

## Overview

This design implements a partial member save feature in the MemberForm component that allows saving basic member information before completing the full membership registration process. The solution involves adding a new save button, creating partial member validation logic, and updating the database schema to handle incomplete member records.

## Architecture

### Component Structure
- **MemberForm Component**: Enhanced with partial save functionality
- **Database Layer**: Updated to handle partial member records
- **Validation Layer**: Separate validation schemas for partial vs complete members
- **UI Components**: New save button and status indicators

### Data Flow
1. User fills basic member information
2. User clicks "Save Member Details" button
3. System validates basic information only
4. System saves partial member record to database
5. System provides feedback and allows continued editing

## Components and Interfaces

### MemberForm Component Updates

#### New State Variables
```typescript
const [isSavingPartial, setIsSavingPartial] = useState(false);
const [isPartialMember, setIsPartialMember] = useState(false);
```

#### New Props Interface
```typescript
interface MemberFormProps {
  initialData?: LegacyMember;
  enquiryData?: LegacyEnquiry;
  onSubmit: (data: MemberData) => void;
  onPartialSave?: (data: PartialMemberData) => void; // New prop
}
```

#### Partial Member Data Interface
```typescript
interface PartialMemberData {
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
```

### Database Schema Updates

#### Member Status Enhancement
- Add 'partial' status to existing member status enum
- Ensure membership-related fields can be null for partial records

#### Database Methods
```typescript
// New method for saving partial members
async savePartialMember(memberData: PartialMemberData): Promise<{success: boolean, data?: any, error?: string}>

// Enhanced method to check if member is partial
async isPartialMember(memberId: string): Promise<boolean>

// Method to convert partial member to full member
async completePartialMember(memberId: string, membershipData: MembershipData): Promise<{success: boolean, data?: any, error?: string}>
```

### Validation Schema

#### Partial Member Validation
```typescript
const partialMemberSchema = z.object({
  customMemberId: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  mobileNo: z.string().min(10, 'Mobile number must be at least 10 digits').regex(/^\d+$/, 'Mobile number must contain only digits'),
  occupation: z.string().min(2, 'Occupation is required'),
  sex: z.enum(['male', 'female']),
  dateOfBirth: z.union([z.date(), z.string().transform(str => new Date(str))]),
  email: z.string().email('Invalid email address'),
  dateOfRegistration: z.union([z.date(), z.string().transform(str => new Date(str))]),
  // Optional fields
  telephoneNo: z.string().optional(),
  maritalStatus: z.enum(['married', 'unmarried']).default('unmarried'),
  anniversaryDate: z.union([z.date(), z.string().transform(str => str ? new Date(str) : undefined)]).optional(),
  bloodGroup: z.string().optional(),
  alternateNo: z.string().optional(),
  memberImage: z.string().optional(),
  idProofImage: z.string().optional(),
  medicalIssues: z.string().optional(),
  goals: z.string().optional(),
});
```

## Data Models

### Enhanced Member Model
```typescript
interface LegacyMember {
  // Existing fields...
  status: 'partial' | 'active' | 'inactive' | 'frozen'; // Enhanced status
  
  // Membership fields (nullable for partial members)
  paymentMode?: 'cash' | 'upi' | 'bank_transfer';
  planType?: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  services?: string[];
  membershipFees?: number;
  registrationFee?: number;
  packageFee?: number;
  discount?: number;
  paidAmount?: number;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}
```

### Member Status Indicators
```typescript
interface MemberStatusInfo {
  status: 'partial' | 'complete';
  label: string;
  color: string;
  icon: string;
  description: string;
}
```

## Error Handling

### Validation Errors
- Display field-specific validation errors for required basic information
- Show clear messaging when partial save fails
- Provide guidance on missing required fields

### Database Errors
- Handle duplicate member ID scenarios
- Manage database connection issues during partial save
- Provide rollback mechanism if partial save fails

### User Experience Errors
- Prevent accidental navigation away from unsaved changes
- Show loading states during save operations
- Provide clear success/failure feedback

## Testing Strategy

### Unit Tests
1. **Partial Member Validation Tests**
   - Test partial member schema validation
   - Test required vs optional field validation
   - Test data transformation and sanitization

2. **Database Operation Tests**
   - Test partial member save functionality
   - Test member status updates
   - Test partial to complete member conversion

3. **Component Logic Tests**
   - Test partial save button functionality
   - Test form state management
   - Test validation error handling

### Integration Tests
1. **End-to-End Partial Save Flow**
   - Test complete partial member save process
   - Test navigation and state persistence
   - Test error scenarios and recovery

2. **Member List Integration**
   - Test partial member display in member list
   - Test status indicators and filtering
   - Test editing partial members

### User Acceptance Tests
1. **Administrator Workflow Tests**
   - Test saving partial member information
   - Test completing partial member registration
   - Test member list management with partial members

2. **Data Integrity Tests**
   - Test member ID generation for partial members
   - Test duplicate detection and prevention
   - Test data consistency across partial and complete saves

## Implementation Phases

### Phase 1: Core Partial Save Functionality
- Add partial member validation schema
- Implement partial save button in MemberForm
- Add database method for saving partial members
- Implement basic success/error feedback

### Phase 2: Enhanced User Experience
- Add member status indicators in member list
- Implement partial member filtering and search
- Add visual cues for incomplete member records
- Enhance form validation messaging

### Phase 3: Advanced Features
- Add bulk operations for partial members
- Implement partial member analytics
- Add automated follow-up reminders
- Enhance reporting for partial vs complete members