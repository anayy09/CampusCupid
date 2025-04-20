const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 1,
    baseUrl: 'http://localhost:3000',
    defaultCommandTimeout: 10000,
    supportFile: false,
    specPattern: 'cypress/component/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
});


