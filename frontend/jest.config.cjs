module.exports = {
  // The environment that will be used for testing (simulates a browser DOM)
  testEnvironment: 'jest-environment-jsdom',

  // The setup files to run before each test file
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // A map from regular expressions to module names that allow to stub out resources
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
 
  // We are now telling Jest to use 'babel-jest' to transform all JS/TS/JSX files.
  // This will use your 'babel.config.js' file and correctly handle the module syntax.
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // The preset for ts-jest is no longer needed.

  roots: ['<rootDir>/src'],
  
  testMatch: [
    // "**/__tests__/**/*.+(ts|tsx|js)",
    // "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],

  testPathIgnorePatterns: [
    "/node_modules/"
  ],
};
