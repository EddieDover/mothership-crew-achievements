export default {
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/src/scripts/__tests__/setup.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!**/node_modules/**",
    "!src/scripts/crew-achievements.js",
    "!src/scripts/relationship-viewer.js",
    "!src/scripts/constants.js",
    "!src/scripts/AchievementModel.js",
    "!src/scripts/AchievementSheet.js",
    "!src/scripts/__tests__/**",
    "!src/typeDefs.js",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/__tests__/"],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
  verbose: true,
};
