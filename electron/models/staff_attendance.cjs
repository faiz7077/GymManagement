// Auto-generated model for table: staff_attendance
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT * FROM staff_attendance ORDER BY check_in DESC`);
stmts.s2 = db.prepare(`INSERT INTO staff_attendance (id, staff_id, staff_name, check_in, date, profile_image, role, shift)
        VALUES (@id, @staff_id, @staff_name, @check_in, @date, @profile_image, @role, @shift)`);
stmts.s3 = db.prepare(`UPDATE staff_attendance SET check_out = @check_out WHERE id = @id`);
stmts.s4 = db.prepare(`SELECT * FROM staff_attendance ORDER BY created_at DESC`);
stmts.s5 = db.prepare(`INSERT INTO staff_attendance (id, staff_id, staff_name, check_in, check_out, date, profile_image, role, shift)
        VALUES (@id, @staff_id, @staff_name, @check_in, @check_out, @date, @profile_image, @role, @shift)`);
stmts.s6 = db.prepare(`UPDATE staff_attendance SET check_out = @check_out WHERE id = @id`);

module.exports = stmts;
