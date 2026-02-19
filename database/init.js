const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

let db;

async function initializeDatabase() {
  db = await open({
    filename: path.join(__dirname, 'layer1.db'),
    driver: sqlite3.Database,
  });

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await db.exec(schema);

  console.log('Database initialized');
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

module.exports = { initializeDatabase, getDb };
