const request = require('supertest');
const express = require('express');

// Crear una aplicación Express simple para pruebas
const app = express();
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Test endpoint' });
});

describe('API Endpoints', () => {
  it('should respond to the test endpoint', async () => {
    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Test endpoint');
  });
});