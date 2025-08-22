module.exports = {
    e2e: {
      setupNodeEvents(on, config) {
        // implement node event listeners here
      },
      baseUrl: 'http://localhost:3000',
      supportFile: false,
      specPattern: 'cypress/e2e/**/*.cy.js'
    }
  };