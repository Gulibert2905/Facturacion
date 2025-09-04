const mongoose = require('mongoose');
const { User, MODULES, ACTIONS } = require('../../../src/models/User');

describe('User Model', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/facturacion_test');
    }
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
  });

  describe('User Schema Validation', () => {
    it('should create a valid user with all required fields', () => {
      const validUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User',
        role: 'facturador'
      });

      const validationError = validUser.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should require username field', () => {
      const userWithoutUsername = new User({
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User'
      });

      const validationError = userWithoutUsername.validateSync();
      expect(validationError.errors.username).toBeDefined();
    });

    it('should require email field', () => {
      const userWithoutEmail = new User({
        username: 'testuser',
        password: 'TestPassword123!',
        fullName: 'Test User'
      });

      const validationError = userWithoutEmail.validateSync();
      expect(validationError.errors.email).toBeDefined();
    });

    it('should require password field', () => {
      const userWithoutPassword = new User({
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User'
      });

      const validationError = userWithoutPassword.validateSync();
      expect(validationError.errors.password).toBeDefined();
    });

    it('should require fullName field', () => {
      const userWithoutFullName = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!'
      });

      const validationError = userWithoutFullName.validateSync();
      expect(validationError.errors.fullName).toBeDefined();
    });

    it('should validate email format', () => {
      const userWithInvalidEmail = new User({
        username: 'testuser',
        email: 'invalid-email',
        password: 'TestPassword123!',
        fullName: 'Test User'
      });

      const validationError = userWithInvalidEmail.validateSync();
      expect(validationError.errors.email).toBeDefined();
    });

    it('should validate password complexity', () => {
      const userWithWeakPassword = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        fullName: 'Test User'
      });

      const validationError = userWithWeakPassword.validateSync();
      expect(validationError.errors.password).toBeDefined();
    });

    it('should validate password minimum length', () => {
      const userWithShortPassword = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Short1!',
        fullName: 'Test User'
      });

      const validationError = userWithShortPassword.validateSync();
      expect(validationError.errors.password).toBeDefined();
    });

    it('should validate role enum', () => {
      const userWithInvalidRole = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User',
        role: 'invalidrole'
      });

      const validationError = userWithInvalidRole.validateSync();
      expect(validationError.errors.role).toBeDefined();
    });

    it('should set default role as facturador', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User'
      });

      expect(user.role).toBe('facturador');
    });

    it('should set default active as true', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User'
      });

      expect(user.active).toBe(true);
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(() => {
      user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User',
        role: 'facturador'
      });
    });

    describe('getPermissions()', () => {
      it('should return facturador permissions for facturador role', () => {
        const permissions = user.getPermissions();
        expect(permissions).toEqual(expect.arrayContaining([
          { module: MODULES.DASHBOARD, actions: [ACTIONS.READ] },
          { module: MODULES.PATIENTS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE] }
        ]));
      });

      it('should return all permissions for superadmin role', () => {
        user.role = 'superadmin';
        const permissions = user.getPermissions();
        
        expect(permissions).toHaveLength(Object.values(MODULES).length);
        permissions.forEach(permission => {
          expect(permission.actions).toEqual(Object.values(ACTIONS));
        });
      });

      it('should return custom permissions for custom role', () => {
        user.role = 'custom';
        user.customPermissions = [
          { module: MODULES.DASHBOARD, actions: [ACTIONS.READ] },
          { module: MODULES.PATIENTS, actions: [ACTIONS.READ, ACTIONS.UPDATE] }
        ];
        
        const permissions = user.getPermissions();
        expect(permissions).toEqual(user.customPermissions);
      });
    });

    describe('hasPermission()', () => {
      it('should return true for valid permission', () => {
        const hasPermission = user.hasPermission(MODULES.DASHBOARD, ACTIONS.READ);
        expect(hasPermission).toBe(true);
      });

      it('should return false for invalid permission', () => {
        const hasPermission = user.hasPermission(MODULES.USERS, ACTIONS.DELETE);
        expect(hasPermission).toBeFalsy();
      });

      it('should return false for non-existent module', () => {
        const hasPermission = user.hasPermission('nonexistent', ACTIONS.READ);
        expect(hasPermission).toBeFalsy();
      });
    });

    describe('isLocked()', () => {
      it('should return false when not locked', () => {
        expect(user.isLocked()).toBe(false);
      });

      it('should return true when locked until future date', () => {
        user.lockedUntil = new Date(Date.now() + 10000); // 10 seconds from now
        expect(user.isLocked()).toBe(true);
      });

      it('should return false when lock time has expired', () => {
        user.lockedUntil = new Date(Date.now() - 10000); // 10 seconds ago
        expect(user.isLocked()).toBe(false);
      });
    });

    describe('createPasswordResetToken()', () => {
      it('should create a password reset token', () => {
        const token = user.createPasswordResetToken();
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token).toHaveLength(64); // 32 bytes * 2 (hex)
        expect(user.resetPasswordToken).toBeDefined();
        expect(user.resetPasswordExpires).toBeDefined();
        expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
      });
    });

    describe('isValidResetToken()', () => {
      it('should validate correct reset token', () => {
        const token = user.createPasswordResetToken();
        expect(user.isValidResetToken(token)).toBe(true);
      });

      it('should reject invalid reset token', () => {
        user.createPasswordResetToken();
        expect(user.isValidResetToken('invalidtoken')).toBe(false);
      });

      it('should reject expired reset token', () => {
        const token = user.createPasswordResetToken();
        user.resetPasswordExpires = new Date(Date.now() - 1000); // 1 second ago
        expect(user.isValidResetToken(token)).toBe(false);
      });

      it('should return false when no reset token exists', () => {
        expect(user.isValidResetToken('anytoken')).toBe(false);
      });
    });

    describe('clearPasswordResetToken()', () => {
      it('should clear password reset token fields', () => {
        user.createPasswordResetToken();
        user.clearPasswordResetToken();
        
        expect(user.resetPasswordToken).toBeNull();
        expect(user.resetPasswordExpires).toBeNull();
      });
    });
  });

  describe('User Database Operations', () => {
    it('should save user with unique username', async () => {
      const user = new User({
        username: 'uniqueuser',
        email: 'unique@example.com',
        password: 'TestPassword123!',
        fullName: 'Unique User'
      });

      const savedUser = await user.save();
      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe('uniqueuser');
    });

    it('should save user with unique email', async () => {
      const user1 = new User({
        username: 'user1',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'User One'
      });
      
      const user2 = new User({
        username: 'user2',
        email: 'test@example.com', // Same email
        password: 'TestPassword123!',
        fullName: 'User Two'
      });

      await user1.save();
      await expect(user2.save()).rejects.toThrow();
    });

    it('should automatically set timestamps', async () => {
      const user = new User({
        username: 'timestampuser',
        email: 'timestamp@example.com',
        password: 'TestPassword123!',
        fullName: 'Timestamp User'
      });

      const savedUser = await user.save();
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });
  });
});