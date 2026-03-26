const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'licenses.db');
const db = new sqlite3.Database(dbPath);

const columnsToAdd = [
  { name: 'system_name', type: 'TEXT' },
  { name: 'start_date', type: 'TEXT' },
  { name: 'payment_terms', type: 'TEXT' }
];

db.serialize(() => {
  for (const col of columnsToAdd) {
    db.run(`ALTER TABLE licenses ADD COLUMN ${col.name} ${col.type}`, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`Column ${col.name} already exists.`);
        } else {
          console.error(`Error adding column ${col.name}:`, err.message);
        }
      } else {
        console.log(`Column ${col.name} added successfully.`);
      }
    });
  }
});

db.close();
