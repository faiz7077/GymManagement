# Trainer Allotment System - Requirements

## Introduction

This feature enables the gym to assign personal trainers (PT) to members, track trainer workload, and manage trainer-member relationships effectively.

## Glossary

- **Trainer**: A staff member with role 'trainer' who can be assigned to members
- **Member**: A gym member who can optionally be assigned a personal trainer
- **Trainer Assignment**: The relationship between a trainer and a member
- **Allotment**: The process of assigning a trainer to a member

## Requirements

### Requirement 1: Database Schema for Trainer Assignment

**User Story:** As a system, I need to store trainer-member relationships in the database

#### Acceptance Criteria

1. WHEN the system initializes, THE Database SHALL add an `assigned_trainer_id` column to the members table
2. WHEN the system initializes, THE Database SHALL add an `assigned_trainer_name` column to the members table for quick reference
3. THE Database SHALL allow NULL values for trainer assignment fields (assignment is optional)
4. THE Database SHALL create an index on `assigned_trainer_id` for efficient queries

### Requirement 2: Trainer Selection in Member Form

**User Story:** As a receptionist, I want to assign a trainer to a member when creating or editing their profile

#### Acceptance Criteria

1. WHEN adding or editing a member, THE Member Form SHALL display a dropdown of available trainers
2. THE Trainer Dropdown SHALL show only active staff members with role 'trainer'
3. THE Trainer Dropdown SHALL display trainer name and current member count
4. THE Trainer Assignment SHALL be optional (can be left unselected)
5. WHEN a trainer is selected, THE System SHALL save both trainer ID and name to the member record

### Requirement 3: Trainer Assignments Page

**User Story:** As an admin, I want to view all trainer assignments and manage them from a dedicated page

#### Acceptance Criteria

1. THE System SHALL provide a "Trainer Assignments" page in the sidebar
2. THE Trainer Assignments Page SHALL display all trainers with their assigned member counts
3. THE Trainer Assignments Page SHALL allow viewing members assigned to each trainer
4. THE Trainer Assignments Page SHALL allow reassigning members to different trainers
5. THE Trainer Assignments Page SHALL allow removing trainer assignments
6. THE Trainer Assignments Page SHALL show trainer workload statistics

### Requirement 4: Member Filtering by Trainer

**User Story:** As a trainer, I want to filter the members list to see only my assigned members

#### Acceptance Criteria

1. THE Members Page SHALL include a trainer filter dropdown
2. THE Trainer Filter SHALL show all trainers plus an "Unassigned" option
3. WHEN a trainer is selected, THE Members Table SHALL display only members assigned to that trainer
4. WHEN "Unassigned" is selected, THE Members Table SHALL display only members without a trainer
5. THE Filter SHALL persist during the session

### Requirement 5: Trainer Dashboard Statistics

**User Story:** As a trainer, I want to see how many members are assigned to me

#### Acceptance Criteria

1. THE Dashboard SHALL display assigned member count for logged-in trainers
2. THE Trainer Assignments Page SHALL show member count for each trainer
3. THE Staff Page SHALL display assigned member count next to each trainer

### Requirement 6: Permissions for Trainer Management

**User Story:** As an admin, I want to control who can assign and manage trainers

#### Acceptance Criteria

1. THE System SHALL allow admins and receptionists to assign trainers to members
2. THE System SHALL allow trainers to view their assigned members
3. THE System SHALL allow admins to manage all trainer assignments
4. THE Trainer Assignments Page SHALL be accessible to admins and trainers
