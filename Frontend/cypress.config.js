const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/integration/**/*.js', // Adjust this pattern if needed
    // chnage the base url to the url of the app you are testing
    
    baseUrl: 'http://localhost:3000/', // Change this to your app's URL if necessary
  },
});

