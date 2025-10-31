// Auto-generated model for table: deleted_members
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`INSERT INTO deleted_members (
          id, original_member_id, custom_member_id, name, email, address, 
          telephone_no, mobile_no, occupation, marital_status, anniversary_date,
          blood_group, sex, date_of_birth, alternate_no, member_image, 
          id_proof_image, date_of_registration, receipt_no, payment_mode,
          plan_type, services, membership_fees, registration_fee, package_fee,
          discount, paid_amount, subscription_start_date, subscription_end_date,
          subscription_status, medical_issues, goals, height, weight, status,
          original_created_at, original_updated_at, deleted_at, deleted_by, deletion_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s2 = db.prepare(`SELECT * FROM deleted_members 
        ORDER BY deleted_at DESC`);
stmts.s3 = db.prepare(`SELECT * FROM deleted_members 
        WHERE id = ? OR original_member_id = ?`);
stmts.s4 = db.prepare(`SELECT * FROM deleted_members WHERE id = ?`);
stmts.s5 = db.prepare(`DELETE FROM deleted_members WHERE id = ?`);
stmts.s6 = db.prepare(`DELETE FROM deleted_members WHERE id = ?`);

module.exports = stmts;
