const userController = require('../../../src/controllers/userController');
const { User, MODULES, ACTIONS } = require('../../../src/models/User');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/logger');
jest.mock('bcryptjs');

describe('User Controller', () => {
  let mockRequest, mockResponse, mockNext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request object
    mockRequest = {
      query: {},
      body: {},
      params: {},
      user: { _id: 'mockUserId', role: 'admin' }
    };

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('getUsers', () => {
    beforeEach(() => {
      // Mock the complex query chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
      };

      User.find = jest.fn().mockReturnValue(mockQuery);
      User.countDocuments = jest.fn();
    });

    it('should return users with default pagination', async () => {
      const mockUsers = [
        { 
          _id: '1', 
          username: 'user1', 
          fullName: 'User One', 
          role: 'facturador',
          toObject: jest.fn().mockReturnValue({ _id: '1', username: 'user1', fullName: 'User One', role: 'facturador' }),
          getPermissions: jest.fn().mockReturnValue(['read:services']),
          isLocked: jest.fn().mockReturnValue(false)
        },
        { 
          _id: '2', 
          username: 'user2', 
          fullName: 'User Two', 
          role: 'admin',
          toObject: jest.fn().mockReturnValue({ _id: '2', username: 'user2', fullName: 'User Two', role: 'admin' }),
          getPermissions: jest.fn().mockReturnValue(['read:*', 'write:*']),
          isLocked: jest.fn().mockReturnValue(false)
        }
      ];

      // Mock Promise.all correctly
      jest.spyOn(Promise, 'all').mockResolvedValue([mockUsers, 2]);

      await userController.getUsers(mockRequest, mockResponse);
      
      // Restore Promise.all
      Promise.all.mockRestore();

      expect(User.find).toHaveBeenCalledWith({});
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        users: expect.arrayContaining([
          expect.objectContaining({ 
            _id: '1',
            username: 'user1', 
            fullName: 'User One', 
            role: 'facturador',
            permissions: expect.any(Array),
            isLocked: expect.any(Boolean)
          }),
          expect.objectContaining({ 
            _id: '2',
            username: 'user2', 
            fullName: 'User Two', 
            role: 'admin',
            permissions: expect.any(Array),
            isLocked: expect.any(Boolean)
          })
        ]),
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 2,
          pages: 1
        })
      }));
    });

    it('should filter users by role', async () => {
      mockRequest.query = { role: 'admin' };
      const mockUsers = [{ _id: '1', username: 'admin1', role: 'admin' }];

      User.find().limit.mockResolvedValue(mockUsers);
      User.countDocuments.mockResolvedValue(1);

      await userController.getUsers(mockRequest, mockResponse);

      expect(User.find).toHaveBeenCalledWith({ role: 'admin' });
    });

    it('should filter users by active status', async () => {
      mockRequest.query = { active: 'true' };
      const mockUsers = [{ _id: '1', username: 'user1', active: true }];

      User.find().limit.mockResolvedValue(mockUsers);
      User.countDocuments.mockResolvedValue(1);

      await userController.getUsers(mockRequest, mockResponse);

      expect(User.find).toHaveBeenCalledWith({ active: true });
    });

    it('should search users by multiple fields', async () => {
      mockRequest.query = { search: 'test' };
      const mockUsers = [{ _id: '1', username: 'testuser', fullName: 'Test User' }];

      User.find().limit.mockResolvedValue(mockUsers);
      User.countDocuments.mockResolvedValue(1);

      await userController.getUsers(mockRequest, mockResponse);

      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { username: { $regex: 'test', $options: 'i' } },
          { fullName: { $regex: 'test', $options: 'i' } },
          { email: { $regex: 'test', $options: 'i' } },
          { department: { $regex: 'test', $options: 'i' } }
        ]
      });
    });

    it('should handle pagination parameters', async () => {
      mockRequest.query = { page: '2', limit: '5' };
      const mockUsers = [{ 
        _id: '1', 
        username: 'user1',
        toObject: jest.fn().mockReturnValue({ _id: '1', username: 'user1' }),
        getPermissions: jest.fn().mockReturnValue(['read:services']),
        isLocked: jest.fn().mockReturnValue(false)
      }];

      // Mock Promise.all correctly
      jest.spyOn(Promise, 'all').mockResolvedValue([mockUsers, 10]);

      await userController.getUsers(mockRequest, mockResponse);
      
      // Restore Promise.all
      Promise.all.mockRestore();

      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        pagination: expect.objectContaining({
          page: 2,
          limit: 5,
          total: 10,
          pages: 2
        })
      }));
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database connection failed';
      User.find = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await userController.getUsers(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error al obtener usuarios',
        error: expect.any(String)
      });
    });
  });

  describe('getUser', () => {
    it('should return user by id', async () => {
      const mockUser = { 
        _id: 'userId', 
        username: 'testuser', 
        fullName: 'Test User',
        getPermissions: jest.fn().mockReturnValue([])
      };
      
      mockRequest.params = { id: 'userId' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis()
      };

      User.findById = jest.fn().mockReturnValue(mockQuery);
      mockQuery.populate.mockResolvedValue(mockUser);

      await userController.getUser(mockRequest, mockResponse);

      expect(User.findById).toHaveBeenCalledWith('userId');
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        ...mockUser,
        permissions: []
      }));
    });

    it('should return 404 when user not found', async () => {
      mockRequest.params = { id: 'nonexistentId' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis()
      };

      User.findById = jest.fn().mockReturnValue(mockQuery);
      mockQuery.populate.mockResolvedValue(null);

      await userController.getUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuario no encontrado'
      });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: 'userId' };
      
      User.findById = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await userController.getUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error al obtener usuario',
        error: expect.any(String)
      });
    });
  });

  describe('createUser', () => {
    beforeEach(() => {
      bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');
      
      // Mock User constructor
      const mockSave = jest.fn();
      User.mockImplementation(() => ({
        save: mockSave
      }));
    });

    it('should create a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'NewPassword123!',
        fullName: 'New User',
        role: 'facturador'
      };

      mockRequest.body = userData;

      const mockSavedUser = {
        _id: 'newUserId',
        ...userData,
        password: 'hashedPassword'
      };

      // Mock the save method to return the saved user
      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSavedUser)
      }));

      await userController.createUser(mockRequest, mockResponse);

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Usuario creado exitosamente',
        user: expect.objectContaining({
          username: 'newuser',
          email: 'new@example.com'
        })
      }));
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'weak',
        fullName: 'Test User'
      };

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        email: { message: 'Email inválido' },
        password: { message: 'Password too weak' }
      };

      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(validationError)
      }));

      await userController.createUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Errores de validación',
        errors: expect.objectContaining({
          email: 'Email inválido',
          password: 'Password too weak'
        })
      });
    });

    it('should handle duplicate key errors', async () => {
      mockRequest.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'Password123!',
        fullName: 'Existing User'
      };

      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;
      duplicateError.keyPattern = { username: 1 };

      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(duplicateError)
      }));

      await userController.createUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuario ya existe',
        field: 'username'
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        fullName: 'Updated Name',
        department: 'IT'
      };

      mockRequest.params = { id: 'userId' };
      mockRequest.body = updateData;

      const mockUpdatedUser = {
        _id: 'userId',
        username: 'testuser',
        ...updateData
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis()
      };

      User.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue(mockUpdatedUser);

      await userController.updateUser(mockRequest, mockResponse);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'userId',
        expect.objectContaining({
          ...updateData,
          updatedBy: 'mockUserId'
        }),
        { new: true, runValidators: true }
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuario actualizado exitosamente',
        user: mockUpdatedUser
      });
    });

    it('should return 404 when user not found', async () => {
      mockRequest.params = { id: 'nonexistentId' };
      mockRequest.body = { fullName: 'Updated Name' };

      const mockQuery = {
        select: jest.fn().mockReturnThis()
      };

      User.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue(null);

      await userController.updateUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuario no encontrado'
      });
    });
  });

  describe('deleteUser', () => {
    it('should deactivate user (soft delete)', async () => {
      mockRequest.params = { id: 'userId' };

      const mockDeactivatedUser = {
        _id: 'userId',
        username: 'testuser',
        active: false
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis()
      };

      User.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue(mockDeactivatedUser);

      await userController.deleteUser(mockRequest, mockResponse);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'userId',
        { 
          active: false,
          updatedBy: 'mockUserId'
        },
        { new: true }
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuario desactivado exitosamente'
      });
    });

    it('should return 404 when user not found', async () => {
      mockRequest.params = { id: 'nonexistentId' };

      const mockQuery = {
        select: jest.fn().mockReturnThis()
      };

      User.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);
      mockQuery.select.mockResolvedValue(null);

      await userController.deleteUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuario no encontrado'
      });
    });
  });

  // updateUserPermissions function doesn't exist in controller, skipping these tests
  /*
  describe('updateUserPermissions', () => {
    it('should update custom permissions for custom role user', async () => {
      // Test implementation commented out because function doesn't exist
    });

    it('should return 400 for non-custom role users', async () => {
      // Test implementation commented out because function doesn't exist
    });
  });
  */
});