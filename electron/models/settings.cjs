// Auto-generated model for table: settings
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT value FROM settings WHERE key = ?`);
stmts.s2 = db.prepare(`UPDATE settings SET value = ? WHERE key = ?`);
stmts.s3 = db.prepare(`SELECT value FROM settings WHERE key = ?`);
stmts.s4 = db.prepare(`SELECT value FROM settings WHERE key = ?`);
stmts.s5 = db.prepare(`UPDATE settings SET value = ? WHERE key = ?`);
stmts.s6 = db.prepare(`SELECT value FROM settings WHERE key = ?`);
stmts.s7 = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`);
stmts.s8 = db.prepare(`UPDATE settings SET value = ? WHERE key = ?`);
stmts.s9 = db.prepare(`SELECT value FROM settings WHERE key = ?`);
stmts.s10 = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`);
stmts.s11 = db.prepare(`UPDATE settings SET value = ? WHERE key = ?`);
stmts.s12 = db.prepare(`SELECT value FROM settings WHERE key = ?`);
stmts.s13 = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`);
stmts.s14 = db.prepare(`UPDATE settings SET value = ? WHERE key = ?`);
stmts.s15 = db.prepare(`SELECT value FROM settings WHERE key = ?`);
stmts.s16 = db.prepare(`SELECT value FROM settings WHERE key = ?`);
stmts.s17 = db.prepare(`SELECT value FROM settings WHERE key = ?`);
stmts.s18 = db.prepare(`SELECT value FROM settings WHERE key = ?`);

module.exports = stmts;
