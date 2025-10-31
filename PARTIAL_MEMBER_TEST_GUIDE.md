# Partial Member Feature Test Guide

## Overview
This guide provides step-by-step instructions to test the partial member save functionality.

## Test Scenarios

### 1. Save Partial Member (New Member)

**Steps:**
1. Navigate to Members page
2. Click "Add New Member" button
3. Fill in basic information:
   - Name: "Test User"
   - Address: "123 Test Street, Test City"
   - Mobile No: "1234567890"
   - Email: "test@example.com"
   - Occupation: "Engineer"
   - Sex: "Male"
   - Date of Birth: Select any date
   - Date of Registration: Today's date
4. Click "Save Member Details" button (above Membership Details section)
5. Verify success message appears
6. Check that member appears in member list with "Partial" status and "Incomplete" badge

**Expected Results:**
- Success toast: "Member Details Saved"
- Member appears in list with partial status
- Member has "Incomplete" badge next to name
- Status shows as "Partial" with amber background

### 2. Complete Partial Member

**Steps:**
1. Find the partial member in the member list
2. Click Edit button for the partial member
3. Notice the "Partial Member" indicator at top of form
4. Fill in membership details:
   - Payment Mode: "Cash"
   - Plan Type: "Monthly"
   - Services: Select "Gym"
   - Registration Fee: 500
   - Package Fee: 1000
   - Paid Amount: 1500
   - Status: "Active"
5. Click "Update Member" button
6. Verify completion message appears

**Expected Results:**
- Success toast: "Membership Completed"
- Member status changes from "Partial" to "Active"
- "Incomplete" badge disappears
- Member now has full membership details

### 3. Filter Partial Members

**Steps:**
1. Go to Members page
2. Use status filter dropdown
3. Select "Partial" from the filter
4. Verify only partial members are shown

**Expected Results:**
- Only members with "Partial" status are displayed
- Filter correctly isolates incomplete members

### 4. Validation Testing

**Steps:**
1. Try to save partial member with missing required fields:
   - Leave Name empty
   - Leave Mobile No empty
   - Leave Email empty
2. Click "Save Member Details"
3. Verify validation errors appear

**Expected Results:**
- Validation errors displayed for missing required fields
- Form does not submit until all required fields are filled
- Clear error messages guide user to fix issues

### 5. Member ID Generation

**Steps:**
1. Create new member without entering Member ID
2. Click "Save Member Details"
3. Verify Member ID is auto-generated

**Expected Results:**
- Member ID automatically generated (e.g., "M001", "M002")
- Generated ID is unique and follows sequence
- Member can be found using generated ID

## Visual Indicators to Verify

### Member List
- ✅ Partial members show "Incomplete" badge next to name
- ✅ Status column shows "Partial" with amber background
- ✅ Filter dropdown includes "Partial" option

### Member Form
- ✅ "Save Member Details" button appears above Membership Details
- ✅ Button shows loading state when saving
- ✅ Partial member indicator appears when editing partial member
- ✅ Success messages are clear and informative

### Database
- ✅ Partial members saved with status = 'partial'
- ✅ Required basic fields are populated
- ✅ Membership fields can be null for partial members
- ✅ Member ID is generated if not provided

## Error Scenarios to Test

1. **Duplicate Member ID**: Try to save with existing member ID
2. **Invalid Email**: Enter malformed email address
3. **Invalid Mobile**: Enter non-numeric mobile number
4. **Network Error**: Test behavior when database is unavailable
5. **Concurrent Access**: Multiple users editing same partial member

## Performance Considerations

- Partial save should be fast (< 2 seconds)
- Member list should load quickly with partial members
- Filtering should be responsive
- No memory leaks when switching between partial/complete members

## Accessibility Testing

- Keyboard navigation works for all buttons
- Screen readers can identify partial member status
- Color indicators have sufficient contrast
- Form validation errors are announced

## Browser Compatibility

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Mobile Responsiveness

- Form layout adapts to mobile screens
- Buttons are touch-friendly
- Member list is scrollable on mobile
- Status indicators remain visible

## Data Integrity Checks

1. Verify partial members don't appear in revenue reports
2. Check that partial members can't generate receipts
3. Ensure partial members don't count in active membership statistics
4. Confirm partial to complete conversion updates all related data

## Rollback Testing

1. Test what happens if partial save fails midway
2. Verify no orphaned data is left in database
3. Check that failed saves don't affect existing members
4. Ensure proper cleanup on errors