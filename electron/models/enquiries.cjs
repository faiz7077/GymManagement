// Auto-generated model for table: enquiries
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`DELETE FROM enquiries WHERE member_id = ?`);
stmts.s2 = db.prepare(`SELECT * FROM enquiries ORDER BY created_at DESC`);
stmts.s3 = db.prepare(`INSERT INTO enquiries (
          id, name, email, phone, interest, source, status, notes, follow_up_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s4 = db.prepare(`SELECT * FROM enquiries ORDER BY created_at DESC`);
stmts.s5 = db.prepare(`SELECT * FROM enquiries WHERE id = ?`);
stmts.s6 = db.prepare(`INSERT INTO enquiries (
          id, enquiry_number, name, address, telephone_no, mobile_no, occupation,
          sex, ref_person_name, date_of_enquiry, interested_in, membership_fees,
          payment_mode, payment_frequency, status, notes, follow_up_date,
          converted_to_member_id, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s7 = db.prepare(`UPDATE enquiries SET
          name = ?, address = ?, telephone_no = ?, mobile_no = ?, occupation = ?,
          sex = ?, ref_person_name = ?, date_of_enquiry = ?, interested_in = ?,
          membership_fees = ?, payment_mode = ?, payment_frequency = ?, status = ?,
          notes = ?, follow_up_date = ?, converted_to_member_id = ?,
          updated_at = CURRENT_TIMESTAMP, created_by = ?
        WHERE id = ?`);
stmts.s8 = db.prepare(`DELETE FROM enquiries WHERE id = ?`);
stmts.s9 = db.prepare(`SELECT * FROM enquiries WHERE id = ?`);
stmts.s10 = db.prepare(`UPDATE enquiries SET
            status = 'converted',
            converted_to_member_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`);
stmts.s11 = db.prepare(`SELECT * FROM enquiries ORDER BY created_at DESC`);
stmts.s12 = db.prepare(`SELECT * FROM enquiries WHERE id = ?`);
stmts.s13 = db.prepare(`INSERT INTO enquiries (
          id, enquiry_number, name, address, telephone_no, mobile_no, occupation,
          sex, ref_person_name, date_of_enquiry, interested_in, membership_fees,
          payment_mode, payment_frequency, status, notes, follow_up_date,
          converted_to_member_id, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s14 = db.prepare(`UPDATE enquiries SET
          name = ?, address = ?, telephone_no = ?, mobile_no = ?, occupation = ?,
          sex = ?, ref_person_name = ?, date_of_enquiry = ?, interested_in = ?,
          membership_fees = ?, payment_mode = ?, payment_frequency = ?, status = ?,
          notes = ?, follow_up_date = ?, converted_to_member_id = ?,
          updated_at = CURRENT_TIMESTAMP, created_by = ?
        WHERE id = ?`);
stmts.s15 = db.prepare(`DELETE FROM enquiries WHERE id = ?`);
stmts.s16 = db.prepare(`SELECT * FROM enquiries WHERE id = ?`);
stmts.s17 = db.prepare(`UPDATE enquiries SET
            status = 'converted',
            converted_to_member_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`);
stmts.s18 = db.prepare(`SELECT * FROM enquiries ORDER BY created_at DESC`);
stmts.s19 = db.prepare(`SELECT * FROM enquiries WHERE id = ?`);
stmts.s20 = db.prepare(`INSERT INTO enquiries (
          id, enquiry_number, name, address, telephone_no, mobile_no, occupation,
          sex, ref_person_name, date_of_enquiry, interested_in, membership_fees,
          payment_mode, payment_frequency, status, notes, follow_up_date,
          converted_to_member_id, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s21 = db.prepare(`UPDATE enquiries SET ${updateFields.join(', ')} WHERE id = ?`);
stmts.s22 = db.prepare(`DELETE FROM enquiries WHERE id = ?`);

module.exports = stmts;
