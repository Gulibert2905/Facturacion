const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const { User } = require('../../src/models/User');

describe('Authentication Integration Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean database before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User',
        role: 'facturador'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid user data', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'weak',
        fullName: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 409 for duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User'
      };

      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          email: 'different@example.com'
        })
        .expect(409);

      expect(response.body.message).toContain('Usuario ya existe');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User',
        role: 'facturador'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent user', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(404);

      expect(response.body.message).toContain('Usuario no encontrado');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User',
        role: 'facturador'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should initiate password reset for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.message).toContain('token de restablecimiento');
    });

    it('should return 404 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.message).toContain('Usuario no encontrado');
    });
  });
});