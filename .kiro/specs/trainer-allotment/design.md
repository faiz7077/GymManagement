# Trainer Allotment System - Design

## Overview

The Trainer Allotment System enables assignment of personal trainers to gym members, providing workload tracking and member filtering capabilities.

## Architecture

### Database Layer
- Add `assigned_trainer_id` and `assigned_trainer_name` columns to members table
- Create methods to get trainers with member counts
- Create methods to get members by trainer

### Backend Layer (Electron)
- IPC handlers for trainer-related queries
- Database methods for trainer assignment operations

### Frontend Layer
- Update MemberForm with trainer selection dropdown
- Create TrainerAssignments page
- Add trainer filter to Members page
- Update Staff page to show member counts

## Components and Interfaces

### Database Schema Changes

```sql
ALTER TABLE members ADD COLUMN assigned_trainer_id TEXT;
ALTER TABLE members ADD COLUMN assigned_trainer_name TEXT;
CREATE INDEX idx_members_trainer ON members(assigned_trainer_id);
```

### New Database Methods

1. `getActiveTrainers()` - Get all active staff with role 'trainer'
2. `getTrainerWithMemberCount(trainerId)` - Get trainer with assigned member count
3. `getAllTrainersWithMemberCounts()` - Get all trainers with their member counts
4. `getMembersByTrainer(trainerId)` - Get all members assigned to a trainer
5. `assignTrainerToMember(memberId, trainerId, trainerName)` - Assign trainer to member
6. `removeTrainerFromMember(memberId)` - Remove trainer assignment

### IPC Handlers

- `staff-get-active-trainers`
- `staff-get-trainers-with-counts`
- `members-get-by-trainer`
- `members-assign-trainer`
- `members-remove-trainer`

### React Components

1. **TrainerAssignments Page** (`src/pages/TrainerAssignments.tsx`)
   - List of all trainers with member counts
   - Expandable sections showing assigned members
   - Reassign and remove actions
   - Statistics cards

2. **Trainer Selector Component** (in MemberForm)
   - Dropdown with trainer list
   - Shows member count per trainer
   - Optional selection

3. **Trainer Filter** (in Members page)
   - Filter dropdown in search bar
   - Options: All, Unassigned, Individual trainers

## Data Models

### Member (Updated)
```typescript
interface Member {
  // ... existing fields
  assigned_trainer_id?: string;
  assigned_trainer_name?: string;
}
```

### Trainer with Count
```typescript
interface TrainerWithCount {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization?: string;
  member_count: number;
  status: string;
}
```

## Error Handling

- Handle case where trainer is deleted but still assigned to members
- Validate trainer exists before assignment
- Handle concurrent assignment updates
- Show appropriate error messages for failed operations

## Testing Strategy

- Test trainer assignment during member creation
- Test trainer assignment during member update
- Test filtering members by trainer
- Test trainer removal
- Test statistics accuracy
- Test permissions for different roles
