// Import our custom mount helper
import './component-utils';

// Listen for window:before:load and spy on console.error
beforeEach(() => {
  cy.on('window:before:load', (win) => {
    if (win && win.console && win.console.error) {
      cy.spy(win.console, 'error').as('consoleError');
    }
  });
});

// Optional: You can assert after each test if you want
afterEach(() => {
  cy.get('@consoleError').then((consoleError) => {
    // This will fail the test if console.error was called
    expect(consoleError).not.to.have.been.called;
  });
});

// You can also define your custom commands here if needed
// Example custom command:
Cypress.Commands.add('dataCy', (value) => {
  return cy.get(`[data-cy=${value}]`);
});