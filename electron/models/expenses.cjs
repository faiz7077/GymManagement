// Auto-generated model for table: expenses
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT * FROM expenses ORDER BY date DESC`);
stmts.s2 = db.prepare(`SELECT * FROM expenses WHERE id = ?`);
stmts.s3 = db.prepare(`INSERT INTO expenses (id, category, description, amount, date, created_by, receipt)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
stmts.s4 = db.prepare(`UPDATE expenses SET
          category = ?, description = ?, amount = ?, date = ?, receipt = ?
        WHERE id = ?`);
stmts.s5 = db.prepare(`DELETE FROM expenses WHERE id = ?`);
stmts.s6 = db.prepare(`SELECT * FROM expenses WHERE category = ? ORDER BY date DESC`);
stmts.s7 = db.prepare(`SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC`);
stmts.s8 = db.prepare(`SELECT * FROM expenses 
        WHERE strftime('%Y', date) = ? 
        AND strftime('%m', date) = ?
        ORDER BY date ASC`);

module.exports = stmts;
