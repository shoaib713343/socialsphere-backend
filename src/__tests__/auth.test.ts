// src/__tests__/auth.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app'; // We still import the clean app
import redisClient from '../config/redis';
import { io } from '../socket'; // We now only import 'io' for cleanup
import { sendEmail } from '../utils/mail';
import { sendSms } from '../utils/sms';

// Mock the external services
jest.mock('../utils/mail');
jest.mock('../utils/sms');

describe('Auth API', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await redisClient.quit();
    io.close(); // Close the Socket.IO instance
    // We no longer need to close httpServer here; Supertest handles the app's lifecycle
  });

  beforeEach(() => {
    // Clear mock history before each test
    (sendEmail as jest.Mock).mockClear();
    (sendSms as jest.Mock).mockClear();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user, call sendEmail, and return 201', async () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.username).toBe('testuser');
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should return 409 for a duplicate email', async () => {
      // Create a user first
      await request(app).post('/api/v1/auth/register').send({
        username: 'firstuser',
        email: 'duplicate@example.com',
        password: 'password123',
      });
      (sendEmail as jest.Mock).mockClear();

      // Attempt to create the same user again
      const existingUser = {
        username: 'anotheruser',
        email: 'duplicate@example.com',
        password: 'password123',
      };
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(existingUser);

      expect(response.statusCode).toBe(409);
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });
});