// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  // This helps with file uploads in tests
  experimentalFileServerFolder: '.',
});

// cypress/support/commands.js
// This adds the 'attachFile' command used in the signup test
import 'cypress-file-upload';

// Add any custom commands you need
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.contains('button', 'Sign In').click();
});

// cypress/support/e2e.js
// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:  
// require('./commands')

// Hide fetch/XHR requests in the Command Log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}