module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: './coverage/',
  testMatch: ['**/test/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.{ts}', '!**/node_modules/**', '!**/vendor/**']
};
