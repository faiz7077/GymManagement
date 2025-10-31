// Auto-generated model for table: invoices
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT COUNT(*) as count FROM invoices WHERE member_id = ?`);
stmts.s2 = db.prepare(`DELETE FROM invoices WHERE member_id = ?`);
stmts.s3 = db.prepare(`SELECT COUNT(*) as count FROM invoices WHERE member_id = ?`);
stmts.s4 = db.prepare(`SELECT * FROM invoices ORDER BY created_at DESC`);
stmts.s5 = db.prepare(`SELECT * FROM invoices WHERE member_id = ? ORDER BY created_at DESC`);
stmts.s6 = db.prepare(`INSERT INTO invoices (
          id, invoice_number, member_id, member_name, registration_fee, package_fee, 
          discount, total_amount, paid_amount, status, due_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s7 = db.prepare(`SELECT * FROM invoices WHERE id = ?`);
stmts.s8 = db.prepare(`UPDATE invoices SET 
          paid_amount = ?, 
          status = ?, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`);

module.exports = stmts;
