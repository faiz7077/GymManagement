# Requirements Document

## Introduction

This feature adds an action dropdown menu to the MemberDetails dialog that allows users to quickly navigate to create receipts, attendance records, and body measurements for the specific member being viewed. This improves workflow efficiency by providing direct access to member-specific actions without having to navigate to separate pages and manually select the member.

## Glossary

- **MemberDetails Dialog**: The modal dialog that displays comprehensive information about a selected member
- **Action Dropdown**: A dropdown menu containing quick action buttons for member-specific operations
- **Receipt Creation**: The process of creating a new payment receipt for a specific member
- **Attendance Recording**: The process of recording attendance for a specific member
- **Body Measurement Recording**: The process of recording physical measurements for a specific member
- **Navigation System**: The React Router-based routing system used to navigate between pages
- **Pre-filled Form**: A form that automatically populates member information when accessed through the action dropdown

## Requirements

### Requirement 1

**User Story:** As a gym administrator, I want to access member-specific actions directly from the member details dialog, so that I can quickly perform common tasks without navigating through multiple pages.

#### Acceptance Criteria

1. WHEN viewing a member's details in the MemberDetails dialog, THE Action Dropdown SHALL be visible in the dialog header
2. WHEN the Action Dropdown is clicked, THE system SHALL display three action options: "Create Receipt", "Record Attendance", and "Record Body Measurements"
3. THE Action Dropdown SHALL be positioned prominently in the dialog header for easy access
4. THE Action Dropdown SHALL use appropriate icons for each action option
5. THE Action Dropdown SHALL be accessible via keyboard navigation

### Requirement 2

**User Story:** As a gym administrator, I want to create a receipt for a specific member directly from their details dialog, so that I can quickly process payments without manually selecting the member.

#### Acceptance Criteria

1. WHEN "Create Receipt" is selected from the Action Dropdown, THE system SHALL navigate to the receipts page
2. WHEN navigating to the receipts page via the Action Dropdown, THE receipt form SHALL be automatically opened
3. WHEN the receipt form opens via member action, THE member field SHALL be pre-filled with the selected member's information
4. THE pre-filled member information SHALL include member ID, name, mobile number, and email
5. THE MemberDetails dialog SHALL close when navigating to the receipt creation

### Requirement 3

**User Story:** As a gym administrator, I want to record attendance for a specific member directly from their details dialog, so that I can quickly mark their presence without searching for them.

#### Acceptance Criteria

1. WHEN "Record Attendance" is selected from the Action Dropdown, THE system SHALL navigate to the attendance page
2. WHEN navigating to the attendance page via the Action Dropdown, THE attendance form SHALL be automatically opened
3. WHEN the attendance form opens via member action, THE member field SHALL be pre-filled with the selected member's information
4. THE pre-filled member information SHALL include member ID, name, and profile image
5. THE MemberDetails dialog SHALL close when navigating to the attendance recording

### Requirement 4

**User Story:** As a gym administrator, I want to record body measurements for a specific member directly from their details dialog, so that I can quickly track their physical progress.

#### Acceptance Criteria

1. WHEN "Record Body Measurements" is selected from the Action Dropdown, THE system SHALL navigate to the body measurements page
2. WHEN navigating to the body measurements page via the Action Dropdown, THE measurement form SHALL be automatically opened
3. WHEN the measurement form opens via member action, THE member field SHALL be pre-filled with the selected member's information
4. THE pre-filled member information SHALL include member ID, name, current height, and current weight if available
5. THE MemberDetails dialog SHALL close when navigating to the measurement recording

### Requirement 5

**User Story:** As a gym administrator, I want the action dropdown to be visually consistent with the existing UI design, so that it feels like a natural part of the application.

#### Acceptance Criteria

1. THE Action Dropdown SHALL use the existing UI component library (shadcn/ui)
2. THE Action Dropdown SHALL follow the application's color scheme and typography
3. THE Action Dropdown SHALL use appropriate icons from the Lucide icon library
4. THE Action Dropdown SHALL have hover and focus states consistent with other interactive elements
5. THE Action Dropdown SHALL be responsive and work properly on different screen sizes