const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const { User } = require('../../src/models/User');
const jwt = require('jsonwebtoken');

describe('API Integration Tests', () => {
  let mongoServer;
  let authToken;
  let testUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);

    // Create a test user and get auth token
    testUser = new User({
      username: 'testadmin',
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      fullName: 'Test Admin',
      role: 'admin'
    });
    
    await testUser.save();

    // Generate JWT token for authentication
    authToken = jwt.sign(
      { 
        userId: testUser._id, 
        username: testUser.username, 
        role: testUser.role 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'API funcionando');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('phase');
    });
  });

  describe('Protected Routes', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });

    it('should allow authenticated requests with valid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Ruta no encontrada');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .options('/')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Helmet security headers
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-download-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });
});