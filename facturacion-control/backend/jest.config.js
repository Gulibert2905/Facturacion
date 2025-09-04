module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    testTimeout: 30000,
    verbose: true,
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    globalTeardown: '<rootDir>/tests/teardown.js',
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/**/*.test.js',
      '!src/config/**',
      '!src/migrations/**',
      '!src/scripts/**'
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    testMatch: [
      '<rootDir>/tests/**/*.test.js'
    ],
    forceExit: true,
    detectOpenHandles: true
  };