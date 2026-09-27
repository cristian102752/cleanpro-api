import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  // Limpia el estado de todos los mocks entre tests (rúbrica semana 09)
  clearMocks: true,
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/config/db.ts',
    // env.ts se evalúa al arrancar el proceso (fail-fast con process.exit)
    '!src/config/env.ts',
    '!src/scripts/**',
    '!src/__tests__/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
};

export default config;
