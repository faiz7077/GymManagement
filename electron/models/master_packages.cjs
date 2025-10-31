// Auto-generated model for table: master_packages
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT * FROM master_packages`);
stmts.s2 = db.prepare(`INSERT INTO master_packages (
              id, name, duration_type, duration_months, price, 
              registration_fee, discount, description, is_active, 
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s3 = db.prepare(`SELECT * FROM master_packages WHERE is_active = 1 ORDER BY duration_months ASC`);
stmts.s4 = db.prepare(`INSERT INTO master_packages (id, name, duration_type, duration_months, price, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
stmts.s5 = db.prepare(`UPDATE master_packages SET 
          name = ?, duration_type = ?, duration_months = ?, price = ?, 
          is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`);
stmts.s6 = db.prepare(`UPDATE master_packages SET is_active = 0 WHERE id = ?`);

module.exports = stmts;
