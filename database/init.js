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

  await db.exec('PRAGMA journal_mode = WAL');
  await db.exec('PRAGMA foreign_keys = ON');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await db.exec(schema);

  // Migrations: add columns that may not exist in older databases
  const migrations = [
    ['projects', 'client', 'ALTER TABLE projects ADD COLUMN client TEXT'],
    ['projects', 'type', 'ALTER TABLE projects ADD COLUMN type TEXT'],
    ['projects', 'is_template', 'ALTER TABLE projects ADD COLUMN is_template INTEGER DEFAULT 0'],
    ['coes', 'code', 'ALTER TABLE coes ADD COLUMN code TEXT'],
    ['technologies', 'vision', 'ALTER TABLE technologies ADD COLUMN vision TEXT'],
    ['technologies', 'why_it_works', 'ALTER TABLE technologies ADD COLUMN why_it_works TEXT'],
    ['technologies', 'key_points', 'ALTER TABLE technologies ADD COLUMN key_points TEXT'],
    ['technologies', 'certifications', 'ALTER TABLE technologies ADD COLUMN certifications TEXT'],
    ['sessions', 'attendees', 'ALTER TABLE sessions ADD COLUMN attendees TEXT'],
  ];
  for (const [table, column, sql] of migrations) {
    const cols = await db.all(`PRAGMA table_info(${table})`);
    if (!cols.find((c) => c.name === column)) {
      await db.exec(sql);
    }
  }

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
