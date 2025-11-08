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

  // Check for any triggers or views that might reference members_old
  const triggers = db.prepare(`
    SELECT name, sql FROM sqlite_master 
    WHERE type='trigger' AND sql LIKE '%members_old%'
  `).all();

  if (triggers.length > 0) {
    console.log('\n⚠️  Found triggers referencing members_old:');
    triggers.forEach(trigger => {
      console.log(`   - ${trigger.name}`);
      db.exec(`DROP TRIGGER IF EXISTS ${trigger.name}`);
      console.log(`   ✅ Dropped trigger: ${trigger.name}`);
    });
  }

  const views = db.prepare(`
    SELECT name, sql FROM sqlite_master 
    WHERE type='view' AND sql LIKE '%members_old%'
  `).all();

  if (views.length > 0) {
    console.log('\n⚠️  Found views referencing members_old:');
    views.forEach(view => {
      console.log(`   - ${view.name}`);
      db.exec(`DROP VIEW IF EXISTS ${view.name}`);
      console.log(`   ✅ Dropped view: ${view.name}`);
    });
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
  console.log('👉 Please restart your application now');
  
} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}
