require('dotenv').config();
const path = require('path');
const fs = require('fs');

let db;
const isPostgres = !!process.env.DATABASE_URL;

function mapParams(query) {
  if (!isPostgres) return query;
  let i = 1;
  return query.replace(/\?/g, () => `$${i++}`);
}

if (isPostgres) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Koyeb/Railway/Render
    }
  });

  db = {
    all: (query, params) => pool.query(mapParams(query), params).then(res => res.rows),
    get: (query, params) => pool.query(mapParams(query), params).then(res => res.rows[0]),
    run: async (query, params) => {
      // For INSERTs, we might want the ID. 
      // We'll append RETURNING id to INSERT queries if it's Postgres.
      let sql = mapParams(query);
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
         sql += ' RETURNING id';
      }
      const res = await pool.query(sql, params);
      return { lastID: res.rows[0]?.id, changes: res.rowCount };
    },
    serialize: async (cb) => {
      // Simple transaction wrapper
      await pool.query('BEGIN');
      try {
        const result = await cb();
        await pool.query('COMMIT');
        return result;
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }
    },
    exec: (query) => pool.query(query),
    close: () => pool.end(),
    isPostgres: true
  };
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbFilePath = process.env.DB_PATH || path.resolve(__dirname, 'licenses.db');
  
  // Ensure directory exists
  const dbDir = path.dirname(dbFilePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqliteDb = new sqlite3.Database(dbFilePath);

  db = {
    all: (query, params) => new Promise((resolve, reject) => {
      sqliteDb.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
    }),
    get: (query, params) => new Promise((resolve, reject) => {
      sqliteDb.get(query, params, (err, row) => err ? reject(err) : resolve(row));
    }),
    run: (query, params) => new Promise((resolve, reject) => {
      sqliteDb.run(query, params, function(err) {
        err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes });
      });
    }),
    serialize: (cb) => {
      return new Promise((resolve, reject) => {
        sqliteDb.serialize(async () => {
          try {
            const result = await cb();
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      });
    },
    exec: (query) => new Promise((resolve, reject) => {
      sqliteDb.exec(query, (err) => err ? reject(err) : resolve());
    }),
    close: () => new Promise((resolve, reject) => {
      sqliteDb.close((err) => err ? reject(err) : resolve());
    }),
    isPostgres: false
  };
}

module.exports = db;
