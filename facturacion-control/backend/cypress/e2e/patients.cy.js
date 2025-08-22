describe('Patients Page', () => {
    beforeEach(() => {
      // Visitar la página de pacientes antes de cada prueba
      cy.visit('http://localhost:3000/patients');
    });
  
    it('should display the patients list', () => {
      // Verificar que la tabla de pacientes existe
      cy.get('table').should('be.visible');
      
      // Verificar que hay filas en la tabla (ajusta el selector según tu aplicación)
      cy.get('tbody tr').should('have.length.at.least', 1);
    });
  
    it('should search for a patient', () => {
      // Buscar un paciente por número de documento
      cy.get('input[placeholder="Buscar paciente..."]').type('12345678');
      cy.get('button').contains('Buscar').click();
      
      // Verificar que se muestran los resultados
      cy.get('tbody tr').should('have.length.at.least', 1);
    });
  
    it('should navigate to patient details', () => {
      // Hacer clic en el primer paciente de la lista
      cy.get('tbody tr').first().click();
      
      // Verificar que se navega a la página de detalles del paciente
      cy.url().should('include', '/patients/');
      
      // Verificar que se muestran los detalles del paciente
      cy.get('h3').contains('Detalles del Paciente').should('be.visible');
    });
  });