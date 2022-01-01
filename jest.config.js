/* eslint-env node */

module.exports = {
  collectCoverageFrom: [".github/workflows/scripts/**/*.js"],
  coverageDirectory: ".coverage",
  coverageReporters: ["text"],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
