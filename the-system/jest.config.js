/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { strict: true, types: ['jest'] } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock native/Expo modules that use ESM and can't run in Node
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};
