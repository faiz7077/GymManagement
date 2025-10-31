// Auto-generated model for table: members
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT * FROM members ORDER BY created_at DESC`);
stmts.s2 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s3 = db.prepare(`INSERT INTO members (
          id, custom_member_id, name, email, address, telephone_no, mobile_no,
          occupation, marital_status, anniversary_date, blood_group, sex,
          date_of_birth, alternate_no, member_image, id_proof_image,
          date_of_registration, receipt_no, payment_mode, plan_type, services,
          membership_fees, registration_fee, package_fee, discount, paid_amount,
          subscription_start_date, subscription_end_date, subscription_status,
          medical_issues, goals, height, weight, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s4 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s5 = db.prepare(`UPDATE members SET
          custom_member_id = ?, name = ?, email = ?, address = ?, telephone_no = ?, mobile_no = ?,
          occupation = ?, marital_status = ?, anniversary_date = ?, blood_group = ?,
          sex = ?, date_of_birth = ?, alternate_no = ?, member_image = ?,
          id_proof_image = ?, payment_mode = ?, plan_type = ?, services = ?,
          membership_fees = ?, registration_fee = ?, package_fee = ?, discount = ?, 
          paid_amount = ?, subscription_start_date = ?, subscription_end_date = ?,
          subscription_status = ?, medical_issues = ?, goals = ?, height = ?, weight = ?,
          status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`);
stmts.s6 = db.prepare(`SELECT COUNT(*) as count FROM members WHERE id = ?`);
stmts.s7 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s8 = db.prepare(`DELETE FROM members WHERE id = ?`);
stmts.s9 = db.prepare(`SELECT COUNT(*) as count FROM members WHERE id = ?`);
stmts.s10 = db.prepare(`SELECT id FROM members WHERE id = ?`);
stmts.s11 = db.prepare(`INSERT INTO members (
          id, custom_member_id, name, email, address, telephone_no, mobile_no,
          occupation, marital_status, anniversary_date, blood_group, sex,
          date_of_birth, alternate_no, member_image, id_proof_image,
          date_of_registration, receipt_no, payment_mode, plan_type, services,
          membership_fees, registration_fee, package_fee, discount, paid_amount,
          subscription_start_date, subscription_end_date, subscription_status,
          medical_issues, goals, height, weight, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s12 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s13 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s14 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s15 = db.prepare(`UPDATE members 
        SET paid_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`);
stmts.s16 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s17 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s18 = db.prepare(`UPDATE members 
        SET paid_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`);
stmts.s19 = db.prepare(`SELECT custom_member_id FROM members`);
stmts.s20 = db.prepare(`SELECT id FROM members WHERE custom_member_id = ?`);
stmts.s21 = db.prepare(`SELECT id FROM members WHERE custom_member_id = ? AND id != ?`);
stmts.s22 = db.prepare(`UPDATE members SET custom_member_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
stmts.s23 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s24 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s25 = db.prepare(`SELECT subscription_end_date FROM members WHERE id = ?`);
stmts.s26 = db.prepare(`UPDATE members SET subscription_status = ? WHERE id = ?`);
stmts.s27 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s28 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s29 = db.prepare(`UPDATE members SET
          subscription_start_date = ?,
          subscription_end_date = ?,
          subscription_status = 'active',
          status = 'active',
          plan_type = ?,
          membership_fees = ?,
          package_fee = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`);
stmts.s30 = db.prepare(`SELECT id FROM members 
        WHERE subscription_end_date BETWEEN date('now') AND date('now', '+7 days')
        AND status = 'active'`);
stmts.s31 = db.prepare(`SELECT m.id FROM members m
        LEFT JOIN attendance a ON m.id = a.member_id AND a.date >= date('now', '-7 days')
        WHERE a.id IS NULL AND m.status = 'active'`);
stmts.s32 = db.prepare(`SELECT id, name, date_of_birth, mobile_no FROM members 
        WHERE strftime('%m-%d', date_of_birth) = strftime('%m-%d', 'now')
        AND status = 'active'`);
stmts.s33 = db.prepare(`SELECT id, name, date_of_birth, mobile_no FROM members 
        WHERE strftime('%m-%d', date_of_birth) = ?
        AND status = 'active'`);
stmts.s34 = db.prepare(`INSERT INTO members (
          id, custom_member_id, name, email, address, telephone_no, mobile_no, 
          occupation, marital_status, anniversary_date, blood_group, sex, 
          date_of_birth, alternate_no, member_image, id_proof_image, 
          date_of_registration, services, medical_issues, goals, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s35 = db.prepare(`SELECT * FROM members ORDER BY created_at DESC`);
stmts.s36 = db.prepare(`SELECT * FROM members WHERE id = ?`);
stmts.s37 = db.prepare(`UPDATE members 
        SET paid_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`);
stmts.s38 = db.prepare(`SELECT * FROM members 
        WHERE mobile_no = ? OR alternate_no = ?
        ORDER BY created_at DESC 
        LIMIT 1`);
stmts.s39 = db.prepare(`SELECT status FROM members WHERE id = ? OR custom_member_id = ?`);
stmts.s40 = db.prepare(`UPDATE members SET 
          payment_mode = ?, plan_type = ?, services = ?, membership_fees = ?, 
          registration_fee = ?, package_fee = ?, discount = ?, paid_amount = ?,
          subscription_start_date = ?, subscription_end_date = ?, status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR custom_member_id = ?`);
stmts.s41 = db.prepare(`SELECT * FROM members 
        WHERE status = 'partial' 
        ORDER BY created_at DESC`);
stmts.s42 = db.prepare(`UPDATE members SET custom_member_id = ? WHERE id = ?`);
stmts.s43 = db.prepare(`SELECT id FROM members WHERE custom_member_id = ?`);
stmts.s44 = db.prepare(`UPDATE members 
        SET subscription_status = 'expired', status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE subscription_end_date IS NOT NULL 
        AND DATE(subscription_end_date) < DATE(?) 
        AND status IN ('active', 'inactive')
        AND subscription_status != 'expired'`);
stmts.s45 = db.prepare(`UPDATE members 
        SET subscription_status = 'expiring_soon', updated_at = CURRENT_TIMESTAMP
        WHERE subscription_end_date IS NOT NULL
        AND subscription_end_date >= ? 
        AND subscription_end_date <= ? 
        AND status = 'active'
        AND subscription_status != 'expiring_soon'`);
stmts.s46 = db.prepare(`UPDATE members 
        SET subscription_status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE subscription_end_date IS NOT NULL
        AND subscription_end_date > ? 
        AND status = 'active'
        AND subscription_status != 'active'`);
stmts.s47 = db.prepare(`SELECT name, subscription_end_date FROM members 
          WHERE subscription_status = 'expired' AND updated_at > datetime('now', '-1 minute')`);

module.exports = stmts;
