// Mock for expo-sqlite using better-sqlite3 for real in-memory SQL in tests
const Database = require('better-sqlite3');

let _db = null;

function getOrCreateDb() {
  if (!_db) {
    _db = new Database(':memory:');
  }
  return _db;
}

// Reset between test files if needed
function resetDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}

class MockSQLiteDatabase {
  constructor(db) {
    this._db = db;
  }

  async execAsync(sql) {
    // better-sqlite3 exec runs multiple statements
    this._db.exec(sql);
  }

  async runAsync(sql, params) {
    const stmt = this._db.prepare(sql);
    const result = stmt.run(params || []);
    return { lastInsertRowId: result.lastInsertRowid, changes: result.changes };
  }

  async getFirstAsync(sql, params) {
    const stmt = this._db.prepare(sql);
    return stmt.get(params || []) || null;
  }

  async getAllAsync(sql, params) {
    const stmt = this._db.prepare(sql);
    return stmt.all(params || []);
  }

  async withTransactionAsync(fn) {
    // better-sqlite3 transactions are synchronous, but our fn is async.
    // Since tests use in-memory DB without concurrent access, just run directly.
    this._db.exec('BEGIN');
    try {
      await fn();
      this._db.exec('COMMIT');
    } catch (e) {
      this._db.exec('ROLLBACK');
      throw e;
    }
  }

  async closeAsync() {
    this._db.close();
    _db = null;
  }
}

module.exports = {
  openDatabaseAsync: jest.fn(async (_name) => {
    const db = getOrCreateDb();
    return new MockSQLiteDatabase(db);
  }),
  SQLiteDatabase: MockSQLiteDatabase,
  _resetDb: resetDb,
};
