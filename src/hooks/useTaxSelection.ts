/**
 * Enhanced Tax Selection Hook
 * Manages tax selection state with mutual exclusivity and real-time calculations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  TaxSetting,
  TaxSelectionState,
  TaxCalculationResult,
  filterTaxesByType,
  validateTaxSelection,
  getCurrentTaxType,
  calculateTaxAmounts,
  createInitialTaxState
} from '@/utils/taxUtils';

interface UseTaxSelectionProps {
  taxes: TaxSetting[];
  baseAmount: number;
  onTaxChange?: (result: TaxCalculationResult) => void;
}

interface UseTaxSelectionReturn {
  // State
  selectedTaxes: { [taxId: string]: boolean };
  taxType: 'inclusive' | 'exclusive' | null;
  filteredTaxes: TaxSetting[];
  calculationResult: TaxCalculationResult;
  
  // Actions
  toggleTax: (taxId: string) => void;
  clearAllTaxes: () => void;
  setTaxSelection: (selection: { [taxId: string]: boolean }) => void;
  
  // Utilities
  isTaxSelectable: (taxId: string) => boolean;
  getTaxTypeLabel: () => string;
}

export function useTaxSelection({
  taxes,
  baseAmount,
  onTaxChange
}: UseTaxSelectionProps): UseTaxSelectionReturn {
  
  // Initialize state
  const [taxState, setTaxState] = useState<TaxSelectionState>(() => 
    createInitialTaxState(taxes)
  );
  
  const [calculationResult, setCalculationResult] = useState<TaxCalculationResult>(() => ({
    baseAmount,
    taxAmount: 0,
    totalAmount: baseAmount,
    taxBreakdown: []
  }));

  // Update tax state when taxes prop changes
  useEffect(() => {
    setTaxState(createInitialTaxState(taxes));
  }, [taxes]);

  // Recalculate when base amount or tax selection changes
  useEffect(() => {
    const result = calculateTaxAmounts(baseAmount, taxState.selectedTaxes, taxes);
    setCalculationResult(result);
    
    if (onTaxChange) {
      onTaxChange(result);
    }
  }, [baseAmount, taxState.selectedTaxes, taxes, onTaxChange]);

  // Update filtered taxes when tax type changes
  useEffect(() => {
    const currentTaxType = getCurrentTaxType(taxState.selectedTaxes, taxes);
    const filteredTaxes = filterTaxesByType(taxes, currentTaxType);
    
    setTaxState(prev => ({
      ...prev,
      taxType: currentTaxType,
      filteredTaxes
    }));
  }, [taxState.selectedTaxes, taxes]);

  // Toggle tax selection with validation
  const toggleTax = useCallback((taxId: string) => {
    setTaxState(prev => {
      const currentlySelected = prev.selectedTaxes[taxId];
      
      if (currentlySelected) {
        // Deselecting tax - always allowed
        return {
          ...prev,
          selectedTaxes: {
            ...prev.selectedTaxes,
            [taxId]: false
          }
        };
      } else {
        // Selecting tax - validate first
        if (validateTaxSelection(prev.selectedTaxes, taxId, taxes)) {
          return {
            ...prev,
            selectedTaxes: {
              ...prev.selectedTaxes,
              [taxId]: true
            }
          };
        }
        // Invalid selection - return unchanged state
        return prev;
      }
    });
  }, [taxes]);

  // Clear all tax selections
  const clearAllTaxes = useCallback(() => {
    setTaxState(prev => {
      const clearedSelection: { [key: string]: boolean } = {};
      Object.keys(prev.selectedTaxes).forEach(id => {
        clearedSelection[id] = false;
      });
      
      return {
        ...prev,
        selectedTaxes: clearedSelection,
        taxType: null,
        filteredTaxes: taxes.filter(tax => tax.is_active)
      };
    });
  }, [taxes]);

  // Set tax selection programmatically (for loading existing data)
  const setTaxSelection = useCallback((selection: { [taxId: string]: boolean }) => {
    // Validate the entire selection for consistency
    const selectedTaxIds = Object.keys(selection).filter(id => selection[id]);
    const selectedTaxes = taxes.filter(tax => selectedTaxIds.includes(tax.id));
    
    if (selectedTaxes.length === 0) {
      // No taxes selected - clear all
      clearAllTaxes();
      return;
    }

    // Check if all selected taxes are the same type
    const firstTaxType = selectedTaxes[0].is_inclusive ? 'inclusive' : 'exclusive';
    const allSameType = selectedTaxes.every(tax => 
      (tax.is_inclusive ? 'inclusive' : 'exclusive') === firstTaxType
    );

    if (!allSameType) {
      console.warn('Invalid tax selection: mixed inclusive and exclusive taxes');
      return;
    }

    setTaxState(prev => ({
      ...prev,
      selectedTaxes: selection
    }));
  }, [taxes, clearAllTaxes]);

  // Check if a tax is selectable based on current state
  const isTaxSelectable = useCallback((taxId: string) => {
    const tax = taxes.find(t => t.id === taxId);
    if (!tax || !tax.is_active) return false;
    
    // If tax is already selected, it's always "selectable" (for deselection)
    if (taxState.selectedTaxes[taxId]) return true;
    
    // If no taxes selected, any tax is selectable
    if (taxState.taxType === null) return true;
    
    // Check if tax type matches current selection
    const taxType = tax.is_inclusive ? 'inclusive' : 'exclusive';
    return taxType === taxState.taxType;
  }, [taxes, taxState.selectedTaxes, taxState.taxType]);

  // Get human-readable tax type label
  const getTaxTypeLabel = useCallback(() => {
    if (taxState.taxType === null) return 'No taxes selected';
    return taxState.taxType === 'inclusive' ? 'Tax Inclusive' : 'Tax Exclusive';
  }, [taxState.taxType]);

  return {
    // State
    selectedTaxes: taxState.selectedTaxes,
    taxType: taxState.taxType,
    filteredTaxes: taxState.filteredTaxes,
    calculationResult,
    
    // Actions
    toggleTax,
    clearAllTaxes,
    setTaxSelection,
    
    // Utilities
    isTaxSelectable,
    getTaxTypeLabel
  };
}