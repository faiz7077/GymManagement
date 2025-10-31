const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

class DatabaseService {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    try {
      // Create database directory if it doesn't exist
      const userDataPath = app.getPath('userData');
      const dbDir = path.join(userDataPath, 'database');

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      const dbPath = path.join(dbDir, 'faizanGym.db');
      console.log('Database path:', dbPath);

      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');

      this.createTables();
      this.initializeDefaultData();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  createTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'trainer', 'receptionist')),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Members table - Complete schema with all columns from the start
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        custom_member_id TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT DEFAULT 'Not specified',
        telephone_no TEXT,
        mobile_no TEXT DEFAULT '0000000000',
        occupation TEXT DEFAULT 'Not specified',
        marital_status TEXT DEFAULT 'unmarried',
        anniversary_date TEXT,
        blood_group TEXT,
        sex TEXT DEFAULT 'male',
        date_of_birth TEXT DEFAULT '1990-01-01',
        alternate_no TEXT,
        member_image TEXT,
        id_proof_image TEXT,
        date_of_registration TEXT,
        receipt_no TEXT,
        payment_mode TEXT DEFAULT 'cash',
        plan_type TEXT DEFAULT 'monthly',
        services TEXT DEFAULT '["gym"]',
        membership_fees REAL DEFAULT 0,
        registration_fee REAL DEFAULT 0,
        package_fee REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        paid_amount REAL DEFAULT 0,
        subscription_start_date TEXT,
        subscription_end_date TEXT,
        subscription_status TEXT CHECK (subscription_status IN ('active', 'expiring_soon', 'expired')) DEFAULT 'active',
        medical_issues TEXT,
        goals TEXT,
        height REAL,
        weight REAL,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'frozen', 'partial')) DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Enquiries table - Updated schema to match the form
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id TEXT PRIMARY KEY,
        enquiry_number TEXT UNIQUE,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        telephone_no TEXT,
        mobile_no TEXT NOT NULL,
        occupation TEXT NOT NULL,
        sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
        ref_person_name TEXT,
        date_of_enquiry TEXT NOT NULL,
        interested_in TEXT NOT NULL,
        membership_fees REAL DEFAULT 0,
        payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'cheque')),
        payment_frequency TEXT NOT NULL CHECK (payment_frequency IN ('monthly', 'quarterly', 'half_yearly', 'yearly')),
        status TEXT NOT NULL CHECK (status IN ('new', 'contacted', 'follow_up', 'converted', 'closed')) DEFAULT 'new',
        notes TEXT,
        follow_up_date TEXT,
        converted_to_member_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        FOREIGN KEY (converted_to_member_id) REFERENCES members (id)
      )
    `);

    // Add missing columns to existing enquiries table if they don't exist
    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN enquiry_number TEXT UNIQUE`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN address TEXT NOT NULL DEFAULT 'Not specified'`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN telephone_no TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN mobile_no TEXT NOT NULL DEFAULT '0000000000'`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN occupation TEXT NOT NULL DEFAULT 'Not specified'`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN sex TEXT NOT NULL DEFAULT 'male'`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN ref_person_name TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN date_of_enquiry TEXT NOT NULL DEFAULT '${new Date().toISOString().split('T')[0]}'`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN interested_in TEXT NOT NULL DEFAULT '["gym"]'`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN membership_fees REAL DEFAULT 0`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN payment_mode TEXT NOT NULL DEFAULT 'cash'`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN payment_frequency TEXT NOT NULL DEFAULT 'yearly'`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN converted_to_member_id TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE enquiries ADD COLUMN created_by TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }

    // Invoices table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        member_id TEXT NOT NULL,
        member_name TEXT NOT NULL,
        registration_fee REAL DEFAULT 0,
        package_fee REAL NOT NULL,
        discount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        paid_amount REAL DEFAULT 0,
        status TEXT NOT NULL CHECK (status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members (id)
      )
    `);

    // Receipts table - Complete schema with all columns
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        receipt_number TEXT UNIQUE NOT NULL,
        invoice_id TEXT,
        member_id TEXT,
        member_name TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'card', 'upi', 'bank_transfer')),
        description TEXT,
        receipt_category TEXT DEFAULT 'member',
        transaction_type TEXT DEFAULT 'payment',
        custom_member_id TEXT,
        subscription_start_date TEXT,
        subscription_end_date TEXT,
        plan_type TEXT,
        payment_mode TEXT,
        mobile_no TEXT,
        package_fee REAL DEFAULT 0,
        registration_fee REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        email TEXT,
        cgst REAL DEFAULT 0,
        sigst REAL DEFAULT 0,
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members (id),
        FOREIGN KEY (invoice_id) REFERENCES invoices (id)
      )
    `);

    // Add new columns for amount_paid and due_amount if they don't exist
    try {
      this.db.exec(`ALTER TABLE receipts ADD COLUMN amount_paid REAL DEFAULT NULL`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE receipts ADD COLUMN due_amount REAL DEFAULT NULL`);
    } catch (error) {
      // Column already exists, ignore error
    }

    // Add versioning columns for receipt history
    try {
      this.db.exec(`ALTER TABLE receipts ADD COLUMN original_receipt_id TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE receipts ADD COLUMN version_number INTEGER DEFAULT 1`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE receipts ADD COLUMN is_current_version BOOLEAN DEFAULT TRUE`);
    } catch (error) {
      // Column already exists, ignore error
    }

    try {
      this.db.exec(`ALTER TABLE receipts ADD COLUMN superseded_at TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }

    // Migrate existing receipts to have proper amount_paid and due_amount values
    try {
      this.db.exec(`
        UPDATE receipts 
        SET amount_paid = amount, due_amount = 0 
        WHERE amount_paid IS NULL OR due_amount IS NULL
      `);
      console.log('Migrated existing receipts to have proper amount_paid and due_amount values');
    } catch (error) {
      console.error('Error migrating receipt amounts:', error);
    }

    // Body measurements table - Updated with all physical measurement fields
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS body_measurements (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        custom_member_id TEXT,
        member_name TEXT NOT NULL,
        serial_number INTEGER,
        measurement_date TEXT NOT NULL,
        weight REAL,
        height REAL,
        age INTEGER,
        neck REAL,
        chest REAL,
        arms REAL,
        fore_arms REAL,
        wrist REAL,
        tummy REAL,
        waist REAL,
        hips REAL,
        thighs REAL,
        calf REAL,
        fat_percentage REAL,
        bmi REAL,
        bmr REAL,
        vf REAL,
        notes TEXT,
        created_at TEXT NOT NULL,
        recorded_by TEXT NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members (id)
      )
    `);

    // Add new columns to existing body_measurements table if they don't exist
    const measurementColumns = [
      'member_name TEXT',
      'serial_number INTEGER',
      'measurement_date TEXT',
      'age INTEGER',
      'neck REAL',
      'arms REAL',
      'fore_arms REAL',
      'wrist REAL',
      'tummy REAL',
      'calf REAL',
      'fat_percentage REAL',
      'bmr REAL',
      'vf REAL'
    ];

    measurementColumns.forEach(column => {
      try {
        const [columnName] = column.split(' ');
        this.db.exec(`ALTER TABLE body_measurements ADD COLUMN ${column}`);
        console.log(`Added column ${columnName} to body_measurements table`);
      } catch (error) {
        // Column already exists, ignore error
      }
    });

    // Attendance table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        custom_member_id TEXT,
        member_name TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT,
        date TEXT NOT NULL,
        profile_image TEXT,
        FOREIGN KEY (member_id) REFERENCES members (id)
      )
    `);

    // Staff Attendance table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT,
        date TEXT NOT NULL,
        profile_image TEXT,
        role TEXT,
        shift TEXT,
        FOREIGN KEY (staff_id) REFERENCES staff (id)
      )
    `);

    // Expenses table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        created_by TEXT NOT NULL,
        receipt TEXT
      )
    `);

    // Staff table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        address TEXT,
        emergency_contact TEXT,
        emergency_phone TEXT,
        date_of_birth TEXT,
        joining_date TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('trainer', 'receptionist', 'manager')),
        salary REAL NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
        profile_image TEXT,
        id_card_image TEXT,
        specialization TEXT,
        shift TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Staff salaries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS staff_salaries (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        base_salary REAL NOT NULL,
        bonus REAL DEFAULT 0,
        deductions REAL DEFAULT 0,
        final_amount REAL NOT NULL,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        paid_date TEXT,
        status TEXT NOT NULL CHECK (status IN ('pending', 'paid')),
        FOREIGN KEY (staff_id) REFERENCES staff (id)
      )
    `);

    // Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // WhatsApp automation tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL,
        member_name TEXT NOT NULL,
        member_phone TEXT NOT NULL,
        message_type TEXT NOT NULL CHECK (message_type IN ('receipt_created', 'membership_expiring', 'attendance_reminder', 'due_amount_reminder', 'birthday_wish', 'welcome_message', 'renewal_reminder')),
        message_content TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'scheduled')) DEFAULT 'pending',
        scheduled_at TEXT,
        sent_at TEXT,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members (id)
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS whatsapp_templates (
        id TEXT PRIMARY KEY,
        template_name TEXT UNIQUE NOT NULL,
        message_type TEXT NOT NULL,
        template_content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS whatsapp_settings (
        id TEXT PRIMARY KEY,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Receipt Tax Mapping table for comprehensive tax handling
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS receipt_tax_mapping (
        id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        tax_setting_id TEXT NOT NULL,
        tax_name TEXT NOT NULL,
        tax_type TEXT NOT NULL,
        tax_percentage REAL NOT NULL,
        is_inclusive BOOLEAN NOT NULL,
        base_amount REAL NOT NULL,
        tax_amount REAL NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES receipts (id),
        FOREIGN KEY (tax_setting_id) REFERENCES master_tax_settings (id)
      )
    `);

    // Deleted Members table - Store deleted member records for audit trail
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS deleted_members (
        id TEXT PRIMARY KEY,
        original_member_id TEXT NOT NULL,
        custom_member_id TEXT,
        name TEXT NOT NULL,
        email TEXT,
        address TEXT,
        telephone_no TEXT,
        mobile_no TEXT,
        occupation TEXT,
        marital_status TEXT,
        anniversary_date TEXT,
        blood_group TEXT,
        sex TEXT,
        date_of_birth TEXT,
        alternate_no TEXT,
        member_image TEXT,
        id_proof_image TEXT,
        date_of_registration TEXT,
        receipt_no TEXT,
        payment_mode TEXT,
        plan_type TEXT,
        services TEXT,
        membership_fees REAL,
        registration_fee REAL,
        package_fee REAL,
        discount REAL,
        paid_amount REAL,
        subscription_start_date TEXT,
        subscription_end_date TEXT,
        subscription_status TEXT,
        medical_issues TEXT,
        goals TEXT,
        height REAL,
        weight REAL,
        status TEXT,
        original_created_at TEXT,
        original_updated_at TEXT,
        deleted_at TEXT NOT NULL,
        deleted_by TEXT NOT NULL,
        deletion_reason TEXT
      )
    `);

    // Master Settings Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS master_packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        duration_type TEXT NOT NULL CHECK (duration_type IN ('monthly', 'quarterly', 'half_yearly', 'yearly', 'custom')),
        duration_months INTEGER NOT NULL,
        price REAL NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS master_tax_settings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tax_type TEXT NOT NULL CHECK (tax_type IN ('cgst', 'sgst', 'igst', 'gst', 'vat', 'service_tax', 'other')),
        percentage REAL NOT NULL,
        is_inclusive BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS master_expense_categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS master_occupations (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS master_payment_types (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS master_body_measurement_fields (
        id TEXT PRIMARY KEY,
        field_name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        field_type TEXT NOT NULL CHECK (field_type IN ('number', 'text', 'date')),
        unit TEXT,
        is_required BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully');

    // Run migrations for existing tables
    this.runMigrations();

    // Only update subscription statuses, no migrations needed
    this.updateAllSubscriptionStatuses();
  }

  runMigrations() {
    try {
      console.log('Running database migrations...');

      // Migration 1: Update master_tax_settings tax_type constraint
      this.migrateTaxSettingsConstraint();

      // Migration 2: Update master_packages duration_type constraint
      this.migratePackagesConstraint();

      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Error running migrations:', error);
    }
  }

  migrateTaxSettingsConstraint() {
    try {
      console.log('Checking master_tax_settings table constraints...');

      // Check if the table exists
      const tableExists = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='master_tax_settings'
      `).get();

      if (!tableExists) {
        console.log('master_tax_settings table does not exist, skipping migration');
        return;
      }

      // Get the current table schema
      const tableInfo = this.db.prepare('SELECT sql FROM sqlite_master WHERE type = ? AND name = ?').get('table', 'master_tax_settings');

      if (!tableInfo || !tableInfo.sql) {
        console.log('Could not get table schema, skipping migration');
        return;
      }

      // Check if the constraint already includes the new tax types
      const currentSchema = tableInfo.sql;
      const hasNewConstraint = currentSchema.includes("'vat'") &&
        currentSchema.includes("'service_tax'") &&
        currentSchema.includes("'other'");

      if (hasNewConstraint) {
        console.log('master_tax_settings constraint already updated, skipping migration');
        return;
      }

      console.log('Migrating master_tax_settings table to include new tax types...');

      // Disable foreign keys temporarily
      this.db.exec('PRAGMA foreign_keys = OFF');

      // Start transaction
      const migration = this.db.transaction(() => {
        // Step 1: Rename existing table
        this.db.exec('ALTER TABLE master_tax_settings RENAME TO master_tax_settings_old');

        // Step 2: Create new table with updated constraint
        this.db.exec(`
          CREATE TABLE master_tax_settings (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            tax_type TEXT NOT NULL CHECK (tax_type IN ('cgst', 'sgst', 'igst', 'gst', 'vat', 'service_tax', 'other')),
            percentage REAL NOT NULL,
            is_inclusive BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Step 3: Copy data from old table to new table
        this.db.exec(`
          INSERT INTO master_tax_settings (
            id, name, tax_type, percentage, is_inclusive, is_active, created_at, updated_at
          )
          SELECT id, name, tax_type, percentage, is_inclusive, is_active, created_at, updated_at
          FROM master_tax_settings_old
        `);

        // Step 4: Drop old table
        this.db.exec('DROP TABLE master_tax_settings_old');
      });

      // Execute migration
      migration();

      // Re-enable foreign keys
      this.db.exec('PRAGMA foreign_keys = ON');

      console.log('✅ Successfully migrated master_tax_settings table with expanded tax_type constraint');

    } catch (error) {
      console.error('Error migrating master_tax_settings constraint:', error);

      // Try to restore foreign keys if they were disabled
      try {
        this.db.exec('PRAGMA foreign_keys = ON');
      } catch (pragmaError) {
        console.error('Error re-enabling foreign keys:', pragmaError);
      }

      // If migration fails, we don't want to break the app
      console.log('Migration failed, but continuing with app startup...');
    }
  }

  migratePackagesConstraint() {
    try {
      console.log('🔄 Checking master_packages constraint migration...');

      // Check if table exists
      const tableExists = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='master_packages'
      `).get();

      if (!tableExists) {
        console.log('❌ master_packages table does not exist, skipping migration');
        return;
      }

      // Get current table schema
      const tableInfo = this.db.prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='master_packages'
      `).get();

      console.log('📋 Current table schema:', tableInfo?.sql);

      if (!tableInfo || !tableInfo.sql) {
        console.log('❌ Could not get table schema, skipping migration');
        return;
      }

      // Check if constraint already includes 'custom'
      const hasNewConstraint = tableInfo.sql.includes("'custom'");

      if (hasNewConstraint) {
        console.log('✅ master_packages constraint already updated, skipping migration');
        return;
      }

      console.log('❌ Current constraint does not support custom packages');
      console.log('📋 Current schema:', tableInfo.sql);

      console.log('🔄 Migrating master_packages constraint to include custom duration type...');

      // Get existing data first
      const existingPackages = this.db.prepare('SELECT * FROM master_packages').all();
      console.log('📦 Found existing packages:', existingPackages.length);

      // Disable foreign keys temporarily
      this.db.exec('PRAGMA foreign_keys = OFF');

      // Start transaction
      const migration = this.db.transaction(() => {
        // Step 1: Drop existing table
        this.db.exec('DROP TABLE IF EXISTS master_packages');

        // Step 2: Create new table with updated constraint
        this.db.exec(`
          CREATE TABLE master_packages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            duration_type TEXT NOT NULL CHECK (duration_type IN ('monthly', 'quarterly', 'half_yearly', 'yearly', 'custom')),
            duration_months INTEGER NOT NULL,
            price REAL NOT NULL,
            registration_fee REAL DEFAULT 0,
            discount REAL DEFAULT 0,
            description TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Step 3: Insert existing data back
        if (existingPackages.length > 0) {
          const insertStmt = this.db.prepare(`
            INSERT INTO master_packages (
              id, name, duration_type, duration_months, price, 
              registration_fee, discount, description, is_active, 
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const pkg of existingPackages) {
            insertStmt.run(
              pkg.id,
              pkg.name,
              pkg.duration_type,
              pkg.duration_months,
              pkg.price,
              pkg.registration_fee || 0,
              pkg.discount || 0,
              pkg.description || null,
              pkg.is_active !== undefined ? pkg.is_active : 1,
              pkg.created_at,
              pkg.updated_at || new Date().toISOString()
            );
          }
        }
      });

      // Execute migration
      migration();

      // Re-enable foreign keys
      this.db.exec('PRAGMA foreign_keys = ON');

      // Verify the migration worked
      const newTableInfo = this.db.prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='master_packages'
      `).get();

      console.log('✅ New table schema:', newTableInfo?.sql);
      console.log('✅ master_packages constraint migration completed successfully');

    } catch (error) {
      console.error('❌ Error migrating master_packages constraint:', error);
      
      // Re-enable foreign keys in case of error
      try {
        this.db.exec('PRAGMA foreign_keys = ON');
      } catch (fkError) {
        console.error('Error re-enabling foreign keys:', fkError);
      }

      // If migration fails, we don't want to break the app
      console.log('Migration failed, but continuing with app startup...');
    }
  }



  initializeDefaultData() {
    // Check if users exist
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get();

    if (userCount.count === 0) {
      console.log('Initializing default users...');

      const insertUser = this.db.prepare(`
        INSERT INTO users (id, username, password, role, name, email, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const defaultUsers = [
        {
          id: 'admin-1',
          username: 'admin',
          password: 'admin123', // In production, hash this
          role: 'admin',
          name: 'System Administrator',
          email: 'admin@gym.local',
          phone: '+1234567890',
          created_at: new Date().toISOString()
        },
        {
          id: 'trainer-1',
          username: 'trainer',
          password: 'trainer123',
          role: 'trainer',
          name: 'John Trainer',
          email: 'trainer@gym.local',
          phone: '+1234567891',
          created_at: new Date().toISOString()
        },
        {
          id: 'receptionist-1',
          username: 'reception',
          password: 'reception123',
          role: 'receptionist',
          name: 'Jane Reception',
          email: 'reception@gym.local',
          phone: '+1234567892',
          created_at: new Date().toISOString()
        }
      ];

      const insertMany = this.db.transaction((users) => {
        for (const user of users) {
          insertUser.run(
            user.id, user.username, user.password, user.role,
            user.name, user.email, user.phone, user.created_at
          );
        }
      });

      insertMany(defaultUsers);

      // Initialize receipt counter
      this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('receipt_counter', '0');

      // Initialize member counter
      this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('member_counter', '0');

      // Initialize WhatsApp settings with your mobile number
      this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('whatsapp_admin_phone', '+919144605788'); // Replace with your number
      this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('whatsapp_enabled', 'true');
      this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('gym_name', 'Prime Fitness Health Point');

      console.log('Default users initialized');
    }

    // Initialize default WhatsApp templates
    const templateCount = this.db.prepare('SELECT COUNT(*) as count FROM whatsapp_templates').get();

    if (templateCount.count === 0) {
      console.log('Initializing default WhatsApp templates...');

      const insertTemplate = this.db.prepare(`
        INSERT INTO whatsapp_templates (id, template_name, message_type, template_content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      const defaultTemplates = [
        {
          id: 'template-receipt',
          template_name: 'Receipt Created',
          message_type: 'receipt_created',
          template_content: 'Hi {member_name}, we\'ve received ₹{amount_paid}. Receipt #{receipt_number} is attached. Thank you for choosing Prime Fitness Health Point! 🎉',
          created_at: new Date().toISOString()
        },
        {
          id: 'template-expiry',
          template_name: 'Membership Expiring',
          message_type: 'membership_expiring',
          template_content: 'Hi {member_name}, your membership ends in {days} day(s) on {end_date}. Renew now to keep smashing your goals! ⚠️',
          created_at: new Date().toISOString()
        },
        {
          id: 'template-attendance',
          template_name: 'Attendance Reminder',
          message_type: 'attendance_reminder',
          template_content: 'Hi {member_name}, we missed you at the gym lately. Let\'s get back on track together—see you soon? 💪',
          created_at: new Date().toISOString()
        },
        {
          id: 'template-due',
          template_name: 'Due Amount Reminder',
          message_type: 'due_amount_reminder',
          template_content: 'Hi {member_name}, your outstanding balance is ₹{due_amount}. Please clear it at your convenience to avoid service interruption. Thanks! 🙏',
          created_at: new Date().toISOString()
        },
        {
          id: 'template-birthday',
          template_name: 'Birthday Wish',
          message_type: 'birthday_wish',
          template_content: 'Dear {member_name}, Wish you a very Happy Birthday ({birth_date})! 🎂 May all your dreams come true and you achieve all your fitness goals. Team: PRIME FITNESS and HEALTH POINT 🎉',
          created_at: new Date().toISOString()
        },
        {
          id: 'template-welcome',
          template_name: 'Welcome Message',
          message_type: 'welcome_message',
          template_content: 'Dear {member_name}, Please Submit your Photo, Copy of ID in GYM. If You\'ve already submitted documents ignore this message. Team: PRIME FITNESS and HEALTH POINT 📋',
          created_at: new Date().toISOString()
        }
      ];

      const insertManyTemplates = this.db.transaction((templates) => {
        for (const template of templates) {
          insertTemplate.run(
            template.id, template.template_name, template.message_type,
            template.template_content, template.created_at
          );
        }
      });

      insertManyTemplates(defaultTemplates);
      console.log('Default WhatsApp templates initialized');
    }

    console.log('Default data initialized');
  }

  // User operations
  authenticateUser(username, password) {
    try {
      const user = this.db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
      return user || null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  getAllUsers() {
    try {
      return this.db.prepare('SELECT id, username, role, name, email, phone, created_at FROM users').all();
    } catch (error) {
      console.error('Get users error:', error);
      return [];
    }
  }

  createUser(userData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO users (id, username, password, role, name, email, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        userData.id, userData.username, userData.password, userData.role,
        userData.name, userData.email, userData.phone, userData.created_at
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create user error:', error);
      return false;
    }
  }

  updateUserPassword(userId, newPassword) {
    try {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET password = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      const result = stmt.run(newPassword, userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Update user password error:', error);
      return false;
    }
  }

  // Member operations
  getAllMembers() {
    try {
      return this.db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get members error:', error);
      return [];
    }
  }

  getMemberById(id) {
    try {
      return this.db.prepare('SELECT * FROM members WHERE id = ?').get(id);
    } catch (error) {
      console.error('Get member error:', error);
      return null;
    }
  }

  createMember(memberData) {
    try {
      console.log('🔵 CREATE MEMBER CALLED:', {
        name: memberData.name,
        id: memberData.id,
        timestamp: new Date().toISOString()
      });

      // Validate required fields and provide defaults
      // Convert camelCase to snake_case for database fields
      const validatedData = {
        id: memberData.id || this.generateId(),
        custom_member_id: memberData.customMemberId || memberData.custom_member_id || this.generateMemberNumber(),
        name: memberData.name || 'Unknown',
        address: memberData.address || 'Not specified',
        telephone_no: memberData.telephoneNo || memberData.telephone_no || null,
        mobile_no: memberData.mobileNo || memberData.mobile_no || '0000000000',
        occupation: memberData.occupation || 'Not specified',
        marital_status: memberData.maritalStatus || memberData.marital_status || 'unmarried',
        anniversary_date: memberData.anniversaryDate || memberData.anniversary_date || null,
        blood_group: memberData.bloodGroup || memberData.blood_group || null,
        sex: memberData.sex || 'male',
        date_of_birth: memberData.dateOfBirth || memberData.date_of_birth || '1990-01-01',
        alternate_no: memberData.alternateNo || memberData.alternate_no || null,
        email: memberData.email || 'noemail@example.com',
        member_image: memberData.memberImage || memberData.member_image || null,
        id_proof_image: memberData.idProofImage || memberData.id_proof_image || null,
        date_of_registration: memberData.dateOfRegistration || memberData.date_of_registration || new Date().toISOString().split('T')[0],
        receipt_no: memberData.receiptNo || memberData.receipt_no || null,
        payment_mode: memberData.paymentMode || memberData.payment_mode || 'cash',
        plan_type: memberData.planType || memberData.plan_type || 'monthly',
        services: Array.isArray(memberData.services) ? JSON.stringify(memberData.services) : (memberData.services || '["gym"]'),
        membership_fees: memberData.membershipFees || memberData.membership_fees || 0,
        registration_fee: memberData.registrationFee || memberData.registration_fee || 0,
        package_fee: memberData.packageFee || memberData.package_fee || memberData.membershipFees || memberData.membership_fees || 0,
        discount: memberData.discount || 0,
        paid_amount: memberData.paidAmount || memberData.paid_amount || 0,
        subscription_start_date: memberData.subscriptionStartDate || memberData.subscription_start_date || new Date().toISOString().split('T')[0],
        subscription_end_date: memberData.subscriptionEndDate || memberData.subscription_end_date || this.calculateSubscriptionEndDate(memberData.subscriptionStartDate || memberData.subscription_start_date || new Date().toISOString().split('T')[0], memberData.planType || memberData.plan_type || 'monthly'),
        subscription_status: memberData.subscriptionStatus || memberData.subscription_status || 'active',
        medical_issues: memberData.medicalIssues || memberData.medical_issues || null,
        goals: memberData.goals || null,
        height: memberData.height || null,
        weight: memberData.weight || null,
        status: memberData.status || 'active',
        created_at: memberData.createdAt || memberData.created_at || new Date().toISOString()
      };

      console.log('Validated member data:', validatedData);

      const stmt = this.db.prepare(`
        INSERT INTO members (
          id, custom_member_id, name, email, address, telephone_no, mobile_no,
          occupation, marital_status, anniversary_date, blood_group, sex,
          date_of_birth, alternate_no, member_image, id_proof_image,
          date_of_registration, receipt_no, payment_mode, plan_type, services,
          membership_fees, registration_fee, package_fee, discount, paid_amount,
          subscription_start_date, subscription_end_date, subscription_status,
          medical_issues, goals, height, weight, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        validatedData.id,
        validatedData.custom_member_id,
        validatedData.name,
        validatedData.email,
        validatedData.address,
        validatedData.telephone_no,
        validatedData.mobile_no,
        validatedData.occupation,
        validatedData.marital_status,
        validatedData.anniversary_date,
        validatedData.blood_group,
        validatedData.sex,
        validatedData.date_of_birth,
        validatedData.alternate_no,
        validatedData.member_image,
        validatedData.id_proof_image,
        validatedData.date_of_registration,
        validatedData.receipt_no,
        validatedData.payment_mode,
        validatedData.plan_type,
        validatedData.services,
        validatedData.membership_fees,
        validatedData.registration_fee,
        validatedData.package_fee,
        validatedData.discount,
        validatedData.paid_amount,
        validatedData.subscription_start_date,
        validatedData.subscription_end_date,
        validatedData.subscription_status,
        validatedData.medical_issues,
        validatedData.goals,
        validatedData.height,
        validatedData.weight,
        validatedData.status,
        validatedData.created_at
      );

      const memberCreated = result.changes > 0;

      // Generate receipt if member was created successfully and has a paid amount
      if (memberCreated && validatedData.paid_amount > 0) {
        try {
          // Check if a receipt already exists for this member to prevent duplicates
          const existingReceipts = this.db.prepare('SELECT id, receipt_number FROM receipts WHERE member_id = ?').all(validatedData.id);
          if (existingReceipts.length > 0) {
            console.log('⚠️ Receipt already exists for member:', {
              memberId: validatedData.id,
              memberName: validatedData.name,
              existingReceipts: existingReceipts.map(r => r.receipt_number)
            });
            return memberCreated;
          }
          const totalFees = (validatedData.registration_fee || 0) + (validatedData.package_fee || 0) - (validatedData.discount || 0);
          const paidAmount = validatedData.paid_amount;
          const dueAmount = Math.max(0, totalFees - paidAmount);

          const receiptData = {
            id: this.generateId(),
            receipt_number: this.generateReceiptNumber(),
            member_id: validatedData.id,
            member_name: validatedData.name,
            amount: totalFees, // Total amount due
            amount_paid: paidAmount, // Amount actually paid
            due_amount: dueAmount, // Remaining due
            payment_type: validatedData.payment_mode || 'cash',
            description: `Initial membership payment - ${validatedData.name}`,
            receipt_category: 'member',
            transaction_type: dueAmount > 0 ? 'partial_payment' : 'payment',
            custom_member_id: validatedData.custom_member_id,
            subscription_start_date: validatedData.subscription_start_date,
            subscription_end_date: validatedData.subscription_end_date,
            plan_type: validatedData.plan_type,
            payment_mode: validatedData.payment_mode,
            mobile_no: validatedData.mobile_no,
            email: validatedData.email,
            package_fee: validatedData.package_fee,
            registration_fee: validatedData.registration_fee,
            discount: validatedData.discount,
            cgst: 0,
            sigst: 0,
            created_at: new Date().toISOString(),
            created_by: 'System'
          };

          console.log('🧾 CREATING RECEIPT:', {
            memberId: validatedData.id,
            memberName: validatedData.name,
            receiptNumber: receiptData.receipt_number,
            timestamp: new Date().toISOString()
          });
          const receiptCreated = this.createReceipt(receiptData);
          if (receiptCreated) {
            console.log(`✅ Receipt generated for new member: ${validatedData.name}, Paid: ${paidAmount}, Due: ${dueAmount}`);

            // Trigger WhatsApp receipt message
            setTimeout(async () => {
              const receiptMessage = await this.generateReceiptMessage(validatedData.id, receiptData.id);
              if (receiptMessage) {
                this.createWhatsAppMessage(receiptMessage);
                console.log(`💰 Receipt WhatsApp message queued for: ${validatedData.name}`);
              }
            }, 2000); // 2 second delay

            // Verify the receipt was saved correctly
            const savedReceipt = this.db.prepare('SELECT * FROM receipts WHERE member_id = ? ORDER BY created_at DESC LIMIT 1').get(validatedData.id);
            console.log('Saved receipt verification:', {
              amount: savedReceipt?.amount,
              amount_paid: savedReceipt?.amount_paid,
              due_amount: savedReceipt?.due_amount
            });
          }
        } catch (receiptError) {
          console.error('Error generating receipt for new member:', receiptError);
          // Don't fail member creation if receipt generation fails
        }
      }

      return memberCreated;
    } catch (error) {
      console.error('Create member error:', error);
      console.error('Member data received:', memberData);
      return false;
    }
  }

  updateMember(id, memberData) {
    try {
      console.log('Updating member with ID:', id, 'Data:', memberData);

      // Get current member data to compare amounts
      const currentMember = this.db.prepare('SELECT * FROM members WHERE id = ?').get(id);
      if (!currentMember) {
        throw new Error('Member not found');
      }

      // Check if subscription dates are being updated
      const subscriptionDatesUpdated = memberData.subscription_start_date !== undefined || memberData.subscription_end_date !== undefined;

      // Check if payment amounts are being updated
      const currentPaidAmount = currentMember.paid_amount || 0;
      const newPaidAmount = memberData.paid_amount || 0;
      const paidAmountChanged = newPaidAmount !== currentPaidAmount;
      const additionalPayment = Math.max(0, newPaidAmount - currentPaidAmount);

      console.log('Payment amount comparison:', {
        currentPaidAmount,
        newPaidAmount,
        paidAmountChanged,
        additionalPayment
      });

      const stmt = this.db.prepare(`
        UPDATE members SET
          custom_member_id = ?, name = ?, email = ?, address = ?, telephone_no = ?, mobile_no = ?,
          occupation = ?, marital_status = ?, anniversary_date = ?, blood_group = ?,
          sex = ?, date_of_birth = ?, alternate_no = ?, member_image = ?,
          id_proof_image = ?, payment_mode = ?, plan_type = ?, services = ?,
          membership_fees = ?, registration_fee = ?, package_fee = ?, discount = ?, 
          paid_amount = ?, subscription_start_date = ?, subscription_end_date = ?,
          subscription_status = ?, medical_issues = ?, goals = ?, height = ?, weight = ?,
          status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        memberData.custom_member_id || null,
        memberData.name,
        memberData.email,
        memberData.address,
        memberData.telephone_no || null,
        memberData.mobile_no,
        memberData.occupation,
        memberData.marital_status,
        memberData.anniversary_date || null,
        memberData.blood_group || null,
        memberData.sex,
        memberData.date_of_birth,
        memberData.alternate_no || null,
        memberData.member_image || null,
        memberData.id_proof_image || null,
        memberData.payment_mode,
        memberData.plan_type,
        memberData.services,
        memberData.membership_fees,
        memberData.registration_fee || 0,
        memberData.package_fee || memberData.membership_fees || 0,
        memberData.discount || 0,
        memberData.paid_amount || 0,
        memberData.subscription_start_date || null,
        memberData.subscription_end_date || null,
        memberData.subscription_status || 'active',
        memberData.medical_issues || null,
        memberData.goals || null,
        memberData.height || null,
        memberData.weight || null,
        memberData.status || 'active',
        id
      );

      // Update related receipts with new member information
      if (result.changes > 0) {
        try {
          // Update receipts with new custom_member_id, member_name, and other member info
          const updateReceiptsStmt = this.db.prepare(`
            UPDATE receipts SET 
              custom_member_id = ?,
              member_name = ?,
              mobile_no = ?,
              email = ?,
              plan_type = ?,
              payment_mode = ?
            WHERE member_id = ?
          `);

          const receiptUpdateResult = updateReceiptsStmt.run(
            memberData.custom_member_id || null,
            memberData.name,
            memberData.mobile_no,
            memberData.email,
            memberData.plan_type,
            memberData.payment_mode,
            id
          );

          if (receiptUpdateResult.changes > 0) {
            console.log(`Updated ${receiptUpdateResult.changes} receipts with new member information for member ${id}`);
          }
        } catch (receiptUpdateError) {
          console.error('Error updating receipts with new member information:', receiptUpdateError);
          // Don't fail the member update if receipt update fails
        }
      }

      // Note: Receipt generation for member updates is handled by the frontend
      // through the createPlanUpdateReceipt function to avoid duplicates and
      // ensure proper due amount calculation with the complete fee structure.

      // Handle payment amount changes properly
      if (result.changes > 0 && paidAmountChanged) {
        console.log('💰 Payment amount changed, updating receipts and due amounts...');
        this.handleMemberPaymentUpdate(id, currentPaidAmount, newPaidAmount);
      }

      // Recalculate member totals if fee structure changed
      if (result.changes > 0) {
        const feeStructureChanged = (
          memberData.registration_fee !== undefined ||
          memberData.package_fee !== undefined ||
          memberData.membership_fees !== undefined ||
          memberData.discount !== undefined
        );

        if (feeStructureChanged) {
          this.recalculateMemberTotals(id);
        }
      }

      // Always update subscription status after updating member if subscription dates were updated
      if (subscriptionDatesUpdated) {
        console.log('Subscription dates updated, updating subscription status for member:', id);
        this.updateMemberSubscriptionStatus(id);
      }

      console.log('Update result changes:', result.changes);
      return result.changes > 0;
    } catch (error) {
      console.error('Update member error:', error);
      return false;
    }
  }

  // Force delete member by recreating tables without foreign keys temporarily
  forceDeleteMember(id) {
    try {
      console.log('Force deleting member:', id);

      // Simple brute force approach - delete everything related to this member
      const queries = [
        'DELETE FROM receipts WHERE member_id = ?',
        'DELETE FROM invoices WHERE member_id = ?',
        'DELETE FROM attendance WHERE member_id = ?',
        'DELETE FROM body_measurements WHERE member_id = ?',
        'DELETE FROM members WHERE id = ?'
      ];

      // Disable foreign keys completely
      this.db.exec('PRAGMA foreign_keys = OFF');

      for (const query of queries) {
        try {
          const result = this.db.prepare(query).run(id);
          console.log(`Executed: ${query}, changes: ${result.changes}`);
        } catch (e) {
          console.log(`Query failed (ignoring): ${query}, error: ${e.message}`);
        }
      }

      // Re-enable foreign keys
      this.db.exec('PRAGMA foreign_keys = ON');

      // Check if member was deleted
      const memberExists = this.db.prepare('SELECT COUNT(*) as count FROM members WHERE id = ?').get(id);
      const success = memberExists.count === 0;

      console.log('Force deletion result:', success);
      return success;

    } catch (error) {
      console.error('Force delete error:', error);
      try {
        this.db.exec('PRAGMA foreign_keys = ON');
      } catch (e) { }
      return false;
    }
  }

  deleteMember(id, deletedBy = 'System', deletionReason = 'Member deletion') {
    try {
      console.log('Deleting member and all related records for ID:', id);

      // First, get the member data to store in deleted_members table
      const memberData = this.db.prepare('SELECT * FROM members WHERE id = ?').get(id);
      
      if (!memberData) {
        console.log('Member not found with ID:', id);
        return false;
      }

      console.log('Found member to delete:', memberData.name);

      // Check current foreign key status
      const fkStatus = this.db.pragma('foreign_keys');
      console.log('Current foreign key status:', fkStatus);

      // First, let's check what records exist for this member
      const receiptsCount = this.db.prepare('SELECT COUNT(*) as count FROM receipts WHERE member_id = ?').get(id);
      const invoicesCount = this.db.prepare('SELECT COUNT(*) as count FROM invoices WHERE member_id = ?').get(id);
      const attendanceCount = this.db.prepare('SELECT COUNT(*) as count FROM attendance WHERE member_id = ?').get(id);
      const measurementsCount = this.db.prepare('SELECT COUNT(*) as count FROM body_measurements WHERE member_id = ?').get(id);

      console.log('Records to delete:', {
        receipts: receiptsCount.count,
        invoices: invoicesCount.count,
        attendance: attendanceCount.count,
        measurements: measurementsCount.count
      });

      // Store member data in deleted_members table before deletion
      console.log('Storing member data in deleted_members table...');
      const deletedMemberId = `deleted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const insertDeletedMember = this.db.prepare(`
        INSERT INTO deleted_members (
          id, original_member_id, custom_member_id, name, email, address, 
          telephone_no, mobile_no, occupation, marital_status, anniversary_date,
          blood_group, sex, date_of_birth, alternate_no, member_image, 
          id_proof_image, date_of_registration, receipt_no, payment_mode,
          plan_type, services, membership_fees, registration_fee, package_fee,
          discount, paid_amount, subscription_start_date, subscription_end_date,
          subscription_status, medical_issues, goals, height, weight, status,
          original_created_at, original_updated_at, deleted_at, deleted_by, deletion_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertDeletedMember.run(
        deletedMemberId,
        memberData.id,
        memberData.custom_member_id,
        memberData.name,
        memberData.email,
        memberData.address,
        memberData.telephone_no,
        memberData.mobile_no,
        memberData.occupation,
        memberData.marital_status,
        memberData.anniversary_date,
        memberData.blood_group,
        memberData.sex,
        memberData.date_of_birth,
        memberData.alternate_no,
        memberData.member_image,
        memberData.id_proof_image,
        memberData.date_of_registration,
        memberData.receipt_no,
        memberData.payment_mode,
        memberData.plan_type,
        memberData.services,
        memberData.membership_fees,
        memberData.registration_fee,
        memberData.package_fee,
        memberData.discount,
        memberData.paid_amount,
        memberData.subscription_start_date,
        memberData.subscription_end_date,
        memberData.subscription_status,
        memberData.medical_issues,
        memberData.goals,
        memberData.height,
        memberData.weight,
        memberData.status,
        memberData.created_at,
        memberData.updated_at,
        new Date().toISOString(),
        deletedBy,
        deletionReason
      );

      console.log('Member data stored in deleted_members table successfully');

      // Use a more aggressive approach - delete without foreign key constraints
      // Execute PRAGMA as a separate statement
      this.db.exec('PRAGMA foreign_keys = OFF');

      // Delete all related records first (without transaction to avoid FK issues)
      console.log('Deleting receipts...');
      const receiptsDeleted = this.db.prepare('DELETE FROM receipts WHERE member_id = ?').run(id);
      console.log('Deleted receipts:', receiptsDeleted.changes);

      console.log('Deleting invoices...');
      const invoicesDeleted = this.db.prepare('DELETE FROM invoices WHERE member_id = ?').run(id);
      console.log('Deleted invoices:', invoicesDeleted.changes);

      console.log('Deleting attendance records...');
      const attendanceDeleted = this.db.prepare('DELETE FROM attendance WHERE member_id = ?').run(id);
      console.log('Deleted attendance records:', attendanceDeleted.changes);

      console.log('Deleting body measurements...');
      const measurementsDeleted = this.db.prepare('DELETE FROM body_measurements WHERE member_id = ?').run(id);
      console.log('Deleted body measurements:', measurementsDeleted.changes);

      // Delete any other potential references
      try {
        const staffSalariesDeleted = this.db.prepare('DELETE FROM staff_salaries WHERE member_id = ?').run(id);
        console.log('Deleted staff salaries (if any):', staffSalariesDeleted.changes);
      } catch (e) {
        console.log('No staff_salaries references');
      }

      try {
        const enquiriesDeleted = this.db.prepare('DELETE FROM enquiries WHERE member_id = ?').run(id);
        console.log('Deleted enquiries (if any):', enquiriesDeleted.changes);
      } catch (e) {
        console.log('No enquiries references');
      }

      // Finally, delete the member
      console.log('Deleting member...');
      const memberDeleted = this.db.prepare('DELETE FROM members WHERE id = ?').run(id);
      console.log('Deleted member:', memberDeleted.changes);

      // Re-enable foreign key constraints
      this.db.exec('PRAGMA foreign_keys = ON');

      const success = memberDeleted.changes > 0;
      console.log('Member deletion completed:', success);
      return success;

    } catch (error) {
      // Re-enable foreign key constraints even if there was an error
      try {
        this.db.exec('PRAGMA foreign_keys = ON');
      } catch (pragmaError) {
        console.error('Error re-enabling foreign keys:', pragmaError);
      }

      console.error('Delete member error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        memberId: id,
        stack: error.stack
      });

      // If it's still a foreign key constraint error, let's do a detailed analysis
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        console.error('Foreign key constraint still exists. Performing detailed analysis...');

        try {
          // Check all tables for any remaining references
          const remainingReceipts = this.db.prepare('SELECT COUNT(*) as count FROM receipts WHERE member_id = ?').get(id);
          const remainingInvoices = this.db.prepare('SELECT COUNT(*) as count FROM invoices WHERE member_id = ?').get(id);
          const remainingAttendance = this.db.prepare('SELECT COUNT(*) as count FROM attendance WHERE member_id = ?').get(id);
          const remainingMeasurements = this.db.prepare('SELECT COUNT(*) as count FROM body_measurements WHERE member_id = ?').get(id);

          console.error('Remaining references after deletion attempt:', {
            receipts: remainingReceipts.count,
            invoices: remainingInvoices.count,
            attendance: remainingAttendance.count,
            measurements: remainingMeasurements.count
          });

          // Check if the member still exists
          const memberExists = this.db.prepare('SELECT COUNT(*) as count FROM members WHERE id = ?').get(id);
          console.error('Member still exists:', memberExists.count > 0);

          // Get foreign key list to see what constraints exist
          const foreignKeys = this.db.prepare('PRAGMA foreign_key_list(receipts)').all();
          console.error('Foreign key constraints on receipts table:', foreignKeys);

        } catch (checkError) {
          console.error('Error during detailed analysis:', checkError);
        }
      }

      // If normal deletion failed due to foreign key constraints, try force deletion
      console.log('Normal deletion failed, attempting force deletion...');
      return this.forceDeleteMember(id);
    }
  }

  // Deleted Members Management
  getAllDeletedMembers() {
    try {
      console.log('Fetching all deleted members...');
      const deletedMembers = this.db.prepare(`
        SELECT * FROM deleted_members 
        ORDER BY deleted_at DESC
      `).all();
      
      console.log('Retrieved deleted members:', deletedMembers.length);
      return deletedMembers;
    } catch (error) {
      console.error('Error fetching deleted members:', error);
      return [];
    }
  }

  getDeletedMemberById(id) {
    try {
      console.log('Fetching deleted member by ID:', id);
      const deletedMember = this.db.prepare(`
        SELECT * FROM deleted_members 
        WHERE id = ? OR original_member_id = ?
      `).get(id, id);
      
      return deletedMember;
    } catch (error) {
      console.error('Error fetching deleted member by ID:', error);
      return null;
    }
  }

  restoreDeletedMember(deletedMemberId) {
    try {
      console.log('Restoring deleted member:', deletedMemberId);
      
      // Get the deleted member data
      const deletedMember = this.db.prepare('SELECT * FROM deleted_members WHERE id = ?').get(deletedMemberId);
      
      if (!deletedMember) {
        console.log('Deleted member not found:', deletedMemberId);
        return { success: false, error: 'Deleted member not found' };
      }

      // Check if a member with the same ID already exists
      const existingMember = this.db.prepare('SELECT id FROM members WHERE id = ?').get(deletedMember.original_member_id);
      
      if (existingMember) {
        console.log('Member with this ID already exists:', deletedMember.original_member_id);
        return { success: false, error: 'A member with this ID already exists' };
      }

      // Restore the member to the members table
      const insertMember = this.db.prepare(`
        INSERT INTO members (
          id, custom_member_id, name, email, address, telephone_no, mobile_no,
          occupation, marital_status, anniversary_date, blood_group, sex,
          date_of_birth, alternate_no, member_image, id_proof_image,
          date_of_registration, receipt_no, payment_mode, plan_type, services,
          membership_fees, registration_fee, package_fee, discount, paid_amount,
          subscription_start_date, subscription_end_date, subscription_status,
          medical_issues, goals, height, weight, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertMember.run(
        deletedMember.original_member_id,
        deletedMember.custom_member_id,
        deletedMember.name,
        deletedMember.email,
        deletedMember.address,
        deletedMember.telephone_no,
        deletedMember.mobile_no,
        deletedMember.occupation,
        deletedMember.marital_status,
        deletedMember.anniversary_date,
        deletedMember.blood_group,
        deletedMember.sex,
        deletedMember.date_of_birth,
        deletedMember.alternate_no,
        deletedMember.member_image,
        deletedMember.id_proof_image,
        deletedMember.date_of_registration,
        deletedMember.receipt_no,
        deletedMember.payment_mode,
        deletedMember.plan_type,
        deletedMember.services,
        deletedMember.membership_fees,
        deletedMember.registration_fee,
        deletedMember.package_fee,
        deletedMember.discount,
        deletedMember.paid_amount,
        deletedMember.subscription_start_date,
        deletedMember.subscription_end_date,
        deletedMember.subscription_status,
        deletedMember.medical_issues,
        deletedMember.goals,
        deletedMember.height,
        deletedMember.weight,
        'active', // Set status to active when restoring
        deletedMember.original_created_at,
        new Date().toISOString() // Update the updated_at timestamp
      );

      // Remove from deleted_members table
      this.db.prepare('DELETE FROM deleted_members WHERE id = ?').run(deletedMemberId);

      console.log('Member restored successfully:', deletedMember.name);
      return { success: true, memberId: deletedMember.original_member_id };

    } catch (error) {
      console.error('Error restoring deleted member:', error);
      return { success: false, error: error.message };
    }
  }

  permanentlyDeleteMember(deletedMemberId) {
    try {
      console.log('Permanently deleting member record:', deletedMemberId);
      
      const result = this.db.prepare('DELETE FROM deleted_members WHERE id = ?').run(deletedMemberId);
      
      if (result.changes > 0) {
        console.log('Member record permanently deleted');
        return { success: true };
      } else {
        return { success: false, error: 'Deleted member record not found' };
      }

    } catch (error) {
      console.error('Error permanently deleting member:', error);
      return { success: false, error: error.message };
    }
  }

  //Attendance
  getAllAttendance() {
    try {
      // Fetches all attendance records, ordered by the most recent check-in
      const records = this.db.prepare('SELECT * FROM attendance ORDER BY check_in DESC').all();
      console.log('Database: Retrieved attendance records:', records.length, 'records'); // Debug log
      if (records.length > 0) {
        console.log('Database: Sample record:'); // Debug log
      }
      return records;
    } catch (error) {
      console.error('Get attendance error:', error);
      return [];
    }
  }

  createAttendance(attendanceData) {
    try {
      console.log('Database: Creating attendance with data:', attendanceData);
      // Inserts a new attendance record (check-in)
      const stmt = this.db.prepare(`
        INSERT INTO attendance (id, member_id, member_name, check_in, date, profile_image)
        VALUES (@id, @member_id, @member_name, @check_in, @date, @profile_image)
      `);
      const result = stmt.run(attendanceData);
      console.log('Database: Attendance created, changes:', result.changes);
      return result.changes > 0;
    } catch (error) {
      console.error('Create attendance error:', error);
      return false;
    }
  }

  updateAttendance(id, attendanceData) {
    try {
      // Updates an attendance record with a check-out time
      const stmt = this.db.prepare('UPDATE attendance SET check_out = @check_out WHERE id = @id');
      const result = stmt.run({ ...attendanceData, id });
      return result.changes > 0;
    } catch (error) {
      console.error('Update attendance error:', error);
      return false;
    }
  }

  // Staff Attendance operations
  getAllStaffAttendance() {
    try {
      // Fetches all staff attendance records, ordered by the most recent check-in
      const records = this.db.prepare('SELECT * FROM staff_attendance ORDER BY check_in DESC').all();
      console.log('Database: Retrieved staff attendance records:', records.length, 'records');
      if (records.length > 0) {
        console.log('Database: Sample staff attendance record:', records[0]);
      }
      return records;
    } catch (error) {
      console.error('Get staff attendance error:', error);
      return [];
    }
  }

  createStaffAttendance(attendanceData) {
    try {
      console.log('Database: Creating staff attendance with data:', attendanceData);
      // Inserts a new staff attendance record (check-in)
      const stmt = this.db.prepare(`
        INSERT INTO staff_attendance (id, staff_id, staff_name, check_in, date, profile_image, role, shift)
        VALUES (@id, @staff_id, @staff_name, @check_in, @date, @profile_image, @role, @shift)
      `);
      const result = stmt.run(attendanceData);
      console.log('Database: Staff attendance created, changes:', result.changes);
      return result.changes > 0;
    } catch (error) {
      console.error('Create staff attendance error:', error);
      return false;
    }
  }

  updateStaffAttendance(id, attendanceData) {
    try {
      // Updates a staff attendance record with a check-out time
      const stmt = this.db.prepare('UPDATE staff_attendance SET check_out = @check_out WHERE id = @id');
      const result = stmt.run({ ...attendanceData, id });
      return result.changes > 0;
    } catch (error) {
      console.error('Update staff attendance error:', error);
      return false;
    }
  }

  // Staff operations
  getAllStaff() {
    try {
      return this.db.prepare('SELECT * FROM staff ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get staff error:', error);
      return [];
    }
  }

  getStaffById(id) {
    try {
      return this.db.prepare('SELECT * FROM staff WHERE id = ?').get(id);
    } catch (error) {
      console.error('Get staff error:', error);
      return null;
    }
  }

  createStaff(staffData) {
    try {
      console.log('Database.cjs - Creating staff with data:', JSON.stringify(staffData, null, 2));

      // Validate required fields
      if (!staffData.id) {
        console.error('Missing required field: id');
        return false;
      }
      if (!staffData.name) {
        console.error('Missing required field: name');
        return false;
      }
      if (!staffData.phone) {
        console.error('Missing required field: phone');
        return false;
      }
      if (!staffData.joining_date) {
        console.error('Missing required field: joining_date');
        return false;
      }
      if (!staffData.role) {
        console.error('Missing required field: role');
        return false;
      }
      if (staffData.salary === undefined || staffData.salary === null) {
        console.error('Missing required field: salary');
        return false;
      }
      if (!staffData.status) {
        console.error('Missing required field: status');
        return false;
      }
      if (!staffData.created_at) {
        console.error('Missing required field: created_at');
        return false;
      }

      const stmt = this.db.prepare(`
        INSERT INTO staff (
          id, name, email, phone, address, emergency_contact, emergency_phone,
          date_of_birth, joining_date, role, salary, status, profile_image, 
          id_card_image, specialization, shift, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      console.log('Database.cjs - Executing insert with values:', [
        staffData.id,
        staffData.name,
        staffData.email,
        staffData.phone,
        staffData.address,
        staffData.emergency_contact,
        staffData.emergency_phone,
        staffData.date_of_birth,
        staffData.joining_date,
        staffData.role,
        staffData.salary,
        staffData.status,
        staffData.profile_image,
        staffData.id_card_image,
        staffData.specialization,
        staffData.shift,
        staffData.created_at
      ]);

      const result = stmt.run(
        staffData.id,
        staffData.name,
        staffData.email,
        staffData.phone,
        staffData.address,
        staffData.emergency_contact,
        staffData.emergency_phone,
        staffData.date_of_birth,
        staffData.joining_date,
        staffData.role,
        staffData.salary,
        staffData.status,
        staffData.profile_image,
        staffData.id_card_image,
        staffData.specialization,
        staffData.shift,
        staffData.created_at
      );

      console.log('Database.cjs - Insert result:', result);
      console.log('Database.cjs - Changes made:', result.changes);

      return result.changes > 0;
    } catch (error) {
      console.error('Create staff error:', error);
      console.error('Error details:', error.message);
      console.error('Staff data that caused error:', JSON.stringify(staffData, null, 2));
      return false;
    }
  }

  updateStaff(id, staffData) {
    try {
      console.log('Updating staff with ID:', id, 'Data:', staffData);

      const stmt = this.db.prepare(`
        UPDATE staff SET
          name = ?, email = ?, phone = ?, address = ?, emergency_contact = ?,
          emergency_phone = ?, date_of_birth = ?, role = ?, salary = ?,
          status = ?, profile_image = ?, id_card_image = ?, specialization = ?, 
          shift = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        staffData.name,
        staffData.email,
        staffData.phone,
        staffData.address,
        staffData.emergency_contact,
        staffData.emergency_phone,
        staffData.date_of_birth,
        staffData.role,
        staffData.salary,
        staffData.status,
        staffData.profile_image,
        staffData.id_card_image,
        staffData.specialization,
        staffData.shift,
        id
      );

      console.log('Update staff result changes:', result.changes);
      return result.changes > 0;
    } catch (error) {
      console.error('Update staff error:', error);
      return false;
    }
  }

  deleteStaff(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM staff WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete staff error:', error);
      return false;
    }
  }
  // Receipt operations
  getAllReceipts() {
    try {
      const receipts = this.db.prepare('SELECT * FROM receipts ORDER BY created_at DESC').all();
      // Ensure amount_paid and due_amount have proper defaults
      return receipts.map(receipt => ({
        ...receipt,
        amount_paid: receipt.amount_paid !== null ? receipt.amount_paid : receipt.amount,
        due_amount: receipt.due_amount !== null ? receipt.due_amount : 0
      }));
    } catch (error) {
      console.error('Get receipts error:', error);
      return [];
    }
  }

  getReceiptsByMemberId(memberId) {
    try {
      const receipts = this.db.prepare('SELECT * FROM receipts WHERE member_id = ? ORDER BY created_at DESC').all(memberId);
      // Ensure amount_paid and due_amount have proper defaults
      return receipts.map(receipt => ({
        ...receipt,
        amount_paid: receipt.amount_paid !== null ? receipt.amount_paid : receipt.amount,
        due_amount: receipt.due_amount !== null ? receipt.due_amount : 0
      }));
    } catch (error) {
      console.error('Get receipts by member error:', error);
      return [];
    }
  }

  createReceipt(receiptData) {
    try {
      // If custom_member_id or subscription dates are not provided, fetch from members table
      let memberInfo = null;
      if (receiptData.member_id) {
        memberInfo = this.db.prepare('SELECT * FROM members WHERE id = ?').get(receiptData.member_id);
      }

      console.log('Creating receipt with data:', receiptData);

      // Validate required fields
      if (!receiptData.receipt_number || !receiptData.member_name || !receiptData.amount || !receiptData.payment_type) {
        throw new Error('Missing required receipt fields');
      }

      // For member receipts, member_id is required
      const receiptCategory = receiptData.receipt_category || 'member';
      if (receiptCategory === 'member' && !receiptData.member_id) {
        throw new Error('member_id is required for member receipts');
      }

      // Validate created_at
      let createdAt = receiptData.created_at;
      if (!createdAt || createdAt === 'Invalid Date') {
        createdAt = new Date().toISOString();
        console.log('Fixed invalid created_at, using current timestamp');
      }

      // Generate ID if not provided
      const receiptId = receiptData.id || this.generateId();

      const stmt = this.db.prepare(`
        INSERT INTO receipts (
          id, receipt_number, invoice_id, member_id, member_name, amount, amount_paid, due_amount, payment_type,
          description, receipt_category, transaction_type, custom_member_id,
          subscription_start_date, subscription_end_date, plan_type, payment_mode,
          mobile_no, package_fee, registration_fee, discount, email, cgst, sigst,
          created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Calculate due amount properly if not provided
      const totalAmount = receiptData.amount;
      const paidAmount = receiptData.amount_paid || receiptData.amount;
      const calculatedDueAmount = Math.max(0, totalAmount - paidAmount);
      const finalDueAmount = receiptData.due_amount !== undefined ? receiptData.due_amount : calculatedDueAmount;

      console.log('Receipt amount calculation:', {
        totalAmount,
        paidAmount,
        providedDueAmount: receiptData.due_amount,
        calculatedDueAmount,
        finalDueAmount,
        receiptNumber: receiptData.receipt_number
      });

      const result = stmt.run(
        receiptId,
        receiptData.receipt_number,
        receiptData.invoice_id || null,
        receiptData.member_id || null,
        receiptData.member_name,
        totalAmount,
        paidAmount,
        finalDueAmount,
        receiptData.payment_type,
        receiptData.description || '',
        receiptCategory,
        receiptData.transaction_type || 'payment',
        receiptData.custom_member_id || (memberInfo ? memberInfo.custom_member_id : null),
        receiptData.subscription_start_date || (memberInfo ? memberInfo.subscription_start_date : null),
        receiptData.subscription_end_date || (memberInfo ? memberInfo.subscription_end_date : null),
        receiptData.plan_type || (memberInfo ? memberInfo.plan_type : null),
        receiptData.payment_mode || (memberInfo ? memberInfo.payment_mode : null),
        receiptData.mobile_no || (memberInfo ? memberInfo.mobile_no : null),
        receiptData.package_fee || (memberInfo ? memberInfo.package_fee : null),
        receiptData.registration_fee || (memberInfo ? memberInfo.registration_fee : null),
        receiptData.discount || (memberInfo ? memberInfo.discount : null),
        receiptData.email || (memberInfo ? memberInfo.email : null),
        receiptData.cgst || 0,
        receiptData.sigst || 0,
        createdAt,
        receiptData.created_by || 'System'
      );

      console.log('Receipt created, changes:', result.changes);

      // Update member due amount if this is a member receipt
      if (result.changes > 0 && receiptData.member_id) {
        this.updateMemberDueAmount(receiptData.member_id);
      }

      // Return the created receipt data
      if (result.changes > 0) {
        return {
          id: receiptId,
          receipt_number: receiptData.receipt_number,
          member_id: receiptData.member_id || null,
          member_name: receiptData.member_name,
          amount: totalAmount,
          amount_paid: paidAmount,
          due_amount: finalDueAmount,
          payment_type: receiptData.payment_type,
          description: receiptData.description || '',
          receipt_category: receiptCategory,
          created_at: createdAt,
          created_by: receiptData.created_by || 'System'
        };
      }

      return false;
    } catch (error) {
      console.error('Create receipt error:', error);
      console.error('Receipt data received:', receiptData);
      return false;
    }
  }

  updateReceipt(id, receiptData) {
    try {
      console.log('Updating receipt with ID:', id, 'Data:', receiptData);

      const stmt = this.db.prepare(`
        UPDATE receipts SET
          member_id = ?, member_name = ?, amount = ?, amount_paid = ?, due_amount = ?, payment_type = ?, description = ?, receipt_category = ?
        WHERE id = ?
      `);

      const result = stmt.run(
        receiptData.member_id,
        receiptData.member_name,
        receiptData.amount,
        receiptData.amount_paid || receiptData.amount,
        receiptData.due_amount || 0,
        receiptData.payment_type,
        receiptData.description,
        receiptData.receipt_category || 'member',
        id
      );

      console.log('Update receipt result changes:', result.changes);

      // Update member due amount if this is a member receipt
      if (result.changes > 0 && receiptData.member_id) {
        this.updateMemberDueAmount(receiptData.member_id);
      }

      return result.changes > 0;
    } catch (error) {
      console.error('Update receipt error:', error);
      return false;
    }
  }

  createReceiptVersion(receiptData) {
    try {
      console.log('🔄 Creating receipt version with data:', receiptData);

      const stmt = this.db.prepare(`
        INSERT INTO receipts (
          id, receipt_number, member_id, member_name, custom_member_id, amount, amount_paid, due_amount,
          payment_type, description, receipt_category, cgst, sigst, created_at, updated_at, created_by,
          original_receipt_id, version_number, is_current_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        receiptData.id,
        receiptData.receipt_number,
        receiptData.member_id,
        receiptData.member_name,
        receiptData.custom_member_id,
        receiptData.amount,
        receiptData.amount_paid,
        receiptData.due_amount,
        receiptData.payment_type,
        receiptData.description,
        receiptData.receipt_category,
        receiptData.cgst || 0,
        receiptData.sigst || 0,
        receiptData.created_at,
        receiptData.updated_at,
        receiptData.created_by,
        receiptData.original_receipt_id,
        receiptData.version_number,
        receiptData.is_current_version
      );

      console.log('✅ Receipt version created, changes:', result.changes);

      // Update member due amount if this is a member receipt
      if (result.changes > 0 && receiptData.member_id) {
        this.updateMemberDueAmount(receiptData.member_id);
      }

      return result.changes > 0;
    } catch (error) {
      console.error('Create receipt version error:', error);
      return false;
    }
  }

  markReceiptAsSuperseded(receiptId) {
    try {
      console.log('📝 Marking receipt as superseded:', receiptId);

      const stmt = this.db.prepare(`
        UPDATE receipts SET 
          is_current_version = FALSE,
          superseded_at = ?
        WHERE id = ?
      `);

      const result = stmt.run(new Date().toISOString(), receiptId);

      console.log('✅ Receipt marked as superseded, changes:', result.changes);
      return result.changes > 0;
    } catch (error) {
      console.error('Mark receipt as superseded error:', error);
      return false;
    }
  }

  getReceiptHistory(originalReceiptId) {
    try {
      console.log('📋 Getting receipt history for:', originalReceiptId);

      const stmt = this.db.prepare(`
        SELECT * FROM receipts 
        WHERE id = ? OR original_receipt_id = ?
        ORDER BY version_number ASC, created_at ASC
      `);

      const receipts = stmt.all(originalReceiptId, originalReceiptId);
      console.log('📋 Found receipt history:', receipts.length, 'versions');

      return receipts;
    } catch (error) {
      console.error('Get receipt history error:', error);
      return [];
    }
  }

  deleteReceipt(id) {
    try {
      // Get the member_id before deleting
      const receipt = this.db.prepare('SELECT member_id FROM receipts WHERE id = ?').get(id);

      const stmt = this.db.prepare('DELETE FROM receipts WHERE id = ?');
      const result = stmt.run(id);

      // Update member due amount if this was a member receipt
      if (result.changes > 0 && receipt && receipt.member_id) {
        this.updateMemberDueAmount(receipt.member_id);
      }

      return result.changes > 0;
    } catch (error) {
      console.error('Delete receipt error:', error);
      return false;
    }
  }

  // Handle member payment updates by properly updating receipts
  handleMemberPaymentUpdate(memberId, oldPaidAmount, newPaidAmount) {
    try {
      console.log(`🔄 Handling payment update for member ${memberId}: ${oldPaidAmount} -> ${newPaidAmount}`);

      // Get current member data
      const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
      if (!member) {
        console.error('Member not found:', memberId);
        return false;
      }

      // Calculate total expected amount
      const registrationFee = member.registration_fee || 0;
      const packageFee = member.package_fee || member.membership_fees || 0;
      const discount = member.discount || 0;
      const totalExpected = Math.max(0, registrationFee + packageFee - discount);

      console.log(`💰 Member fee structure:`, {
        registrationFee,
        packageFee,
        discount,
        totalExpected,
        newPaidAmount
      });

      // Get all member receipts ordered by creation date
      const receipts = this.db.prepare(`
        SELECT * FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
        ORDER BY created_at ASC
      `).all(memberId);

      if (receipts.length === 0) {
        console.log('No receipts found for member, creating initial receipt');
        // Create a receipt for the payment
        const receiptData = {
          id: this.generateId(),
          receipt_number: this.generateReceiptNumber(),
          member_id: memberId,
          member_name: member.name,
          amount: totalExpected,
          amount_paid: newPaidAmount,
          due_amount: Math.max(0, totalExpected - newPaidAmount),
          payment_type: member.payment_mode || 'cash',
          description: `Payment update - ${member.name}`,
          receipt_category: 'member',
          transaction_type: newPaidAmount >= totalExpected ? 'payment' : 'partial_payment',
          custom_member_id: member.custom_member_id,
          subscription_start_date: member.subscription_start_date,
          subscription_end_date: member.subscription_end_date,
          plan_type: member.plan_type,
          payment_mode: member.payment_mode,
          mobile_no: member.mobile_no,
          email: member.email,
          package_fee: packageFee,
          registration_fee: registrationFee,
          discount: discount,
          cgst: 0,
          sigst: 0,
          created_at: new Date().toISOString(),
          created_by: 'System'
        };

        return this.createReceipt(receiptData);
      }

      // Simple approach: Update the most recent receipt to reflect the total payment
      const latestReceipt = receipts[receipts.length - 1];
      const dueAmount = Math.max(0, totalExpected - newPaidAmount);

      const updateReceiptStmt = this.db.prepare(`
        UPDATE receipts SET 
          amount = ?,
          amount_paid = ?,
          due_amount = ?
        WHERE id = ?
      `);

      const result = updateReceiptStmt.run(
        totalExpected,
        newPaidAmount,
        dueAmount,
        latestReceipt.id
      );

      if (result.changes > 0) {
        console.log(`✅ Updated receipt ${latestReceipt.receipt_number}: Amount=₹${totalExpected}, Paid=₹${newPaidAmount}, Due=₹${dueAmount}`);

        // If there are multiple receipts, update the others to show 0 paid and 0 due
        if (receipts.length > 1) {
          for (let i = 0; i < receipts.length - 1; i++) {
            const otherReceipt = receipts[i];
            const otherResult = updateReceiptStmt.run(
              totalExpected,
              0,
              0,
              otherReceipt.id
            );
            if (otherResult.changes > 0) {
              console.log(`✅ Updated other receipt ${otherReceipt.receipt_number}: Amount=₹${totalExpected}, Paid=₹0, Due=₹0`);
            }
          }
        }
      }

      console.log(`✅ Updated receipts for member payment change`);
      return true;
    } catch (error) {
      console.error('Handle member payment update error:', error);
      return false;
    }
  }

  // Update member's total due amount based on receipts
  updateMemberDueAmount(memberId) {
    try {
      if (!memberId) return false;

      // Get current member data
      const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
      if (!member) {
        console.error('Member not found:', memberId);
        return false;
      }

      // Calculate totals from receipts
      const receiptTotals = this.db.prepare(`
        SELECT 
          SUM(COALESCE(amount_paid, 0)) as total_paid,
          SUM(COALESCE(due_amount, 0)) as total_due,
          SUM(COALESCE(amount, 0)) as total_amount
        FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
      `).get(memberId);

      const totalPaidFromReceipts = receiptTotals.total_paid || 0;
      const totalDueFromReceipts = receiptTotals.total_due || 0;
      const totalAmountFromReceipts = receiptTotals.total_amount || 0;

      console.log(`Member ${memberId} receipt totals:`, {
        totalPaidFromReceipts,
        totalDueFromReceipts,
        totalAmountFromReceipts,
        currentMemberPaidAmount: member.paid_amount
      });

      // Update member's paid_amount to match the total from receipts
      const updateMemberStmt = this.db.prepare(`
        UPDATE members 
        SET paid_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const updateResult = updateMemberStmt.run(totalPaidFromReceipts, memberId);

      if (updateResult.changes > 0) {
        console.log(`✅ Member ${memberId} paid_amount updated from ${member.paid_amount} to ${totalPaidFromReceipts}`);
        console.log(`✅ Member ${memberId} total due amount: ${totalDueFromReceipts}`);
      }

      return true;
    } catch (error) {
      console.error('Update member due amount error:', error);
      return false;
    }
  }

  // Get member's current due amount for display
  getMemberDueAmount(memberId) {
    try {
      if (!memberId) return 0;

      // Get current member data
      const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
      if (!member) return 0;

      // Calculate expected total from member's fee structure
      const registrationFee = member.registration_fee || 0;
      const packageFee = member.package_fee || member.membership_fees || 0;
      const discount = member.discount || 0;
      const expectedTotal = Math.max(0, registrationFee + packageFee - discount);

      // Get actual paid amount
      const paidAmount = member.paid_amount || 0;

      // Calculate due amount
      const dueAmount = Math.max(0, expectedTotal - paidAmount);

      return dueAmount;
    } catch (error) {
      console.error('Get member due amount error:', error);
      return 0;
    }
  }

  // Recalculate member totals when fee structure changes
  recalculateMemberTotals(memberId) {
    try {
      if (!memberId) return false;

      // Get current member data
      const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
      if (!member) {
        console.error('Member not found:', memberId);
        return false;
      }

      // Calculate expected total from member's fee structure
      const registrationFee = member.registration_fee || 0;
      const packageFee = member.package_fee || member.membership_fees || 0;
      const discount = member.discount || 0;
      const expectedTotal = Math.max(0, registrationFee + packageFee - discount);

      // Get actual paid amount from receipts
      const receiptTotals = this.db.prepare(`
        SELECT 
          SUM(COALESCE(amount_paid, 0)) as total_paid
        FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
      `).get(memberId);

      const actualPaid = receiptTotals.total_paid || 0;
      const calculatedDue = Math.max(0, expectedTotal - actualPaid);

      console.log(`Member ${memberId} totals recalculation:`, {
        expectedTotal,
        actualPaid,
        calculatedDue,
        registrationFee,
        packageFee,
        discount
      });

      // Update member's paid_amount to match receipts
      const updateMemberStmt = this.db.prepare(`
        UPDATE members 
        SET paid_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const updateResult = updateMemberStmt.run(actualPaid, memberId);

      if (updateResult.changes > 0) {
        console.log(`✅ Member ${memberId} totals recalculated - Paid: ${actualPaid}, Due: ${calculatedDue}`);
      }

      return { expectedTotal, actualPaid, calculatedDue };
    } catch (error) {
      console.error('Recalculate member totals error:', error);
      return false;
    }
  }

  // Fix existing receipts that have NULL or incorrect amount_paid/due_amount values
  fixReceiptAmounts() {
    try {
      console.log('Starting receipt amounts fix...');

      // Get all receipts that need fixing
      const receiptsToFix = this.db.prepare(`
        SELECT id, amount, amount_paid, due_amount 
        FROM receipts 
        WHERE amount_paid IS NULL OR due_amount IS NULL
      `).all();

      console.log(`Found ${receiptsToFix.length} receipts to fix`);

      const updateStmt = this.db.prepare(`
        UPDATE receipts 
        SET amount_paid = ?, due_amount = ? 
        WHERE id = ?
      `);

      let fixedCount = 0;
      for (const receipt of receiptsToFix) {
        const amount = receipt.amount || 0;
        const amountPaid = receipt.amount_paid !== null ? receipt.amount_paid : amount;
        const dueAmount = Math.max(0, amount - amountPaid);

        const result = updateStmt.run(amountPaid, dueAmount, receipt.id);
        if (result.changes > 0) {
          fixedCount++;
        }
      }

      console.log(`✅ Fixed ${fixedCount} receipts with proper amount_paid and due_amount values`);
      return fixedCount;
    } catch (error) {
      console.error('Error fixing receipt amounts:', error);
      return 0;
    }
  }

  // Clear member due amounts by updating receipts with additional payment
  clearMemberDueAmounts(memberId, additionalPayment) {
    try {
      if (!memberId || additionalPayment <= 0) return false;

      // Get all receipts with due amounts for this member
      const receiptsWithDue = this.db.prepare(`
        SELECT id, amount, amount_paid, due_amount, receipt_number
        FROM receipts 
        WHERE member_id = ? 
          AND (receipt_category IS NULL OR receipt_category = 'member')
          AND COALESCE(due_amount, 0) > 0
        ORDER BY created_at ASC
      `).all(memberId);

      if (receiptsWithDue.length === 0) {
        console.log('No receipts with due amounts found for member:', memberId);
        return false;
      }

      let remainingPayment = additionalPayment;
      let updatedReceipts = 0;

      // Update receipts to clear due amounts
      const updateStmt = this.db.prepare(`
        UPDATE receipts 
        SET amount_paid = ?, due_amount = ?
        WHERE id = ?
      `);

      for (const receipt of receiptsWithDue) {
        if (remainingPayment <= 0) break;

        const currentDue = receipt.due_amount || 0;
        const paymentForThisReceipt = Math.min(remainingPayment, currentDue);

        const newAmountPaid = (receipt.amount_paid || 0) + paymentForThisReceipt;
        const newDueAmount = Math.max(0, currentDue - paymentForThisReceipt);

        updateStmt.run(newAmountPaid, newDueAmount, receipt.id);

        remainingPayment -= paymentForThisReceipt;
        updatedReceipts++;

        console.log(`Updated receipt ${receipt.receipt_number}: paid +${paymentForThisReceipt}, due: ${currentDue} -> ${newDueAmount}`);
      }

      console.log(`Cleared due amounts for ${updatedReceipts} receipts. Remaining payment: ${remainingPayment}`);

      // If there's remaining payment after clearing all dues, create a new receipt
      if (remainingPayment > 0) {
        console.log(`Creating new receipt for remaining payment: ${remainingPayment}`);
        // This will be handled by the calling function
      }

      return {
        success: true,
        updatedReceipts,
        remainingPayment,
        clearedAmount: additionalPayment - remainingPayment
      };
    } catch (error) {
      console.error('Clear member due amounts error:', error);
      return false;
    }
  }

  // Enquiry operations
  getAllEnquiries() {
    try {
      return this.db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get enquiries error:', error);
      return [];
    }
  }

  createEnquiry(enquiryData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO enquiries (
          id, name, email, phone, interest, source, status, notes, follow_up_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        enquiryData.id, enquiryData.name, enquiryData.email, enquiryData.phone,
        enquiryData.interest, enquiryData.source, enquiryData.status,
        enquiryData.notes, enquiryData.followUpDate, enquiryData.createdAt
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create enquiry error:', error);
      return false;
    }
  }

  // Body measurements operations
  createBodyMeasurement(measurementData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO body_measurements (
          id, member_id, weight, height, bmi, body_fat, muscle, chest, waist, hips, biceps, thighs, notes, created_at, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        measurementData.id,
        measurementData.member_id,
        measurementData.weight,
        measurementData.height,
        measurementData.bmi,
        measurementData.body_fat,
        measurementData.muscle,
        measurementData.chest,
        measurementData.waist,
        measurementData.hips,
        measurementData.biceps,
        measurementData.thighs,
        measurementData.notes,
        measurementData.created_at,
        measurementData.recorded_by
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create body measurement error:', error);
      return false;
    }
  }

  getBodyMeasurementsByMemberId(memberId) {
    try {
      return this.db.prepare('SELECT * FROM body_measurements WHERE member_id = ? ORDER BY created_at DESC').all(memberId);
    } catch (error) {
      console.error('Get body measurements error:', error);
      return [];
    }
  }

  // getAllBodyMeasurements moved to a single implementation below

  // Utility functions
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11);
  }

  generateReceiptNumber() {
    try {
      const setting = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('receipt_counter');
      const counter = parseInt(setting?.value || '0');
      const newCounter = counter + 1;

      this.db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(newCounter.toString(), 'receipt_counter');

      return `${newCounter}`;
    } catch (error) {
      console.error('Generate receipt number error:', error);
      return `${Date.now()}`;
    }
  }

  generateInvoiceNumber() {
    try {
      const setting = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('invoice_counter');
      const counter = parseInt(setting?.value || '1000');
      const newCounter = counter + 1;

      this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('invoice_counter', newCounter.toString());

      return `INV${newCounter}`;
    } catch (error) {
      console.error('Generate invoice number error:', error);
      return `INV${Date.now()}`;
    }
  }

  // Generate next available member ID
  generateMemberNumber() {
    try {
      // Get all member IDs and find the highest numeric one
      const allMembers = this.db.prepare('SELECT custom_member_id FROM members').all();
      
      let highestNumber = 0;
      for (const member of allMembers) {
        const memberId = member.custom_member_id;
        // Check if it's a pure number (no letters)
        if (memberId && /^\d+$/.test(memberId)) {
          const num = parseInt(memberId);
          if (num > highestNumber) {
            highestNumber = num;
          }
        }
      }
      
      const newNumber = highestNumber + 1;

      // Double-check that this number isn't taken (safety check)
      let memberNumber = newNumber;
      while (this.isMemberNumberTaken(memberNumber.toString())) {
        memberNumber++;
      }

      // Update the counter setting for consistency
      this.db.prepare(`
        INSERT OR REPLACE INTO settings (key, value) 
        VALUES ('member_counter', ?)
      `).run(memberNumber.toString());

      console.log(`🔵 Generated member number: ${memberNumber} (highest was: ${highestNumber})`);
      return memberNumber.toString();
    } catch (error) {
      console.error('Generate member number error:', error);
      // Fallback: use timestamp-based number
      return Date.now().toString().slice(-6);
    }
  }

  // Check if a member number is already taken
  isMemberNumberTaken(memberNumber) {
    try {
      const existing = this.db.prepare('SELECT id FROM members WHERE custom_member_id = ?').get(memberNumber);
      return !!existing;
    } catch (error) {
      console.error('Check member number error:', error);
      return false;
    }
  }

  // Validate and update member ID (for admin updates)
  updateMemberNumber(memberId, newMemberNumber) {
    try {
      // Check if the new member number is already taken by another member
      const existing = this.db.prepare('SELECT id FROM members WHERE custom_member_id = ? AND id != ?').get(newMemberNumber, memberId);

      if (existing) {
        return { success: false, error: 'Member ID already exists' };
      }

      // Update the member's custom_member_id
      const stmt = this.db.prepare('UPDATE members SET custom_member_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      const result = stmt.run(newMemberNumber, memberId);

      if (result.changes > 0) {
        // Update all related records (receipts, body measurements, attendance)
        this.updateRelatedRecordsMemberNumber(memberId, newMemberNumber);

        // Update the counter if the new number is higher
        const currentCounter = parseInt(this.db.prepare('SELECT value FROM settings WHERE key = ?').get('member_counter')?.value || '0');
        const newNumber = parseInt(newMemberNumber);
        if (newNumber > currentCounter) {
          this.db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(newNumber.toString(), 'member_counter');
        }

        return { success: true };
      }

      return { success: false, error: 'Failed to update member ID' };
    } catch (error) {
      console.error('Update member number error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update related records when member number changes
  updateRelatedRecordsMemberNumber(memberId, newMemberNumber) {
    try {
      // Update receipts
      this.db.prepare('UPDATE receipts SET custom_member_id = ? WHERE member_id = ?').run(newMemberNumber, memberId);

      // Update body measurements
      this.db.prepare('UPDATE body_measurements SET custom_member_id = ? WHERE member_id = ?').run(newMemberNumber, memberId);

      // Update attendance
      this.db.prepare('UPDATE attendance SET custom_member_id = ? WHERE member_id = ?').run(newMemberNumber, memberId);

      console.log(`Updated related records for member ${memberId} with new member number ${newMemberNumber}`);
    } catch (error) {
      console.error('Update related records member number error:', error);
    }
  }

  // Get receipt history for a member (ordered by creation date)
  getMemberReceiptHistory(memberId) {
    try {
      return this.db.prepare(`
        SELECT * FROM receipts 
        WHERE member_id = ? 
        ORDER BY created_at DESC, receipt_number DESC
      `).all(memberId);
    } catch (error) {
      console.error('Get member receipt history error:', error);
      return [];
    }
  }







  // Update all receipts for a member with current member information
  updateMemberReceiptsInfo(memberId) {
    try {
      // Get current member data
      const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
      if (!member) {
        console.log('Member not found for receipt update:', memberId);
        return false;
      }

      // Update all receipts for this member with basic info
      const updateStmt = this.db.prepare(`
        UPDATE receipts SET 
          custom_member_id = ?,
          member_name = ?,
          mobile_no = ?,
          email = ?,
          plan_type = ?,
          payment_mode = ?
        WHERE member_id = ?
      `);

      const result = updateStmt.run(
        member.custom_member_id,
        member.name,
        member.mobile_no,
        member.email,
        member.plan_type,
        member.payment_mode,
        memberId
      );

      console.log(`Updated ${result.changes} receipts for member ${member.name}`);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating member receipts info:', error);
      return false;
    }
  }

  // Update member receipts with new fee structure and recalculate amounts
  updateMemberReceiptsWithFeeStructure(memberId) {
    try {
      console.log(`🔄 Updating receipts with new fee structure for member: ${memberId}`);

      // Get current member data
      const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
      if (!member) {
        console.log('Member not found for receipt fee structure update:', memberId);
        return { success: false, updatedReceipts: 0 };
      }

      // Calculate new fee structure
      const registrationFee = member.registration_fee || 0;
      const packageFee = member.package_fee || member.membership_fees || 0;
      const discount = member.discount || 0;
      const newTotalAmount = Math.max(0, registrationFee + packageFee - discount);

      console.log(`💰 New fee structure for ${member.name}:`, {
        registrationFee,
        packageFee,
        discount,
        newTotalAmount
      });

      // Get all member receipts
      const receipts = this.db.prepare(`
        SELECT * FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
        ORDER BY created_at ASC
      `).all(memberId);

      if (receipts.length === 0) {
        console.log('No receipts found for member:', member.name);
        return { success: true, updatedReceipts: 0 };
      }

      let updatedCount = 0;
      let totalPaidSoFar = 0;

      // Update each receipt with new fee structure
      const updateReceiptStmt = this.db.prepare(`
        UPDATE receipts SET 
          custom_member_id = ?,
          member_name = ?,
          mobile_no = ?,
          email = ?,
          plan_type = ?,
          payment_mode = ?,
          subscription_start_date = ?,
          subscription_end_date = ?,
          package_fee = ?,
          registration_fee = ?,
          discount = ?,
          amount = ?,
          due_amount = ?
        WHERE id = ?
      `);

      for (const receipt of receipts) {
        // Keep the original amount_paid (what was actually paid)
        const amountPaid = receipt.amount_paid || receipt.amount || 0;
        totalPaidSoFar += amountPaid;

        // Calculate new due amount based on updated total and cumulative payments
        const remainingAmount = Math.max(0, newTotalAmount - totalPaidSoFar);

        const result = updateReceiptStmt.run(
          member.custom_member_id,
          member.name,
          member.mobile_no,
          member.email,
          member.plan_type,
          member.payment_mode,
          member.subscription_start_date,
          member.subscription_end_date,
          packageFee,
          registrationFee,
          discount,
          newTotalAmount, // New total amount
          remainingAmount, // New due amount
          receipt.id
        );

        if (result.changes > 0) {
          updatedCount++;
          console.log(`✅ Updated receipt ${receipt.receipt_number}: Amount=₹${newTotalAmount}, Paid=₹${amountPaid}, Due=₹${remainingAmount}`);
        }
      }

      // Recalculate member totals to ensure consistency
      this.recalculateMemberTotals(memberId);

      console.log(`✅ Updated ${updatedCount} receipts for member ${member.name}`);
      return { success: true, updatedReceipts: updatedCount };
    } catch (error) {
      console.error('Error updating member receipts with fee structure:', error);
      return { success: false, updatedReceipts: 0, error: error.message };
    }
  }

  // Helper function to calculate subscription end date
  calculateSubscriptionEndDate(startDate, planType) {
    const start = new Date(startDate);
    let endDate = new Date(start);

    switch (planType) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'half_yearly':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    return endDate.toISOString().split('T')[0];
  }

  // Update subscription status for a single member
  updateMemberSubscriptionStatus(memberId) {
    try {
      console.log('Updating subscription status for member:', memberId);

      // Get current date in ISO format (YYYY-MM-DD)
      const currentDate = new Date().toISOString().split('T')[0];

      // Calculate date 7 days from now
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0];

      // Get the member's subscription end date
      const member = this.db.prepare('SELECT subscription_end_date FROM members WHERE id = ?').get(memberId);

      if (!member || !member.subscription_end_date) {
        console.log('Member not found or no subscription end date');
        return false;
      }

      let newStatus = '';

      // Determine the appropriate status
      if (member.subscription_end_date < currentDate) {
        newStatus = 'expired';
      } else if (member.subscription_end_date <= sevenDaysFromNowStr) {
        newStatus = 'expiring_soon';
      } else {
        newStatus = 'active';
      }

      // Update the member's subscription status
      const updateStmt = this.db.prepare('UPDATE members SET subscription_status = ? WHERE id = ?');
      const result = updateStmt.run(newStatus, memberId);

      console.log(`Updated subscription status for member ${memberId} to ${newStatus}`);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating member subscription status:', error);
      return false;
    }
  }

  // Legacy method - kept for compatibility but redirects to the main implementation
  updateAllSubscriptionStatusesLegacy() {
    console.log('🔄 Legacy subscription status update called - redirecting to main implementation');
    return this.updateAllSubscriptionStatuses();
  }

  // Force migration - simplified to only update subscription statuses
  forceMigration() {
    console.log('Force running subscription status update...');
    this.updateAllSubscriptionStatuses();
  }

  // Force packages constraint migration
  forcePackagesMigration() {
    console.log('🔄 Force running packages constraint migration...');
    this.migratePackagesConstraint();
  }

  // Check if packages constraint supports custom
  checkPackagesConstraint() {
    try {
      const tableInfo = this.db.prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='master_packages'
      `).get();

      if (tableInfo && tableInfo.sql) {
        const hasCustom = tableInfo.sql.includes("'custom'");
        console.log('📋 Current packages constraint supports custom:', hasCustom);
        console.log('📋 Table schema:', tableInfo.sql);
        return hasCustom;
      }
      return false;
    } catch (error) {
      console.error('Error checking packages constraint:', error);
      return false;
    }
  }

  // Invoice operations
  getAllInvoices() {
    try {
      return this.db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get invoices error:', error);
      return [];
    }
  }

  getInvoicesByMemberId(memberId) {
    try {
      return this.db.prepare('SELECT * FROM invoices WHERE member_id = ? ORDER BY created_at DESC').all(memberId);
    } catch (error) {
      console.error('Get invoices by member error:', error);
      return [];
    }
  }

  createInvoice(invoiceData) {
    try {
      console.log('Creating invoice with data:', invoiceData);

      const stmt = this.db.prepare(`
        INSERT INTO invoices (
          id, invoice_number, member_id, member_name, registration_fee, package_fee, 
          discount, total_amount, paid_amount, status, due_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        invoiceData.id,
        invoiceData.invoice_number,
        invoiceData.member_id,
        invoiceData.member_name,
        invoiceData.registration_fee || 0,
        invoiceData.package_fee,
        invoiceData.discount || 0,
        invoiceData.total_amount,
        invoiceData.paid_amount || 0,
        invoiceData.status || 'unpaid',
        invoiceData.due_date,
        invoiceData.created_at
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create invoice error:', error);
      return false;
    }
  }

  updateInvoicePayment(invoiceId, paidAmount) {
    try {
      // Get current invoice
      const invoice = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
      if (!invoice) return false;

      const newPaidAmount = (invoice.paid_amount || 0) + paidAmount;
      const newStatus = newPaidAmount >= invoice.total_amount ? 'paid' :
        newPaidAmount > 0 ? 'partial' : 'unpaid';

      const stmt = this.db.prepare(`
        UPDATE invoices SET 
          paid_amount = ?, 
          status = ?, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      const result = stmt.run(newPaidAmount, newStatus, invoiceId);
      return result.changes > 0;
    } catch (error) {
      console.error('Update invoice payment error:', error);
      return false;
    }
  }

  getMemberDueAmount(memberId) {
    try {
      // Get member's total fees and paid amount
      const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);

      if (!member) {
        return { dueAmount: 0, unpaidInvoices: 0 };
      }

      // Calculate total fees
      const registrationFee = member.registration_fee || 0;
      const packageFee = member.package_fee || member.membership_fees || 0;
      const discount = member.discount || 0;
      const totalFees = Math.max(0, registrationFee + packageFee - discount);

      // Get total paid from receipts
      const paidResult = this.db.prepare(`
        SELECT SUM(COALESCE(amount_paid, amount, 0)) as total_paid
        FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
      `).get(memberId);

      const totalPaid = paidResult.total_paid || 0;
      const dueAmount = Math.max(0, totalFees - totalPaid);

      // Debug log for troubleshooting
      if (dueAmount > 0) {
        console.log(`💰 Due amount calculation for member ${member.name} (${memberId}):`, {
          totalFees,
          totalPaid,
          dueAmount,
          registrationFee,
          packageFee,
          discount,
          memberPaidAmount: member.paid_amount // This should NOT be used for calculation
        });
      }

      return {
        dueAmount: dueAmount,
        unpaidInvoices: dueAmount > 0 ? 1 : 0
      };
    } catch (error) {
      console.error('Get member due amount error:', error);
      return { dueAmount: 0, unpaidInvoices: 0 };
    }
  }



  // Staff salary receipt functions
  createStaffSalaryReceipt(staffId, staffName, amount, paymentType, description, createdBy) {
    try {
      const receiptData = {
        id: this.generateId(),
        receipt_number: this.generateReceiptNumber(),
        member_id: null, // No member_id for staff receipts
        member_name: staffName,
        amount: amount,
        payment_type: paymentType,
        description: description || 'Staff Salary Payment',
        receipt_category: 'staff_salary',
        created_at: new Date().toISOString(),
        created_by: createdBy
      };

      const result = this.createReceipt(receiptData);
      return result; // This now returns the receipt object or false
    } catch (error) {
      console.error('Create staff salary receipt error:', error);
      return null;
    }
  }

  createSalaryUpdateReceipt(staffId, staffName, oldSalary, newSalary, createdBy) {
    try {
      const receiptData = {
        id: this.generateId(),
        receipt_number: this.generateReceiptNumber(),
        member_id: null,
        member_name: staffName,
        amount: newSalary - oldSalary,
        payment_type: 'bank_transfer',
        description: `Salary Update: $${oldSalary} → $${newSalary}`,
        receipt_category: 'staff_salary_update',
        created_at: new Date().toISOString(),
        created_by: createdBy
      };

      const result = this.createReceipt(receiptData);
      return result; // This now returns the receipt object or false
    } catch (error) {
      console.error('Create salary update receipt error:', error);
      return null;
    }
  }

  createBonusReceipt(staffId, staffName, bonusAmount, paymentType, description, createdBy) {
    try {
      const receiptData = {
        id: this.generateId(),
        receipt_number: this.generateReceiptNumber(),
        member_id: null,
        member_name: staffName,
        amount: bonusAmount,
        payment_type: paymentType,
        description: description || 'Staff Bonus Payment',
        receipt_category: 'staff_bonus',
        created_at: new Date().toISOString(),
        created_by: createdBy
      };

      const result = this.createReceipt(receiptData);
      return result; // This now returns the receipt object or false
    } catch (error) {
      console.error('Create bonus receipt error:', error);
      return null;
    }
  }

  getStaffReceipts(staffName = null) {
    try {
      let query = `
        SELECT * FROM receipts 
        WHERE receipt_category IN ('staff_salary', 'staff_salary_update', 'staff_bonus')
      `;

      if (staffName) {
        query += ' AND member_name = ?';
        return this.db.prepare(query + ' ORDER BY created_at DESC').all(staffName);
      }

      return this.db.prepare(query + ' ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get staff receipts error:', error);
      return [];
    }
  }



  // Get member receipts only (exclude staff receipts)
  getMemberReceipts() {
    try {
      const receipts = this.db.prepare(`
        SELECT * FROM receipts 
        WHERE receipt_category IS NULL OR receipt_category = 'member'
        ORDER BY created_at DESC
      `).all();
      console.log('Database: Retrieved member receipts:', receipts.length);
      return receipts;
    } catch (error) {
      console.error('Get member receipts error:', error);
      return [];
    }
  }

  // Renewal workflow
  renewMembership(memberId, planType, membershipFees, createdBy) {
    try {
      console.log('Renewing membership for member:', memberId, 'Plan:', planType, 'Fees:', membershipFees);

      // Get current member data
      const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      // Calculate new subscription dates
      const subscriptionStartDate = new Date().toISOString().split('T')[0];
      const subscriptionEndDate = this.calculateSubscriptionEndDate(subscriptionStartDate, planType);

      // Update member with new subscription details
      const updateStmt = this.db.prepare(`
        UPDATE members SET
          subscription_start_date = ?,
          subscription_end_date = ?,
          subscription_status = 'active',
          status = 'active',
          plan_type = ?,
          membership_fees = ?,
          package_fee = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = updateStmt.run(
        subscriptionStartDate,
        subscriptionEndDate,
        planType,
        membershipFees,
        membershipFees, // package_fee same as membership_fees for renewal
        memberId
      );

      if (result.changes === 0) {
        return { success: false, error: 'Failed to update member subscription' };
      }

      // Create renewal receipt
      const receiptData = {
        id: this.generateId(),
        receipt_number: this.generateReceiptNumber(),
        member_id: memberId,
        member_name: member.name,
        amount: membershipFees,
        payment_type: 'cash', // Default, can be updated later
        description: `Membership renewal - ${planType} plan`,
        receipt_category: 'member',
        created_at: new Date().toISOString(),
        created_by: createdBy
      };

      const receiptCreated = this.createReceipt(receiptData);
      if (!receiptCreated) {
        console.warn('Failed to create renewal receipt, but membership was renewed');
      }

      // Create invoice for the renewal
      const invoiceData = {
        id: this.generateId(),
        invoice_number: this.generateInvoiceNumber(),
        member_id: memberId,
        member_name: member.name,
        registration_fee: 0, // No registration fee for renewals
        package_fee: membershipFees,
        discount: 0,
        total_amount: membershipFees,
        paid_amount: membershipFees, // Assume paid in full for renewal
        status: 'paid',
        due_date: subscriptionEndDate,
        created_at: new Date().toISOString()
      };

      const invoiceCreated = this.createInvoice(invoiceData);
      if (!invoiceCreated) {
        console.warn('Failed to create renewal invoice, but membership was renewed');
      }

      console.log('Membership renewed successfully for member:', member.name);
      return { success: true };

    } catch (error) {
      console.error('Renew membership error:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate subscription end date based on plan type
  calculateSubscriptionEndDate(startDate, planType) {
    const start = new Date(startDate);
    let endDate = new Date(start);

    switch (planType) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'half_yearly':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    return endDate.toISOString().split('T')[0];
  }

  // Enquiry operations
  getAllEnquiries() {
    try {
      return this.db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get enquiries error:', error);
      return [];
    }
  }

  getEnquiryById(id) {
    try {
      return this.db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id);
    } catch (error) {
      console.error('Get enquiry error:', error);
      return null;
    }
  }

  createEnquiry(enquiryData) {
    try {
      console.log('Creating enquiry with data:', enquiryData);

      const stmt = this.db.prepare(`
        INSERT INTO enquiries (
          id, enquiry_number, name, address, telephone_no, mobile_no, occupation,
          sex, ref_person_name, date_of_enquiry, interested_in, membership_fees,
          payment_mode, payment_frequency, status, notes, follow_up_date,
          converted_to_member_id, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        enquiryData.id,
        enquiryData.enquiry_number,
        enquiryData.name,
        enquiryData.address,
        enquiryData.telephone_no,
        enquiryData.mobile_no,
        enquiryData.occupation,
        enquiryData.sex,
        enquiryData.ref_person_name,
        enquiryData.date_of_enquiry,
        enquiryData.interested_in,
        enquiryData.membership_fees,
        enquiryData.payment_mode,
        enquiryData.payment_frequency,
        enquiryData.status,
        enquiryData.notes,
        enquiryData.follow_up_date,
        enquiryData.converted_to_member_id,
        enquiryData.created_at,
        enquiryData.created_by
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create enquiry error:', error);
      return false;
    }
  }

  updateEnquiry(id, enquiryData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE enquiries SET
          name = ?, address = ?, telephone_no = ?, mobile_no = ?, occupation = ?,
          sex = ?, ref_person_name = ?, date_of_enquiry = ?, interested_in = ?,
          membership_fees = ?, payment_mode = ?, payment_frequency = ?, status = ?,
          notes = ?, follow_up_date = ?, converted_to_member_id = ?,
          updated_at = CURRENT_TIMESTAMP, created_by = ?
        WHERE id = ?
      `);

      const result = stmt.run(
        enquiryData.name,
        enquiryData.address,
        enquiryData.telephone_no,
        enquiryData.mobile_no,
        enquiryData.occupation,
        enquiryData.sex,
        enquiryData.ref_person_name,
        enquiryData.date_of_enquiry,
        enquiryData.interested_in,
        enquiryData.membership_fees,
        enquiryData.payment_mode,
        enquiryData.payment_frequency,
        enquiryData.status,
        enquiryData.notes,
        enquiryData.follow_up_date,
        enquiryData.converted_to_member_id,
        enquiryData.created_by,
        id
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Update enquiry error:', error);
      return false;
    }
  }

  deleteEnquiry(id) {
    try {
      const result = this.db.prepare('DELETE FROM enquiries WHERE id = ?').run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete enquiry error:', error);
      return false;
    }
  }

  convertEnquiryToMember(enquiryId, memberData) {
    try {
      console.log('Converting enquiry to member:', { enquiryId, memberName: memberData.name });

      // Start a transaction
      const transaction = this.db.transaction(() => {
        // Get the enquiry
        const enquiry = this.db.prepare('SELECT * FROM enquiries WHERE id = ?').get(enquiryId);
        if (!enquiry) {
          throw new Error('Enquiry not found');
        }

        // Create the member
        const memberId = this.generateId();
        const memberDataWithId = {
          ...memberData,
          id: memberId,
          created_at: new Date().toISOString()
        };

        const memberCreated = this.createMember(memberDataWithId);
        if (!memberCreated) {
          throw new Error('Failed to create member');
        }

        // Update the enquiry status to converted and link to member
        const updateEnquiryStmt = this.db.prepare(`
          UPDATE enquiries SET
            status = 'converted',
            converted_to_member_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        const enquiryUpdated = updateEnquiryStmt.run(memberId, enquiryId);
        if (enquiryUpdated.changes === 0) {
          throw new Error('Failed to update enquiry status');
        }

        return { success: true, memberId };
      });

      return transaction();
    } catch (error) {
      console.error('Convert enquiry to member error:', error);
      return { success: false, error: error.message };
    }
  }

  generateEnquiryNumber() {
    try {
      // Get the current counter
      let counter = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('enquiry_counter');

      if (!counter) {
        // Initialize counter if it doesn't exist
        this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('enquiry_counter', '1000');
        counter = { value: '1000' };
      }

      const nextNumber = parseInt(counter.value) + 1;

      // Update the counter
      this.db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(nextNumber.toString(), 'enquiry_counter');

      return `ENQ${nextNumber}`;
    } catch (error) {
      console.error('Generate enquiry number error:', error);
      return `ENQ${Date.now()}`;
    }
  }

  // Enquiry operations
  getAllEnquiries() {
    try {
      return this.db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get enquiries error:', error);
      return [];
    }
  }

  getEnquiryById(id) {
    try {
      return this.db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id);
    } catch (error) {
      console.error('Get enquiry error:', error);
      return null;
    }
  }

  createEnquiry(enquiryData) {
    try {
      console.log('Creating enquiry with data:', enquiryData);

      const stmt = this.db.prepare(`
        INSERT INTO enquiries (
          id, enquiry_number, name, address, telephone_no, mobile_no, occupation,
          sex, ref_person_name, date_of_enquiry, interested_in, membership_fees,
          payment_mode, payment_frequency, status, notes, follow_up_date,
          converted_to_member_id, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        enquiryData.id,
        enquiryData.enquiry_number,
        enquiryData.name,
        enquiryData.address,
        enquiryData.telephone_no,
        enquiryData.mobile_no,
        enquiryData.occupation,
        enquiryData.sex,
        enquiryData.ref_person_name,
        enquiryData.date_of_enquiry,
        enquiryData.interested_in,
        enquiryData.membership_fees,
        enquiryData.payment_mode,
        enquiryData.payment_frequency,
        enquiryData.status,
        enquiryData.notes,
        enquiryData.follow_up_date,
        enquiryData.converted_to_member_id,
        enquiryData.created_at,
        enquiryData.created_by
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create enquiry error:', error);
      return false;
    }
  }

  updateEnquiry(id, enquiryData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE enquiries SET
          name = ?, address = ?, telephone_no = ?, mobile_no = ?, occupation = ?,
          sex = ?, ref_person_name = ?, date_of_enquiry = ?, interested_in = ?,
          membership_fees = ?, payment_mode = ?, payment_frequency = ?, status = ?,
          notes = ?, follow_up_date = ?, converted_to_member_id = ?,
          updated_at = CURRENT_TIMESTAMP, created_by = ?
        WHERE id = ?
      `);

      const result = stmt.run(
        enquiryData.name,
        enquiryData.address,
        enquiryData.telephone_no,
        enquiryData.mobile_no,
        enquiryData.occupation,
        enquiryData.sex,
        enquiryData.ref_person_name,
        enquiryData.date_of_enquiry,
        enquiryData.interested_in,
        enquiryData.membership_fees,
        enquiryData.payment_mode,
        enquiryData.payment_frequency,
        enquiryData.status,
        enquiryData.notes,
        enquiryData.follow_up_date,
        enquiryData.converted_to_member_id,
        enquiryData.created_by,
        id
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Update enquiry error:', error);
      return false;
    }
  }

  deleteEnquiry(id) {
    try {
      const result = this.db.prepare('DELETE FROM enquiries WHERE id = ?').run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete enquiry error:', error);
      return false;
    }
  }

  convertEnquiryToMember(enquiryId, memberData) {
    try {
      console.log('Converting enquiry to member:', { enquiryId, memberName: memberData.name });

      // Start a transaction
      const transaction = this.db.transaction(() => {
        // Get the enquiry
        const enquiry = this.db.prepare('SELECT * FROM enquiries WHERE id = ?').get(enquiryId);
        if (!enquiry) {
          throw new Error('Enquiry not found');
        }

        // Create the member
        const memberId = this.generateId();
        const memberDataWithId = {
          ...memberData,
          id: memberId,
          created_at: new Date().toISOString()
        };

        const memberCreated = this.createMember(memberDataWithId);
        if (!memberCreated) {
          throw new Error('Failed to create member');
        }

        // Update the enquiry status to converted and link to member
        const updateEnquiryStmt = this.db.prepare(`
          UPDATE enquiries SET
            status = 'converted',
            converted_to_member_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        const enquiryUpdated = updateEnquiryStmt.run(memberId, enquiryId);
        if (enquiryUpdated.changes === 0) {
          throw new Error('Failed to update enquiry status');
        }

        return { success: true, memberId };
      });

      return transaction();
    } catch (error) {
      console.error('Convert enquiry to member error:', error);
      return { success: false, error: error.message };
    }
  }

  generateEnquiryNumber() {
    try {
      // Get the current counter
      let counter = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('enquiry_counter');

      if (!counter) {
        // Initialize counter if it doesn't exist
        this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('enquiry_counter', '1000');
        counter = { value: '1000' };
      }

      const nextNumber = parseInt(counter.value) + 1;

      // Update the counter
      this.db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(nextNumber.toString(), 'enquiry_counter');

      return `ENQ${nextNumber}`;
    } catch (error) {
      console.error('Generate enquiry number error:', error);
      return `ENQ${Date.now()}`;
    }
  }

  // Create Receipt
  createReceipt(receiptData) {
    try {
      console.log('🧾 Creating receipt:', {
        receiptNumber: receiptData.receipt_number,
        memberId: receiptData.member_id,
        memberName: receiptData.member_name
      });

      // Additional check to prevent duplicate receipts for the same member
      const existingReceipt = this.db.prepare('SELECT id FROM receipts WHERE member_id = ? AND receipt_category = ?').get(receiptData.member_id, receiptData.receipt_category);
      if (existingReceipt) {
        console.log('⚠️ Duplicate receipt prevented for member:', receiptData.member_id);
        return false;
      }

      const stmt = this.db.prepare(`
        INSERT INTO receipts (
          id, receipt_number, invoice_id, member_id, member_name, amount,
          payment_type, description, receipt_category, transaction_type,
          custom_member_id, subscription_start_date, subscription_end_date,
          plan_type, payment_mode, mobile_no, package_fee, registration_fee,
          discount, email, cgst, sigst, amount_paid, due_amount,
          created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        receiptData.id,
        receiptData.receipt_number,
        receiptData.invoice_id || null,
        receiptData.member_id,
        receiptData.member_name,
        receiptData.amount,
        receiptData.payment_type,
        receiptData.description,
        receiptData.receipt_category,
        receiptData.transaction_type,
        receiptData.custom_member_id,
        receiptData.subscription_start_date,
        receiptData.subscription_end_date,
        receiptData.plan_type,
        receiptData.payment_mode,
        receiptData.mobile_no,
        receiptData.package_fee,
        receiptData.registration_fee,
        receiptData.discount,
        receiptData.email,
        receiptData.cgst,
        receiptData.sigst,
        receiptData.amount_paid,
        receiptData.due_amount,
        receiptData.created_at,
        receiptData.created_by
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create receipt error:', error);
      return false;
    }
  }

  generateReceiptNumber() {
    try {
      // Get the current counter
      let counter = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('receipt_counter');

      if (!counter) {
        // Initialize counter if it doesn't exist
        this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('receipt_counter', '0');
        counter = { value: '0' };
      }

      const nextNumber = parseInt(counter.value) + 1;

      // Update the counter
      this.db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(nextNumber.toString(), 'receipt_counter');

      return nextNumber.toString();
    } catch (error) {
      console.error('Generate receipt number error:', error);
      return Date.now().toString();
    }
  }

  // Body Measurements CRUD operations
  createBodyMeasurement(measurementData) {
    try {
      console.log('Creating body measurement:', measurementData);

      const stmt = this.db.prepare(`
        INSERT INTO body_measurements (
          id, member_id, custom_member_id, member_name, serial_number, measurement_date,
          weight, height, age, neck, chest, arms, fore_arms, wrist, tummy, waist,
          hips, thighs, calf, fat_percentage, bmi, bmr, vf, notes, created_at, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        measurementData.id,
        measurementData.member_id,
        measurementData.custom_member_id,
        measurementData.member_name,
        measurementData.serial_number,
        measurementData.measurement_date,
        measurementData.weight,
        measurementData.height,
        measurementData.age,
        measurementData.neck,
        measurementData.chest,
        measurementData.arms,
        measurementData.fore_arms,
        measurementData.wrist,
        measurementData.tummy,
        measurementData.waist,
        measurementData.hips,
        measurementData.thighs,
        measurementData.calf,
        measurementData.fat_percentage,
        measurementData.bmi,
        measurementData.bmr,
        measurementData.vf,
        measurementData.notes,
        measurementData.created_at,
        measurementData.recorded_by
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create body measurement error:', error);
      return false;
    }
  }

  getAllBodyMeasurements() {
    try {
      return this.db.prepare(`
        SELECT bm.*, m.name as member_name, m.custom_member_id
        FROM body_measurements bm 
        JOIN members m ON bm.member_id = m.id 
        ORDER BY bm.measurement_date DESC, bm.created_at DESC
      `).all();
    } catch (error) {
      console.error('Get all body measurements error:', error);
      return [];
    }
  }

  getBodyMeasurementsByMember(memberId) {
    try {
      return this.db.prepare(`
        SELECT * FROM body_measurements 
        WHERE member_id = ? 
        ORDER BY measurement_date DESC, created_at DESC
      `).all(memberId);
    } catch (error) {
      console.error('Get body measurements by member error:', error);
      return [];
    }
  }

  updateBodyMeasurement(id, measurementData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE body_measurements SET
          measurement_date = ?, weight = ?, height = ?, age = ?, neck = ?, chest = ?,
          arms = ?, fore_arms = ?, wrist = ?, tummy = ?, waist = ?, hips = ?,
          thighs = ?, calf = ?, fat_percentage = ?, bmi = ?, bmr = ?, vf = ?, notes = ?
        WHERE id = ?
      `);

      const result = stmt.run(
        measurementData.measurement_date,
        measurementData.weight,
        measurementData.height,
        measurementData.age,
        measurementData.neck,
        measurementData.chest,
        measurementData.arms,
        measurementData.fore_arms,
        measurementData.wrist,
        measurementData.tummy,
        measurementData.waist,
        measurementData.hips,
        measurementData.thighs,
        measurementData.calf,
        measurementData.fat_percentage,
        measurementData.bmi,
        measurementData.bmr,
        measurementData.vf,
        measurementData.notes,
        id
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Update body measurement error:', error);
      return false;
    }
  }

  deleteBodyMeasurement(id) {
    try {
      const result = this.db.prepare('DELETE FROM body_measurements WHERE id = ?').run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete body measurement error:', error);
      return false;
    }
  }

  // WhatsApp Automation methods
  createWhatsAppMessage(messageData) {
    try {
      console.log('Creating WhatsApp message:', messageData);

      const stmt = this.db.prepare(`
        INSERT INTO whatsapp_messages (
          id, member_id, member_name, member_phone, message_type, message_content,
          status, scheduled_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        messageData.id,
        messageData.member_id,
        messageData.member_name,
        messageData.member_phone,
        messageData.message_type,
        messageData.message_content,
        messageData.status || 'pending',
        messageData.scheduled_at,
        messageData.created_at
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create WhatsApp message error:', error);
      return false;
    }
  }

  getPendingWhatsAppMessages() {
    try {
      return this.db.prepare(`
        SELECT * FROM whatsapp_messages 
        WHERE status = 'pending' OR (status = 'scheduled' AND scheduled_at <= datetime('now'))
        ORDER BY created_at ASC
      `).all();
    } catch (error) {
      console.error('Get pending WhatsApp messages error:', error);
      return [];
    }
  }

  updateWhatsAppMessageStatus(id, status, sentAt = null, errorMessage = null) {
    try {
      const stmt = this.db.prepare(`
        UPDATE whatsapp_messages SET
          status = ?, sent_at = ?, error_message = ?, retry_count = retry_count + 1
        WHERE id = ?
      `);

      const result = stmt.run(status, sentAt, errorMessage, id);
      return result.changes > 0;
    } catch (error) {
      console.error('Update WhatsApp message status error:', error);
      return false;
    }
  }

  // WhatsApp message generators based on the system prompt
  async generateReceiptMessage(memberId, receiptId) {
    try {
      const member = await this.getMemberById(memberId);
      const receipts = await this.getReceiptsByMemberId(memberId);
      const receipt = receipts[0]; // newest

      if (!member || !receipt) return null;

      const message = `Hi ${member.name}, we've received ₹${receipt.amount_paid}. Receipt #${receipt.receipt_number} is attached. Thank you for choosing Prime Fitness Health Point! 🎉`;

      return {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        member_id: memberId,
        member_name: member.name,
        member_phone: member.mobile_no,
        message_type: 'receipt_created',
        message_content: message,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Generate receipt message error:', error);
      return null;
    }
  }

  async generateExpiryMessage(memberId) {
    try {
      const member = await this.getMemberById(memberId);
      if (!member) return null;

      const endDate = new Date(member.subscription_end_date);
      const today = new Date();
      const diffTime = endDate - today;
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const message = `Hi ${member.name}, your membership ends in ${days} day(s) on ${member.subscription_end_date}. Renew now to keep smashing your goals! ⚠️`;

      return {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        member_id: memberId,
        member_name: member.name,
        member_phone: member.mobile_no,
        message_type: 'membership_expiring',
        message_content: message,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Generate expiry message error:', error);
      return null;
    }
  }

  async generateAttendanceReminderMessage(memberId) {
    try {
      const member = await this.getMemberById(memberId);
      if (!member) return null;

      const message = `Hi ${member.name}, we missed you at the gym lately. Let's get back on track together—see you soon? 💪`;

      return {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        member_id: memberId,
        member_name: member.name,
        member_phone: member.mobile_no,
        message_type: 'attendance_reminder',
        message_content: message,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Generate attendance reminder message error:', error);
      return null;
    }
  }

  async generateDueAmountMessage(memberId) {
    try {
      const member = await this.getMemberById(memberId);
      const dueData = await this.getMemberDueAmount(memberId);

      if (!member || !dueData) return null;

      const message = `Hi ${member.name}, your outstanding balance is ₹${dueData.dueAmount}. Please clear it at your convenience to avoid service interruption. Thanks! 🙏`;

      return {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        member_id: memberId,
        member_name: member.name,
        member_phone: member.mobile_no,
        message_type: 'due_amount_reminder',
        message_content: message,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Generate due amount message error:', error);
      return null;
    }
  }

  async generateBirthdayMessage(memberId) {
    try {
      const member = await this.getMemberById(memberId);
      if (!member) return null;

      // Format the birth date for display
      const birthDate = new Date(member.date_of_birth);
      const formattedBirthDate = birthDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long'
      });

      const message = `Dear ${member.name}, Wish you a very Happy Birthday (${formattedBirthDate})! 🎂 May all your dreams come true and you achieve all your fitness goals. Team: PRIME FITNESS and HEALTH POINT 🎉`;

      return {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        member_id: memberId,
        member_name: member.name,
        member_phone: member.mobile_no,
        message_type: 'birthday_wish',
        message_content: message,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Generate birthday message error:', error);
      return null;
    }
  }

  async generateWelcomeMessage(memberId) {
    try {
      const member = await this.getMemberById(memberId);
      if (!member) return null;

      const message = `Dear ${member.name}, Please Submit your Photo, Copy of ID in GYM. If You've already submitted documents ignore this message. Team: PRIME FITNESS and HEALTH POINT 📋`;

      return {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        member_id: memberId,
        member_name: member.name,
        member_phone: member.mobile_no,
        message_type: 'welcome_message',
        message_content: message,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Generate welcome message error:', error);
      return null;
    }
  }

  // Helper method to get member due amount (referenced in the system prompt)
  async getMemberDueAmount(memberId) {
    try {
      const member = this.getMemberById(memberId);
      if (!member) return null;

      // Calculate due amount based on member's payment status
      const totalFees = (member.registration_fee || 0) + (member.package_fee || 0) - (member.discount || 0);
      const paidAmount = member.paid_amount || 0;
      const dueAmount = Math.max(0, totalFees - paidAmount);

      return {
        dueAmount: dueAmount,
        unpaidInvoices: dueAmount > 0 ? 1 : 0
      };
    } catch (error) {
      console.error('Get member due amount error:', error);
      return { dueAmount: 0, unpaidInvoices: 0 };
    }
  }

  // Helper method to get receipts by member ID
  getReceiptsByMemberId(memberId) {
    try {
      return this.db.prepare(`
        SELECT * FROM receipts 
        WHERE member_id = ? 
        ORDER BY created_at DESC
      `).all(memberId);
    } catch (error) {
      console.error('Get receipts by member ID error:', error);
      return [];
    }
  }

  // Automated triggers for WhatsApp messages
  async triggerReceiptMessage(memberId, receiptId) {
    const messageData = await this.generateReceiptMessage(memberId, receiptId);
    if (messageData) {
      return this.createWhatsAppMessage(messageData);
    }
    return false;
  }

  async triggerExpiryReminders() {
    try {
      // Get members expiring in next 7 days
      const expiringMembers = this.db.prepare(`
        SELECT id FROM members 
        WHERE subscription_end_date BETWEEN date('now') AND date('now', '+7 days')
        AND status = 'active'
      `).all();

      let messagesCreated = 0;
      for (const member of expiringMembers) {
        const messageData = await this.generateExpiryMessage(member.id);
        if (messageData && this.createWhatsAppMessage(messageData)) {
          messagesCreated++;
        }
      }

      return messagesCreated;
    } catch (error) {
      console.error('Trigger expiry reminders error:', error);
      return 0;
    }
  }

  async triggerAttendanceReminders() {
    try {
      // Get members who haven't attended in last 7 days
      const inactiveMembers = this.db.prepare(`
        SELECT m.id FROM members m
        LEFT JOIN attendance a ON m.id = a.member_id AND a.date >= date('now', '-7 days')
        WHERE a.id IS NULL AND m.status = 'active'
      `).all();

      let messagesCreated = 0;
      for (const member of inactiveMembers) {
        const messageData = await this.generateAttendanceReminderMessage(member.id);
        if (messageData && this.createWhatsAppMessage(messageData)) {
          messagesCreated++;
        }
      }

      return messagesCreated;
    } catch (error) {
      console.error('Trigger attendance reminders error:', error);
      return 0;
    }
  }

  getTodaysBirthdayMembers() {
    try {
      const today = new Date();
      const todayFormatted = today.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long'
      });

      console.log(`🎂 Checking for members with birthday on ${todayFormatted}...`);
      console.log(`📅 Today's date info:`, {
        fullDate: today.toISOString(),
        localDate: today.toLocaleDateString(),
        month: today.getMonth() + 1,
        day: today.getDate()
      });

      // First, let's see what the current date looks like in SQLite
      const currentDateInfo = this.db.prepare(`
        SELECT 
          datetime('now') as current_datetime,
          date('now') as current_date,
          strftime('%m-%d', 'now') as current_month_day,
          strftime('%m', 'now') as current_month,
          strftime('%d', 'now') as current_day
      `).get();

      console.log('🗓️ SQLite current date info:', currentDateInfo);

      // Get all active members with their birth dates for debugging
      const allMembers = this.db.prepare(`
        SELECT id, name, date_of_birth, mobile_no,
               strftime('%m-%d', date_of_birth) as birth_month_day,
               strftime('%m', date_of_birth) as birth_month,
               strftime('%d', date_of_birth) as birth_day
        FROM members 
        WHERE status = 'active'
        ORDER BY name
      `).all();

      console.log(`👥 All active members (${allMembers.length}):`);
      allMembers.forEach(member => {
        const birthDate = new Date(member.date_of_birth);
        console.log(`   - ${member.name}: DOB=${member.date_of_birth}, Month-Day=${member.birth_month_day}, Parsed=${birthDate.toLocaleDateString()}`);
      });

      // Get members with birthday today using multiple approaches
      console.log('\n🔍 Trying different date matching approaches:');

      // Approach 1: Original SQLite strftime
      const approach1 = this.db.prepare(`
        SELECT id, name, date_of_birth, mobile_no FROM members 
        WHERE strftime('%m-%d', date_of_birth) = strftime('%m-%d', 'now')
        AND status = 'active'
      `).all();
      console.log(`Approach 1 (strftime): ${approach1.length} matches`);

      // Approach 2: Manual date comparison
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
      const todayDay = String(today.getDate()).padStart(2, '0');
      const todayMonthDay = `${todayMonth}-${todayDay}`;

      console.log(`🎯 Looking for month-day: ${todayMonthDay}`);

      const approach2 = this.db.prepare(`
        SELECT id, name, date_of_birth, mobile_no FROM members 
        WHERE strftime('%m-%d', date_of_birth) = ?
        AND status = 'active'
      `).all(todayMonthDay);
      console.log(`Approach 2 (manual): ${approach2.length} matches`);

      // Approach 3: JavaScript date comparison
      const approach3 = allMembers.filter(member => {
        const birthDate = new Date(member.date_of_birth);
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();

        return birthMonth === todayMonth && birthDay === todayDay;
      });
      console.log(`Approach 3 (JavaScript): ${approach3.length} matches`);

      // Use the approach that works best
      let birthdayMembers = approach2.length > 0 ? approach2 : approach3;

      console.log(`🎉 Final result: Found ${birthdayMembers.length} members with birthday today:`);
      birthdayMembers.forEach(member => {
        const birthDate = new Date(member.date_of_birth);
        const formattedBirthDate = birthDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long'
        });
        console.log(`   - ${member.name} (${member.mobile_no}) - Birthday: ${formattedBirthDate}`);
      });

      return birthdayMembers;
    } catch (error) {
      console.error('Get today\'s birthday members error:', error);
      return [];
    }
  }

  async triggerBirthdayMessages() {
    try {
      console.log('\n🎂 === BIRTHDAY MESSAGE TRIGGER DEBUG ===');

      // Get current date info
      const now = new Date();
      console.log('📅 Current JavaScript Date:', {
        fullDate: now.toString(),
        isoString: now.toISOString(),
        localDate: now.toLocaleDateString(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        year: now.getFullYear()
      });

      // Check SQLite date functions
      const sqliteDate = this.db.prepare(`
        SELECT 
          datetime('now') as sqlite_now,
          date('now') as sqlite_date,
          strftime('%Y-%m-%d', 'now') as formatted_date,
          strftime('%m-%d', 'now') as month_day,
          strftime('%m', 'now') as month,
          strftime('%d', 'now') as day
      `).get();
      console.log('🗓️ SQLite Date Info:', sqliteDate);

      // Get all members to see their date formats
      const allMembers = this.db.prepare(`
        SELECT name, date_of_birth, 
               strftime('%m-%d', date_of_birth) as birth_month_day,
               status
        FROM members 
        WHERE status = 'active'
        LIMIT 5
      `).all();
      console.log('👥 Sample members with birth dates:', allMembers);

      // Try the birthday query with debug
      const birthdayQuery = `
        SELECT id, name, date_of_birth, mobile_no,
               strftime('%m-%d', date_of_birth) as birth_month_day
        FROM members 
        WHERE strftime('%m-%d', date_of_birth) = strftime('%m-%d', 'now')
        AND status = 'active'
      `;
      console.log('🔍 Birthday Query:', birthdayQuery);

      const birthdayMembers = this.db.prepare(birthdayQuery).all();
      console.log('🎉 Birthday Members Found:', birthdayMembers);

      // Also try with manual date (using the same logic as our fixed date formatting)
      const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
      const todayDay = String(now.getDate()).padStart(2, '0');
      const todayMonthDay = `${todayMonth}-${todayDay}`;
      console.log('🎯 Looking for month-day pattern:', todayMonthDay);
      console.log('📅 Today is:', now.toDateString());

      const manualQuery = `
        SELECT id, name, date_of_birth, mobile_no,
               strftime('%m-%d', date_of_birth) as birth_month_day
        FROM members 
        WHERE strftime('%m-%d', date_of_birth) = ?
        AND status = 'active'
      `;
      const manualBirthdayMembers = this.db.prepare(manualQuery).all(todayMonthDay);
      console.log('🔍 Manual Query Results:', manualBirthdayMembers);

      // Use whichever method found results
      const finalBirthdayMembers = birthdayMembers.length > 0 ? birthdayMembers : manualBirthdayMembers;

      let messagesCreated = 0;
      for (const member of finalBirthdayMembers) {
        console.log(`🎂 Processing birthday for ${member.name} (DOB: ${member.date_of_birth})`);
        const messageData = await this.generateBirthdayMessage(member.id);
        if (messageData && this.createWhatsAppMessage(messageData)) {
          messagesCreated++;
          console.log(`✅ Birthday message queued for ${member.name}`);
        } else {
          console.log(`❌ Failed to create birthday message for ${member.name}`);
        }
      }

      console.log(`🎂 Total birthday messages created: ${messagesCreated}`);
      console.log('🎂 === END BIRTHDAY DEBUG ===\n');
      return messagesCreated;
    } catch (error) {
      console.error('Trigger birthday messages error:', error);
      return 0;
    }
  }

  // Additional WhatsApp methods for the frontend
  getAllWhatsAppMessages() {
    try {
      return this.db.prepare(`
        SELECT * FROM whatsapp_messages 
        ORDER BY created_at DESC
      `).all();
    } catch (error) {
      console.error('Get all WhatsApp messages error:', error);
      return [];
    }
  }

  retryWhatsAppMessage(messageId) {
    try {
      const stmt = this.db.prepare(`
        UPDATE whatsapp_messages SET
          status = 'pending', retry_count = retry_count + 1
        WHERE id = ?
      `);

      const result = stmt.run(messageId);
      return result.changes > 0;
    } catch (error) {
      console.error('Retry WhatsApp message error:', error);
      return false;
    }
  }

  getAllWhatsAppMessages() {
    try {
      return this.db.prepare(`
        SELECT * FROM whatsapp_messages 
        ORDER BY created_at DESC
      `).all();
    } catch (error) {
      console.error('Get all WhatsApp messages error:', error);
      return [];
    }
  }

  async processPendingWhatsAppMessages(whatsappIntegration) {
    try {
      const pendingMessages = this.getPendingWhatsAppMessages();
      console.log(`📤 Processing ${pendingMessages.length} pending WhatsApp messages...`);

      let processedCount = 0;
      for (const message of pendingMessages) {
        try {
          console.log(`🔄 Processing message for ${message.member_name} (${message.member_phone})`);
          console.log(`📝 Message: ${message.message_content}`);

          // Try to send the message using WhatsApp integration
          let result;
          if (whatsappIntegration) {
            result = await whatsappIntegration.sendMessage(
              message.member_phone,
              message.message_content,
              message.member_name
            );
          } else {
            // Fallback: just open WhatsApp Web
            const { shell } = require('electron');
            const encodedMessage = encodeURIComponent(message.message_content);
            const cleanPhone = message.member_phone.replace(/[^\d+]/g, '');
            const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;

            console.log(`🌐 Opening WhatsApp Web: ${whatsappUrl}`);
            await shell.openExternal(whatsappUrl);
            result = { success: true, method: 'WhatsApp Web (fallback)' };
          }

          if (result.success) {
            // Update status to opened (WhatsApp Web opened, but not yet sent)
            const success = this.updateWhatsAppMessageStatus(
              message.id,
              'opened',
              null,
              null
            );

            if (success) {
              processedCount++;
              console.log(`🌐 WhatsApp Web opened for ${message.member_name} via ${result.method || 'WhatsApp'}`);
            }
          } else {
            // Update status to failed
            this.updateWhatsAppMessageStatus(
              message.id,
              'failed',
              null,
              result.error || 'Failed to send message'
            );
            console.log(`❌ Failed to send message to ${message.member_name}: ${result.error}`);
          }

          // Add delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Error processing message for ${message.member_name}:`, error);
          this.updateWhatsAppMessageStatus(
            message.id,
            'failed',
            null,
            error.message
          );
        }
      }

      return processedCount;
    } catch (error) {
      console.error('Process pending WhatsApp messages error:', error);
      return 0;
    }
  }

  // Expense management methods
  getAllExpenses() {
    try {
      return this.db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
    } catch (error) {
      console.error('Get all expenses error:', error);
      return [];
    }
  }

  getExpenseById(id) {
    try {
      return this.db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    } catch (error) {
      console.error('Get expense by ID error:', error);
      return null;
    }
  }

  createExpense(expenseData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO expenses (id, category, description, amount, date, created_by, receipt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        expenseData.id,
        expenseData.category,
        expenseData.description,
        expenseData.amount,
        expenseData.date,
        expenseData.created_by,
        expenseData.receipt || null
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create expense error:', error);
      return false;
    }
  }

  updateExpense(id, expenseData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE expenses SET
          category = ?, description = ?, amount = ?, date = ?, receipt = ?
        WHERE id = ?
      `);

      const result = stmt.run(
        expenseData.category,
        expenseData.description,
        expenseData.amount,
        expenseData.date,
        expenseData.receipt || null,
        id
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Update expense error:', error);
      return false;
    }
  }

  deleteExpense(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM expenses WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete expense error:', error);
      return false;
    }
  }

  getExpensesByCategory(category) {
    try {
      return this.db.prepare('SELECT * FROM expenses WHERE category = ? ORDER BY date DESC').all(category);
    } catch (error) {
      console.error('Get expenses by category error:', error);
      return [];
    }
  }

  getExpensesByDateRange(startDate, endDate) {
    try {
      return this.db.prepare('SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC').all(startDate, endDate);
    } catch (error) {
      console.error('Get expenses by date range error:', error);
      return [];
    }
  }

  getMonthlyExpenseReport(year, month) {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

      const expenses = this.getExpensesByDateRange(startDate, endDate);

      const categoryTotals = {
        salaries: 0,
        maintenance: 0,
        food: 0,
        other: 0
      };

      expenses.forEach(expense => {
        if (categoryTotals.hasOwnProperty(expense.category)) {
          categoryTotals[expense.category] += expense.amount;
        }
      });

      return {
        year,
        month,
        expenses,
        categoryTotals,
        totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0)
      };
    } catch (error) {
      console.error('Get monthly expense report error:', error);
      return null;
    }
  }

  // Settings management methods
  getSetting(key) {
    try {
      const result = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
      return result ? result.value : null;
    } catch (error) {
      console.error('Get setting error:', error);
      return null;
    }
  }

  setSetting(key, value) {
    try {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      const result = stmt.run(key, value);
      return result.changes > 0;
    } catch (error) {
      console.error('Set setting error:', error);
      return false;
    }
  }

  updateWhatsAppTemplate(messageType, templateContent) {
    try {
      const stmt = this.db.prepare(`
        UPDATE whatsapp_templates SET
          template_content = ?, updated_at = ?
        WHERE message_type = ?
      `);

      const result = stmt.run(templateContent, new Date().toISOString(), messageType);
      return result.changes > 0;
    } catch (error) {
      console.error('Update WhatsApp template error:', error);
      return false;
    }
  }

  createWhatsAppMessage(messageData) {
    try {
      console.log('Creating WhatsApp message:', messageData);

      const stmt = this.db.prepare(`
        INSERT INTO whatsapp_messages (
          id, member_id, member_name, member_phone, message_type, message_content,
          status, scheduled_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        messageData.id,
        messageData.member_id,
        messageData.member_name,
        messageData.member_phone,
        messageData.message_type,
        messageData.message_content,
        messageData.status || 'pending',
        messageData.scheduled_at,
        messageData.created_at
      );

      return { success: result.changes > 0 };
    } catch (error) {
      console.error('Create WhatsApp message error:', error);
      return { success: false, error: error.message };
    }
  }

  // Monthly Transaction Report
  getMonthlyTransactionReport(month, year) {
    try {
      console.log('Getting monthly transaction report for:', { month, year });

      const query = `
        SELECT 
          m.custom_member_id as user_id,
          m.name,
          r.receipt_number as transaction_no,
          COALESCE(r.amount_paid, r.amount) as fees_deposit,
          r.created_at as deposit_date,
          m.subscription_start_date as starting_date,
          m.subscription_end_date as ending_date
        FROM receipts r
        LEFT JOIN members m ON r.member_id = m.id
        WHERE strftime('%m', r.created_at) = ? 
        AND strftime('%Y', r.created_at) = ?
        ORDER BY r.created_at DESC
      `;

      const monthStr = month.toString().padStart(2, '0');
      const yearStr = year.toString();

      const results = this.db.prepare(query).all(monthStr, yearStr);

      console.log(`Found ${results.length} transactions for ${month}/${year}`);

      return {
        success: true,
        data: results.map(row => ({
          userId: row.user_id || 'N/A',
          name: row.name || 'Unknown',
          transactionNo: row.transaction_no || 'N/A',
          feesDeposit: row.fees_deposit || 0,
          depositDate: row.deposit_date ? new Date(row.deposit_date).toLocaleDateString() : 'N/A',
          startingDate: row.starting_date ? new Date(row.starting_date).toLocaleDateString() : 'N/A',
          endingDate: row.ending_date ? new Date(row.ending_date).toLocaleDateString() : 'N/A'
        }))
      };
    } catch (error) {
      console.error('Get monthly transaction report error:', error);
      return { success: false, error: error.message };
    }
  }

  // Master Settings CRUD Operations

  // Package Management
  getAllPackages() {
    try {
      return this.db.prepare('SELECT * FROM master_packages WHERE is_active = 1 ORDER BY duration_months ASC').all();
    } catch (error) {
      console.error('Get all packages error:', error);
      return [];
    }
  }

  createPackage(packageData) {
    try {
      // Validate duration_type
      const validDurationTypes = ['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom'];
      let durationType = packageData.duration_type || 'monthly';
      
      if (!validDurationTypes.includes(durationType)) {
        throw new Error(`Invalid duration_type: ${durationType}. Must be one of: ${validDurationTypes.join(', ')}`);
      }

      // Handle 'custom' duration_type constraint issue
      if (durationType === 'custom') {
        try {
          // First, try to run the migration to update the constraint
          console.log('🔄 Attempting to update database constraint for custom packages...');
          this.migratePackagesConstraint();
          console.log('✅ Database constraint updated successfully');
        } catch (migrationError) {
          console.error('❌ Migration failed:', migrationError);
          // If migration fails, we'll still try to create the package
        }
      }

      const stmt = this.db.prepare(`
        INSERT INTO master_packages (id, name, duration_type, duration_months, price, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        packageData.id ?? null, // force null if undefined
        packageData.name ?? "",
        durationType, // validated duration type
        packageData.duration_months ?? 1, // default to 1 month
        packageData.price ?? 0,
        packageData.is_active ? 1 : 0, // convert boolean to int
        new Date().toISOString() // fine as string
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create package error:', error);
      
      // If it's still a constraint error after migration attempt, provide helpful message
      if (error.code === 'SQLITE_CONSTRAINT_CHECK' && error.message.includes('duration_type')) {
        console.error('❌ Database constraint still not updated. Please restart the application.');
        throw new Error('Database constraint error: Please restart the application and try again. If the problem persists, contact support.');
      }
      
      throw error;
    }
  }

  updatePackage(id, packageData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE master_packages SET 
          name = ?, duration_type = ?, duration_months = ?, price = ?, 
          is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      // const result = stmt.run(
      //   packageData.name,
      //   packageData.duration_type,
      //   packageData.duration_months,
      //   packageData.price,
      //   packageData.is_active !== undefined ? packageData.is_active : 1,
      //   id
      // );
      // Validate duration_type
      const validDurationTypes = ['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom'];
      const durationType = packageData.duration_type || 'monthly';
      
      if (!validDurationTypes.includes(durationType)) {
        throw new Error(`Invalid duration_type: ${durationType}. Must be one of: ${validDurationTypes.join(', ')}`);
      }

      const result = stmt.run(
        packageData.name || "",
        durationType, // validated duration type
        packageData.duration_months ?? 1, // default to 1 month
        packageData.price ?? 0,
        packageData.is_active !== undefined ? packageData.is_active : 1,
        id
      );


      return result.changes > 0;
    } catch (error) {
      console.error('Update package error:', error);
      return false;
    }
  }

  deletePackage(id) {
    try {
      const stmt = this.db.prepare('UPDATE master_packages SET is_active = 0 WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete package error:', error);
      return false;
    }
  }

  // Tax Settings Management
  getAllTaxSettings() {
    try {
      return this.db.prepare('SELECT * FROM master_tax_settings WHERE is_active = 1 ORDER BY tax_type ASC').all();
    } catch (error) {
      console.error('Get all tax settings error:', error);
      return [];
    }
  }

  createTaxSetting(taxData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO master_tax_settings (id, name, tax_type, percentage, is_inclusive, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // const result = stmt.run(
      //   taxData.id,
      //   taxData.name,
      //   taxData.tax_type,
      //   taxData.percentage,
      //   taxData.is_inclusive !== undefined ? taxData.is_inclusive : 0,
      //   taxData.is_active !== undefined ? taxData.is_active : 1,
      //   new Date().toISOString()
      // );

      const result = stmt.run(
        taxData.id,
        String(taxData.name),         // force string
        String(taxData.tax_type),     // force string
        Number(taxData.percentage),   // force number
        taxData.is_inclusive ? 1 : 0, // boolean → 0/1
        taxData.is_active ? 1 : 0,    // boolean → 0/1
        new Date().toISOString()
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create tax setting error:', error);
      return false;
    }
  }

  updateTaxSetting(id, taxData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE master_tax_settings SET 
          name = ?, tax_type = ?, percentage = ?, is_inclusive = ?, 
          is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        String(taxData.name || ""),
        String(taxData.tax_type || ""),
        Number(taxData.percentage || 0),
        taxData.is_inclusive ? 1 : 0,  // Convert boolean to 0/1
        taxData.is_active !== undefined ? (taxData.is_active ? 1 : 0) : 1,  // Convert boolean to 0/1
        id
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Update tax setting error:', error);
      return false;
    }
  }

  deleteTaxSetting(id) {
    try {
      const stmt = this.db.prepare('UPDATE master_tax_settings SET is_active = 0 WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete tax setting error:', error);
      return false;
    }
  }

  // Expense Categories Management
  getAllExpenseCategories() {
    try {
      return this.db.prepare('SELECT * FROM master_expense_categories WHERE is_active = 1 ORDER BY name ASC').all();
    } catch (error) {
      console.error('Get all expense categories error:', error);
      return [];
    }
  }

  createExpenseCategory(categoryData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO master_expense_categories (id, name, description, is_active, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      // const result = stmt.run(
      //   categoryData.id,
      //   categoryData.name,
      //   categoryData.description || null,
      //   categoryData.is_active !== undefined ? categoryData.is_active : 1,
      //   new Date().toISOString()
      // );
      const result = stmt.run(
        categoryData.id,
        String(categoryData.name ?? ""), // Ensure it's always a string
        categoryData.description != null ? String(categoryData.description) : null, // nullable string
        categoryData.is_active !== undefined ? Number(categoryData.is_active) : 1, // force 0/1
        new Date().toISOString() // string date
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create expense category error:', error);
      return false;
    }
  }

  updateExpenseCategory(id, categoryData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE master_expense_categories SET 
          name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        String(categoryData.name || ""),
        categoryData.description ? String(categoryData.description) : null,
        categoryData.is_active !== undefined ? (categoryData.is_active ? 1 : 0) : 1,
        id
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Update expense category error:', error);
      return false;
    }
  }

  deleteExpenseCategory(id) {
    try {
      const stmt = this.db.prepare('UPDATE master_expense_categories SET is_active = 0 WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete expense category error:', error);
      return false;
    }
  }

  // Occupations Management
  getAllOccupations() {
    try {
      return this.db.prepare('SELECT * FROM master_occupations WHERE is_active = 1 ORDER BY name ASC').all();
    } catch (error) {
      console.error('Get all occupations error:', error);
      return [];
    }
  }

  createOccupation(occupationData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO master_occupations (id, name, is_active, created_at)
        VALUES (?, ?, ?, ?)
      `);

      // const result = stmt.run(
      //   occupationData.id,
      //   occupationData.name,
      //   occupationData.is_active !== undefined ? occupationData.is_active : 1,
      //   new Date().toISOString()
      // );
      const result = stmt.run(
        occupationData.id,
        String(occupationData.name ?? ""), // always a string
        occupationData.is_active !== undefined ? Number(occupationData.is_active) : 1, // force 0/1
        new Date().toISOString() // ISO date string
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create occupation error:', error);
      return false;
    }
  }

  updateOccupation(id, occupationData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE master_occupations SET 
          name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        String(occupationData.name || ""),
        occupationData.is_active !== undefined ? (occupationData.is_active ? 1 : 0) : 1,
        id
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Update occupation error:', error);
      return false;
    }
  }

  deleteOccupation(id) {
    try {
      const stmt = this.db.prepare('UPDATE master_occupations SET is_active = 0 WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete occupation error:', error);
      return false;
    }
  }

  // Payment Types Management
  getAllPaymentTypes() {
    try {
      return this.db.prepare('SELECT * FROM master_payment_types WHERE is_active = 1 ORDER BY name ASC').all();
    } catch (error) {
      console.error('Get all payment types error:', error);
      return [];
    }
  }

  createPaymentType(paymentData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO master_payment_types (id, name, display_name, is_active, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      // const result = stmt.run(
      //   paymentData.id,
      //   paymentData.name,
      //   paymentData.display_name,
      //   paymentData.is_active !== undefined ? paymentData.is_active : 1,
      //   new Date().toISOString()
      // );
      const result = stmt.run(
        paymentData.id ?? null,                     // ensure null if undefined
        paymentData.name ?? "",                     // string fallback
        paymentData.display_name ?? "",             // string fallback
        paymentData.is_active ? 1 : 0,              // boolean → int
        new Date().toISOString()                    // string
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create payment type error:', error);
      return false;
    }
  }

  updatePaymentType(id, paymentData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE master_payment_types SET 
          name = ?, display_name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        String(paymentData.name || ""),
        String(paymentData.display_name || ""),
        paymentData.is_active !== undefined ? (paymentData.is_active ? 1 : 0) : 1,
        id
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Update payment type error:', error);
      return false;
    }
  }

  deletePaymentType(id) {
    try {
      const stmt = this.db.prepare('UPDATE master_payment_types SET is_active = 0 WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete payment type error:', error);
      return false;
    }
  }

  // Body Measurement Fields Management
  getAllBodyMeasurementFields() {
    try {
      return this.db.prepare('SELECT * FROM master_body_measurement_fields WHERE is_active = 1 ORDER BY sort_order ASC, field_name ASC').all();
    } catch (error) {
      console.error('Get all body measurement fields error:', error);
      return [];
    }
  }

  createBodyMeasurementField(fieldData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO master_body_measurement_fields 
        (id, field_name, display_name, field_type, unit, is_required, is_active, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // const result = stmt.run(
      //   fieldData.id,
      //   fieldData.field_name,
      //   fieldData.display_name,
      //   fieldData.field_type,
      //   fieldData.unit || null,
      //   fieldData.is_required !== undefined ? fieldData.is_required : 0,
      //   fieldData.is_active !== undefined ? fieldData.is_active : 1,
      //   fieldData.sort_order || 0,
      //   new Date().toISOString()
      // );
      const result = stmt.run(
        fieldData.id,
        String(fieldData.field_name ?? ""),       // always a string
        String(fieldData.display_name ?? ""),     // always a string
        String(fieldData.field_type ?? ""),       // always a string
        fieldData.unit ? String(fieldData.unit) : null, // nullable string
        fieldData.is_required !== undefined ? Number(fieldData.is_required) : 0, // 0/1
        fieldData.is_active !== undefined ? Number(fieldData.is_active) : 1,     // 0/1
        Number(fieldData.sort_order ?? 0),        // always a number
        new Date().toISOString()                  // ISO date
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create body measurement field error:', error);
      return false;
    }
  }

  updateBodyMeasurementField(id, fieldData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE master_body_measurement_fields SET 
          field_name = ?, display_name = ?, field_type = ?, unit = ?, 
          is_required = ?, is_active = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const result = stmt.run(
        String(fieldData.field_name || ""),
        String(fieldData.display_name || ""),
        String(fieldData.field_type || ""),
        fieldData.unit ? String(fieldData.unit) : null,
        fieldData.is_required !== undefined ? (fieldData.is_required ? 1 : 0) : 0,
        fieldData.is_active !== undefined ? (fieldData.is_active ? 1 : 0) : 1,
        Number(fieldData.sort_order || 0),
        id
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Update body measurement field error:', error);
      return false;
    }
  }

  deleteBodyMeasurementField(id) {
    try {
      const stmt = this.db.prepare('UPDATE master_body_measurement_fields SET is_active = 0 WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete body measurement field error:', error);
      return false;
    }
  }

  // Receipt Tax Mapping Operations
  createReceiptTaxMapping(taxMappingData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO receipt_tax_mapping (
          id, receipt_id, tax_setting_id, tax_name, tax_type, tax_percentage,
          is_inclusive, base_amount, tax_amount, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        taxMappingData.id,
        taxMappingData.receipt_id,
        taxMappingData.tax_setting_id,
        taxMappingData.tax_name,
        taxMappingData.tax_type,
        taxMappingData.tax_percentage,
        taxMappingData.is_inclusive ? 1 : 0,
        taxMappingData.base_amount,
        taxMappingData.tax_amount,
        taxMappingData.created_at || new Date().toISOString()
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Create receipt tax mapping error:', error);
      return false;
    }
  }

  getReceiptTaxMappings(receiptId) {
    try {
      return this.db.prepare(`
        SELECT * FROM receipt_tax_mapping 
        WHERE receipt_id = ? 
        ORDER BY tax_type ASC
      `).all(receiptId);
    } catch (error) {
      console.error('Get receipt tax mappings error:', error);
      return [];
    }
  }

  deleteReceiptTaxMappings(receiptId) {
    try {
      const stmt = this.db.prepare('DELETE FROM receipt_tax_mapping WHERE receipt_id = ?');
      const result = stmt.run(receiptId);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete receipt tax mappings error:', error);
      return false;
    }
  }

  // Save receipt with tax mappings
  createReceiptWithTaxes(receiptData, taxMappings = []) {
    try {
      console.log('Creating receipt with taxes:', {
        receiptNumber: receiptData.receipt_number,
        taxMappingsCount: taxMappings.length
      });

      // Start a transaction
      const transaction = this.db.transaction(() => {
        // Create the receipt
        const receiptCreated = this.createReceipt(receiptData);
        if (!receiptCreated) {
          throw new Error('Failed to create receipt');
        }

        // Create tax mappings
        let taxMappingsCreated = 0;
        for (const taxMapping of taxMappings) {
          const mappingData = {
            id: this.generateId(),
            receipt_id: receiptData.id,
            tax_setting_id: taxMapping.tax_setting_id,
            tax_name: taxMapping.tax_name,
            tax_type: taxMapping.tax_type,
            tax_percentage: taxMapping.tax_percentage,
            is_inclusive: taxMapping.is_inclusive,
            base_amount: taxMapping.base_amount,
            tax_amount: taxMapping.tax_amount,
            created_at: new Date().toISOString()
          };

          if (this.createReceiptTaxMapping(mappingData)) {
            taxMappingsCreated++;
          }
        }

        console.log(`Created ${taxMappingsCreated} tax mappings for receipt ${receiptData.receipt_number}`);
        return { receiptCreated: true, taxMappingsCreated };
      });

      return transaction();
    } catch (error) {
      console.error('Create receipt with taxes error:', error);
      return { receiptCreated: false, taxMappingsCreated: 0, error: error.message };
    }
  }

  // Update receipt with tax mappings
  updateReceiptWithTaxes(receiptId, receiptData, taxMappings = []) {
    try {
      console.log('Updating receipt with taxes:', {
        receiptId,
        taxMappingsCount: taxMappings.length
      });

      // Start a transaction
      const transaction = this.db.transaction(() => {
        // Update the receipt
        const receiptUpdated = this.updateReceipt(receiptId, receiptData);
        if (!receiptUpdated) {
          throw new Error('Failed to update receipt');
        }

        // Delete existing tax mappings
        this.deleteReceiptTaxMappings(receiptId);

        // Create new tax mappings
        let taxMappingsCreated = 0;
        for (const taxMapping of taxMappings) {
          const mappingData = {
            id: this.generateId(),
            receipt_id: receiptId,
            tax_setting_id: taxMapping.tax_setting_id,
            tax_name: taxMapping.tax_name,
            tax_type: taxMapping.tax_type,
            tax_percentage: taxMapping.tax_percentage,
            is_inclusive: taxMapping.is_inclusive,
            base_amount: taxMapping.base_amount,
            tax_amount: taxMapping.tax_amount,
            created_at: new Date().toISOString()
          };

          if (this.createReceiptTaxMapping(mappingData)) {
            taxMappingsCreated++;
          }
        }

        console.log(`Updated receipt with ${taxMappingsCreated} tax mappings`);
        return { receiptUpdated: true, taxMappingsCreated };
      });

      return transaction();
    } catch (error) {
      console.error('Update receipt with taxes error:', error);
      return { receiptUpdated: false, taxMappingsCreated: 0, error: error.message };
    }
  }

  // Get receipt with tax details
  getReceiptWithTaxes(receiptId) {
    try {
      // Get the receipt
      const receipt = this.db.prepare('SELECT * FROM receipts WHERE id = ?').get(receiptId);
      if (!receipt) {
        return null;
      }

      // Get tax mappings
      const taxMappings = this.getReceiptTaxMappings(receiptId);

      return {
        ...receipt,
        tax_mappings: taxMappings
      };
    } catch (error) {
      console.error('Get receipt with taxes error:', error);
      return null;
    }
  }

  // Tax reporting methods
  getTaxCollectionReport(startDate, endDate, taxType = null) {
    try {
      let query = `
        SELECT 
          rtm.tax_type,
          rtm.tax_name,
          rtm.tax_percentage,
          SUM(rtm.tax_amount) as total_tax_collected,
          SUM(rtm.base_amount) as total_base_amount,
          COUNT(DISTINCT rtm.receipt_id) as receipt_count,
          rtm.is_inclusive
        FROM receipt_tax_mapping rtm
        JOIN receipts r ON rtm.receipt_id = r.id
        WHERE r.created_at BETWEEN ? AND ?
      `;

      const params = [startDate, endDate];

      if (taxType) {
        query += ' AND rtm.tax_type = ?';
        params.push(taxType);
      }

      query += `
        GROUP BY rtm.tax_type, rtm.tax_name, rtm.tax_percentage, rtm.is_inclusive
        ORDER BY rtm.tax_type ASC, rtm.tax_percentage ASC
      `;

      return this.db.prepare(query).all(...params);
    } catch (error) {
      console.error('Get tax collection report error:', error);
      return [];
    }
  }

  getMonthlyTaxReport(year, month) {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

      return this.getTaxCollectionReport(startDate, endDate);
    } catch (error) {
      console.error('Get monthly tax report error:', error);
      return [];
    }
  }

  // Save partial member (basic information only)
  savePartialMember(memberData) {
    try {
      console.log('🔵 DATABASE: Saving partial member:', memberData);
      
      // Check if database is initialized
      if (!this.db) {
        console.log('🔴 DATABASE: Database not initialized');
        throw new Error('Database not initialized');
      }

      // Generate member ID if not provided
      if (!memberData.customMemberId) {
        memberData.customMemberId = this.generateMemberNumber();
        console.log('🔵 DATABASE: Generated member ID:', memberData.customMemberId);
      }

      // Check if member ID is already taken
      if (this.isMemberNumberTaken(memberData.customMemberId)) {
        console.log('🔴 DATABASE: Member ID already taken:', memberData.customMemberId);
        throw new Error(`Member ID ${memberData.customMemberId} is already taken`);
      }

      // Validate required fields for partial member
      const requiredFields = ['name', 'mobileNo', 'email', 'occupation', 'sex', 'dateOfBirth', 'address'];
      console.log('🔵 DATABASE: Validating required fields:', requiredFields);
      for (const field of requiredFields) {
        if (!memberData[field]) {
          console.log(`🔴 DATABASE: Missing required field: ${field} (value: ${memberData[field]})`);
          throw new Error(`Required field missing: ${field}`);
        }
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberData.email)) {
        console.log('🔴 DATABASE: Invalid email format:', memberData.email);
        throw new Error('Invalid email format');
      }
      
      // Validate mobile number format
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(memberData.mobileNo)) {
        console.log('🔴 DATABASE: Invalid mobile number format:', memberData.mobileNo);
        throw new Error('Mobile number must be exactly 10 digits');
      }
      
      console.log('🔵 DATABASE: All required fields present and valid');

      const memberId = this.generateId();
      const now = new Date().toISOString();

      // Parse services array if it's a string
      let servicesJson = '[]';
      if (memberData.services) {
        servicesJson = Array.isArray(memberData.services)
          ? JSON.stringify(memberData.services)
          : memberData.services;
      }

      const stmt = this.db.prepare(`
        INSERT INTO members (
          id, custom_member_id, name, email, address, telephone_no, mobile_no, 
          occupation, marital_status, anniversary_date, blood_group, sex, 
          date_of_birth, alternate_no, member_image, id_proof_image, 
          date_of_registration, services, medical_issues, goals, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Ensure dates are properly formatted as strings
      const dateOfBirth = memberData.dateOfBirth instanceof Date 
        ? memberData.dateOfBirth.toISOString().split('T')[0] 
        : memberData.dateOfBirth;
      
      const dateOfRegistration = memberData.dateOfRegistration instanceof Date 
        ? memberData.dateOfRegistration.toISOString().split('T')[0] 
        : memberData.dateOfRegistration;
      
      const anniversaryDate = memberData.anniversaryDate 
        ? (memberData.anniversaryDate instanceof Date 
          ? memberData.anniversaryDate.toISOString().split('T')[0] 
          : memberData.anniversaryDate)
        : null;

      console.log('🔵 DATABASE: Formatted dates:', {
        dateOfBirth,
        dateOfRegistration,
        anniversaryDate
      });

      const result = stmt.run(
        memberId,
        memberData.customMemberId,
        memberData.name,
        memberData.email,
        memberData.address,
        memberData.telephoneNo || null,
        memberData.mobileNo,
        memberData.occupation,
        memberData.maritalStatus || 'unmarried',
        anniversaryDate,
        memberData.bloodGroup || null,
        memberData.sex,
        dateOfBirth,
        memberData.alternateNo || null,
        memberData.memberImage || null,
        memberData.idProofImage || null,
        dateOfRegistration,
        servicesJson,
        memberData.medicalIssues || null,
        memberData.goals || null,
        'partial',
        now
      );

      console.log('🔵 DATABASE: Insert result:', result);
      if (result.changes > 0) {
        console.log(`✅ DATABASE: Partial member saved successfully: ${memberData.name} (ID: ${memberData.customMemberId})`);
        return {
          success: true,
          data: {
            id: memberId,
            customMemberId: memberData.customMemberId,
            name: memberData.name
          }
        };
      } else {
        console.log('🔴 DATABASE: No changes made during insert');
        throw new Error('Failed to save partial member');
      }
    } catch (error) {
      console.error('🔴 DATABASE: Save partial member error:', error);
      return { success: false, error: error.message };
    }
  }

  // Enquiry operations
  getAllEnquiries() {
    try {
      return this.db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get enquiries error:', error);
      return [];
    }
  }

  getEnquiryById(id) {
    try {
      return this.db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id);
    } catch (error) {
      console.error('Get enquiry error:', error);
      return null;
    }
  }

  createEnquiry(enquiryData) {
    try {
      console.log('Creating enquiry:', enquiryData);

      // Validate required fields
      const validatedData = {
        id: enquiryData.id || this.generateId(),
        enquiry_number: enquiryData.enquiry_number || enquiryData.enquiryNumber || this.generateEnquiryNumber(),
        name: enquiryData.name || 'Unknown',
        address: enquiryData.address || 'Not specified',
        telephone_no: enquiryData.telephone_no || enquiryData.telephoneNo || null,
        mobile_no: enquiryData.mobile_no || enquiryData.mobileNo || '0000000000',
        occupation: enquiryData.occupation || 'Not specified',
        sex: enquiryData.sex || 'male',
        ref_person_name: enquiryData.ref_person_name || enquiryData.refPersonName || null,
        date_of_enquiry: enquiryData.date_of_enquiry || enquiryData.dateOfEnquiry || new Date().toISOString().split('T')[0],
        interested_in: Array.isArray(enquiryData.interested_in) ? JSON.stringify(enquiryData.interested_in) : 
                      Array.isArray(enquiryData.interestedIn) ? JSON.stringify(enquiryData.interestedIn) : 
                      (enquiryData.interested_in || enquiryData.interestedIn || '["gym"]'),
        membership_fees: enquiryData.membership_fees || enquiryData.membershipFees || 0,
        payment_mode: enquiryData.payment_mode || enquiryData.paymentMode || 'cash',
        payment_frequency: enquiryData.payment_frequency || enquiryData.paymentFrequency || 'yearly',
        status: enquiryData.status || 'new',
        notes: enquiryData.notes || null,
        follow_up_date: enquiryData.follow_up_date || enquiryData.followUpDate || null,
        converted_to_member_id: enquiryData.converted_to_member_id || enquiryData.convertedToMemberId || null,
        created_at: enquiryData.created_at || enquiryData.createdAt || new Date().toISOString(),
        created_by: enquiryData.created_by || enquiryData.createdBy || 'system'
      };

      const stmt = this.db.prepare(`
        INSERT INTO enquiries (
          id, enquiry_number, name, address, telephone_no, mobile_no, occupation,
          sex, ref_person_name, date_of_enquiry, interested_in, membership_fees,
          payment_mode, payment_frequency, status, notes, follow_up_date,
          converted_to_member_id, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        validatedData.id,
        validatedData.enquiry_number,
        validatedData.name,
        validatedData.address,
        validatedData.telephone_no,
        validatedData.mobile_no,
        validatedData.occupation,
        validatedData.sex,
        validatedData.ref_person_name,
        validatedData.date_of_enquiry,
        validatedData.interested_in,
        validatedData.membership_fees,
        validatedData.payment_mode,
        validatedData.payment_frequency,
        validatedData.status,
        validatedData.notes,
        validatedData.follow_up_date,
        validatedData.converted_to_member_id,
        validatedData.created_at,
        validatedData.created_by
      );

      if (result.changes > 0) {
        console.log(`✅ Enquiry created successfully: ${validatedData.name} (${validatedData.enquiry_number})`);
        return true;
      } else {
        throw new Error('Failed to create enquiry');
      }
    } catch (error) {
      console.error('Create enquiry error:', error);
      return false;
    }
  }

  updateEnquiry(id, enquiryData) {
    try {
      console.log('Updating enquiry:', id, enquiryData);

      // Build update query dynamically based on provided fields
      const updateFields = [];
      const values = [];

      if (enquiryData.name !== undefined) {
        updateFields.push('name = ?');
        values.push(enquiryData.name);
      }
      if (enquiryData.address !== undefined) {
        updateFields.push('address = ?');
        values.push(enquiryData.address);
      }
      if (enquiryData.telephone_no !== undefined || enquiryData.telephoneNo !== undefined) {
        updateFields.push('telephone_no = ?');
        values.push(enquiryData.telephone_no || enquiryData.telephoneNo);
      }
      if (enquiryData.mobile_no !== undefined || enquiryData.mobileNo !== undefined) {
        updateFields.push('mobile_no = ?');
        values.push(enquiryData.mobile_no || enquiryData.mobileNo);
      }
      if (enquiryData.occupation !== undefined) {
        updateFields.push('occupation = ?');
        values.push(enquiryData.occupation);
      }
      if (enquiryData.sex !== undefined) {
        updateFields.push('sex = ?');
        values.push(enquiryData.sex);
      }
      if (enquiryData.ref_person_name !== undefined || enquiryData.refPersonName !== undefined) {
        updateFields.push('ref_person_name = ?');
        values.push(enquiryData.ref_person_name || enquiryData.refPersonName);
      }
      if (enquiryData.interested_in !== undefined || enquiryData.interestedIn !== undefined) {
        updateFields.push('interested_in = ?');
        const interestedIn = enquiryData.interested_in || enquiryData.interestedIn;
        values.push(Array.isArray(interestedIn) ? JSON.stringify(interestedIn) : interestedIn);
      }
      if (enquiryData.membership_fees !== undefined || enquiryData.membershipFees !== undefined) {
        updateFields.push('membership_fees = ?');
        values.push(enquiryData.membership_fees || enquiryData.membershipFees);
      }
      if (enquiryData.payment_mode !== undefined || enquiryData.paymentMode !== undefined) {
        updateFields.push('payment_mode = ?');
        values.push(enquiryData.payment_mode || enquiryData.paymentMode);
      }
      if (enquiryData.payment_frequency !== undefined || enquiryData.paymentFrequency !== undefined) {
        updateFields.push('payment_frequency = ?');
        values.push(enquiryData.payment_frequency || enquiryData.paymentFrequency);
      }
      if (enquiryData.status !== undefined) {
        updateFields.push('status = ?');
        values.push(enquiryData.status);
      }
      if (enquiryData.notes !== undefined) {
        updateFields.push('notes = ?');
        values.push(enquiryData.notes);
      }
      if (enquiryData.follow_up_date !== undefined || enquiryData.followUpDate !== undefined) {
        updateFields.push('follow_up_date = ?');
        values.push(enquiryData.follow_up_date || enquiryData.followUpDate);
      }
      if (enquiryData.converted_to_member_id !== undefined || enquiryData.convertedToMemberId !== undefined) {
        updateFields.push('converted_to_member_id = ?');
        values.push(enquiryData.converted_to_member_id || enquiryData.convertedToMemberId);
      }

      if (updateFields.length === 0) {
        console.log('No fields to update');
        return true;
      }

      // Add updated_at field
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE enquiries SET ${updateFields.join(', ')} WHERE id = ?
      `);

      const result = stmt.run(...values);
      return result.changes > 0;
    } catch (error) {
      console.error('Update enquiry error:', error);
      return false;
    }
  }

  deleteEnquiry(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM enquiries WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete enquiry error:', error);
      return false;
    }
  }

  convertEnquiryToMember(enquiryId, memberData) {
    try {
      console.log('Converting enquiry to member:', enquiryId, memberData);

      // Get the enquiry
      const enquiry = this.getEnquiryById(enquiryId);
      if (!enquiry) {
        return { success: false, error: 'Enquiry not found' };
      }

      // Create member from enquiry data
      const memberId = memberData.id || this.generateId();
      const memberToCreate = {
        id: memberId,
        customMemberId: memberData.customMemberId || this.generateMemberNumber(),
        name: enquiry.name,
        address: enquiry.address,
        telephoneNo: enquiry.telephone_no,
        mobileNo: enquiry.mobile_no,
        occupation: enquiry.occupation,
        sex: enquiry.sex,
        email: memberData.email || 'noemail@example.com',
        dateOfBirth: memberData.dateOfBirth || '1990-01-01',
        dateOfRegistration: new Date().toISOString().split('T')[0],
        paymentMode: enquiry.payment_mode,
        planType: memberData.planType || 'monthly',
        services: Array.isArray(enquiry.interested_in) ? enquiry.interested_in : JSON.parse(enquiry.interested_in || '["gym"]'),
        membershipFees: enquiry.membership_fees || 0,
        registrationFee: memberData.registrationFee || 0,
        packageFee: memberData.packageFee || enquiry.membership_fees || 0,
        discount: memberData.discount || 0,
        paidAmount: memberData.paidAmount || 0,
        subscriptionStartDate: memberData.subscriptionStartDate || new Date().toISOString().split('T')[0],
        subscriptionEndDate: memberData.subscriptionEndDate || this.calculateSubscriptionEndDate(memberData.subscriptionStartDate || new Date().toISOString().split('T')[0], memberData.planType || 'monthly'),
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // Create the member
      const memberCreated = this.createMember(memberToCreate);
      if (!memberCreated) {
        return { success: false, error: 'Failed to create member' };
      }

      // Update enquiry status to converted
      const enquiryUpdated = this.updateEnquiry(enquiryId, {
        status: 'converted',
        converted_to_member_id: memberId
      });

      if (enquiryUpdated) {
        console.log(`✅ Enquiry ${enquiry.enquiry_number} converted to member ${memberToCreate.customMemberId}`);
        return { success: true, memberId: memberId };
      } else {
        return { success: false, error: 'Failed to update enquiry status' };
      }
    } catch (error) {
      console.error('Convert enquiry to member error:', error);
      return { success: false, error: error.message };
    }
  }

  generateEnquiryNumber() {
    try {
      // Get current counter
      const counterResult = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('enquiry_counter');
      let counter = counterResult ? parseInt(counterResult.value) : 0;
      
      // Increment counter
      counter++;
      
      // Update counter in database
      this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('enquiry_counter', counter.toString());
      
      // Format as ENQ001, ENQ002, etc.
      return `ENQ${counter.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Generate enquiry number error:', error);
      return `ENQ${Date.now()}`;
    }
  }

  // Attendance operations
  getAllAttendance() {
    try {
      return this.db.prepare('SELECT * FROM attendance ORDER BY check_in DESC').all();
    } catch (error) {
      console.error('Get attendance error:', error);
      return [];
    }
  }

  createAttendance(attendanceData) {
    try {
      console.log('Creating attendance:', attendanceData);

      // Ensure all required fields are present with defaults
      const safeAttendanceData = {
        id: attendanceData.id,
        member_id: attendanceData.member_id,
        custom_member_id: attendanceData.custom_member_id || null,
        member_name: attendanceData.member_name,
        check_in: attendanceData.check_in,
        check_out: attendanceData.check_out || null,
        date: attendanceData.date,
        profile_image: attendanceData.profile_image || null
      };

      const stmt = this.db.prepare(`
        INSERT INTO attendance (id, member_id, custom_member_id, member_name, check_in, check_out, date, profile_image)
        VALUES (@id, @member_id, @custom_member_id, @member_name, @check_in, @check_out, @date, @profile_image)
      `);

      const result = stmt.run(safeAttendanceData);
      console.log('Database: Attendance created, changes:', result.changes);
      return result.changes > 0;
    } catch (error) {
      console.error('Create attendance error:', error);
      return false;
    }
  }

  updateAttendance(id, attendanceData) {
    try {
      // Updates an attendance record with a check-out time
      const stmt = this.db.prepare('UPDATE attendance SET check_out = @check_out WHERE id = @id');
      const result = stmt.run({ ...attendanceData, id });
      return result.changes > 0;
    } catch (error) {
      console.error('Update attendance error:', error);
      return false;
    }
  }

  // Staff attendance operations
  getAllStaffAttendance() {
    try {
      return this.db.prepare('SELECT * FROM staff_attendance ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get staff attendance error:', error);
      return [];
    }
  }

  createStaffAttendance(attendanceData) {
    try {
      console.log('Creating staff attendance:', attendanceData);

      const stmt = this.db.prepare(`
        INSERT INTO staff_attendance (id, staff_id, staff_name, check_in, check_out, date, profile_image, role, shift)
        VALUES (@id, @staff_id, @staff_name, @check_in, @check_out, @date, @profile_image, @role, @shift)
      `);
      const result = stmt.run(attendanceData);
      console.log('Database: Staff attendance created, changes:', result.changes);
      return result.changes > 0;
    } catch (error) {
      console.error('Create staff attendance error:', error);
      return false;
    }
  }

  updateStaffAttendance(id, attendanceData) {
    try {
      // Updates a staff attendance record with a check-out time
      const stmt = this.db.prepare('UPDATE staff_attendance SET check_out = @check_out WHERE id = @id');
      const result = stmt.run({ ...attendanceData, id });
      return result.changes > 0;
    } catch (error) {
      console.error('Update staff attendance error:', error);
      return false;
    }
  }

  // Body measurement operations
  createBodyMeasurement(measurementData) {
    try {
      console.log('Creating body measurement:', measurementData);

      const validatedData = {
        id: measurementData.id || this.generateId(),
        member_id: measurementData.member_id || measurementData.memberId,
        custom_member_id: measurementData.custom_member_id || measurementData.customMemberId,
        member_name: measurementData.member_name || measurementData.memberName || 'Unknown',
        serial_number: measurementData.serial_number || measurementData.serialNumber || null,
        measurement_date: measurementData.measurement_date || measurementData.measurementDate || new Date().toISOString().split('T')[0],
        weight: measurementData.weight || null,
        height: measurementData.height || null,
        age: measurementData.age || null,
        neck: measurementData.neck || null,
        chest: measurementData.chest || null,
        arms: measurementData.arms || null,
        fore_arms: measurementData.fore_arms || measurementData.foreArms || null,
        wrist: measurementData.wrist || null,
        tummy: measurementData.tummy || null,
        waist: measurementData.waist || null,
        hips: measurementData.hips || null,
        thighs: measurementData.thighs || null,
        calf: measurementData.calf || null,
        fat_percentage: measurementData.fat_percentage || measurementData.fatPercentage || null,
        bmi: measurementData.bmi || null,
        bmr: measurementData.bmr || null,
        vf: measurementData.vf || null,
        notes: measurementData.notes || null,
        created_at: measurementData.created_at || measurementData.createdAt || new Date().toISOString(),
        recorded_by: measurementData.recorded_by || measurementData.recordedBy || 'system'
      };

      const stmt = this.db.prepare(`
        INSERT INTO body_measurements (
          id, member_id, custom_member_id, member_name, serial_number, measurement_date,
          weight, height, age, neck, chest, arms, fore_arms, wrist, tummy, waist,
          hips, thighs, calf, fat_percentage, bmi, bmr, vf, notes, created_at, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        validatedData.id,
        validatedData.member_id,
        validatedData.custom_member_id,
        validatedData.member_name,
        validatedData.serial_number,
        validatedData.measurement_date,
        validatedData.weight,
        validatedData.height,
        validatedData.age,
        validatedData.neck,
        validatedData.chest,
        validatedData.arms,
        validatedData.fore_arms,
        validatedData.wrist,
        validatedData.tummy,
        validatedData.waist,
        validatedData.hips,
        validatedData.thighs,
        validatedData.calf,
        validatedData.fat_percentage,
        validatedData.bmi,
        validatedData.bmr,
        validatedData.vf,
        validatedData.notes,
        validatedData.created_at,
        validatedData.recorded_by
      );

      if (result.changes > 0) {
        console.log(`✅ Body measurement created successfully for: ${validatedData.member_name}`);
        return true;
      } else {
        throw new Error('Failed to create body measurement');
      }
    } catch (error) {
      console.error('Create body measurement error:', error);
      return false;
    }
  }

  getAllBodyMeasurements() {
    try {
      return this.db.prepare('SELECT * FROM body_measurements ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get body measurements error:', error);
      return [];
    }
  }

  getBodyMeasurementsByMember(memberId) {
    try {
      return this.db.prepare('SELECT * FROM body_measurements WHERE member_id = ? OR custom_member_id = ? ORDER BY created_at DESC').all(memberId, memberId);
    } catch (error) {
      console.error('Get body measurements by member error:', error);
      return [];
    }
  }

  updateBodyMeasurement(id, measurementData) {
    try {
      console.log('Updating body measurement:', id, measurementData);

      // Build update query dynamically based on provided fields
      const updateFields = [];
      const values = [];

      if (measurementData.weight !== undefined) {
        updateFields.push('weight = ?');
        values.push(measurementData.weight);
      }
      if (measurementData.height !== undefined) {
        updateFields.push('height = ?');
        values.push(measurementData.height);
      }
      if (measurementData.age !== undefined) {
        updateFields.push('age = ?');
        values.push(measurementData.age);
      }
      if (measurementData.neck !== undefined) {
        updateFields.push('neck = ?');
        values.push(measurementData.neck);
      }
      if (measurementData.chest !== undefined) {
        updateFields.push('chest = ?');
        values.push(measurementData.chest);
      }
      if (measurementData.arms !== undefined) {
        updateFields.push('arms = ?');
        values.push(measurementData.arms);
      }
      if (measurementData.fore_arms !== undefined || measurementData.foreArms !== undefined) {
        updateFields.push('fore_arms = ?');
        values.push(measurementData.fore_arms || measurementData.foreArms);
      }
      if (measurementData.wrist !== undefined) {
        updateFields.push('wrist = ?');
        values.push(measurementData.wrist);
      }
      if (measurementData.tummy !== undefined) {
        updateFields.push('tummy = ?');
        values.push(measurementData.tummy);
      }
      if (measurementData.waist !== undefined) {
        updateFields.push('waist = ?');
        values.push(measurementData.waist);
      }
      if (measurementData.hips !== undefined) {
        updateFields.push('hips = ?');
        values.push(measurementData.hips);
      }
      if (measurementData.thighs !== undefined) {
        updateFields.push('thighs = ?');
        values.push(measurementData.thighs);
      }
      if (measurementData.calf !== undefined) {
        updateFields.push('calf = ?');
        values.push(measurementData.calf);
      }
      if (measurementData.fat_percentage !== undefined || measurementData.fatPercentage !== undefined) {
        updateFields.push('fat_percentage = ?');
        values.push(measurementData.fat_percentage || measurementData.fatPercentage);
      }
      if (measurementData.bmi !== undefined) {
        updateFields.push('bmi = ?');
        values.push(measurementData.bmi);
      }
      if (measurementData.bmr !== undefined) {
        updateFields.push('bmr = ?');
        values.push(measurementData.bmr);
      }
      if (measurementData.vf !== undefined) {
        updateFields.push('vf = ?');
        values.push(measurementData.vf);
      }
      if (measurementData.notes !== undefined) {
        updateFields.push('notes = ?');
        values.push(measurementData.notes);
      }

      if (updateFields.length === 0) {
        console.log('No fields to update');
        return true;
      }

      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE body_measurements SET ${updateFields.join(', ')} WHERE id = ?
      `);

      const result = stmt.run(...values);
      return result.changes > 0;
    } catch (error) {
      console.error('Update body measurement error:', error);
      return false;
    }
  }

  deleteBodyMeasurement(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM body_measurements WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete body measurement error:', error);
      return false;
    }
  }

  // Staff operations
  getAllStaff() {
    try {
      return this.db.prepare('SELECT * FROM staff ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get staff error:', error);
      return [];
    }
  }

  getStaffById(id) {
    try {
      return this.db.prepare('SELECT * FROM staff WHERE id = ?').get(id);
    } catch (error) {
      console.error('Get staff error:', error);
      return null;
    }
  }

  createStaff(staffData) {
    try {
      console.log('Database.cjs - Creating staff with data:', JSON.stringify(staffData, null, 2));

      // Validate required fields
      if (!staffData.id) {
        console.error('Missing required field: id');
        return false;
      }
      if (!staffData.name) {
        console.error('Missing required field: name');
        return false;
      }
      if (!staffData.phone) {
        console.error('Missing required field: phone');
        return false;
      }
      if (!staffData.joining_date) {
        console.error('Missing required field: joining_date');
        return false;
      }
      if (!staffData.role) {
        console.error('Missing required field: role');
        return false;
      }
      if (staffData.salary === undefined || staffData.salary === null) {
        console.error('Missing required field: salary');
        return false;
      }
      if (!staffData.status) {
        console.error('Missing required field: status');
        return false;
      }
      if (!staffData.created_at) {
        console.error('Missing required field: created_at');
        return false;
      }

      const stmt = this.db.prepare(`
        INSERT INTO staff (
          id, name, email, phone, address, emergency_contact, emergency_phone,
          date_of_birth, joining_date, role, salary, status, profile_image, 
          id_card_image, specialization, shift, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      console.log('Database.cjs - Executing insert with values:', [
        staffData.id,
        staffData.name,
        staffData.email,
        staffData.phone,
        staffData.address,
        staffData.emergency_contact,
        staffData.emergency_phone,
        staffData.date_of_birth,
        staffData.joining_date,
        staffData.role,
        staffData.salary,
        staffData.status,
        staffData.profile_image,
        staffData.id_card_image,
        staffData.specialization,
        staffData.shift,
        staffData.created_at
      ]);

      const result = stmt.run(
        staffData.id,
        staffData.name,
        staffData.email,
        staffData.phone,
        staffData.address,
        staffData.emergency_contact,
        staffData.emergency_phone,
        staffData.date_of_birth,
        staffData.joining_date,
        staffData.role,
        staffData.salary,
        staffData.status,
        staffData.profile_image,
        staffData.id_card_image,
        staffData.specialization,
        staffData.shift,
        staffData.created_at
      );

      console.log('Database.cjs - Insert result:', result);

      if (result.changes > 0) {
        console.log(`✅ Staff created successfully: ${staffData.name}`);
        return true;
      } else {
        console.error('❌ Staff creation failed - no changes made');
        return false;
      }
    } catch (error) {
      console.error('Create staff error:', error);
      return false;
    }
  }

  updateStaff(id, staffData) {
    try {
      console.log('Updating staff:', id, staffData);

      // Build update query dynamically based on provided fields
      const updateFields = [];
      const values = [];

      if (staffData.name !== undefined) {
        updateFields.push('name = ?');
        values.push(staffData.name);
      }
      if (staffData.email !== undefined) {
        updateFields.push('email = ?');
        values.push(staffData.email);
      }
      if (staffData.phone !== undefined) {
        updateFields.push('phone = ?');
        values.push(staffData.phone);
      }
      if (staffData.address !== undefined) {
        updateFields.push('address = ?');
        values.push(staffData.address);
      }
      if (staffData.emergency_contact !== undefined) {
        updateFields.push('emergency_contact = ?');
        values.push(staffData.emergency_contact);
      }
      if (staffData.emergency_phone !== undefined) {
        updateFields.push('emergency_phone = ?');
        values.push(staffData.emergency_phone);
      }
      if (staffData.date_of_birth !== undefined) {
        updateFields.push('date_of_birth = ?');
        values.push(staffData.date_of_birth);
      }
      if (staffData.joining_date !== undefined) {
        updateFields.push('joining_date = ?');
        values.push(staffData.joining_date);
      }
      if (staffData.role !== undefined) {
        updateFields.push('role = ?');
        values.push(staffData.role);
      }
      if (staffData.salary !== undefined) {
        updateFields.push('salary = ?');
        values.push(staffData.salary);
      }
      if (staffData.status !== undefined) {
        updateFields.push('status = ?');
        values.push(staffData.status);
      }
      if (staffData.profile_image !== undefined) {
        updateFields.push('profile_image = ?');
        values.push(staffData.profile_image);
      }
      if (staffData.id_card_image !== undefined) {
        updateFields.push('id_card_image = ?');
        values.push(staffData.id_card_image);
      }
      if (staffData.specialization !== undefined) {
        updateFields.push('specialization = ?');
        values.push(staffData.specialization);
      }
      if (staffData.shift !== undefined) {
        updateFields.push('shift = ?');
        values.push(staffData.shift);
      }

      if (updateFields.length === 0) {
        console.log('No fields to update');
        return true;
      }

      // Add updated_at field
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE staff SET ${updateFields.join(', ')} WHERE id = ?
      `);

      const result = stmt.run(...values);
      return result.changes > 0;
    } catch (error) {
      console.error('Update staff error:', error);
      return false;
    }
  }

  deleteStaff(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM staff WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete staff error:', error);
      return false;
    }
  }

  // Receipt operations
  getAllReceipts() {
    try {
      return this.db.prepare('SELECT * FROM receipts ORDER BY created_at DESC').all();
    } catch (error) {
      console.error('Get receipts error:', error);
      return [];
    }
  }

  getMemberReceipts() {
    try {
      return this.db.prepare(`
        SELECT * FROM receipts 
        WHERE receipt_category IS NULL OR receipt_category = 'member'
        ORDER BY created_at DESC
      `).all();
    } catch (error) {
      console.error('Get member receipts error:', error);
      return [];
    }
  }

  getReceiptsByMemberId(memberId) {
    try {
      return this.db.prepare('SELECT * FROM receipts WHERE member_id = ? ORDER BY created_at DESC').all(memberId);
    } catch (error) {
      console.error('Get receipts by member error:', error);
      return [];
    }
  }

  getMemberReceiptHistory(memberId) {
    try {
      return this.db.prepare(`
        SELECT * FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
        ORDER BY created_at DESC
      `).all(memberId);
    } catch (error) {
      console.error('Get member receipt history error:', error);
      return [];
    }
  }

  createReceipt(receiptData) {
    try {
      console.log('Creating receipt:', receiptData);

      const stmt = this.db.prepare(`
        INSERT INTO receipts (
          id, receipt_number, invoice_id, member_id, member_name, amount, amount_paid, due_amount,
          payment_type, description, receipt_category, transaction_type, custom_member_id,
          subscription_start_date, subscription_end_date, plan_type, payment_mode, mobile_no,
          email, package_fee, registration_fee, discount, cgst, sigst, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        receiptData.id,
        receiptData.receipt_number,
        receiptData.invoice_id || null,
        receiptData.member_id,
        receiptData.member_name,
        receiptData.amount,
        receiptData.amount_paid || receiptData.amount,
        receiptData.due_amount || 0,
        receiptData.payment_type,
        receiptData.description,
        receiptData.receipt_category || 'member',
        receiptData.transaction_type || 'payment',
        receiptData.custom_member_id,
        receiptData.subscription_start_date,
        receiptData.subscription_end_date,
        receiptData.plan_type,
        receiptData.payment_mode,
        receiptData.mobile_no,
        receiptData.email,
        receiptData.package_fee || 0,
        receiptData.registration_fee || 0,
        receiptData.discount || 0,
        receiptData.cgst || 0,
        receiptData.sigst || 0,
        receiptData.created_at,
        receiptData.created_by
      );

      if (result.changes > 0) {
        console.log(`✅ Receipt created successfully: ${receiptData.receipt_number}`);
        return true;
      } else {
        throw new Error('Failed to create receipt');
      }
    } catch (error) {
      console.error('Create receipt error:', error);
      return false;
    }
  }

  updateReceipt(id, receiptData) {
    try {
      console.log('Updating receipt:', id, receiptData);

      // Build update query dynamically based on provided fields
      const updateFields = [];
      const values = [];

      if (receiptData.amount !== undefined) {
        updateFields.push('amount = ?');
        values.push(receiptData.amount);
      }
      if (receiptData.amount_paid !== undefined) {
        updateFields.push('amount_paid = ?');
        values.push(receiptData.amount_paid);
      }
      if (receiptData.due_amount !== undefined) {
        updateFields.push('due_amount = ?');
        values.push(receiptData.due_amount);
      }
      if (receiptData.payment_type !== undefined) {
        updateFields.push('payment_type = ?');
        values.push(receiptData.payment_type);
      }
      if (receiptData.description !== undefined) {
        updateFields.push('description = ?');
        values.push(receiptData.description);
      }

      if (updateFields.length === 0) {
        console.log('No fields to update');
        return true;
      }

      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE receipts SET ${updateFields.join(', ')} WHERE id = ?
      `);

      const result = stmt.run(...values);
      return result.changes > 0;
    } catch (error) {
      console.error('Update receipt error:', error);
      return false;
    }
  }

  deleteReceipt(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM receipts WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Delete receipt error:', error);
      return false;
    }
  }

  // Receipt versioning methods
  createReceiptVersion(receiptData) {
    try {
      console.log('Creating receipt version:', receiptData);

      // Mark the original receipt as superseded if it exists
      if (receiptData.original_receipt_id) {
        this.markReceiptAsSuperseded(receiptData.original_receipt_id);
      }

      // Create the new receipt version
      return this.createReceipt(receiptData);
    } catch (error) {
      console.error('Create receipt version error:', error);
      return false;
    }
  }

  markReceiptAsSuperseded(receiptId) {
    try {
      const stmt = this.db.prepare(`
        UPDATE receipts 
        SET is_current_version = FALSE, superseded_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      const result = stmt.run(receiptId);
      return result.changes > 0;
    } catch (error) {
      console.error('Mark receipt as superseded error:', error);
      return false;
    }
  }

  getReceiptHistory(originalReceiptId) {
    try {
      return this.db.prepare(`
        SELECT * FROM receipts 
        WHERE id = ? OR original_receipt_id = ? 
        ORDER BY version_number ASC
      `).all(originalReceiptId, originalReceiptId);
    } catch (error) {
      console.error('Get receipt history error:', error);
      return [];
    }
  }

  // Monthly transaction report
  getMonthlyTransactionReport(month, year) {
    try {
      console.log('Getting monthly transaction report for:', month, year);

      // Get receipts for the month
      const receipts = this.db.prepare(`
        SELECT * FROM receipts 
        WHERE strftime('%Y', created_at) = ? 
        AND strftime('%m', created_at) = ?
        AND (receipt_category IS NULL OR receipt_category = 'member')
        ORDER BY created_at ASC
      `).all(year.toString(), month.toString().padStart(2, '0'));

      // Get expenses for the month
      const expenses = this.db.prepare(`
        SELECT * FROM expenses 
        WHERE strftime('%Y', date) = ? 
        AND strftime('%m', date) = ?
        ORDER BY date ASC
      `).all(year.toString(), month.toString().padStart(2, '0'));

      // Calculate totals
      const totalIncome = receipts.reduce((sum, receipt) => sum + (receipt.amount_paid || receipt.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const netProfit = totalIncome - totalExpenses;

      return {
        month,
        year,
        receipts,
        expenses,
        summary: {
          totalIncome,
          totalExpenses,
          netProfit,
          receiptCount: receipts.length,
          expenseCount: expenses.length
        }
      };
    } catch (error) {
      console.error('Get monthly transaction report error:', error);
      return {
        month,
        year,
        receipts: [],
        expenses: [],
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
          receiptCount: 0,
          expenseCount: 0
        }
      };
    }
  }

  // Get all members with due amounts
  getAllMembersWithDueAmounts() {
    try {
      const members = this.db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();

      return members.map(member => {
        // Calculate total fees
        const registrationFee = member.registration_fee || 0;
        const packageFee = member.package_fee || member.membership_fees || 0;
        const discount = member.discount || 0;
        const totalFees = Math.max(0, registrationFee + packageFee - discount);

        // Use member's paid_amount as primary source, but validate against receipts
        const memberPaidAmount = member.paid_amount || 0;
        // Get total paid from receipts for validation
        const paidResult = this.db.prepare(`
          SELECT SUM(COALESCE(amount_paid, amount, 0)) as total_paid
          FROM receipts 
          WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
        `).get(member.id);
        const receiptsPaidAmount = paidResult.total_paid || 0;
        // Use member's paid_amount if it exists and is reasonable, otherwise use receipts total
        const totalPaid = memberPaidAmount > 0 ? memberPaidAmount : receiptsPaidAmount;
        const dueAmount = Math.max(0, totalFees - totalPaid);
        // Debug logging for inconsistencies
        if (Math.abs(memberPaidAmount - receiptsPaidAmount) > 0.01 && memberPaidAmount > 0 && receiptsPaidAmount > 0) {
          console.log(`⚠️ Payment inconsistency for ${member.name}: member.paid_amount=${memberPaidAmount}, receipts_total=${receiptsPaidAmount}`);
        }

        return {
          ...member,
          due_amount: dueAmount,
          unpaid_invoices: dueAmount > 0 ? 1 : 0
        };
      });
    } catch (error) {
      console.error('Get members with due amounts error:', error);
      return [];
    }
  }

  // Get member due amount
  getMemberDueAmount(memberId) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COALESCE(SUM(i.total_amount - i.paid_amount), 0) as dueAmount,
          COUNT(CASE WHEN i.status != 'paid' THEN 1 END) as unpaidInvoices
        FROM invoices i
        WHERE i.member_id = ? AND i.status != 'paid'
      `);
      const result = stmt.get(memberId);
      return result || { dueAmount: 0, unpaidInvoices: 0 };
    } catch (error) {
      console.error('Get member due amount error:', error);
      return { dueAmount: 0, unpaidInvoices: 0 };
    }
  }

  // Pay member due amount - Robust implementation with proper calculation
  payMemberDueAmount(memberId, paymentAmount, paymentType = 'cash', createdBy = 'system') {
    try {
      console.log('💰 Processing due payment for member:', memberId, 'Amount:', paymentAmount);

      // 1. Fetch the member record
      const member = this.db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      // 2. Calculate current due amount using the same logic as getAllMembersWithDueAmounts
      const registrationFee = member.registration_fee || 0;
      const packageFee = member.package_fee || member.membership_fees || 0;
      const discount = member.discount || 0;
      const totalMembershipFee = Math.max(0, registrationFee + packageFee - discount);
      
      // Get total paid from receipts (same as due calculation)
      const paidResult = this.db.prepare(`
        SELECT SUM(COALESCE(amount_paid, amount, 0)) as total_paid
        FROM receipts 
        WHERE member_id = ? AND (receipt_category IS NULL OR receipt_category = 'member')
      `).get(memberId);

      const totalPaidFromReceipts = paidResult.total_paid || 0;
      const currentDueAmount = Math.max(0, totalMembershipFee - totalPaidFromReceipts);

      console.log('💰 Due payment calculation:', {
        memberName: member.name,
        totalFee: totalMembershipFee,
        totalPaidFromReceipts,
        memberPaidAmount: member.paid_amount || 0,
        currentDue: currentDueAmount,
        paymentAmount
      });

      // Debug: Check if we have receipts for this member
      const allReceipts = this.db.prepare(`
        SELECT * FROM receipts WHERE member_id = ?
      `).all(memberId);
      console.log('💰 All receipts for member:', allReceipts.length, allReceipts.map(r => ({
        id: r.id,
        amount_paid: r.amount_paid,
        amount: r.amount,
        category: r.receipt_category,
        type: r.transaction_type
      })));

      // 3. Validate payment amount
      if (currentDueAmount <= 0) {
        return { success: false, error: 'No due amount found for this member' };
      }

      if (paymentAmount <= 0) {
        return { success: false, error: 'Payment amount must be greater than 0' };
      }

      if (paymentAmount > currentDueAmount) {
        return { success: false, error: `Payment amount (₹${paymentAmount}) cannot exceed due amount (₹${currentDueAmount})` };
      }

      // 4. Calculate new amounts after payment
      const newTotalPaid = totalPaidFromReceipts + paymentAmount;
      const newDueAmount = Math.max(0, totalMembershipFee - newTotalPaid);
      
      // Determine new membership status
      let newStatus = member.status;
      if (newDueAmount === 0 && member.subscriptionStatus !== 'expired') {
        newStatus = 'active';
      }

      // 5. Update member's paid_amount to match the new total
      const updateMemberStmt = this.db.prepare(`
        UPDATE members 
        SET paid_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      
      const memberUpdateResult = updateMemberStmt.run(newTotalPaid, newStatus, memberId);
      
      if (memberUpdateResult.changes === 0) {
        throw new Error('Failed to update member record');
      }

      // 6. Generate receipt for ONLY the current payment (not total)
      const receiptId = this.generateId();
      const receiptNumber = this.generateReceiptNumber();
      const currentDateTime = new Date().toISOString();
      
      // Determine receipt remarks
      const isFullPayment = newDueAmount === 0;
      const remarks = isFullPayment ? 'Full due cleared' : 'Partial due cleared';
      
      const receiptData = {
        id: receiptId,
        receipt_number: receiptNumber,
        member_id: memberId,
        member_name: member.name,
        custom_member_id: member.custom_member_id,
        amount: totalMembershipFee, // Total membership fee
        amount_paid: paymentAmount, // ONLY the current payment amount
        due_amount: newDueAmount, // Remaining due after this payment
        payment_type: paymentType,
        description: `Due Payment - ${remarks} (₹${paymentAmount} of ₹${currentDueAmount} due)`,
        receipt_category: 'member',
        transaction_type: 'due_payment',
        subscription_start_date: member.subscription_start_date,
        subscription_end_date: member.subscription_end_date,
        plan_type: member.plan_type,
        payment_mode: paymentType,
        mobile_no: member.mobile_no,
        email: member.email,
        package_fee: packageFee,
        registration_fee: registrationFee,
        discount: discount,
        cgst: 0,
        sigst: 0,
        created_at: currentDateTime,
        created_by: createdBy
      };

      // Insert receipt
      const insertReceiptStmt = this.db.prepare(`
        INSERT INTO receipts (
          id, receipt_number, member_id, member_name, custom_member_id, amount, amount_paid, due_amount,
          payment_type, description, receipt_category, transaction_type, subscription_start_date,
          subscription_end_date, plan_type, payment_mode, mobile_no, email, package_fee,
          registration_fee, discount, cgst, sigst, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const receiptResult = insertReceiptStmt.run(
        receiptData.id,
        receiptData.receipt_number,
        receiptData.member_id,
        receiptData.member_name,
        receiptData.custom_member_id,
        receiptData.amount,
        receiptData.amount_paid,
        receiptData.due_amount,
        receiptData.payment_type,
        receiptData.description,
        receiptData.receipt_category,
        receiptData.transaction_type,
        receiptData.subscription_start_date,
        receiptData.subscription_end_date,
        receiptData.plan_type,
        receiptData.payment_mode,
        receiptData.mobile_no,
        receiptData.email,
        receiptData.package_fee,
        receiptData.registration_fee,
        receiptData.discount,
        receiptData.cgst,
        receiptData.sigst,
        receiptData.created_at,
        receiptData.created_by
      );

      if (receiptResult.changes === 0) {
        throw new Error('Failed to create receipt');
      }

      // 7. Prepare response
      const response = {
        success: true,
        member_id: memberId,
        updated_member_data: {
          amount_paid: newTotalPaid,
          due_amount: newDueAmount,
          membership_status: newStatus,
          total_membership_fee: totalMembershipFee
        },
        new_receipt: {
          receipt_id: receiptId,
          receipt_number: receiptNumber,
          receipt_type: 'Due Payment',
          amount_paid_now: paymentAmount, // Only current payment
          previous_paid: totalPaidFromReceipts, // Previous total from receipts
          new_total_paid: newTotalPaid, // New total after this payment
          total_amount: totalMembershipFee,
          remaining_due: newDueAmount,
          payment_date: currentDateTime,
          payment_type: paymentType,
          remarks: remarks
        },
        confirmation_message: `₹${paymentAmount} received from ${member.name}. Remaining due: ₹${newDueAmount}.`
      };

      console.log('✅ Due payment processed successfully:', response);
      return response;

    } catch (error) {
      console.error('❌ Error processing due payment:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
      });
      return { 
        success: false, 
        error: error.message || 'Failed to process due payment' 
      };
    }
  }

  // Find member by mobile number for due payment
  findMemberByMobile(mobileNumber) {
    try {
      console.log('🔍 Finding member by mobile:', mobileNumber);
      
      const member = this.db.prepare(`
        SELECT * FROM members 
        WHERE mobile_no = ? OR alternate_no = ?
        ORDER BY created_at DESC 
        LIMIT 1
      `).get(mobileNumber, mobileNumber);

      if (!member) {
        return { success: false, error: 'Member not found with this mobile number' };
      }

      // Calculate current due amount
      const registrationFee = member.registration_fee || 0;
      const packageFee = member.package_fee || member.membership_fees || 0;
      const discount = member.discount || 0;
      const totalMembershipFee = Math.max(0, registrationFee + packageFee - discount);
      
      const paidAmount = member.paid_amount || 0;
      const dueAmount = Math.max(0, totalMembershipFee - paidAmount);

      const memberWithDue = {
        ...member,
        total_membership_fee: totalMembershipFee,
        current_due_amount: dueAmount,
        membership_status: dueAmount > 0 ? 'due' : 'active'
      };

      console.log('✅ Member found:', {
        name: member.name,
        mobile: member.mobile_no,
        totalFee: totalMembershipFee,
        paid: paidAmount,
        due: dueAmount
      });

      return { success: true, member: memberWithDue };

    } catch (error) {
      console.error('❌ Error finding member by mobile:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to find member' 
      };
    }
  }

  // Get member's payment history
  getMemberPaymentHistory(memberId) {
    try {
      console.log('📋 Getting payment history for member:', memberId);
      
      const receipts = this.db.prepare(`
        SELECT * FROM receipts 
        WHERE member_id = ? 
        ORDER BY created_at DESC
      `).all(memberId);

      const paymentHistory = receipts.map(receipt => ({
        receipt_id: receipt.id,
        receipt_number: receipt.receipt_number,
        amount_paid: receipt.amount_paid || receipt.amount || 0,
        payment_date: receipt.created_at,
        payment_type: receipt.payment_type || receipt.payment_mode,
        transaction_type: receipt.transaction_type,
        description: receipt.description,
        due_amount_after: receipt.due_amount || 0
      }));

      return { success: true, payment_history: paymentHistory };

    } catch (error) {
      console.error('❌ Error getting payment history:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get payment history' 
      };
    }
  }



  // Check if member is partial
  isPartialMember(memberId) {
    try {
      const stmt = this.db.prepare('SELECT status FROM members WHERE id = ? OR custom_member_id = ?');
      const member = stmt.get(memberId, memberId);
      return member && member.status === 'partial';
    } catch (error) {
      console.error('Check partial member error:', error);
      return false;
    }
  }

  // Complete partial member by adding membership details
  completePartialMember(memberId, membershipData) {
    try {
      console.log('Completing partial member:', memberId, membershipData);

      // Parse services array if it's a string
      let servicesJson = '[]';
      if (membershipData.services) {
        servicesJson = Array.isArray(membershipData.services)
          ? JSON.stringify(membershipData.services)
          : membershipData.services;
      }

      const stmt = this.db.prepare(`
        UPDATE members SET 
          payment_mode = ?, plan_type = ?, services = ?, membership_fees = ?, 
          registration_fee = ?, package_fee = ?, discount = ?, paid_amount = ?,
          subscription_start_date = ?, subscription_end_date = ?, status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR custom_member_id = ?
      `);

      const result = stmt.run(
        membershipData.paymentMode,
        membershipData.planType,
        servicesJson,
        membershipData.membershipFees || 0,
        membershipData.registrationFee || 0,
        membershipData.packageFee || 0,
        membershipData.discount || 0,
        membershipData.paidAmount || 0,
        membershipData.subscriptionStartDate,
        membershipData.subscriptionEndDate,
        membershipData.status || 'active',
        memberId,
        memberId
      );

      if (result.changes > 0) {
        console.log(`✅ Partial member completed successfully: ${memberId}`);
        return { success: true, data: { memberId } };
      } else {
        throw new Error('Failed to complete partial member - member not found');
      }
    } catch (error) {
      console.error('Complete partial member error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all partial members
  getPartialMembers() {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM members 
        WHERE status = 'partial' 
        ORDER BY created_at DESC
      `);
      return stmt.all();
    } catch (error) {
      console.error('Get partial members error:', error);
      return [];
    }
  }

  // Utility methods
  generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateReceiptNumber() {
    try {
      // Get current counter
      const counterResult = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('receipt_counter');
      let counter = counterResult ? parseInt(counterResult.value) : 0;
      
      // Increment counter
      counter++;
      
      // Update counter in database
      this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('receipt_counter', counter.toString());
      
      // Format as RCP001, RCP002, etc.
      return `RCP${counter.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Generate receipt number error:', error);
      return `RCP${Date.now()}`;
    }
  }



  generateInvoiceNumber() {
    try {
      // Get current counter
      const counterResult = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('invoice_counter');
      let counter = counterResult ? parseInt(counterResult.value) : 0;
      
      // Increment counter
      counter++;
      
      // Update counter in database
      this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('invoice_counter', counter.toString());
      
      // Format as INV001, INV002, etc.
      return `INV${counter.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Generate invoice number error:', error);
      return `INV${Date.now()}`;
    }
  }

  updateMemberNumber(memberId, newMemberNumber) {
    try {
      const stmt = this.db.prepare('UPDATE members SET custom_member_id = ? WHERE id = ?');
      const result = stmt.run(newMemberNumber, memberId);
      return { success: result.changes > 0 };
    } catch (error) {
      console.error('Update member number error:', error);
      return { success: false, error: error.message };
    }
  }

  isMemberNumberTaken(memberNumber) {
    try {
      const stmt = this.db.prepare('SELECT id FROM members WHERE custom_member_id = ?');
      const result = stmt.get(memberNumber);
      return !!result;
    } catch (error) {
      console.error('Check member number taken error:', error);
      return false;
    }
  }

  // Subscription status update
  updateAllSubscriptionStatuses() {
    try {
      console.log('🔄 Updating all subscription statuses...');
      
      const today = new Date().toISOString().split('T')[0];
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 7); // 7 days from now
      const warningDateStr = warningDate.toISOString().split('T')[0];

      console.log('📅 Date comparison:', {
        today,
        warningDate: warningDateStr
      });

      // Debug: Check members that should be expired
      const shouldBeExpired = this.db.prepare(`
        SELECT name, subscription_end_date, status, subscription_status 
        FROM members 
        WHERE subscription_end_date IS NOT NULL 
        AND subscription_end_date < ?
        LIMIT 5
      `).all(today);
      
      console.log('🔍 Members that should be expired:', shouldBeExpired);

      // Update expired memberships - set subscription_status to expired and main status to inactive
      const expiredStmt = this.db.prepare(`
        UPDATE members 
        SET subscription_status = 'expired', status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE subscription_end_date IS NOT NULL 
        AND DATE(subscription_end_date) < DATE(?) 
        AND status IN ('active', 'inactive')
        AND subscription_status != 'expired'
      `);
      const expiredResult = expiredStmt.run(today);
      console.log('📅 Checking for expired memberships with end date before:', today);

      // Update expiring soon memberships (still active but expiring within 7 days)
      const expiringSoonStmt = this.db.prepare(`
        UPDATE members 
        SET subscription_status = 'expiring_soon', updated_at = CURRENT_TIMESTAMP
        WHERE subscription_end_date IS NOT NULL
        AND subscription_end_date >= ? 
        AND subscription_end_date <= ? 
        AND status = 'active'
        AND subscription_status != 'expiring_soon'
      `);
      const expiringSoonResult = expiringSoonStmt.run(today, warningDateStr);

      // Update active memberships (subscription end date is more than 7 days away)
      const activeStmt = this.db.prepare(`
        UPDATE members 
        SET subscription_status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE subscription_end_date IS NOT NULL
        AND subscription_end_date > ? 
        AND status = 'active'
        AND subscription_status != 'active'
      `);
      const activeResult = activeStmt.run(warningDateStr);

      // Log members that were updated
      if (expiredResult.changes > 0) {
        const expiredMembers = this.db.prepare(`
          SELECT name, subscription_end_date FROM members 
          WHERE subscription_status = 'expired' AND updated_at > datetime('now', '-1 minute')
        `).all();
        console.log('⚠️ Members set to expired:', expiredMembers.map(m => `${m.name} (expired: ${m.subscription_end_date})`));
      }

      console.log(`✅ Subscription status update complete:`, {
        expired: expiredResult.changes,
        expiring_soon: expiringSoonResult.changes,
        active: activeResult.changes,
        total_updated: expiredResult.changes + expiringSoonResult.changes + activeResult.changes
      });

      return {
        expired: expiredResult.changes,
        expiring_soon: expiringSoonResult.changes,
        active: activeResult.changes
      };
    } catch (error) {
      console.error('Update subscription statuses error:', error);
      return false;
    }
  }

  // Calculate subscription end date
  calculateSubscriptionEndDate(startDate, planType) {
    try {
      const start = new Date(startDate);
      let endDate = new Date(start);

      switch (planType) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'half_yearly':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
      }

      return endDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Calculate subscription end date error:', error);
      const fallback = new Date();
      fallback.setMonth(fallback.getMonth() + 1);
      return fallback.toISOString().split('T')[0];
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = DatabaseService;
