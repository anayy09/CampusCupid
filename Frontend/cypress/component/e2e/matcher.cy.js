describe('Matcher Page', () => {
  it('logs in and tests swipe interaction for mobile', () => {
    // Step 1: Log in
    cy.visit('/login');  // Visit the login page
    cy.get('input[name="email"]').type('john@example.com');  // Adjust the selector if needed
    cy.get('input[name="password"]').type('password123');  // Adjust the selector if needed
    cy.get('button[type="submit"]').click();  // Adjust the selector for the login button if needed

    // Step 2: Ensure login was successful and the user is redirected to matcher page
    cy.url().should('not.include', '/login');  // Ensure we are not on the login page anymore
    cy.contains('Find All Matches').should('be.visible').click();  // Click 'Find All Matches'

    // Step 3: Visit matcher page and test swipe interaction for mobile
    cy.get('.matcher-container')  // Ensure this is the correct selector for your matcher element
      .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 50, clientY: 100 }] })
      .trigger('touchend', { touches: [{ clientX: 50, clientY: 100 }] });

    cy.contains('Profile picture not available').should('be.visible');

    // Swipe interaction to the right
    cy.get('.matcher-container')
      .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 150, clientY: 100 }] })
      .trigger('touchend', { touches: [{ clientX: 150, clientY: 100 }] });

    cy.contains('abhijeet@gmail.com').should('be.visible');
  });

  it('tests swipe interaction for desktop', () => {
    // Step 1: Log in
    cy.visit('/login');  // Visit the login page
    cy.get('input[name="email"]').type('john@example.com');  // Adjust the selector if needed
    cy.get('input[name="password"]').type('password123');  // Adjust the selector if needed
    cy.get('button[type="submit"]').click();  // Adjust the selector for the login button if needed

    // Step 2: Ensure login was successful and the user is redirected to matcher page
    cy.url().should('not.include', '/login');  // Ensure we are not on the login page anymore
    cy.contains('Find All Matches').should('be.visible').click();  // Click 'Find All Matches'

    // Step 3: Test swipe interaction for desktop
    cy.visit('/matcher');  // Visit matcher page directly
    cy.get('body').type('{leftarrow}');  // Use keyboard for desktop swipe simulation
    cy.contains('Profile picture not available').should('be.visible');

    cy.get('body').type('{rightarrow}');
    cy.contains('abhijeet@gmail.com').should('be.visible');
  });

  it('tests like button click', () => {
    // Step 1: Log in
    cy.visit('/login');  // Visit the login page
    cy.get('input[name="email"]').type('john@example.com');  // Adjust the selector if needed
    cy.get('input[name="password"]').type('password123');  // Adjust the selector if needed
    cy.get('button[type="submit"]').click();  // Adjust the selector for the login button if needed

    // Step 2: Ensure login was successful and the user is redirected to matcher page
    cy.url().should('not.include', '/login');  // Ensure we are not on the login page anymore
    cy.contains('Find All Matches').should('be.visible').click();  // Click 'Find All Matches'

    // Step 3: Test like button click
    cy.get('.like-button').click(); // Ensure this is the correct selector
    cy.contains('abhijeet@gmail.com').should('be.visible');
  });

  it('tests dislike button click', () => {
    // Step 1: Log in
    cy.visit('/login');  // Visit the login page
    cy.get('input[name="email"]').type('john@example.com');  // Adjust the selector if needed
    cy.get('input[name="password"]').type('password123');  // Adjust the selector if needed
    cy.get('button[type="submit"]').click();  // Adjust the selector for the login button if needed

    // Step 2: Ensure login was successful and the user is redirected to matcher page
    cy.url().should('not.include', '/login');  // Ensure we are not on the login page anymore
    cy.contains('Find All Matches').should('be.visible').click();  // Click 'Find All Matches'

    // Step 3: Test dislike button click
    cy.get('.dislike-button').click(); // Ensure this is the correct selector
    cy.contains('Profile picture not available').should('be.visible');
  });
});
