// Auto-generated model for table: staff_salaries
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`DELETE FROM staff_salaries WHERE member_id = ?`);

module.exports = stmts;
