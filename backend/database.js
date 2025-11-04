const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Use /data volume on Railway if available, otherwise use local directory
const dataDir = fs.existsSync('/data') ? '/data' : path.join(__dirname, '..');

// Ensure directory exists and is writable
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (err) {
  console.error('⚠️ Cannot create data directory:', err.message);
}

const dbPath = path.join(dataDir, 'database.db');

console.log(`📁 Database path: ${dbPath}`);
console.log(`📂 Data directory: ${dataDir}`);
console.log(`✅ Directory exists: ${fs.existsSync(dataDir)}`);
console.log(`✅ Directory writable: ${fs.accessSync ? 'checking...' : 'unknown'}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('   This may cause authentication issues');
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Initialize database tables
db.serialize(() => {
  // Orders table (sample orders for demo)
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_email TEXT NOT NULL,
    customer_mobile TEXT,
    customer_name TEXT NOT NULL,
    order_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Order items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  )`);

  // Return/Exchange requests table (Shopify integrated with exchange product)
  db.run(`CREATE TABLE IF NOT EXISTS return_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT UNIQUE NOT NULL,
    order_number TEXT NOT NULL,
    shopify_order_id TEXT,
    shopify_item_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    product_price REAL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_mobile TEXT,
    action_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    other_reason TEXT,
    exchange_details TEXT,
    exchange_product_id TEXT,
    exchange_product_name TEXT,
    exchange_product_sku TEXT,
    exchange_product_price REAL,
    price_difference REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'Not Required',
    payment_method TEXT,
    payment_transaction_id TEXT,
    payment_date DATETIME,
    refund_amount REAL DEFAULT 0,
    credit_option TEXT DEFAULT 'next_order',
    discount_code TEXT,
    discount_code_status TEXT DEFAULT 'Active',
    discount_code_expiry DATETIME,
    store_credit_amount REAL DEFAULT 0,
    store_credit_code TEXT,
    store_credit_status TEXT DEFAULT 'Inactive',
    store_credit_expiry DATETIME,
    image_path TEXT,
    status TEXT DEFAULT 'Pending',
    admin_notes TEXT,
    submitted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME
  )`);

  // Status history table
  db.run(`CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES return_requests(request_id)
  )`);

  // Add store credit columns to existing return_requests table if they don't exist
  db.run(`ALTER TABLE return_requests ADD COLUMN store_credit_amount REAL DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding store_credit_amount column:', err);
    }
  });
  
  db.run(`ALTER TABLE return_requests ADD COLUMN store_credit_code TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding store_credit_code column:', err);
    }
  });
  
  db.run(`ALTER TABLE return_requests ADD COLUMN store_credit_status TEXT DEFAULT 'Inactive'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding store_credit_status column:', err);
    }
  });
  
  db.run(`ALTER TABLE return_requests ADD COLUMN store_credit_expiry DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding store_credit_expiry column:', err);
    }
  });

  // Add product_image column for storing Shopify product images
  db.run(`ALTER TABLE return_requests ADD COLUMN product_image TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding product_image column:', err);
    }
  });


  // Admin users table
  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, () => {
    // Create default admin user
    const defaultEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    db.get('SELECT id FROM admin_users WHERE email = ?', [defaultEmail], (err, row) => {
      if (!row) {
        const passwordHash = bcrypt.hashSync(defaultPassword, 10);
        db.run('INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)',
          [defaultEmail, passwordHash, 'Admin User'],
          (err) => {
            if (!err) {
              console.log(`✅ Default admin created: ${defaultEmail} / ${defaultPassword}`);
            }
          }
        );
      }
    });
  });

  // Demo data removed - using Shopify integration for real orders
});

module.exports = db;

