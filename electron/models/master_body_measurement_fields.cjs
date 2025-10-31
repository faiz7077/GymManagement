// Auto-generated model for table: master_body_measurement_fields
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT * FROM master_body_measurement_fields WHERE is_active = 1 ORDER BY sort_order ASC, field_name ASC`);
stmts.s2 = db.prepare(`INSERT INTO master_body_measurement_fields 
        (id, field_name, display_name, field_type, unit, is_required, is_active, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s3 = db.prepare(`UPDATE master_body_measurement_fields SET 
          field_name = ?, display_name = ?, field_type = ?, unit = ?, 
          is_required = ?, is_active = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`);
stmts.s4 = db.prepare(`UPDATE master_body_measurement_fields SET is_active = 0 WHERE id = ?`);

module.exports = stmts;
