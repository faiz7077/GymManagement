# Subscription Status "Pending" Feature

## Overview
Added a new "pending" subscription status for members who are partially saved (basic information only, without membership/payment details).

## Changes Made

### 1. Database Schema Updates (`electron/database.cjs` & `electron/database_original.cjs`)

#### Members Table
- Updated `subscription_status` CHECK constraint to include 'pending':
  ```sql
  subscription_status TEXT CHECK (subscription_status IN ('active', 'expiring_soon', 'expired', 'pending')) DEFAULT 'active'
  ```

#### savePartialMember Function
- Modified to set `subscription_status = 'pending'` when saving partial members
- Added `subscription_status` field to INSERT statement

#### completePartialMember Function
- Updated to set `subscription_status = 'active'` when completing partial member registration

#### Migration Function
- Added `migrateSubscriptionStatusConstraint()` to handle existing databases
- Automatically migrates existing partial members to have 'pending' subscription status
- Called in `runMigrations()` method

### 2. Frontend Updates (`src/pages/Members.tsx`)

#### Subscription Status Display
- Added styling for 'pending' status badge:
  - Amber background (`bg-amber-50`)
  - Amber text (`text-amber-700`)
  - Amber border (`border-amber-300`)
- Displays as "Pending" in the table

#### Subscription Filter
- Added "Pending" option to subscription filter dropdown
- Allows filtering members by pending subscription status

## User Flow

### Adding a New Member (Partial Save)
1. User clicks "Add Member"
2. Fills in basic information (name, email, mobile, etc.)
3. Clicks "Save Partial" button
4. Member is saved with:
   - `status = 'partial'`
   - `subscription_status = 'pending'`
5. Member appears in list with:
   - "Incomplete" badge (for partial status)
   - "Pending" subscription status badge (amber colored)

### Completing a Partial Member
1. User edits the partial member
2. Fills in membership details (plan, fees, payment, etc.)
3. Saves the member
4. Member is updated with:
   - `status = 'active'` (or as specified)
   - `subscription_status = 'active'`
5. Member now shows as fully registered

## Benefits

1. **Clear Status Indication**: Users can immediately see which members have pending subscriptions
2. **Easy Filtering**: Can filter to see only members with pending subscriptions
3. **Better Workflow**: Separates incomplete registrations from expired memberships
4. **Data Integrity**: Automatic migration ensures existing partial members get the correct status

## Testing

To test the feature:
1. Restart the application (migration will run automatically)
2. Add a new member using "Save Partial"
3. Verify the member shows "Pending" subscription status
4. Edit the member and complete the registration
5. Verify the subscription status changes to "Active"
6. Use the subscription filter to view only pending members
