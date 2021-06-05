/* eslint-env node */

module.exports = {
  collectCoverageFrom: [".github/workflows/scripts/**/*.js"],
  coverageDirectory: ".coverage",
  coverageReporters: ["text"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
