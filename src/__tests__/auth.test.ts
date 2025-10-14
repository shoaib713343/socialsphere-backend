// src/__tests__/auth.test.ts
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app';
import redisClient from '../config/redis';
import { sendEmail } from '../utils/mail';
import { httpServer, io } from '../socket';

// Tell Jest to automatically use the fake versions from the __mocks__ folder
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
    io.close();
    httpServer.close();
  });

  beforeEach(() => {
    // Clear the history of our fake functions before each test
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
      expect(sendEmail).toHaveBeenCalled(); // Check if the fake email function was called
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
      expect(sendEmail).not.toHaveBeenCalled(); // Ensure no email was sent on failure
    });
  });
});