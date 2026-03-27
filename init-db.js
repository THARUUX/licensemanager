const db = require('./db');

(async () => {
  try {
    const idType = db.isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const timestampDefault = 'CURRENT_TIMESTAMP';
    const datetimeType = db.isPostgres ? 'TIMESTAMP' : 'DATETIME';

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

  } catch (err) {
    console.error("Initialization error:", err);
  } finally {
    // Wait for a small bit to ensure outputs are shown before closing if needed, 
    // but db.close is async now.
    await db.close();
  }
})();
