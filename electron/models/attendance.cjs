// Auto-generated model for table: attendance
const db = require('../db/connection.cjs');

const stmts = {};

stmts.s1 = db.prepare(`SELECT COUNT(*) as count FROM attendance WHERE member_id = ?`);
stmts.s2 = db.prepare(`DELETE FROM attendance WHERE member_id = ?`);
stmts.s3 = db.prepare(`SELECT COUNT(*) as count FROM attendance WHERE member_id = ?`);
stmts.s4 = db.prepare(`SELECT * FROM attendance ORDER BY check_in DESC`);
stmts.s5 = db.prepare(`INSERT INTO attendance (id, member_id, member_name, check_in, date, profile_image)
        VALUES (@id, @member_id, @member_name, @check_in, @date, @profile_image)`);
stmts.s6 = db.prepare(`UPDATE attendance SET check_out = @check_out WHERE id = @id`);
stmts.s7 = db.prepare(`UPDATE attendance SET custom_member_id = ? WHERE member_id = ?`);
stmts.s8 = db.prepare(`SELECT * FROM attendance ORDER BY check_in DESC`);
stmts.s9 = db.prepare(`INSERT INTO attendance (id, member_id, custom_member_id, member_name, check_in, check_out, date, profile_image)
        VALUES (@id, @member_id, @custom_member_id, @member_name, @check_in, @check_out, @date, @profile_image)`);
stmts.s10 = db.prepare(`UPDATE attendance SET check_out = @check_out WHERE id = @id`);

module.exports = stmts;
