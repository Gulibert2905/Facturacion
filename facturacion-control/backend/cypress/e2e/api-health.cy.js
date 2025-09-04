describe('API Health Check', () => {
  beforeEach(() => {
    // Intercept requests to prevent external network calls during tests
    cy.intercept('GET', '**/api/**', { fixture: 'api-response.json' }).as('apiCall');
  });

  it('should load the API root endpoint', () => {
    cy.request('GET', 'http://localhost:5000/')
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('message', 'API funcionando');
        expect(response.body).to.have.property('version');
        expect(response.body).to.have.property('phase');
      });
  });

  it('should return 404 for non-existent endpoints', () => {
    cy.request({
      url: 'http://localhost:5000/api/nonexistent',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body).to.have.property('message', 'Ruta no encontrada');
    });
  });

  it('should return 401 for protected endpoints without authentication', () => {
    cy.request({
      url: 'http://localhost:5000/api/users',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });

  it('should include security headers', () => {
    cy.request('GET', 'http://localhost:5000/')
      .then((response) => {
        // Check for Helmet security headers
        expect(response.headers).to.have.property('x-dns-prefetch-control');
        expect(response.headers).to.have.property('x-frame-options');
        expect(response.headers).to.have.property('x-content-type-options');
      });
  });
});