# Requirements Document

## Introduction

The MemberForm component has a critical JavaScript error where `selectedTaxes` is referenced but not defined as a state variable. This causes the component to crash when trying to render tax-related functionality. The component currently has a `selectedTaxId` state but the code expects a `selectedTaxes` object to track which taxes are selected.

## Requirements

### Requirement 1

**User Story:** As a gym administrator, I want the member form to load without JavaScript errors, so that I can successfully create and edit member records.

#### Acceptance Criteria

1. WHEN the MemberForm component is rendered THEN the system SHALL not throw "selectedTaxes is not defined" errors
2. WHEN the component initializes THEN the system SHALL properly define all required state variables for tax handling
3. WHEN the form loads THEN the system SHALL display tax options without crashing

### Requirement 2

**User Story:** As a gym administrator, I want to select tax options for member fees, so that I can apply appropriate taxes to membership charges.

#### Acceptance Criteria

1. WHEN I view the tax selection section THEN the system SHALL display available tax options as checkboxes
2. WHEN I select a tax option THEN the system SHALL update the selectedTaxes state correctly
3. WHEN I select a tax THEN the system SHALL automatically uncheck other tax options (single selection)
4. WHEN a tax is selected THEN the system SHALL recalculate the total membership fees including tax

### Requirement 3

**User Story:** As a gym administrator, I want to see tax calculations in the fee summary, so that I can understand how taxes affect the total amount.

#### Acceptance Criteria

1. WHEN a tax is selected THEN the system SHALL display the tax amount in the fee summary
2. WHEN the tax type is "inclusive" THEN the system SHALL show the tax amount as included in the base amount
3. WHEN the tax type is "exclusive" THEN the system SHALL show the tax amount as an addition to the base amount
4. WHEN no tax is selected THEN the system SHALL not display any tax-related calculations

### Requirement 4

**User Story:** As a gym administrator, I want tax information to be included when submitting member data, so that tax details are properly stored with the member record.

#### Acceptance Criteria

1. WHEN I submit the form with a selected tax THEN the system SHALL include tax information in the submission data
2. WHEN tax information is submitted THEN the system SHALL include tax id, name, rate, type, and calculated amount
3. WHEN no tax is selected THEN the system SHALL submit undefined tax information
4. WHEN the form is submitted THEN the system SHALL not throw errors related to tax data processing