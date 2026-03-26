const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'licenses.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      system_name TEXT,
      duration_days INTEGER NOT NULL,
      next_payment_date TEXT NOT NULL,
      start_date TEXT,
      payment_terms TEXT,
      client_name TEXT,
      description TEXT,
      payment_fee TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database initialized check licenses.db");

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_id INTEGER NOT NULL,
      amount_paid TEXT,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      extended_date TEXT NOT NULL,
      FOREIGN KEY(license_id) REFERENCES licenses(id)
    )
  `);
  console.log("Payments table initialized");
});

db.close();
