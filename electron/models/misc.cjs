// Auto-generated model for table: misc
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
stmts.s2 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
stmts.s3 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
stmts.s4 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
stmts.s5 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
stmts.s6 = db.prepare(`PRAGMA foreign_key_list(receipts)`);
stmts.s7 = db.prepare(`SELECT 
          SUM(COALESCE(amount_paid, 0)) as total_paid,
          SUM(COALESCE(due_amount, 0)) as total_due,
          SUM(COALESCE(amount, 0)) as total_amount
        FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')`);
stmts.s8 = db.prepare(`SELECT 
          SUM(COALESCE(amount_paid, 0)) as total_paid
        FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')`);
stmts.s9 = db.prepare(`SELECT id, amount, amount_paid, due_amount 
        FROM receipts 
        WHERE amount_paid IS NULL OR due_amount IS NULL`);
stmts.s10 = db.prepare(`SELECT id, amount, amount_paid, due_amount, receipt_number
        FROM receipts 
        WHERE member_id = ? 
          AND (receipt_category IS NULL OR receipt_category = 'member')
          AND COALESCE(due_amount, 0) > 0
        ORDER BY created_at ASC`);
stmts.s11 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
stmts.s12 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) 
        VALUES ('member_counter', ?)`);
stmts.s13 = db.prepare(`SELECT SUM(COALESCE(amount_paid, amount, 0)) as total_paid
        FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')`);
stmts.s14 = db.prepare(`SELECT bm.*, m.name as member_name, m.custom_member_id
        FROM body_measurements bm 
        JOIN members m ON bm.member_id = m.id 
        ORDER BY bm.measurement_date DESC, bm.created_at DESC`);
stmts.s15 = db.prepare(`SELECT 
          datetime('now') as current_datetime,
          date('now') as current_date,
          strftime('%m-%d', 'now') as current_month_day,
          strftime('%m', 'now') as current_month,
          strftime('%d', 'now') as current_day`);
stmts.s16 = db.prepare(`SELECT id, name, date_of_birth, mobile_no,
               strftime('%m-%d', date_of_birth) as birth_month_day,
               strftime('%m', date_of_birth) as birth_month,
               strftime('%d', date_of_birth) as birth_day
        FROM members 
        WHERE status = 'active'
        ORDER BY name`);
stmts.s17 = db.prepare(`SELECT 
          datetime('now') as sqlite_now,
          date('now') as sqlite_date,
          strftime('%Y-%m-%d', 'now') as formatted_date,
          strftime('%m-%d', 'now') as month_day,
          strftime('%m', 'now') as month,
          strftime('%d', 'now') as day`);
stmts.s18 = db.prepare(`SELECT name, date_of_birth, 
               strftime('%m-%d', date_of_birth) as birth_month_day,
               status
        FROM members 
        WHERE status = 'active'
        LIMIT 5`);
stmts.s19 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
stmts.s20 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
stmts.s21 = db.prepare(`SELECT SUM(COALESCE(amount_paid, amount, 0)) as total_paid
          FROM receipts 
          WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')`);
stmts.s22 = db.prepare(`SELECT 
          COALESCE(SUM(i.total_amount - i.paid_amount), 0) as dueAmount,
          COUNT(CASE WHEN i.status != 'paid' THEN 1 END) as unpaidInvoices
        FROM invoices i
        WHERE i.member_id = ? AND i.status != 'paid'`);
stmts.s23 = db.prepare(`SELECT SUM(COALESCE(amount_paid, amount, 0)) as total_paid
        FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')`);
stmts.s24 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
stmts.s25 = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
stmts.s26 = db.prepare(`SELECT name, subscription_end_date, status, subscription_status 
        FROM members 
        WHERE subscription_end_date IS NOT NULL 
        AND subscription_end_date < ?
        LIMIT 5`);

module.exports = stmts;
