// Migration script to add trainer assignment columns to members table
// Run this if the columns weren't added automatically

const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

function runMigration() {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'database', 'pratik.db');
    
    console.log('Opening database at:', dbPath);
    const db = new Database(dbPath);
    
    // Check if columns exist
    const tableInfo = db.prepare("PRAGMA table_info(members)").all();
    const hasTrainerId = tableInfo.some(col => col.name === 'assigned_trainer_id');
    const hasTrainerName = tableInfo.some(col => col.name === 'assigned_trainer_name');
    
    if (!hasTrainerId) {
      console.log('Adding assigned_trainer_id column...');
      db.exec('ALTER TABLE members ADD COLUMN assigned_trainer_id TEXT');
      console.log('✓ Added assigned_trainer_id column');
    } else {
      console.log('✓ assigned_trainer_id column already exists');
    }
    
    if (!hasTrainerName) {
      console.log('Adding assigned_trainer_name column...');
      db.exec('ALTER TABLE members ADD COLUMN assigned_trainer_name TEXT');
      console.log('✓ Added assigned_trainer_name column');
    } else {
      console.log('✓ assigned_trainer_name column already exists');
    }
    
    // Create index
    console.log('Creating index on assigned_trainer_id...');
    db.exec('CREATE INDEX IF NOT EXISTS idx_members_trainer ON members(assigned_trainer_id)');
    console.log('✓ Index created');
    
    db.close();
    console.log('\n✅ Migration completed successfully!');
    console.log('You can now restart your application.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
