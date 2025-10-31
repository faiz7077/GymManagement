// Auto-generated model for table: body_measurements
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT COUNT(*) as count FROM body_measurements WHERE member_id = ?`);
stmts.s2 = db.prepare(`DELETE FROM body_measurements WHERE member_id = ?`);
stmts.s3 = db.prepare(`SELECT COUNT(*) as count FROM body_measurements WHERE member_id = ?`);
stmts.s4 = db.prepare(`INSERT INTO body_measurements (
          id, member_id, weight, height, bmi, body_fat, muscle, chest, waist, hips, biceps, thighs, notes, created_at, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s5 = db.prepare(`SELECT * FROM body_measurements WHERE member_id = ? ORDER BY created_at DESC`);
stmts.s6 = db.prepare(`UPDATE body_measurements SET custom_member_id = ? WHERE member_id = ?`);
stmts.s7 = db.prepare(`INSERT INTO body_measurements (
          id, member_id, custom_member_id, member_name, serial_number, measurement_date,
          weight, height, age, neck, chest, arms, fore_arms, wrist, tummy, waist,
          hips, thighs, calf, fat_percentage, bmi, bmr, vf, notes, created_at, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s8 = db.prepare(`SELECT * FROM body_measurements 
        WHERE member_id = ? 
        ORDER BY measurement_date DESC, created_at DESC`);
stmts.s9 = db.prepare(`UPDATE body_measurements SET
          measurement_date = ?, weight = ?, height = ?, age = ?, neck = ?, chest = ?,
          arms = ?, fore_arms = ?, wrist = ?, tummy = ?, waist = ?, hips = ?,
          thighs = ?, calf = ?, fat_percentage = ?, bmi = ?, bmr = ?, vf = ?, notes = ?
        WHERE id = ?`);
stmts.s10 = db.prepare(`DELETE FROM body_measurements WHERE id = ?`);
stmts.s11 = db.prepare(`INSERT INTO body_measurements (
          id, member_id, custom_member_id, member_name, serial_number, measurement_date,
          weight, height, age, neck, chest, arms, fore_arms, wrist, tummy, waist,
          hips, thighs, calf, fat_percentage, bmi, bmr, vf, notes, created_at, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s12 = db.prepare(`SELECT * FROM body_measurements ORDER BY created_at DESC`);
stmts.s13 = db.prepare(`SELECT * FROM body_measurements WHERE member_id = ? OR custom_member_id = ? ORDER BY created_at DESC`);
stmts.s14 = db.prepare(`UPDATE body_measurements SET ${updateFields.join(', ')} WHERE id = ?`);
stmts.s15 = db.prepare(`DELETE FROM body_measurements WHERE id = ?`);

module.exports = stmts;
