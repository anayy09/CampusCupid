const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',  // e2e baseUrl for your app
  },
  component: {
    devServer: {
      framework: "react",        // Framework: React
      bundler: "webpack",        // Bundler: Webpack
      port: 3000,                // Ensure tests run on port 3000
      webpackConfig: require('./webpack.config.js'), // Optional custom Webpack config
    },
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",  // Test file pattern
    supportFile: false,  // Optional: Disable if no support file is used
  },
});
