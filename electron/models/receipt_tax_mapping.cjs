// Auto-generated model for table: receipt_tax_mapping
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`INSERT INTO receipt_tax_mapping (
          id, receipt_id, tax_setting_id, tax_name, tax_type, tax_percentage,
          is_inclusive, base_amount, tax_amount, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s2 = db.prepare(`SELECT * FROM receipt_tax_mapping 
        WHERE receipt_id = ? 
        ORDER BY tax_type ASC`);
stmts.s3 = db.prepare(`DELETE FROM receipt_tax_mapping WHERE receipt_id = ?`);

module.exports = stmts;
