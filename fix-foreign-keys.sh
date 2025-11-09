#!/bin/bash

# Fix Foreign Key References to members_old
DB_PATH=~/Library/Application\ Support/fit-local-control/database/pratik.db

echo "🔧 Fixing Foreign Key References"
echo "📁 Database: $DB_PATH"
echo ""

# Backup the database first
echo "📦 Creating backup..."
cp "$DB_PATH" "$DB_PATH.backup_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"
echo ""

# Fix each table by recreating it without the members_old reference
echo "🔄 Fixing foreign key references..."

sqlite3 "$DB_PATH" <<'EOF'
PRAGMA foreign_keys = OFF;

-- Fix enquiries table
BEGIN TRANSACTION;

CREATE TABLE enquiries_new (
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
);

INSERT INTO enquiries_new SELECT * FROM enquiries;
DROP TABLE enquiries;
ALTER TABLE enquiries_new RENAME TO enquiries;

COMMIT;

-- Fix invoices table
BEGIN TRANSACTION;

CREATE TABLE invoices_new (
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
);

INSERT INTO invoices_new SELECT * FROM invoices;
DROP TABLE invoices;
ALTER TABLE invoices_new RENAME TO invoices;

COMMIT;

-- Fix receipts table
BEGIN TRANSACTION;

CREATE TABLE receipts_new (
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
  amount_paid REAL DEFAULT NULL,
  due_amount REAL DEFAULT NULL,
  original_receipt_id TEXT,
  version_number INTEGER DEFAULT 1,
  is_current_version BOOLEAN DEFAULT TRUE,
  superseded_at TEXT,
  FOREIGN KEY (member_id) REFERENCES members (id),
  FOREIGN KEY (invoice_id) REFERENCES invoices (id)
);

INSERT INTO receipts_new SELECT * FROM receipts;
DROP TABLE receipts;
ALTER TABLE receipts_new RENAME TO receipts;

COMMIT;

-- Fix body_measurements table
BEGIN TRANSACTION;

CREATE TABLE body_measurements_new (
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
);

INSERT INTO body_measurements_new SELECT * FROM body_measurements;
DROP TABLE body_measurements;
ALTER TABLE body_measurements_new RENAME TO body_measurements;

COMMIT;

-- Fix attendance table
BEGIN TRANSACTION;

CREATE TABLE attendance_new (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  custom_member_id TEXT,
  member_name TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT,
  date TEXT NOT NULL,
  profile_image TEXT,
  FOREIGN KEY (member_id) REFERENCES members (id)
);

INSERT INTO attendance_new SELECT * FROM attendance;
DROP TABLE attendance;
ALTER TABLE attendance_new RENAME TO attendance;

COMMIT;

-- Fix whatsapp_messages table
BEGIN TRANSACTION;

CREATE TABLE whatsapp_messages_new (
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
);

INSERT INTO whatsapp_messages_new SELECT * FROM whatsapp_messages;
DROP TABLE whatsapp_messages;
ALTER TABLE whatsapp_messages_new RENAME TO whatsapp_messages;

COMMIT;

PRAGMA foreign_keys = ON;
EOF

echo "✅ All foreign key references fixed!"
echo "📋 Verifying..."

# Verify the fix
RESULT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE sql LIKE '%members_old%';")

if [ "$RESULT" -eq "0" ]; then
  echo "✅ SUCCESS: No more references to members_old found!"
  echo "👉 Please restart your application now"
else
  echo "⚠️  Warning: Still found $RESULT references to members_old"
  echo "   Please check the database manually"
fi
