/**
 * Tax Utility Functions and Types
 * Handles tax selection logic, calculations, and mutual exclusivity
 */

// Core tax interfaces
export interface TaxSetting {
  id: string;
  name: string;
  rate: number;
  is_inclusive: boolean;
  is_active: boolean;
  tax_type: string;
  description?: string;
}

export interface TaxSelectionState {
  selectedTaxes: { [taxId: string]: boolean };
  taxType: 'inclusive' | 'exclusive' | null;
  availableTaxes: TaxSetting[];
  filteredTaxes: TaxSetting[];
}

export interface TaxBreakdownItem {
  id: string;
  name: string;
  rate: number;
  amount: number;
  type: 'inclusive' | 'exclusive';
}

export interface TaxCalculationResult {
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxBreakdown: TaxBreakdownItem[];
}

/**
 * Filters taxes based on the currently selected tax type
 * Implements mutual exclusivity between inclusive and exclusive taxes
 */
export function filterTaxesByType(
  taxes: TaxSetting[], 
  selectedType: 'inclusive' | 'exclusive' | null
): TaxSetting[] {
  if (!selectedType) {
    // No taxes selected yet, show all available taxes
    return taxes.filter(tax => tax.is_active);
  }

  // Filter taxes to only show the same type as currently selected
  return taxes.filter(tax => 
    tax.is_active && 
    (selectedType === 'inclusive' ? tax.is_inclusive : !tax.is_inclusive)
  );
}

/**
 * Validates if a new tax selection is allowed based on mutual exclusivity rules
 */
export function validateTaxSelection(
  currentSelection: { [key: string]: boolean },
  newTaxId: string,
  taxes: TaxSetting[]
): boolean {
  const newTax = taxes.find(tax => tax.id === newTaxId);
  if (!newTax) return false;

  // Get currently selected taxes
  const selectedTaxIds = Object.keys(currentSelection).filter(id => currentSelection[id]);
  
  if (selectedTaxIds.length === 0) {
    // No taxes currently selected, any tax is valid
    return true;
  }

  // Check if all currently selected taxes are the same type as the new tax
  const selectedTaxes = taxes.filter(tax => selectedTaxIds.includes(tax.id));
  const newTaxType = newTax.is_inclusive ? 'inclusive' : 'exclusive';
  
  return selectedTaxes.every(tax => 
    (tax.is_inclusive ? 'inclusive' : 'exclusive') === newTaxType
  );
}

/**
 * Determines the current tax type based on selected taxes
 */
export function getCurrentTaxType(
  selectedTaxes: { [key: string]: boolean },
  taxes: TaxSetting[]
): 'inclusive' | 'exclusive' | null {
  const selectedTaxIds = Object.keys(selectedTaxes).filter(id => selectedTaxes[id]);
  
  if (selectedTaxIds.length === 0) {
    return null;
  }

  const firstSelectedTax = taxes.find(tax => tax.id === selectedTaxIds[0]);
  return firstSelectedTax ? (firstSelectedTax.is_inclusive ? 'inclusive' : 'exclusive') : null;
}

/**
 * Calculates tax amounts for inclusive taxes
 * For inclusive: tax is already included in the base amount
 * Formula: tax_amount = base_amount * tax_rate / (100 + tax_rate)
 */
function calculateInclusiveTax(baseAmount: number, taxRate: number): number {
  return (baseAmount * taxRate) / (100 + taxRate);
}

/**
 * Calculates tax amounts for exclusive taxes  
 * For exclusive: tax is added on top of the base amount
 * Formula: tax_amount = base_amount * tax_rate / 100
 */
function calculateExclusiveTax(baseAmount: number, taxRate: number): number {
  return (baseAmount * taxRate) / 100;
}

/**
 * Calculates total tax amounts and breakdown for selected taxes
 */
export function calculateTaxAmounts(
  baseAmount: number,
  selectedTaxes: { [key: string]: boolean },
  taxes: TaxSetting[]
): TaxCalculationResult {
  const selectedTaxIds = Object.keys(selectedTaxes).filter(id => selectedTaxes[id]);
  const activeTaxes = taxes.filter(tax => selectedTaxIds.includes(tax.id));
  
  if (activeTaxes.length === 0) {
    return {
      baseAmount,
      taxAmount: 0,
      totalAmount: baseAmount,
      taxBreakdown: []
    };
  }

  const taxType = getCurrentTaxType(selectedTaxes, taxes);
  const taxBreakdown: TaxBreakdownItem[] = [];
  let totalTaxAmount = 0;

  if (taxType === 'inclusive') {
    // For inclusive taxes: tax is already included in the base amount
    // The total amount stays the same, we just show what portion is tax
    activeTaxes.forEach(tax => {
      const taxAmount = calculateInclusiveTax(baseAmount, tax.rate);
      totalTaxAmount += taxAmount;
      
      taxBreakdown.push({
        id: tax.id,
        name: tax.name,
        rate: tax.rate,
        amount: taxAmount,
        type: 'inclusive'
      });
    });

    return {
      baseAmount,
      taxAmount: totalTaxAmount,
      totalAmount: baseAmount, // IMPORTANT: For inclusive, total amount does NOT change
      taxBreakdown
    };
  } else {
    // For exclusive taxes: tax is added on top of the base amount
    // The total amount increases by the tax amount
    activeTaxes.forEach(tax => {
      const taxAmount = calculateExclusiveTax(baseAmount, tax.rate);
      totalTaxAmount += taxAmount;
      
      taxBreakdown.push({
        id: tax.id,
        name: tax.name,
        rate: tax.rate,
        amount: taxAmount,
        type: 'exclusive'
      });
    });

    return {
      baseAmount,
      taxAmount: totalTaxAmount,
      totalAmount: baseAmount + totalTaxAmount, // IMPORTANT: For exclusive, ADD tax to base amount
      taxBreakdown
    };
  }
}

/**
 * Formats tax breakdown for display purposes
 */
export function formatTaxBreakdown(breakdown: TaxBreakdownItem[]): string {
  if (breakdown.length === 0) return 'No taxes applied';
  
  const taxType = breakdown[0]?.type || 'exclusive';
  const taxList = breakdown.map(item => 
    `${item.name} (${item.rate}%): ₹${item.amount.toFixed(2)}`
  ).join(', ');
  
  return `${taxType === 'inclusive' ? 'Tax Inclusive' : 'Tax Exclusive'} - ${taxList}`;
}

/**
 * Validates tax calculation results for consistency
 */
export function validateTaxCalculation(result: TaxCalculationResult): boolean {
  const { baseAmount, taxAmount, totalAmount, taxBreakdown } = result;
  
  // Basic validation
  if (baseAmount < 0 || taxAmount < 0 || totalAmount < 0) return false;
  
  // Check if breakdown amounts sum to total tax amount
  const breakdownTotal = taxBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const tolerance = 0.01; // Allow small floating point differences
  
  return Math.abs(breakdownTotal - taxAmount) <= tolerance;
}

/**
 * Creates initial tax selection state
 */
export function createInitialTaxState(taxes: TaxSetting[]): TaxSelectionState {
  const selectedTaxes: { [key: string]: boolean } = {};
  taxes.forEach(tax => {
    selectedTaxes[tax.id] = false;
  });

  return {
    selectedTaxes,
    taxType: null,
    availableTaxes: taxes.filter(tax => tax.is_active),
    filteredTaxes: taxes.filter(tax => tax.is_active)
  };
}