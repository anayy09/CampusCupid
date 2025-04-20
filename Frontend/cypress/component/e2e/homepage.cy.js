describe('Homepage Tests', () => {
  beforeEach(() => {
    cy.visit('/'); // Visit the homepage
  });

  it('should display the main header', () => {
    cy.get('h1').should('contain', 'Welcome to CampusCupid'); // Adjust to your app
  });

  it('should have a login button', () => {
    cy.get('[data-test="login-button"]').should('be.visible');
  });

  it('should navigate to login page when clicking login', () => {
    cy.get('[data-test="login-button"]').click();
    cy.url().should('include', '/login'); // Ensure it navigates correctly
  });
});

