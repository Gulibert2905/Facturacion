const mongoose = require('mongoose');
const Patient = require('../../../src/models/Patient');

// Desconectar mongoose después de las pruebas
afterAll(async () => {
  await mongoose.disconnect();
});

describe('Patient Model', () => {
  it('should validate a valid patient', () => {
    const validPatient = new Patient({
      firstName: 'Juan',
      firstLastName: 'Pérez',
      documentType: 'CC',
      documentNumber: '12345678',
      birthDate: new Date('1990-01-01'),
      gender: 'M',
      contactPhone: '3001234567',
      email: 'juan@example.com',
      address: 'Calle 123'
    });

    const validationError = validPatient.validateSync();
    expect(validationError).toBeUndefined();
  });

  it('should require firstName field', () => {
    const patientWithoutFirstName = new Patient({
      firstLastName: 'Pérez',
      documentType: 'CC',
      documentNumber: '12345678'
    });

    const validationError = patientWithoutFirstName.validateSync();
    expect(validationError.errors.firstName).toBeDefined();
  });
});