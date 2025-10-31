// Auto-generated model for table: users
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT COUNT(*) as count FROM users`);
stmts.s2 = db.prepare(`INSERT INTO users (id, username, password, role, name, email, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s3 = db.prepare(`SELECT * FROM users WHERE username = ? AND password = ?`);
stmts.s4 = db.prepare(`SELECT id, username, role, name, email, phone, created_at FROM users`);
stmts.s5 = db.prepare(`INSERT INTO users (id, username, password, role, name, email, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
stmts.s6 = db.prepare(`UPDATE users 
        SET password = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`);

module.exports = stmts;
