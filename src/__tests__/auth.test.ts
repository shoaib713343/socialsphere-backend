// src/__tests__/auth.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app';
import redisClient from '../config/redis'; // 1. Import the Redis client
import { sendEmail } from '../utils/mail';
import { httpServer, io } from '../socket';

// Tell Jest to replace the real 'sendEmail' with a fake (mock) version
jest.mock('../utils/mail');

describe('Auth API', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  // This is the updated afterAll hook
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await redisClient.quit(); // 2. Add this line to politely close the Redis connection
    io.close();
    httpServer.close();
});

  beforeEach(() => {
    (sendEmail as jest.Mock).mockClear();
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
      // Create a user first to ensure there's a duplicate
      await request(app).post('/api/v1/auth/register').send({
        username: 'firstuser',
        email: 'duplicate@example.com',
        password: 'password123',
      });
      (sendEmail as jest.Mock).mockClear();

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