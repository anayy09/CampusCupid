describe('Dashboard Page - E2E Test', () => {
  beforeEach(() => {
    cy.visit('/login');

    // Fill in login form
    cy.get('input[name="email"]').type('john@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('form').submit();

    // Confirm login was successful
    cy.url().should('include', '/dashboard');
  });

  it('should load the dashboard page', () => {
    cy.get('.loading-spinner').should('not.exist');
    cy.get('h1', { timeout: 15000 }).should('contain', 'Dashboard');
  });

  it('should display the user’s name', () => {
    cy.get('body').should('contain', 'john'); // Adjust casing if needed
  });

  it('should display the user’s email', () => {
    cy.get('body').should('contain', 'john@example.com');
  });

  it('should display the user’s age', () => {
    cy.get('body').should('contain', '25');
  });

  it('should display the user’s gender', () => {
    cy.get('body').should('contain', 'Male');
  });

  it('should display a default bio message', () => {
    cy.get('body').should('contain', 'No bio available');
  });

  it('should show number of matches', () => {
    cy.get('body').should('contain', '0 Matches');
  });
});
