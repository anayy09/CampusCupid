import Matcher from '../../src/components/matcher';
// Update the import to use @tanstack/react-query
import { setupLocalStorage } from '../../support/test-utils';

describe('Matcher Tests', () => {
  beforeEach(() => {
    // Setup localStorage
    setupLocalStorage();

    // Mock API calls
    cy.intercept('GET', '**/api/profiles', {
      statusCode: 200,
      body: [
        {
          id: '1',
          name: 'Test Profile',
          age: 25,
          bio: 'Test bio',
          interests: ['Reading', 'Hiking'],
          profileImage: '/test-image.jpg'
        }
      ]
    }).as('getProfiles');

    // Mock like/dislike endpoints
    cy.intercept('POST', '**/api/like', {
      statusCode: 200,
      body: { success: true }
    }).as('likeProfile');

    cy.intercept('POST', '**/api/dislike', {
      statusCode: 200,
      body: { success: true }
    }).as('dislikeProfile');

    // Use the mountWithProviders command
    cy.mountWithProviders(<Matcher />);

    // Wait for initial data load
    cy.wait('@getProfiles');
  });

  // Tests remain the same
  it('should display the matcher interface', () => {
    cy.get('.MuiContainer-root').should('be.visible');
  });

  it('should show potential match cards', () => {
    cy.get('.MuiCard-root').should('have.length.at.least', 1);
    cy.get('.MuiTypography-h6').should('be.visible');
    cy.get('img').should('be.visible');
  });

  it('should handle like/dislike interactions', () => {
    // Test like button
    cy.get('button').contains('Like').click();
    cy.wait('@likeProfile');
    cy.get('.MuiSnackbar-root').should('be.visible');

    // Test dislike button
    cy.get('button').contains('Dislike').click();
    cy.wait('@dislikeProfile');
    cy.get('.MuiSnackbar-root').should('be.visible');
  });

  it('should show match details when clicking on a card', () => {
    cy.get('.MuiCard-root').first().click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('.MuiDialogContent-root').should('be.visible');
    cy.get('.MuiDialogContent-root').should('contain', 'Test bio');
  });

  it('should have filtering options', () => {
    cy.get('button').contains('Filter').should('be.visible');
  });

  it('should show loading state initially', () => {
    cy.get('.MuiCircularProgress-root').should('be.visible');
  });
}); 