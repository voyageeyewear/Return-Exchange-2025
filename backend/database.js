const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Use /data volume on Railway if available, otherwise use local directory
const dataDir = fs.existsSync('/data') ? '/data' : path.join(__dirname, '..');
const dbPath = path.join(dataDir, 'database.db');

console.log(`📁 Database path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected');
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

  // Return/Exchange requests table
  db.run(`CREATE TABLE IF NOT EXISTS return_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT UNIQUE NOT NULL,
    order_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_mobile TEXT,
    action_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    other_reason TEXT,
    exchange_details TEXT,
    image_path TEXT,
    status TEXT DEFAULT 'Pending',
    admin_notes TEXT,
    submitted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
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

  // Insert sample orders for testing
  db.get('SELECT COUNT(*) as count FROM orders', (err, row) => {
    if (row.count === 0) {
      // Sample order 1
      db.run(`INSERT INTO orders (order_number, customer_email, customer_mobile, customer_name, order_date) 
              VALUES ('ORD-2025-001', 'customer@example.com', '+1234567890', 'John Doe', '2025-10-01')`, 
        function(err) {
          if (!err) {
            const orderId = this.lastID;
            db.run(`INSERT INTO order_items (order_id, product_name, product_image, sku, quantity, price) VALUES 
              (?, 'Classic Aviator Sunglasses', '/images/aviator.jpg', 'SKU-AV-001', 1, 149.99),
              (?, 'Round Frame Eyeglasses', '/images/round.jpg', 'SKU-RF-002', 2, 89.99)`,
              [orderId, orderId]
            );
          }
        }
      );

      // Sample order 2
      db.run(`INSERT INTO orders (order_number, customer_email, customer_mobile, customer_name, order_date) 
              VALUES ('ORD-2025-002', 'jane@example.com', '+0987654321', 'Jane Smith', '2025-10-05')`, 
        function(err) {
          if (!err) {
            const orderId = this.lastID;
            db.run(`INSERT INTO order_items (order_id, product_name, product_image, sku, quantity, price) VALUES 
              (?, 'Sport Sunglasses', '/images/sport.jpg', 'SKU-SP-003', 1, 199.99)`,
              [orderId]
            );
          }
        }
      );

      console.log('✅ Sample orders created for testing');
    }
  });
});

module.exports = db;

