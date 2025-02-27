// End-to-End Tests with Cypress
// File: cypress/integration/campus-cupid.spec.js

describe('Campus Cupid E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('navigates to login page when login button is clicked', () => {
    cy.contains('Login').click();
    cy.url().should('include', '/login');
    cy.contains('Sign In').should('be.visible');
  });

  it('navigates to signup page when sign up button is clicked', () => {
    cy.contains('Sign Up Now').click();
    cy.url().should('include', '/signup');
    cy.contains('Join Campus Cupid').should('be.visible');
  });

  it('verifies age requirement during signup', () => {
    cy.visit('/signup');
    
    // Enter name and email
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="email"]').type('john@example.com');
    
    // Enter a date that's less than 18 years ago
    const underageDate = new Date();
    underageDate.setFullYear(underageDate.getFullYear() - 17);
    const formattedUnderageDate = underageDate.toISOString().split('T')[0];
    cy.get('input[type="date"]').type(formattedUnderageDate);
    
    // Try to proceed
    cy.contains('Next').click();
    
    // Should show error
    cy.contains('You must be at least 18 years old').should('be.visible');
    
    // Enter a valid date
    const validDate = new Date();
    validDate.setFullYear(validDate.getFullYear() - 20);
    const formattedValidDate = validDate.toISOString().split('T')[0];
    cy.get('input[type="date"]').clear().type(formattedValidDate);
    
    // Should proceed to next step
    cy.contains('Next').click();
    cy.contains('I am a').should('be.visible');
  });

  it('completes the signup process', () => {
    cy.visit('/signup');
    
    // Step 1
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="email"]').type('john@example.com');
    const validDate = new Date();
    validDate.setFullYear(validDate.getFullYear() - 20);
    const formattedValidDate = validDate.toISOString().split('T')[0];
    cy.get('input[type="date"]').type(formattedValidDate);
    cy.contains('Next').click();
    
    // Step 2
    cy.contains('Man').click();
    cy.contains('Women').click();
    cy.contains('Long-term Relationship').click();
    cy.contains('Next').click();
    
    // Step 3 - Upload photos
    const fileName = 'test-photo.jpg';
    cy.fixture('test-photo.jpg').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent,
        fileName,
        mimeType: 'image/jpeg'
      });
    });
    
    // Create account
    cy.contains('Create Account').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('successfully logs in with valid credentials', () => {
    cy.visit('/login');
    cy.get('input[id="email"]').type('test@example.com');
    cy.get('input[id="password"]').type('password123');
    cy.contains('Sign In').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});

