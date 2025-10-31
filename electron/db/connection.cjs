// const path = require('path');
// const Database = require('better-sqlite3');

// const dbPath = path.join(__dirname, '..', 'data', 'fit_local_control.db');
// const db = new Database(dbPath);

// module.exports = db;
const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');

const dbFile = 'fit_local_control.db';
const dbFolder = app.getPath('userData');
const dbPath = path.join(dbFolder, dbFile);

const db = new Database(dbPath);

module.exports = db;
