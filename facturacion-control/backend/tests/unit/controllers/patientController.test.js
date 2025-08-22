const patientController = require('../../../src/controllers/patientController');
const Patient = require('../../../src/models/Patient');

// Mock del modelo Patient
jest.mock('../../../src/models/Patient');

describe('Patient Controller', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('getPatients', () => {
    it('should call res.json when successful', async () => {
      // Configurar mock
      const mockPatients = [
        { _id: '1', firstName: 'Juan', firstLastName: 'Pérez', documentNumber: '12345678', documentType: 'CC' },
        { _id: '2', firstName: 'María', firstLastName: 'López', documentNumber: '87654321', documentType: 'CC' }
      ];
      
      // Ajustar según la implementación real del controlador
      Patient.find = jest.fn().mockResolvedValue(mockPatients);

      // Crear request y response mock
      const req = { query: {} };
      const res = {
        json: jest.fn()
      };

      // Ejecutar función
      await patientController.getPatients(req, res);

      // Verificar que se llamó a res.json con los pacientes
      expect(res.json).toHaveBeenCalledWith(mockPatients);
    });

    it('should call res.status with 500 when there is an error', async () => {
      // Simular error
      const errorMessage = 'Database error';
      Patient.find = jest.fn().mockRejectedValue(new Error(errorMessage));

      const req = { query: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await patientController.getPatients(req, res);

      // Verificar que se llamó a res.status con 500
      expect(res.status).toHaveBeenCalledWith(500);
      // Verificar que se llamó a res.json con el mensaje de error
      expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
    });
  });
});