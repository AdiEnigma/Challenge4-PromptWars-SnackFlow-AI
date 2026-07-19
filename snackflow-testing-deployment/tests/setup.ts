import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test configuration
const PROPERTY_TEST_RUNS = parseInt(process.env.PROPERTY_TEST_RUNS || '100');
const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '30000');

global.PROPERTY_TEST_RUNS = PROPERTY_TEST_RUNS;
global.TEST_TIMEOUT = TEST_TIMEOUT;

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Silence debug/info logs during testing unless DEBUG=true
  log: process.env.DEBUG === 'true' ? console.log : jest.fn(),
  debug: process.env.DEBUG === 'true' ? console.debug : jest.fn(),
  info: process.env.DEBUG === 'true' ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Increase timeout for property-based tests
jest.setTimeout(TEST_TIMEOUT);

// Setup global test utilities
beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  // Cleanup any global resources
  await new Promise(resolve => setTimeout(resolve, 100));
});