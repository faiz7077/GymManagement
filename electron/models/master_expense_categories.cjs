// Auto-generated model for table: master_expense_categories
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT * FROM master_expense_categories WHERE is_active = 1 ORDER BY name ASC`);
stmts.s2 = db.prepare(`INSERT INTO master_expense_categories (id, name, description, is_active, created_at)
        VALUES (?, ?, ?, ?, ?)`);
stmts.s3 = db.prepare(`UPDATE master_expense_categories SET 
          name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`);
stmts.s4 = db.prepare(`UPDATE master_expense_categories SET is_active = 0 WHERE id = ?`);

module.exports = stmts;
