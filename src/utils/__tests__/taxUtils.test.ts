/**
 * Unit tests for tax utility functions
 */

import {
  TaxSetting,
  filterTaxesByType,
  validateTaxSelection,
  getCurrentTaxType,
  calculateTaxAmounts,
  formatTaxBreakdown,
  validateTaxCalculation,
  createInitialTaxState
} from '../taxUtils';

// Mock tax data for testing
const mockTaxes: TaxSetting[] = [
  {
    id: '1',
    name: 'GST (Inclusive)',
    rate: 18,
    is_inclusive: true,
    is_active: true,
    tax_type: 'GST'
  },
  {
    id: '2',
    name: 'VAT (Inclusive)',
    rate: 12,
    is_inclusive: true,
    is_active: true,
    tax_type: 'VAT'
  },
  {
    id: '3',
    name: 'Service Tax (Exclusive)',
    rate: 15,
    is_inclusive: false,
    is_active: true,
    tax_type: 'Service'
  },
  {
    id: '4',
    name: 'Luxury Tax (Exclusive)',
    rate: 10,
    is_inclusive: false,
    is_active: true,
    tax_type: 'Luxury'
  },
  {
    id: '5',
    name: 'Inactive Tax',
    rate: 5,
    is_inclusive: true,
    is_active: false,
    tax_type: 'Inactive'
  }
];

describe('filterTaxesByType', () => {
  test('should return all active taxes when no type is selected', () => {
    const result = filterTaxesByType(mockTaxes, null);
    expect(result).toHaveLength(4); // Excludes inactive tax
    expect(result.every(tax => tax.is_active)).toBe(true);
  });

  test('should return only inclusive taxes when inclusive type is selected', () => {
    const result = filterTaxesByType(mockTaxes, 'inclusive');
    expect(result).toHaveLength(2);
    expect(result.every(tax => tax.is_inclusive)).toBe(true);
    expect(result.map(tax => tax.id)).toEqual(['1', '2']);
  });

  test('should return only exclusive taxes when exclusive type is selected', () => {
    const result = filterTaxesByType(mockTaxes, 'exclusive');
    expect(result).toHaveLength(2);
    expect(result.every(tax => !tax.is_inclusive)).toBe(true);
    expect(result.map(tax => tax.id)).toEqual(['3', '4']);
  });
});

describe('validateTaxSelection', () => {
  test('should allow any tax when no taxes are currently selected', () => {
    const currentSelection = { '1': false, '2': false, '3': false, '4': false };
    expect(validateTaxSelection(currentSelection, '1', mockTaxes)).toBe(true);
    expect(validateTaxSelection(currentSelection, '3', mockTaxes)).toBe(true);
  });

  test('should allow inclusive tax when inclusive taxes are already selected', () => {
    const currentSelection = { '1': true, '2': false, '3': false, '4': false };
    expect(validateTaxSelection(currentSelection, '2', mockTaxes)).toBe(true);
  });

  test('should not allow exclusive tax when inclusive taxes are selected', () => {
    const currentSelection = { '1': true, '2': false, '3': false, '4': false };
    expect(validateTaxSelection(currentSelection, '3', mockTaxes)).toBe(false);
  });

  test('should allow exclusive tax when exclusive taxes are already selected', () => {
    const currentSelection = { '1': false, '2': false, '3': true, '4': false };
    expect(validateTaxSelection(currentSelection, '4', mockTaxes)).toBe(true);
  });

  test('should not allow inclusive tax when exclusive taxes are selected', () => {
    const currentSelection = { '1': false, '2': false, '3': true, '4': false };
    expect(validateTaxSelection(currentSelection, '1', mockTaxes)).toBe(false);
  });

  test('should return false for non-existent tax', () => {
    const currentSelection = { '1': false, '2': false, '3': false, '4': false };
    expect(validateTaxSelection(currentSelection, 'non-existent', mockTaxes)).toBe(false);
  });
});

describe('getCurrentTaxType', () => {
  test('should return null when no taxes are selected', () => {
    const selectedTaxes = { '1': false, '2': false, '3': false, '4': false };
    expect(getCurrentTaxType(selectedTaxes, mockTaxes)).toBeNull();
  });

  test('should return inclusive when inclusive tax is selected', () => {
    const selectedTaxes = { '1': true, '2': false, '3': false, '4': false };
    expect(getCurrentTaxType(selectedTaxes, mockTaxes)).toBe('inclusive');
  });

  test('should return exclusive when exclusive tax is selected', () => {
    const selectedTaxes = { '1': false, '2': false, '3': true, '4': false };
    expect(getCurrentTaxType(selectedTaxes, mockTaxes)).toBe('exclusive');
  });
});

