// Auto-generated model for table: staff
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT * FROM staff ORDER BY created_at DESC`);
stmts.s2 = db.prepare(`SELECT * FROM staff WHERE id = ?`);
stmts.s3 = db.prepare(`INSERT INTO staff (
          id, name, email, phone, address, emergency_contact, emergency_phone,
          date_of_birth, joining_date, role, salary, status, profile_image, 
          id_card_image, specialization, shift, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s4 = db.prepare(`UPDATE staff SET
          name = ?, email = ?, phone = ?, address = ?, emergency_contact = ?,
          emergency_phone = ?, date_of_birth = ?, role = ?, salary = ?,
          status = ?, profile_image = ?, id_card_image = ?, specialization = ?, 
          shift = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`);
stmts.s5 = db.prepare(`DELETE FROM staff WHERE id = ?`);
stmts.s6 = db.prepare(`SELECT * FROM staff ORDER BY created_at DESC`);
stmts.s7 = db.prepare(`SELECT * FROM staff WHERE id = ?`);
stmts.s8 = db.prepare(`INSERT INTO staff (
          id, name, email, phone, address, emergency_contact, emergency_phone,
          date_of_birth, joining_date, role, salary, status, profile_image, 
          id_card_image, specialization, shift, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s9 = db.prepare(`UPDATE staff SET ${updateFields.join(', ')} WHERE id = ?`);
stmts.s10 = db.prepare(`DELETE FROM staff WHERE id = ?`);

module.exports = stmts;
