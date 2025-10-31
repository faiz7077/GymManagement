// Auto-generated model for table: master_tax_settings
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT * FROM master_tax_settings WHERE is_active = 1 ORDER BY tax_type ASC`);
stmts.s2 = db.prepare(`INSERT INTO master_tax_settings (id, name, tax_type, percentage, is_inclusive, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
stmts.s3 = db.prepare(`UPDATE master_tax_settings SET 
          name = ?, tax_type = ?, percentage = ?, is_inclusive = ?, 
          is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`);
stmts.s4 = db.prepare(`UPDATE master_tax_settings SET is_active = 0 WHERE id = ?`);

module.exports = stmts;
