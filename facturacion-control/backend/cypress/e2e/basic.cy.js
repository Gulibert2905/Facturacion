describe('Basic Test', () => {
    it('should visit the homepage', () => {
      cy.visit('http://localhost:3000');
      // Ajusta el selector según tu aplicación real
      cy.get('body').should('be.visible');
    });
  });