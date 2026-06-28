/** @type {import('jest').Config} */
const config = {
  // Clear calls/instances
  clearMocks: true,

  // Coverage
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",

  // Defined as Node
  testEnvironment: "node",
};

module.exports = config;
