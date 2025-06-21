import request from 'supertest';
import express from 'express';

// We will test a simple Express app instance
const app = express();
app.get('/', (req, res) => {
  res.status(200).send('PassitPal Backend API is running!');
});

// Test suite for basic API functionality
describe('GET /', () => {
  it('should respond with a 200 status code and the correct message', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('PassitPal Backend API is running!');
  });
});
