# Requirements Document

## Introduction

This feature creates dedicated tables for managing members with expiring and expired subscriptions, similar to the receipt history functionality. It includes filtering capabilities, dashboard integration, and optimization of the existing receipt display to make room for the new member expiry management features.

## Glossary

- **Expiring Soon Members**: Members whose subscription will expire within a configurable timeframe (default 7 days)
- **Expired Members**: Members whose subscription has already expired
- **Member Expiry Table**: A filterable table component displaying members based on their subscription status
- **Dashboard Integration**: Adding expiry management widgets to the main dashboard
- **Receipt Card Optimization**: Reducing the size of receipt display cards to accommodate new features
- **Subscription Status Filter**: A filtering mechanism to view members by their subscription expiry status

## Requirements

### Requirement 1

**User Story:** As a gym administrator, I want to view members with expiring subscriptions in a dedicated table, so that I can proactively manage renewals and prevent service interruptions.

#### Acceptance Criteria

1. WHEN accessing the expiring members table, THE system SHALL display all members whose subscriptions expire within 7 days
2. THE expiring members table SHALL show member name, subscription end date, days until expiry, contact information, and plan type
3. THE table SHALL be sortable by expiry date, member name, and plan type
4. THE table SHALL include search functionality to filter members by name or member ID
5. THE table SHALL provide action buttons for each member to create renewal receipts or contact the member

### Requirement 2

**User Story:** As a gym administrator, I want to view expired members in a separate table, so that I can follow up on overdue renewals and manage inactive memberships.

#### Acceptance Criteria

1. WHEN accessing the expired members table, THE system SHALL display all members whose subscriptions have already expired
2. THE expired members table SHALL show member name, subscription end date, days since expiry, contact information, and plan type
3. THE table SHALL be sortable by expiry date, member name, and days overdue
4. THE table SHALL include search functionality to filter members by name or member ID
5. THE table SHALL provide action buttons for each member to create renewal receipts, mark as inactive, or contact the member

### Requirement 3

**User Story:** As a gym administrator, I want to access member expiry information directly from the dashboard, so that I can quickly see subscription status without navigating to separate pages.

#### Acceptance Criteria

1. THE dashboard SHALL display a summary card showing the count of expiring soon members
2. THE dashboard SHALL display a summary card showing the count of expired members
3. WHEN clicking on the expiring soon card, THE system SHALL navigate to the expiring members table
4. WHEN clicking on the expired members card, THE system SHALL navigate to the expired members table
5. THE dashboard cards SHALL update in real-time when member subscription statuses change

### Requirement 4

**User Story:** As a gym administrator, I want the receipt display to be more compact, so that I have more screen space for other important information like member expiry status.

#### Acceptance Criteria

1. THE receipt cards SHALL be reduced in size while maintaining readability
2. THE receipt table SHALL use a more compact layout with smaller fonts and reduced padding
3. THE receipt information SHALL remain complete but displayed more efficiently
4. THE receipt actions SHALL remain easily accessible despite the smaller size
5. THE receipt display SHALL be responsive and work well on different screen sizes

### Requirement 5

**User Story:** As a gym administrator, I want to filter and search within the member expiry tables, so that I can quickly find specific members or groups of members based on various criteria.

#### Acceptance Criteria

1. THE member expiry tables SHALL include a search bar to filter by member name, ID, or contact information
2. THE tables SHALL include filter options for plan type, days until/since expiry, and member status
3. THE tables SHALL include date range filters to view members expiring within specific periods
4. THE search and filter functionality SHALL work in real-time as the user types
5. THE tables SHALL display the number of filtered results and total members

### Requirement 6

**User Story:** As a gym administrator, I want to perform bulk actions on members in the expiry tables, so that I can efficiently manage multiple renewals or status changes at once.

#### Acceptance Criteria

1. THE member expiry tables SHALL include checkboxes for selecting multiple members
2. THE tables SHALL provide bulk action options including "Send Renewal Reminders", "Mark as Inactive", and "Export to CSV"
3. WHEN performing bulk actions, THE system SHALL show a confirmation dialog with the number of affected members
4. THE bulk actions SHALL be executed asynchronously with progress indication
5. THE system SHALL provide feedback on the success or failure of bulk operations

### Requirement 7

**User Story:** As a gym administrator, I want the member expiry management to integrate seamlessly with existing workflows, so that I can use familiar patterns and maintain consistency across the application.

#### Acceptance Criteria

1. THE member expiry tables SHALL use the same UI components and styling as the receipt history tables
2. THE tables SHALL follow the same interaction patterns for sorting, filtering, and actions
3. THE member expiry pages SHALL integrate with the existing navigation and sidebar structure
4. THE action buttons SHALL use the same icons and styling as other parts of the application
5. THE tables SHALL support the same keyboard navigation and accessibility features as existing tables