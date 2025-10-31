// Auto-generated model for table: master_occupations
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT * FROM master_occupations WHERE is_active = 1 ORDER BY name ASC`);
stmts.s2 = db.prepare(`INSERT INTO master_occupations (id, name, is_active, created_at)
        VALUES (?, ?, ?, ?)`);
stmts.s3 = db.prepare(`UPDATE master_occupations SET 
          name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`);
stmts.s4 = db.prepare(`UPDATE master_occupations SET is_active = 0 WHERE id = ?`);

module.exports = stmts;