describe('calculateTaxAmounts', () => {
  test('should return zero tax when no taxes are selected', () => {
    const selectedTaxes = { '1': false, '2': false, '3': false, '4': false };
    const result = calculateTaxAmounts(1000, selectedTaxes, mockTaxes);

    expect(result.baseAmount).toBe(1000);
    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(1000);
    expect(result.taxBreakdown).toHaveLength(0);
  });

  test('should calculate inclusive tax correctly for single tax', () => {
    const selectedTaxes = { '1': true, '2': false, '3': false, '4': false };
    const result = calculateTaxAmounts(1000, selectedTaxes, mockTaxes);

    // For 18% inclusive tax: tax_amount = 1000 * 18 / (100 + 18) = 152.54
    expect(result.baseAmount).toBe(1000);
    expect(result.taxAmount).toBeCloseTo(152.54, 2);
    expect(result.totalAmount).toBe(1000); // Inclusive tax doesn't change total
    expect(result.taxBreakdown).toHaveLength(1);
    expect(result.taxBreakdown[0].type).toBe('inclusive');
  });

  test('should calculate exclusive tax correctly for single tax', () => {
    const selectedTaxes = { '1': false, '2': false, '3': true, '4': false };
    const result = calculateTaxAmounts(1000, selectedTaxes, mockTaxes);

    // For 15% exclusive tax: tax_amount = 1000 * 15 / 100 = 150
    expect(result.baseAmount).toBe(1000);
    expect(result.taxAmount).toBe(150);
    expect(result.totalAmount).toBe(1150); // Exclusive tax adds to total
    expect(result.taxBreakdown).toHaveLength(1);
    expect(result.taxBreakdown[0].type).toBe('exclusive');
  });

  test('should calculate multiple inclusive taxes correctly', () => {
    const selectedTaxes = { '1': true, '2': true, '3': false, '4': false };
    const result = calculateTaxAmounts(1000, selectedTaxes, mockTaxes);

    // GST: 1000 * 18 / 118 = 152.54
    // VAT: 1000 * 12 / 112 = 107.14
    const expectedTaxAmount = 152.54 + 107.14;

    expect(result.baseAmount).toBe(1000);
    expect(result.taxAmount).toBeCloseTo(expectedTaxAmount, 2);
    expect(result.totalAmount).toBe(1000); // Inclusive tax doesn't change total
    expect(result.taxBreakdown).toHaveLength(2);
  });

  test('should calculate multiple exclusive taxes correctly', () => {
    const selectedTaxes = { '1': false, '2': false, '3': true, '4': true };
    const result = calculateTaxAmounts(1000, selectedTaxes, mockTaxes);

    // Service Tax: 1000 * 15 / 100 = 150
    // Luxury Tax: 1000 * 10 / 100 = 100
    const expectedTaxAmount = 150 + 100;

    expect(result.baseAmount).toBe(1000);
    expect(result.taxAmount).toBe(expectedTaxAmount);
    expect(result.totalAmount).toBe(1000 + expectedTaxAmount);
    expect(result.taxBreakdown).toHaveLength(2);
  });
});

describe('formatTaxBreakdown', () => {
  test('should return no taxes message for empty breakdown', () => {
    expect(formatTaxBreakdown([])).toBe('No taxes applied');
  });

  test('should format inclusive tax breakdown correctly', () => {
    const breakdown = [
      { id: '1', name: 'GST', rate: 18, amount: 152.54, type: 'inclusive' as const }
    ];
    const result = formatTaxBreakdown(breakdown);
    expect(result).toBe('Tax Inclusive - GST (18%): ₹152.54');
  });

  test('should format exclusive tax breakdown correctly', () => {
    const breakdown = [
      { id: '3', name: 'Service Tax', rate: 15, amount: 150, type: 'exclusive' as const }
    ];
    const result = formatTaxBreakdown(breakdown);
    expect(result).toBe('Tax Exclusive - Service Tax (15%): ₹150.00');
  });

  test('should format multiple taxes correctly', () => {
    const breakdown = [
      { id: '3', name: 'Service Tax', rate: 15, amount: 150, type: 'exclusive' as const },
      { id: '4', name: 'Luxury Tax', rate: 10, amount: 100, type: 'exclusive' as const }
    ];
    const result = formatTaxBreakdown(breakdown);
    expect(result).toBe('Tax Exclusive - Service Tax (15%): ₹150.00, Luxury Tax (10%): ₹100.00');
  });
});

describe('validateTaxCalculation', () => {
  test('should validate correct tax calculation', () => {
    const result = {
      baseAmount: 1000,
      taxAmount: 250,
      totalAmount: 1250,
      taxBreakdown: [
        { id: '3', name: 'Service Tax', rate: 15, amount: 150, type: 'exclusive' as const },
        { id: '4', name: 'Luxury Tax', rate: 10, amount: 100, type: 'exclusive' as const }
      ]
    };
    expect(validateTaxCalculation(result)).toBe(true);
  });

  test('should reject calculation with negative amounts', () => {
    const result = {
      baseAmount: -1000,
      taxAmount: 250,
      totalAmount: 1250,
      taxBreakdown: []
    };
    expect(validateTaxCalculation(result)).toBe(false);
  });

  test('should reject calculation with inconsistent breakdown', () => {
    const result = {
      baseAmount: 1000,
      taxAmount: 250,
      totalAmount: 1250,
      taxBreakdown: [
        { id: '3', name: 'Service Tax', rate: 15, amount: 200, type: 'exclusive' as const } // Wrong amount
      ]
    };
    expect(validateTaxCalculation(result)).toBe(false);
  });
});

describe('createInitialTaxState', () => {
  test('should create initial state with all taxes unselected', () => {
    const result = createInitialTaxState(mockTaxes);

    expect(result.taxType).toBeNull();
    expect(result.availableTaxes).toHaveLength(4); // Only active taxes
    expect(result.filteredTaxes).toHaveLength(4);

    // All taxes should be unselected
    Object.values(result.selectedTaxes).forEach(selected => {
      expect(selected).toBe(false);
    });
  });

  test('should only include active taxes in available and filtered lists', () => {
    const result = createInitialTaxState(mockTaxes);

    result.availableTaxes.forEach(tax => {
      expect(tax.is_active).toBe(true);
    });

    result.filteredTaxes.forEach(tax => {
      expect(tax.is_active).toBe(true);
    });
  });
});