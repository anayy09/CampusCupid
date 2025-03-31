// cypress/e2e/signup-page.cy.js
describe('Sign Up Page', () => {
  beforeEach(() => {
    cy.visit('/signup');
    // Mock geolocation API
    cy.window().then((win) => {
      cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
        return cb({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        });
      });
    });
    
    // Mock API calls
    cy.intercept('GET', 'https://nominatim.openstreetmap.org/reverse*', {
      statusCode: 200,
      body: {
        address: {
          city: 'New York',
          country: 'United States'
        }
      }
    }).as('geocodingRequest');
    
    cy.intercept('POST', '**/register', {
      statusCode: 200,
      body: { message: 'Registration successful' }
    }).as('registerRequest');
  });

  it('displays the stepper with all steps', () => {
    cy.contains('Join Campus Cupid').should('be.visible');
    cy.contains('Basic Info').should('be.visible');
    cy.contains('About You').should('be.visible');
    cy.contains('Photos').should('be.visible');
  });

  it('validates age is 18+ on basic info page', () => {
    // Fill form with underage birth date
    cy.get('input[name="firstName"]').type('Test User');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').first().type('password123');
    cy.get('input[type="password"]').last().type('password123');
    
    // Current date minus 17 years
    const underageDate = new Date();
    underageDate.setFullYear(underageDate.getFullYear() - 17);
    const formattedDate = underageDate.toISOString().split('T')[0];
    
    cy.get('input[type="date"]').type(formattedDate);
    cy.contains('button', 'Next').click();
    
    cy.contains('You must be at least 18 years old to register').should('be.visible');
  });

  it('validates password match on basic info page', () => {
    cy.get('input[name="firstName"]').type('Test User');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').first().type('password123');
    cy.get('input[type="password"]').last().type('differentpassword');
    
    // Valid date
    const validDate = new Date();
    validDate.setFullYear(validDate.getFullYear() - 20);
    const formattedDate = validDate.toISOString().split('T')[0];
    
    cy.get('input[type="date"]').type(formattedDate);
    cy.contains('button', 'Next').click();
    
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('fetches location details when "Detect My Location" is clicked', () => {
    cy.contains('button', 'Detect My Location').click();
    cy.wait('@geocodingRequest');
    cy.get('input[label="City"]').should('have.value', 'New York');
    cy.get('input[label="Country"]').should('have.value', 'United States');
  });

  it('completes the full signup flow successfully', () => {
    // Step 1: Basic Info
    cy.get('input[name="firstName"]').type('Test User');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').first().type('password123');
    cy.get('input[type="password"]').last().type('password123');
    
    // Valid date
    const validDate = new Date();
    validDate.setFullYear(validDate.getFullYear() - 20);
    const formattedDate = validDate.toISOString().split('T')[0];
    cy.get('input[type="date"]').type(formattedDate);
    
    // Get location
    cy.contains('button', 'Detect My Location').click();
    cy.wait('@geocodingRequest');
    
    cy.contains('button', 'Next').click();
    
    // Step 2: About You
    cy.get('input[value="woman"]').click();
    cy.get('input[value="men"]').click();
    cy.get('input[value="longTerm"]').click();
    cy.get('input[value="Straight"]').click();
    
    // Add interests
    cy.get('#interests-tags').click().type('Dancing{enter}');
    cy.get('#interests-tags').click().type('Music{enter}');
    
    // Add bio
    cy.get('textarea').type('This is my test bio for Cypress testing.');
    
    cy.contains('button', 'Next').click();
    
    // Step 3: Photos
    // Create a mock file for upload
    cy.fixture('sample-1.jpg', 'base64').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent,
        fileName: 'sample-1.jpg',
        mimeType: 'image/jpeg'
      });
    });
    
    cy.fixture('sample-2.jpg', 'base64').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent,
        fileName: 'sample-2.jpg',
        mimeType: 'image/jpeg'
      });
    });
    
    // Submit the form
    cy.contains('button', 'Create Account').click();
    cy.wait('@registerRequest');
    
    // Should be redirected to login page
    cy.url().should('include', '/login');
  });

  it('validates minimum photos requirement', () => {
    // Go through step 1 and 2
    cy.get('input[name="firstName"]').type('Test User');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').first().type('password123');
    cy.get('input[type="password"]').last().type('password123');
    
    const validDate = new Date();
    validDate.setFullYear(validDate.getFullYear() - 20);
    const formattedDate = validDate.toISOString().split('T')[0];
    cy.get('input[type="date"]').type(formattedDate);
    
    cy.contains('button', 'Next').click();
    
    // Step 2 quick fill
    cy.get('input[value="woman"]').click();
    cy.get('input[value="men"]').click();
    cy.get('input[value="longTerm"]').click();
    cy.get('textarea').type('Test bio');
    
    cy.contains('button', 'Next').click();
    
    // Try to submit without adding photos
    cy.contains('button', 'Create Account').click();
    
    // Should see an error
    cy.contains('Please upload at least 2 photos').should('be.visible');
  });
});