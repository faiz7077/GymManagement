# Requirements Document

## Introduction

This feature enhances the gym management system by creating dedicated expiring and expired member tables with advanced filtering capabilities, similar to the existing receipt history table. The system will provide easy access to these tables from the dashboard and optimize the existing receipt card display.

## Glossary

- **System**: The gym management application
- **Expiring Members Table**: A filterable table showing members whose subscriptions will expire within a configurable timeframe
- **Expired Members Table**: A filterable table showing members whose subscriptions have already expired
- **Dashboard**: The main application dashboard page
- **Receipt Card**: The existing recent receipts display component on the dashboard
- **Filter Controls**: UI elements allowing users to filter and search table data
- **Subscription End Date**: The date when a member's gym subscription expires
- **Member Status**: The current status of a member (active, inactive, expired, etc.)

## Requirements

### Requirement 1

**User Story:** As a gym manager, I want to view expiring members in a dedicated filterable table, so that I can proactively manage subscription renewals.

#### Acceptance Criteria

1. WHEN the user accesses the expiring members table, THE System SHALL display all members whose subscriptions expire within the next 30 days
2. WHERE date range filtering is enabled, THE System SHALL allow users to customize the expiry timeframe from 7 to 90 days
3. THE System SHALL provide search functionality to filter members by name, member ID, or mobile number
4. THE System SHALL display member details including name, member ID, mobile number, subscription end date, and days until expiry
5. THE System SHALL include WhatsApp integration for sending renewal reminders to expiring members

### Requirement 2

**User Story:** As a gym manager, I want to view expired members in a dedicated filterable table, so that I can follow up on overdue renewals.

#### Acceptance Criteria

1. THE System SHALL display all members whose subscriptions have already expired
2. WHERE date filtering is applied, THE System SHALL allow filtering expired members by expiry date range
3. THE System SHALL show how many days each member's subscription has been expired
4. THE System SHALL provide search functionality to filter expired members by name, member ID, or mobile number
5. THE System SHALL include WhatsApp integration for sending follow-up messages to expired members

### Requirement 3

**User Story:** As a gym manager, I want easy access to member expiry tables from the dashboard, so that I can quickly monitor subscription status.

#### Acceptance Criteria

1. THE System SHALL add navigation cards on the dashboard for both expiring and expired member tables
2. WHEN a user clicks on an expiry navigation card, THE System SHALL open the corresponding member table
3. THE System SHALL display summary counts of expiring and expired members on the dashboard cards
4. THE System SHALL provide quick action buttons for common tasks like sending bulk reminders
5. THE System SHALL integrate these tables with the existing dashboard layout without disrupting current functionality

### Requirement 4

**User Story:** As a gym manager, I want the receipt card to be more compact, so that I can see more dashboard information at once.

#### Acceptance Criteria

1. THE System SHALL reduce the height of the recent receipts card by 30-40%
2. THE System SHALL maintain all essential information while using more compact display
3. THE System SHALL preserve the "View All" functionality to access the full receipt history
4. THE System SHALL ensure the compact design remains readable and functional
5. THE System SHALL maintain responsive design across different screen sizes

### Requirement 5

**User Story:** As a gym manager, I want advanced filtering options in the member expiry tables, so that I can efficiently manage different member segments.

#### Acceptance Criteria

1. THE System SHALL provide filtering by subscription plan type
2. THE System SHALL allow filtering by member status (active, inactive, frozen)
3. THE System SHALL include sorting options by expiry date, member name, and days until/since expiry
4. THE System SHALL provide pagination controls for large member lists
5. THE System SHALL include export functionality for filtered member data
