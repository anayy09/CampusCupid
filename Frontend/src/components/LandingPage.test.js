// cypress/e2e/landing-page.cy.js
describe('Landing Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays the correct title and subtitle', () => {
    cy.contains('h2', 'Campus Cupid').should('be.visible');
    cy.contains('h5', 'Join millions of people connecting through love').should('be.visible');
  });

  it('displays the three feature cards', () => {
    cy.contains('Why Choose Us?').should('be.visible');
    cy.contains('Smart Matching').should('be.visible');
    cy.contains('Large Community').should('be.visible');
    cy.contains('Safe & Secure').should('be.visible');
  });

  it('navigates to login page when login button is clicked', () => {
    cy.contains('button', 'Login').click();
    cy.url().should('include', '/login');
  });

  it('navigates to signup page when sign up button is clicked', () => {
    cy.contains('button', 'Sign Up Now').click();
    cy.url().should('include', '/signup');
  });

  it('has a call to action section', () => {
    cy.contains('LOVE STARTS HERE').should('be.visible');
  });
});