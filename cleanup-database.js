// Database cleanup script
// Run this if you encounter "members_old" table errors

const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Determine the database path
const userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'gym-cms-test');
const dbPath = path.join(userDataPath, 'database', 'faizanNewGym.db');

console.log('🔧 Database Cleanup Script');
console.log('📁 Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Check for members_old table
  const oldTableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='members_old'
  `).get();

  if (oldTableExists) {
    console.log('⚠️  Found members_old table, removing...');
    db.exec('DROP TABLE IF EXISTS members_old');
    console.log('✅ Successfully removed members_old table');
  } else {
    console.log('✅ No members_old table found - database is clean');
  }

  // List all tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table'
    ORDER BY name
  `).all();

  console.log('\n📋 Current database tables:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });

  db.close();
  console.log('\n✅ Database cleanup completed successfully');
  
} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}
