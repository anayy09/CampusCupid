import Dashboard from '../../src/components/Dashboard';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
// import { QueryClient, QueryClientProvider } from 'react-query';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

// Mock localStorage
const mockUser = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com'
};
global.process = {
  env: {
    NODE_ENV: 'development'
    // Add any other environment variables your components need
  }
};

const mockToken = 'mock-token';

// Create a theme instance
const theme = createTheme();

// Create a query client
const queryClient = new QueryClient();

describe('Dashboard Tests', () => {
  beforeEach(() => {
    // Mock localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify(mockUser));
      win.localStorage.setItem('token', mockToken);
      win.localStorage.setItem('userId', mockUser.id);
    });

    // Mock axios
    cy.intercept('GET', '**/api/matches', {
      statusCode: 200,
      body: [
        {
          id: '1',
          name: 'Match 1',
          age: 25,
          bio: 'Test bio 1',
          profileImage: '/test-image-1.jpg'
        },
        {
          id: '2',
          name: 'Match 2',
          age: 26,
          bio: 'Test bio 2',
          profileImage: '/test-image-2.jpg'
        }
      ]
    }).as('getMatches');

    cy.mount(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Wait for initial data load
    cy.wait('@getMatches');
  });

  it('should display the dashboard header', () => {
    cy.get('.MuiAppBar-root').should('be.visible');
    cy.get('.MuiTypography-h6').should('contain', mockUser.name);
  });

  it('should show user profile information', () => {
    cy.get('.MuiCard-root').first().should('be.visible');
    cy.get('.MuiAvatar-root').should('be.visible');
  });

  it('should display match suggestions', () => {
    cy.get('.MuiCard-root').should('have.length.at.least', 2);
    cy.get('.MuiTypography-h6').should('contain', 'Match 1');
    cy.get('img').should('be.visible');
  });

  it('should show recent activity', () => {
    cy.get('.MuiList-root').should('be.visible');
    cy.get('.MuiListItem-root').should('have.length.at.least', 1);
  });

  it('should have working navigation links', () => {
    cy.get('a').contains('Matches').should('be.visible');
    cy.get('a').contains('Settings').should('be.visible');
  });

  it('should handle match interactions', () => {
    cy.get('.MuiCard-root').first().click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('.MuiDialogContent-root').should('contain', 'Test bio 1');
  });
}); 