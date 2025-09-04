const mongoose = require('mongoose');
const Service = require('../../../src/models/Service');

describe('Service Model', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/facturacion_test');
    }
  });

  afterAll(async () => {
    await Service.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Service.deleteMany({});
  });

  describe('Service Schema Validation', () => {
    it('should create a valid service with required fields', () => {
      const validService = new Service({
        cupsCode: '890201',
        description: 'Consulta médica general',
        category: 'Consulta',
        status: 'active'
      });

      const validationError = validService.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should require cupsCode field', () => {
      const serviceWithoutCupsCode = new Service({
        description: 'Test service'
      });

      const validationError = serviceWithoutCupsCode.validateSync();
      expect(validationError.errors.cupsCode).toBeDefined();
    });

    it('should require description field', () => {
      const serviceWithoutDescription = new Service({
        cupsCode: '890201'
      });

      const validationError = serviceWithoutDescription.validateSync();
      expect(validationError.errors.description).toBeDefined();
    });

    it('should trim cupsCode whitespace', () => {
      const service = new Service({
        cupsCode: '  890201  ',
        description: 'Test service'
      });

      expect(service.cupsCode).toBe('890201');
    });

    it('should trim description whitespace', () => {
      const service = new Service({
        cupsCode: '890201',
        description: '  Test service  '
      });

      expect(service.description).toBe('Test service');
    });

    it('should validate status enum values', () => {
      const serviceWithInvalidStatus = new Service({
        cupsCode: '890201',
        description: 'Test service',
        status: 'invalidstatus'
      });

      const validationError = serviceWithInvalidStatus.validateSync();
      expect(validationError.errors.status).toBeDefined();
    });

    it('should set default status as active', () => {
      const service = new Service({
        cupsCode: '890201',
        description: 'Test service'
      });

      expect(service.status).toBe('active');
    });

    it('should validate contracts array structure', () => {
      const service = new Service({
        cupsCode: '890201',
        description: 'Test service',
        contracts: [{
          contractId: new mongoose.Types.ObjectId(),
          value: 50000,
          requiresAuthorization: true,
          validFrom: new Date(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        }]
      });

      const validationError = service.validateSync();
      expect(validationError).toBeUndefined();
      expect(service.contracts).toHaveLength(1);
      expect(service.contracts[0].value).toBe(50000);
      expect(service.contracts[0].requiresAuthorization).toBe(true);
    });

    it('should set default requiresAuthorization as false in contracts', () => {
      const service = new Service({
        cupsCode: '890201',
        description: 'Test service',
        contracts: [{
          contractId: new mongoose.Types.ObjectId(),
          value: 50000
        }]
      });

      expect(service.contracts[0].requiresAuthorization).toBe(false);
    });

    it('should set default validFrom as current date in contracts', () => {
      const beforeCreation = Date.now();
      const service = new Service({
        cupsCode: '890201',
        description: 'Test service',
        contracts: [{
          contractId: new mongoose.Types.ObjectId(),
          value: 50000
        }]
      });
      const afterCreation = Date.now();

      const validFromTime = service.contracts[0].validFrom.getTime();
      expect(validFromTime).toBeGreaterThanOrEqual(beforeCreation);
      expect(validFromTime).toBeLessThanOrEqual(afterCreation);
    });
  });

  describe('Service Database Operations', () => {
    it('should save service with unique cupsCode', async () => {
      const service = new Service({
        cupsCode: '890201',
        description: 'Consulta médica general'
      });

      const savedService = await service.save();
      expect(savedService._id).toBeDefined();
      expect(savedService.cupsCode).toBe('890201');
    });

    it('should enforce unique cupsCode constraint', async () => {
      const service1 = new Service({
        cupsCode: '890201',
        description: 'First service'
      });

      const service2 = new Service({
        cupsCode: '890201', // Same cupsCode
        description: 'Second service'
      });

      await service1.save();
      await expect(service2.save()).rejects.toThrow();
    });

    it('should automatically set timestamps', async () => {
      const service = new Service({
        cupsCode: '890201',
        description: 'Test service'
      });

      const savedService = await service.save();
      expect(savedService.createdAt).toBeDefined();
      expect(savedService.updatedAt).toBeDefined();
    });

    it('should update timestamps on modification', async () => {
      const service = new Service({
        cupsCode: '890201',
        description: 'Test service'
      });

      const savedService = await service.save();
      const originalUpdatedAt = savedService.updatedAt;

      // Wait a moment and update
      await new Promise(resolve => setTimeout(resolve, 10));
      savedService.description = 'Updated description';
      const updatedService = await savedService.save();

      expect(updatedService.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should find services by status', async () => {
      const activeService = new Service({
        cupsCode: '890201',
        description: 'Active service',
        status: 'active'
      });

      const inactiveService = new Service({
        cupsCode: '890202',
        description: 'Inactive service',
        status: 'inactive'
      });

      await activeService.save();
      await inactiveService.save();

      const activeServices = await Service.find({ status: 'active' });
      const inactiveServices = await Service.find({ status: 'inactive' });

      expect(activeServices).toHaveLength(1);
      expect(activeServices[0].cupsCode).toBe('890201');
      expect(inactiveServices).toHaveLength(1);
      expect(inactiveServices[0].cupsCode).toBe('890202');
    });

    it('should populate contract references', async () => {
      const contractId = new mongoose.Types.ObjectId();
      
      const service = new Service({
        cupsCode: '890201',
        description: 'Test service with contract',
        contracts: [{
          contractId: contractId,
          value: 75000,
          requiresAuthorization: true
        }]
      });

      const savedService = await service.save();
      expect(savedService.contracts[0].contractId.toString()).toBe(contractId.toString());
    });

    it('should allow multiple contracts for same service', async () => {
      const contractId1 = new mongoose.Types.ObjectId();
      const contractId2 = new mongoose.Types.ObjectId();
      
      const service = new Service({
        cupsCode: '890201',
        description: 'Service with multiple contracts',
        contracts: [
          {
            contractId: contractId1,
            value: 50000,
            requiresAuthorization: false
          },
          {
            contractId: contractId2,
            value: 75000,
            requiresAuthorization: true
          }
        ]
      });

      const savedService = await service.save();
      expect(savedService.contracts).toHaveLength(2);
      expect(savedService.contracts[0].value).toBe(50000);
      expect(savedService.contracts[1].value).toBe(75000);
    });

    it('should validate contract dates', async () => {
      const validFrom = new Date();
      const validTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      
      const service = new Service({
        cupsCode: '890201',
        description: 'Service with date validation',
        contracts: [{
          contractId: new mongoose.Types.ObjectId(),
          value: 50000,
          validFrom: validFrom,
          validTo: validTo
        }]
      });

      const savedService = await service.save();
      expect(savedService.contracts[0].validFrom).toEqual(validFrom);
      expect(savedService.contracts[0].validTo).toEqual(validTo);
    });
  });

  describe('Service Query Operations', () => {
    beforeEach(async () => {
      // Create test data
      await Service.create([
        {
          cupsCode: '890201',
          description: 'Consulta médica general',
          category: 'Consulta',
          status: 'active'
        },
        {
          cupsCode: '890202',
          description: 'Consulta especializada',
          category: 'Consulta',
          status: 'active'
        },
        {
          cupsCode: '890301',
          description: 'Procedimiento quirúrgico',
          category: 'Cirugía',
          status: 'inactive'
        }
      ]);
    });

    it('should find services by category', async () => {
      const consultaServices = await Service.find({ category: 'Consulta' });
      expect(consultaServices).toHaveLength(2);
    });

    it('should find services by text search in description', async () => {
      const consultaServices = await Service.find({ 
        description: { $regex: 'Consulta', $options: 'i' } 
      });
      expect(consultaServices).toHaveLength(2);
    });

    it('should find services by cupsCode', async () => {
      const service = await Service.findOne({ cupsCode: '890201' });
      expect(service).toBeTruthy();
      expect(service.description).toBe('Consulta médica general');
    });

    it('should count services by status', async () => {
      const activeCount = await Service.countDocuments({ status: 'active' });
      const inactiveCount = await Service.countDocuments({ status: 'inactive' });
      
      expect(activeCount).toBe(2);
      expect(inactiveCount).toBe(1);
    });
  });
});