// cypress/e2e/login-page.cy.js
describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login');
    // Intercept API calls
    cy.intercept('POST', '**/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: { id: 1, firstName: 'Test', email: 'test@example.com' }
      }
    }).as('loginRequest');
  });

  it('displays the login form with all elements', () => {
    cy.contains('h1', 'Campus Cupid').should('be.visible');
    cy.contains('Welcome back! Please sign in to continue').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.contains('button', 'Sign In').should('be.visible');
    cy.contains('Forgot password?').should('be.visible');
    cy.contains("Don't have an account?").should('be.visible');
    cy.contains('Sign Up').should('be.visible');
  });

  it('validates email format', () => {
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Sign In').click();
    cy.contains('Please enter a valid email address').should('be.visible');
  });

  it('shows error for empty fields', () => {
    cy.contains('button', 'Sign In').click();
    cy.contains('Email is required').should('be.visible');
  });

  it('successfully logs in with valid credentials', () => {
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Sign In').click();
    
    // Wait for the API call
    cy.wait('@loginRequest');
    
    // Check if we're redirected to the dashboard
    cy.url().should('include', '/dashboard');
  });

  it('shows error message on login failure', () => {
    // Override the intercept for this test
    cy.intercept('POST', '**/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' }
    }).as('failedLoginRequest');
    
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.contains('button', 'Sign In').click();
    
    cy.wait('@failedLoginRequest');
    cy.contains('Invalid credentials').should('be.visible');
  });

  it('toggles password visibility', () => {
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    cy.get('button[aria-label="toggle password visibility"]').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');
  });

  it('navigates to signup page', () => {
    cy.contains('Sign Up').click();
    cy.url().should('include', '/signup');
  });
});