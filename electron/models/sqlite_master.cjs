// Auto-generated model for table: sqlite_master
const db = require('../db/connection');

const stmts = {};

stmts.s1 = db.prepare(`SELECT name FROM sqlite_master 
        WHERE type='table' AND name='master_tax_settings'`);
stmts.s2 = db.prepare(`SELECT sql FROM sqlite_master WHERE type = ? AND name = ?`);
stmts.s3 = db.prepare(`SELECT name FROM sqlite_master 
        WHERE type='table' AND name='master_packages'`);
stmts.s4 = db.prepare(`SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='master_packages'`);
stmts.s5 = db.prepare(`SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='master_packages'`);
stmts.s6 = db.prepare(`SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='master_packages'`);

module.exports = stmts;
