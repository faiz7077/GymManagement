import { Receipt, db } from './database';
import { ReceiptPDFGenerator } from './pdfUtils';

export class ReceiptStorageManager {
  /**
   * Ensures the receipts directory exists and returns its path
   */
  static async ensureReceiptsDirectory(): Promise<string | null> {
    try {
      const result = await db.getReceiptsDirectory();
      return result.success ? result.path || null : null;
    } catch (error) {
      console.error('Error ensuring receipts directory:', error);
      return null;
    }
  }

  /**
   * Saves a receipt as PDF to the system
   */
  static async saveReceiptPDF(receipt: Receipt): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Generate PDF
      const pdfBlob = await ReceiptPDFGenerator.generateReceiptPDF({ receipt });
      const arrayBuffer = await pdfBlob.arrayBuffer();
      
      // Save to system
      const result = await db.saveReceiptPDF(receipt, arrayBuffer);
      
      return {
        success: result.success,
        filePath: result.filePath,
        error: result.error
      };
    } catch (error) {
      console.error('Error saving receipt PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Checks if a receipt PDF already exists in the system
   */
  static async receiptPDFExists(receipt: Receipt): Promise<boolean> {
    try {
      const result = await db.getReceiptFilePath(receipt);
      return result.success && result.exists === true;
    } catch (error) {
      console.error('Error checking receipt PDF existence:', error);
      return false;
    }
  }

  /**
   * Gets the file path for a receipt PDF
   */
  static async getReceiptPDFPath(receipt: Receipt): Promise<string | null> {
    try {
      const result = await db.getReceiptFilePath(receipt);
      return result.success ? result.filePath || null : null;
    } catch (error) {
      console.error('Error getting receipt PDF path:', error);
      return null;
    }
  }

  /**
   * Batch save multiple receipts as PDFs
   */
  static async saveMultipleReceiptPDFs(receipts: Receipt[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const receipt of receipts) {
      try {
        const result = await this.saveReceiptPDF(receipt);
        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(`${receipt.receipt_number}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        failed++;
        errors.push(`${receipt.receipt_number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { successful, failed, errors };
  }

  /**
   * Opens the receipts folder in the system file manager
   */
  static async openReceiptsFolder(): Promise<{ success: boolean; error?: string }> {
    try {
      return await db.openReceiptsFolder();
    } catch (error) {
      console.error('Error opening receipts folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets receipt storage statistics
   */
  static async getStorageStats(): Promise<{
    totalReceipts: number;
    savedPDFs: number;
    missingPDFs: number;
    directoryPath: string | null;
  }> {
    try {
      const receipts = await db.getAllReceipts();
      const directoryPath = await this.ensureReceiptsDirectory();
      
      let savedPDFs = 0;
      
      // Check each receipt for PDF existence
      for (const receipt of receipts) {
        const exists = await this.receiptPDFExists(receipt);
        if (exists) savedPDFs++;
      }

      return {
        totalReceipts: receipts.length,
        savedPDFs,
        missingPDFs: receipts.length - savedPDFs,
        directoryPath
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalReceipts: 0,
        savedPDFs: 0,
        missingPDFs: 0,
        directoryPath: null
      };
    }
  }

  /**
   * Regenerates missing receipt PDFs
   */
  static async regenerateMissingPDFs(): Promise<{
    processed: number;
    generated: number;
    errors: string[];
  }> {
    try {
      const receipts = await db.getAllReceipts();
      let processed = 0;
      let generated = 0;
      const errors: string[] = [];

      for (const receipt of receipts) {
        processed++;
        
        const exists = await this.receiptPDFExists(receipt);
        if (!exists) {
          try {
            const result = await this.saveReceiptPDF(receipt);
            if (result.success) {
              generated++;
            } else {
              errors.push(`${receipt.receipt_number}: ${result.error || 'Unknown error'}`);
            }
          } catch (error) {
            errors.push(`${receipt.receipt_number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return { processed, generated, errors };
    } catch (error) {
      console.error('Error regenerating missing PDFs:', error);
      return {
        processed: 0,
        generated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

// Export convenience functions
export const saveReceiptPDF = ReceiptStorageManager.saveReceiptPDF;
export const openReceiptsFolder = ReceiptStorageManager.openReceiptsFolder;
export const getStorageStats = ReceiptStorageManager.getStorageStats;
export const regenerateMissingPDFs = ReceiptStorageManager.regenerateMissingPDFs;