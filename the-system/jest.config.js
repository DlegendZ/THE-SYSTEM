/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { strict: true, types: ['jest'] } }],
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: false, presets: ['babel-preset-expo'] }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock native/Expo modules that use ESM and can't run in Node
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^react-native-svg$': '<rootDir>/__mocks__/react-native-svg.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-svg|expo.*|@expo.*)/)',
  ],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  globals: {
    __DEV__: true,
    IS_REACT_ACT_ENVIRONMENT: true,
  },
};
