// Auto-generated model for table: receipts
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT id, receipt_number FROM receipts WHERE member_id = ?`);
stmts.s2 = db.prepare(`SELECT * FROM receipts WHERE member_id = ? ORDER BY created_at DESC LIMIT 1`);
stmts.s3 = db.prepare(`UPDATE receipts SET 
              custom_member_id = ?,
              member_name = ?,
              mobile_no = ?,
              email = ?,
              plan_type = ?,
              payment_mode = ?
            WHERE member_id = ?`);
stmts.s4 = db.prepare(`SELECT COUNT(*) as count FROM receipts WHERE member_id = ?`);
stmts.s5 = db.prepare(`DELETE FROM receipts WHERE member_id = ?`);
stmts.s6 = db.prepare(`SELECT COUNT(*) as count FROM receipts WHERE member_id = ?`);
stmts.s7 = db.prepare(`SELECT * FROM receipts ORDER BY created_at DESC`);
stmts.s8 = db.prepare(`SELECT * FROM receipts WHERE member_id = ? ORDER BY created_at DESC`);
stmts.s9 = db.prepare(`INSERT INTO receipts (
          id, receipt_number, invoice_id, member_id, member_name, amount, amount_paid, due_amount, payment_type,
          description, receipt_category, transaction_type, custom_member_id,
          subscription_start_date, subscription_end_date, plan_type, payment_mode,
          mobile_no, package_fee, registration_fee, discount, email, cgst, sigst,
          created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s10 = db.prepare(`UPDATE receipts SET
          member_id = ?, member_name = ?, amount = ?, amount_paid = ?, due_amount = ?, payment_type = ?, description = ?, receipt_category = ?
        WHERE id = ?`);
stmts.s11 = db.prepare(`INSERT INTO receipts (
          id, receipt_number, member_id, member_name, custom_member_id, amount, amount_paid, due_amount,
          payment_type, description, receipt_category, cgst, sigst, created_at, updated_at, created_by,
          original_receipt_id, version_number, is_current_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s12 = db.prepare(`UPDATE receipts SET 
          is_current_version = FALSE,
          superseded_at = ?
        WHERE id = ?`);
stmts.s13 = db.prepare(`SELECT * FROM receipts 
        WHERE id = ? OR original_receipt_id = ?
        ORDER BY version_number ASC, created_at ASC`);
stmts.s14 = db.prepare(`SELECT member_id FROM receipts WHERE id = ?`);
stmts.s15 = db.prepare(`DELETE FROM receipts WHERE id = ?`);
stmts.s16 = db.prepare(`SELECT * FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
        ORDER BY created_at ASC`);
stmts.s17 = db.prepare(`UPDATE receipts SET 
          amount = ?,
          amount_paid = ?,
          due_amount = ?
        WHERE id = ?`);
stmts.s18 = db.prepare(`UPDATE receipts 
        SET amount_paid = ?, due_amount = ? 
        WHERE id = ?`);
stmts.s19 = db.prepare(`UPDATE receipts 
        SET amount_paid = ?, due_amount = ?
        WHERE id = ?`);
stmts.s20 = db.prepare(`UPDATE receipts SET custom_member_id = ? WHERE member_id = ?`);
stmts.s21 = db.prepare(`SELECT * FROM receipts 
        WHERE member_id = ? 
        ORDER BY created_at DESC, receipt_number DESC`);
stmts.s22 = db.prepare(`UPDATE receipts SET 
          custom_member_id = ?,
          member_name = ?,
          mobile_no = ?,
          email = ?,
          plan_type = ?,
          payment_mode = ?
        WHERE member_id = ?`);
stmts.s23 = db.prepare(`SELECT * FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
        ORDER BY created_at ASC`);
stmts.s24 = db.prepare(`UPDATE receipts SET 
          custom_member_id = ?,
          member_name = ?,
          mobile_no = ?,
          email = ?,
          plan_type = ?,
          payment_mode = ?,
          subscription_start_date = ?,
          subscription_end_date = ?,
          package_fee = ?,
          registration_fee = ?,
          discount = ?,
          amount = ?,
          due_amount = ?
        WHERE id = ?`);
stmts.s25 = db.prepare(`SELECT * FROM receipts 
        WHERE receipt_category IS NULL OR receipt_category = 'member'
        ORDER BY created_at DESC`);
stmts.s26 = db.prepare(`SELECT id FROM receipts WHERE member_id = ? AND receipt_category = ?`);
stmts.s27 = db.prepare(`INSERT INTO receipts (
          id, receipt_number, invoice_id, member_id, member_name, amount,
          payment_type, description, receipt_category, transaction_type,
          custom_member_id, subscription_start_date, subscription_end_date,
          plan_type, payment_mode, mobile_no, package_fee, registration_fee,
          discount, email, cgst, sigst, amount_paid, due_amount,
          created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s28 = db.prepare(`SELECT * FROM receipts 
        WHERE member_id = ? 
        ORDER BY created_at DESC`);
stmts.s29 = db.prepare(`SELECT * FROM receipts WHERE id = ?`);
stmts.s30 = db.prepare(`SELECT * FROM receipts ORDER BY created_at DESC`);
stmts.s31 = db.prepare(`SELECT * FROM receipts 
        WHERE receipt_category IS NULL OR receipt_category = 'member'
        ORDER BY created_at DESC`);
stmts.s32 = db.prepare(`SELECT * FROM receipts WHERE member_id = ? ORDER BY created_at DESC`);
stmts.s33 = db.prepare(`SELECT * FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
        ORDER BY created_at DESC`);
stmts.s34 = db.prepare(`INSERT INTO receipts (
          id, receipt_number, invoice_id, member_id, member_name, amount, amount_paid, due_amount,
          payment_type, description, receipt_category, transaction_type, custom_member_id,
          subscription_start_date, subscription_end_date, plan_type, payment_mode, mobile_no,
          email, package_fee, registration_fee, discount, cgst, sigst, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s35 = db.prepare(`UPDATE receipts SET ${updateFields.join(', ')} WHERE id = ?`);
stmts.s36 = db.prepare(`DELETE FROM receipts WHERE id = ?`);
stmts.s37 = db.prepare(`UPDATE receipts 
        SET is_current_version = FALSE, superseded_at = CURRENT_TIMESTAMP 
        WHERE id = ?`);
stmts.s38 = db.prepare(`SELECT * FROM receipts 
        WHERE id = ? OR original_receipt_id = ? 
        ORDER BY version_number ASC`);
stmts.s39 = db.prepare(`SELECT * FROM receipts 
        WHERE strftime('%Y', created_at) = ? 
        AND strftime('%m', created_at) = ?
        AND (receipt_category IS NULL OR receipt_category = 'member')
        ORDER BY created_at ASC`);
stmts.s40 = db.prepare(`SELECT * FROM receipts WHERE member_id = ?`);
stmts.s41 = db.prepare(`INSERT INTO receipts (
          id, receipt_number, member_id, member_name, custom_member_id, amount, amount_paid, due_amount,
          payment_type, description, receipt_category, transaction_type, subscription_start_date,
          subscription_end_date, plan_type, payment_mode, mobile_no, email, package_fee,
          registration_fee, discount, cgst, sigst, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s42 = db.prepare(`SELECT * FROM receipts 
        WHERE member_id = ? 
        ORDER BY created_at DESC`);

module.exports = stmts;
