# Trainer Allotment System - Implementation Tasks

- [x] 1. Update database schema for trainer assignments
  - Add `assigned_trainer_id` column to members table
  - Add `assigned_trainer_name` column to members table
  - Create index on `assigned_trainer_id`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement database methods for trainer operations
  - [x] 2.1 Create `getActiveTrainers()` method
    - Query staff table for active trainers
    - Return trainer details
    - _Requirements: 2.2_
  
  - [x] 2.2 Create `getAllTrainersWithMemberCounts()` method
    - Join staff and members tables
    - Count assigned members per trainer
    - Return trainers with counts
    - _Requirements: 3.2, 3.6, 5.2_
  
  - [x] 2.3 Create `getMembersByTrainer()` method
    - Query members by trainer ID
    - Return member list
    - _Requirements: 3.3, 4.3_
  
  - [x] 2.4 Create `assignTrainerToMember()` method
    - Update member record with trainer ID and name
    - Validate trainer exists
    - _Requirements: 2.5_
  
  - [x] 2.5 Create `removeTrainerFromMember()` method
    - Clear trainer fields from member record
    - _Requirements: 3.5_

- [x] 3. Add IPC handlers and preload methods
  - Add IPC handlers in main.js for trainer operations
  - Expose methods in preload.js
  - Add TypeScript interfaces in database.ts
  - _Requirements: All_

- [x] 4. Update Member Form with trainer selection
  - [x] 4.1 Add trainer dropdown to MemberForm
    - Fetch active trainers on form load
    - Display trainer name and member count
    - Make selection optional
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 4.2 Handle trainer assignment on form submit
    - Save trainer ID and name when selected
    - Allow clearing trainer assignment
    - _Requirements: 2.5_

- [ ] 5. Create Trainer Assignments page
  - [ ] 5.1 Create TrainerAssignments.tsx page
    - Set up page layout with header
    - Add statistics cards
    - _Requirements: 3.1_
  
  - [ ] 5.2 Display trainers list with member counts
    - Show trainer cards with details
    - Display assigned member count
    - Add expand/collapse functionality
    - _Requirements: 3.2, 3.6_
  
  - [ ] 5.3 Show assigned members for each trainer
    - Display member list in expandable section
    - Show member details (name, ID, status)
    - _Requirements: 3.3_
  
  - [ ] 5.4 Implement reassign functionality
    - Add reassign button for each member
    - Show trainer selection dialog
    - Update assignment on confirmation
    - _Requirements: 3.4_
  
  - [ ] 5.5 Implement remove assignment functionality
    - Add remove button for each member
    - Confirm before removing
    - Update member record
    - _Requirements: 3.5_

- [ ] 6. Add trainer filter to Members page
  - [ ] 6.1 Add trainer filter dropdown
    - Add filter to search bar area
    - Populate with trainers list
    - Add "All" and "Unassigned" options
    - _Requirements: 4.1, 4.2_
  
  - [ ] 6.2 Implement filter logic
    - Filter members by selected trainer
    - Show unassigned members when selected
    - Update table display
    - _Requirements: 4.3, 4.4, 4.5_

- [ ] 7. Add trainer assignments to sidebar
  - Add "Trainer Assignments" menu item
  - Set appropriate permission
  - Add icon
  - _Requirements: 3.1_

- [ ] 8. Update Staff page with member counts
  - Display assigned member count for each trainer
  - Add badge or indicator
  - _Requirements: 5.3_

- [ ] 9. Add trainer statistics to Dashboard
  - Show assigned member count for logged-in trainers
  - Display in statistics cards
  - _Requirements: 5.1_

- [ ] 10. Implement permissions for trainer management
  - Configure role permissions for trainer assignment
  - Restrict Trainer Assignments page access
  - Allow trainers to view their assignments
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
