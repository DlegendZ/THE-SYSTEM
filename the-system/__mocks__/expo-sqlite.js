// Mock for expo-sqlite — not available in Jest/Node environment
module.exports = {
  openDatabaseAsync: jest.fn(),
  SQLiteDatabase: jest.fn(),
};
