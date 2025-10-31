# Requirements Document

## Introduction

The current tax system in both ReceiptForm and MemberForm allows users to select multiple taxes simultaneously without proper mutual exclusivity logic. Users need an enhanced tax selection system where inclusive and exclusive taxes are mutually exclusive, proper tax calculations are applied, and tax details are included in PDF receipts with appropriate columns and calculations.

## Requirements

### Requirement 1

**User Story:** As a gym administrator, I want tax selection to be mutually exclusive between inclusive and exclusive types, so that I can only select taxes of one type at a time.

#### Acceptance Criteria

1. WHEN I select an inclusive tax THEN the system SHALL automatically deselect all exclusive taxes
2. WHEN I select an exclusive tax THEN the system SHALL automatically deselect all inclusive taxes
3. WHEN I have inclusive taxes selected and select another inclusive tax THEN the system SHALL allow multiple inclusive tax selections
4. WHEN I have exclusive taxes selected and select another exclusive tax THEN the system SHALL allow multiple exclusive tax selections
5. WHEN no taxes are selected THEN the system SHALL allow selection of either inclusive or exclusive taxes

### Requirement 2

**User Story:** As a gym administrator, I want to see only relevant tax options based on my current selection, so that I can easily understand which taxes I can select.

#### Acceptance Criteria

1. WHEN I have inclusive taxes selected THEN the system SHALL only show inclusive taxes as selectable options
2. WHEN I have exclusive taxes selected THEN the system SHALL only show exclusive taxes as selectable options
3. WHEN no taxes are selected THEN the system SHALL show all available taxes as selectable options
4. WHEN taxes are filtered THEN the system SHALL visually indicate which taxes are disabled/unavailable

### Requirement 3

**User Story:** As a gym administrator, I want accurate tax calculations applied to receipts and member fees, so that the total amounts reflect proper inclusive or exclusive tax handling.

#### Acceptance Criteria

1. WHEN inclusive taxes are selected THEN the system SHALL calculate tax amounts as part of the base amount (tax = base_amount * tax_rate / (100 + tax_rate))
2. WHEN exclusive taxes are selected THEN the system SHALL calculate tax amounts as additions to the base amount (tax = base_amount * tax_rate / 100)
3. WHEN multiple taxes of the same type are selected THEN the system SHALL apply cumulative tax calculations
4. WHEN tax calculations are performed THEN the system SHALL display subtotal, tax amounts, and final total separately

### Requirement 4

**User Story:** As a gym administrator, I want tax details included in PDF receipts, so that customers can see the tax breakdown on their receipts.

#### Acceptance Criteria

1. WHEN generating a PDF receipt with taxes THEN the system SHALL include a tax details section
2. WHEN taxes are applied THEN the system SHALL show each tax name, percentage, and calculated amount in the PDF
3. WHEN inclusive taxes are used THEN the system SHALL clearly indicate "Tax Inclusive" in the PDF
4. WHEN exclusive taxes are used THEN the system SHALL clearly indicate "Tax Exclusive" in the PDF
5. WHEN multiple taxes are applied THEN the system SHALL list each tax separately with individual amounts

### Requirement 5

**User Story:** As a gym administrator, I want the tax system to work consistently across both ReceiptForm and MemberForm, so that tax handling is uniform throughout the application.

#### Acceptance Criteria

1. WHEN using tax selection in ReceiptForm THEN the system SHALL apply the same mutual exclusivity logic as MemberForm
2. WHEN using tax selection in MemberForm THEN the system SHALL apply the same mutual exclusivity logic as ReceiptForm
3. WHEN tax calculations are performed THEN the system SHALL use identical calculation logic in both forms
4. WHEN tax data is processed THEN the system SHALL use consistent data structures in both forms

### Requirement 6

**User Story:** As a gym administrator, I want tax information properly stored and retrieved, so that tax details are preserved when editing receipts or member records.

#### Acceptance Criteria

1. WHEN saving a receipt with taxes THEN the system SHALL store tax type (inclusive/exclusive), selected tax IDs, and calculated amounts
2. WHEN saving a member record with taxes THEN the system SHALL store tax type (inclusive/exclusive), selected tax IDs, and calculated amounts
3. WHEN loading an existing receipt THEN the system SHALL restore the correct tax selections and calculations
4. WHEN loading an existing member record THEN the system SHALL restore the correct tax selections and calculations
5. WHEN tax data is corrupted or missing THEN the system SHALL handle gracefully without crashing