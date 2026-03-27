require('dotenv').config();
const db = require('./db');

const bcrypt = require('bcryptjs');

(async () => {
  try {
    const idType = db.isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const timestampDefault = 'CURRENT_TIMESTAMP';
    const datetimeType = db.isPostgres ? 'TIMESTAMP' : 'DATETIME';

    // Users Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id ${idType},
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at ${datetimeType} DEFAULT ${timestampDefault}
      )
    `);
    console.log("Users table initialized");

    // Licenses Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS licenses (
        id ${idType},
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
        created_at ${datetimeType} DEFAULT ${timestampDefault}
      )
    `);
    console.log("Licenses table initialized");

    // Payments Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id ${idType},
        license_id INTEGER NOT NULL,
        amount_paid TEXT,
        payment_date ${datetimeType} DEFAULT ${timestampDefault},
        extended_date TEXT NOT NULL,
        FOREIGN KEY(license_id) REFERENCES licenses(id)
      )
    `);
    console.log("Payments table initialized");

    // Create or Update default admin user
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin';
    
    const adminExists = await db.get("SELECT * FROM users WHERE username = ?", [defaultUsername]);
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    if (!adminExists) {
      await db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", [defaultUsername, passwordHash]);
      console.log(`Admin user created: ${defaultUsername}`);
    } else if (process.env.ADMIN_PASSWORD) {
      // Update password if explicitly provided in environment
      await db.run("UPDATE users SET password_hash = ? WHERE username = ?", [passwordHash, defaultUsername]);
      console.log(`Admin password updated for: ${defaultUsername}`);
    }

    // Cleanup: If we are using a custom username, remove the default 'admin' user if it still exists
    if (defaultUsername !== 'admin') {
      const result = await db.run("DELETE FROM users WHERE username = 'admin'", []);
      if (result.changes > 0) {
        console.log("Default 'admin' user removed for security.");
      }
    }

  } catch (err) {
    console.error("Initialization error:", err);
  } finally {
    await db.close();
  }
})();
