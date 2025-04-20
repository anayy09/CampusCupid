const { defineConfig } = require("cypress");
const path = require("path");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: false,
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig: require("./webpack.config.js"),
    },
    
    specPattern: "cypress/component/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: false,
    devServer: {
      historyApiFallback: true
    }
  },
});
