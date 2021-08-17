/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig-mjs.json",
    },
  },
  coverageDirectory: "test/coverage",
  collectCoverageFrom: ["src/**/*.ts", "!src/@types/**/*"],
};
