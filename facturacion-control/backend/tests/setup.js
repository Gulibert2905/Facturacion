const { MongoMemoryServer } = require('mongodb-memory-server');

// Global test setup
beforeAll(async () => {
  // Suppress console.log during tests unless needed
  if (process.env.NODE_ENV === 'test') {
    global.originalConsoleLog = console.log;
    console.log = jest.fn();
  }
});

afterAll(async () => {
  // Restore console.log
  if (global.originalConsoleLog) {
    console.log = global.originalConsoleLog;
  }
});