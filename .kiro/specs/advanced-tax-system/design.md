# Design Document

## Overview

This design outlines the implementation of an advanced tax selection system with mutual exclusivity between inclusive and exclusive taxes, enhanced tax calculations, and comprehensive PDF receipt integration. The system will work consistently across both ReceiptForm and MemberForm components while maintaining backward compatibility with existing tax data.

## Architecture

### Core Components

1. **Tax Selection Logic Component** - Handles mutual exclusivity and filtering
2. **Tax Calculation Engine** - Performs inclusive/exclusive tax calculations
3. **PDF Tax Integration** - Extends existing PDF generation with tax details
4. **Tax State Management** - Unified state management across forms

### Data Flow

```
User Tax Selection → Mutual Exclusivity Filter → Tax Calculation Engine → Form State Update → PDF Generation
```

## Components and Interfaces

### 1. Tax Selection Logic

**Location**: `src/utils/taxUtils.ts`

```typescript
interface TaxSelectionState {
  selectedTaxes: { [taxId: string]: boolean };
  taxType: 'inclusive' | 'exclusive' | null;
  availableTaxes: TaxSetting[];
  filteredTaxes: TaxSetting[];
}

interface TaxCalculationResult {
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxBreakdown: TaxBreakdownItem[];
}

interface TaxBreakdownItem {
  id: string;
  name: string;
  rate: number;
  amount: number;
  type: 'inclusive' | 'exclusive';
}
```

**Key Functions**:
- `filterTaxesByType(taxes: TaxSetting[], selectedType: 'inclusive' | 'exclusive' | null): TaxSetting[]`
- `validateTaxSelection(currentSelection: {[key: string]: boolean}, newTaxId: string, taxes: TaxSetting[]): boolean`
- `calculateTaxAmounts(baseAmount: number, selectedTaxes: TaxSetting[], taxType: 'inclusive' | 'exclusive'): TaxCalculationResult`

### 2. Enhanced Form Components

**ReceiptForm Tax Section**:
- Replace current tax checkboxes with filtered tax selection
- Add tax type indicator (inclusive/exclusive)
- Show real-time tax calculations

**MemberForm Tax Section**:
- Implement identical tax selection logic
- Integrate with existing fee calculation system
- Maintain consistency with ReceiptForm

### 3. PDF Enhancement

**Extended PDF Structure**:
- Add tax breakdown section after payment breakdown
- Include tax type indicator (inclusive/exclusive)
- Show individual tax calculations
- Update total calculations to reflect tax handling

## Data Models

### Enhanced Receipt Interface

```typescript
interface Receipt {
  // ... existing fields
  
  // Enhanced tax fields
  selected_taxes: { [taxId: string]: number }; // tax_id -> calculated_amount
  tax_type: 'inclusive' | 'exclusive' | null;
  tax_breakdown: TaxBreakdownItem[];
  total_tax_amount: number;
  base_amount_before_tax: number;
  
  // Legacy fields (maintained for backward compatibility)
  cgst?: number;
  sigst?: number;
}
```

### Tax Settings Interface

```typescript
interface TaxSetting {
  id: string;
  name: string;
  rate: number;
  is_inclusive: boolean;
  is_active: boolean;
  tax_type: string;
  description?: string;
}
```

## Error Handling

### Tax Selection Errors
- **Invalid Tax Combination**: Prevent selection of mixed inclusive/exclusive taxes
- **Missing Tax Data**: Handle cases where tax settings are not loaded
- **Calculation Errors**: Validate tax calculations and handle edge cases

### PDF Generation Errors
- **Missing Tax Data**: Generate PDF with available information, note missing data
- **Calculation Inconsistencies**: Log warnings and use fallback calculations
- **Formatting Issues**: Ensure tax section renders properly even with long tax names

### Form Validation Errors
- **Tax State Inconsistency**: Validate tax selections before form submission
- **Amount Calculation Errors**: Ensure total amounts are consistent with tax calculations

## Testing Strategy

### Unit Tests
1. **Tax Utility Functions**
   - Test mutual exclusivity logic
   - Test tax calculation accuracy for both inclusive and exclusive taxes
   - Test edge cases (zero amounts, high tax rates, multiple taxes)

2. **Form Integration**
   - Test tax selection state management
   - Test form submission with tax data
   - Test backward compatibility with existing receipts

3. **PDF Generation**
   - Test PDF generation with various tax scenarios
   - Test PDF layout with long tax names and multiple taxes
   - Test backward compatibility with legacy tax data

### Integration Tests
1. **Cross-Form Consistency**
   - Test that ReceiptForm and MemberForm behave identically
   - Test data persistence and retrieval
   - Test tax calculations match between forms and PDF

2. **Database Integration**
   - Test tax data storage and retrieval
   - Test migration of legacy tax data
   - Test performance with large tax datasets

### User Acceptance Tests
1. **Tax Selection Workflow**
   - User can select inclusive taxes and system prevents exclusive selection
   - User can select exclusive taxes and system prevents inclusive selection
   - User can select multiple taxes of the same type
   - Tax calculations update in real-time

2. **PDF Receipt Verification**
   - PDF shows correct tax breakdown
   - PDF indicates tax type (inclusive/exclusive)
   - PDF calculations match form calculations
   - PDF handles edge cases gracefully

## Implementation Phases

### Phase 1: Core Tax Logic
- Implement tax utility functions
- Create tax selection state management
- Add tax calculation engine

### Phase 2: Form Integration
- Update ReceiptForm with new tax logic
- Update MemberForm with new tax logic
- Ensure cross-form consistency

### Phase 3: PDF Enhancement
- Extend PDF generator with tax section
- Update tax calculation display
- Test PDF generation with various scenarios

### Phase 4: Testing & Refinement
- Comprehensive testing across all components
- Performance optimization
- User experience refinements

## Backward Compatibility

### Legacy Tax Data
- Maintain support for existing `cgst` and `sigst` fields
- Migrate legacy tax data to new structure where possible
- Provide fallback calculations for incomplete tax data

### Database Schema
- Add new tax fields without breaking existing queries
- Provide migration scripts for existing receipts
- Maintain indexes for performance

### API Compatibility
- Ensure existing API endpoints continue to work
- Add new endpoints for enhanced tax functionality
- Version API changes appropriately

## Performance Considerations

### Tax Calculations
- Cache tax settings to avoid repeated database queries
- Optimize calculation algorithms for real-time updates
- Implement debouncing for rapid tax selection changes

### PDF Generation
- Optimize PDF rendering with tax sections
- Consider lazy loading of tax data for PDF generation
- Implement caching for frequently generated receipts

### Database Queries
- Index tax-related fields for fast filtering
- Optimize queries for tax settings retrieval
- Consider denormalization for frequently accessed tax data