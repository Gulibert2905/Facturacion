const serviceController = require('../../../src/controllers/serviceController');
const Service = require('../../../src/models/Service');
const ServiceRecord = require('../../../src/models/ServiceRecord');
const PreBill = require('../../../src/models/PreBill');
const Patient = require('../../../src/models/Patient');

// Mock dependencies
jest.mock('../../../src/models/Service');
jest.mock('../../../src/models/ServiceRecord');
jest.mock('../../../src/models/PreBill');
jest.mock('../../../src/models/Patient');
jest.mock('../../../src/middleware/serviceValidation');
jest.mock('../../../src/controllers/contractController');
jest.mock('../../../src/utils/logger');

describe('Service Controller', () => {
  let mockRequest, mockResponse, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      query: {},
      body: {},
      params: {},
      user: { _id: 'mockUserId' }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('createServiceRecord', () => {
    beforeEach(() => {
      ServiceRecord.findOne = jest.fn();
      ServiceRecord.create = jest.fn();
    });

    it('should create a service record successfully', async () => {
      const serviceRecordData = {
        documentType: 'CC',
        documentNumber: '12345678',
        patientName: 'Test Patient',
        serviceDate: '2024-01-15',
        cupsCode: '890201',
        contractId: 'contract123',
        value: 50000,
        municipality: 'Bogotá',
        observations: 'Test observation'
      };

      mockRequest.body = serviceRecordData;

      // Mock no existing record
      ServiceRecord.findOne.mockResolvedValue(null);

      // Mock successful creation
      const mockCreatedRecord = {
        _id: 'recordId',
        ...serviceRecordData,
        createdBy: 'mockUserId'
      };
      ServiceRecord.create.mockResolvedValue(mockCreatedRecord);

      await serviceController.createServiceRecord(mockRequest, mockResponse);

      expect(ServiceRecord.findOne).toHaveBeenCalledWith({
        documentNumber: '12345678',
        cupsCode: '890201',
        serviceDate: '2024-01-15',
        contractId: 'contract123'
      });

      expect(ServiceRecord.create).toHaveBeenCalledWith({
        ...serviceRecordData,
        createdBy: 'mockUserId'
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedRecord);
    });

    it('should return 400 if duplicate record exists', async () => {
      const serviceRecordData = {
        documentType: 'CC',
        documentNumber: '12345678',
        patientName: 'Test Patient',
        serviceDate: '2024-01-15',
        cupsCode: '890201',
        contractId: 'contract123',
        value: 50000
      };

      mockRequest.body = serviceRecordData;

      // Mock existing record found
      ServiceRecord.findOne.mockResolvedValue({ _id: 'existingId' });

      await serviceController.createServiceRecord(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Ya existe un registro para este paciente con el mismo servicio y fecha'
      });

      expect(ServiceRecord.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockRequest.body = {
        documentType: 'CC',
        documentNumber: '12345678',
        patientName: 'Test Patient',
        serviceDate: '2024-01-15',
        cupsCode: '890201',
        contractId: 'contract123',
        value: 50000
      };

      ServiceRecord.findOne.mockRejectedValue(new Error('Database error'));

      await serviceController.createServiceRecord(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });

  // Note: The actual serviceController only exports specific functions
  // So we'll test only the ones that exist: createServiceRecord, getServiceRecords, etc.

  describe('getServiceRecords', () => {
    beforeEach(() => {
      ServiceRecord.find = jest.fn();
    });

    it('should return service records with filters', async () => {
      const mockRecords = [
        { _id: '1', documentNumber: '12345678', cupsCode: '890201' },
        { _id: '2', documentNumber: '87654321', cupsCode: '890202' }
      ];

      mockRequest.query = {};

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockRecords)
      };

      ServiceRecord.find.mockReturnValue(mockQuery);

      await serviceController.getServiceRecords(mockRequest, mockResponse);

      expect(ServiceRecord.find).toHaveBeenCalledWith({});
      expect(mockResponse.json).toHaveBeenCalledWith(mockRecords);
    });

    it('should filter records by date range', async () => {
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      ServiceRecord.find.mockReturnValue(mockQuery);

      await serviceController.getServiceRecords(mockRequest, mockResponse);

      expect(ServiceRecord.find).toHaveBeenCalledWith({
        serviceDate: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-01-31')
        }
      });
    });

    it('should filter records by contractId, status, and municipality', async () => {
      mockRequest.query = { 
        contractId: 'contract123',
        status: 'active',
        municipality: 'Bogotá'
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      ServiceRecord.find.mockReturnValue(mockQuery);

      await serviceController.getServiceRecords(mockRequest, mockResponse);

      expect(ServiceRecord.find).toHaveBeenCalledWith({
        contractId: 'contract123',
        status: 'active',
        municipality: 'Bogotá'
      });
    });

    it('should handle errors', async () => {
      ServiceRecord.find = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await serviceController.getServiceRecords(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });
});