# Implementation Plan

- [x] 1. Create core tax utility functions and types
  - Create `src/utils/taxUtils.ts` with TypeScript interfaces for tax selection state, calculation results, and breakdown items
  - Implement `filterTaxesByType` function to filter taxes based on inclusive/exclusive type
  - Implement `validateTaxSelection` function to enforce mutual exclusivity rules
  - Write unit tests for core tax utility functions
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Implement tax calculation engine
  - Create `calculateTaxAmounts` function for inclusive tax calculations (tax = base_amount * tax_rate / (100 + tax_rate))
  - Create `calculateTaxAmounts` function for exclusive tax calculations (tax = base_amount * tax_rate / 100)
  - Implement cumulative tax calculation for multiple taxes of same type
  - Add tax breakdown generation with individual tax amounts
  - Write unit tests for tax calculation accuracy with various scenarios
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Create enhanced tax selection hook
  - Create `src/hooks/useTaxSelection.ts` custom hook for tax state management
  - Implement state management for selectedTaxes, taxType, and filteredTaxes
  - Add functions to handle tax selection with mutual exclusivity validation
  - Implement real-time tax calculation updates when selections change
  - Write unit tests for tax selection hook behavior
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 4. Update ReceiptForm with enhanced tax selection
  - Replace existing tax checkbox implementation with new tax selection logic
  - Integrate `useTaxSelection` hook into ReceiptForm component
  - Update tax selection UI to show only available taxes based on current selection type
  - Add visual indicators for tax type (inclusive/exclusive) in the UI
  - Update form submission to include new tax data structure
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 5.1, 5.3_

- [x] 5. Update MemberForm with enhanced tax selection
  - Replace existing tax selection implementation with new tax selection logic
  - Integrate `useTaxSelection` hook into MemberForm component
  - Ensure tax selection UI matches ReceiptForm implementation exactly
  - Update member form submission to include new tax data structure
  - Test consistency between MemberForm and ReceiptForm tax behavior
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 5.2, 5.3_

- [x] 6. Enhance PDF generation with tax breakdown section
  - Extend `ReceiptPDFGenerator` class in `src/utils/pdfUtils.ts` to include tax breakdown section
  - Add tax type indicator (inclusive/exclusive) display in PDF
  - Implement individual tax line items with name, percentage, and calculated amount
  - Update total amount calculations in PDF to use new tax calculation logic
  - Replace legacy CGST/SGST section with dynamic tax breakdown
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Update database interfaces for enhanced tax data
  - Extend Receipt interface in `src/utils/database.ts` with new tax fields
  - Add `selected_taxes`, `tax_type`, `tax_breakdown`, and `total_tax_amount` fields
  - Implement backward compatibility handling for legacy `cgst` and `sigst` fields
  - Update receipt creation and update functions to handle new tax data structure
  - Write database migration logic for existing receipts
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8. Implement tax data persistence and retrieval
  - Update receipt save operations to store new tax data structure
  - Update member save operations to store tax information with member records
  - Implement tax data loading when editing existing receipts
  - Implement tax data loading when editing existing member records
  - Add error handling for corrupted or missing tax data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Create comprehensive tax calculation tests
  - Write integration tests for tax calculations across ReceiptForm and MemberForm
  - Test inclusive tax calculations with single and multiple taxes
  - Test exclusive tax calculations with single and multiple taxes
  - Test edge cases: zero amounts, 100% tax rates, very small amounts
  - Test backward compatibility with legacy tax data
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.3, 5.4_

- [ ] 10. Implement PDF tax section integration tests
  - Test PDF generation with inclusive taxes showing correct breakdown
  - Test PDF generation with exclusive taxes showing correct breakdown
  - Test PDF generation with multiple taxes of same type
  - Test PDF layout with long tax names and high tax amounts
  - Test PDF generation with legacy tax data for backward compatibility
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 11. Add form validation for tax selections
  - Implement client-side validation to prevent invalid tax combinations
  - Add validation messages for tax selection errors
  - Ensure form submission is blocked when tax state is inconsistent
  - Add validation for tax calculation results before form submission
  - Test form validation with various invalid tax selection scenarios
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 12. Optimize performance and add error handling
  - Implement caching for tax settings to reduce database queries
  - Add debouncing for real-time tax calculation updates
  - Implement graceful error handling for tax calculation failures
  - Add logging for tax-related errors and edge cases
  - Test performance with large numbers of tax settings and selections
  - _Requirements: 6.5, 3.4, 5.4_