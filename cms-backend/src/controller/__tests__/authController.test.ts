import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../model/UserModel';
import bcrypt from 'bcrypt';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Controller', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const userData = {
        firstName: 'Rishanthan',
        lastName: 'Sritharan',
        email: 'e20338@eng.pdn.ac.lk',
        password: 'password123',
        address: 'No 2, LLG Division, Poonagala',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user).toHaveProperty('email', userData.email);
    });

    it('should not create user with existing email', async () => {
      const userData = {
        firstName: 'Rishanthan',
        lastName: 'Sritharan',
        email: 'e20338@eng.pdn.ac.lk',
        password: 'password123',
        address: 'No 2, LLG Division, Poonagala',
      };

      // Create first user
      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveProperty('email', 'Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        firstName: 'Rishanthan',
        lastName: 'Sritharan',
        email: 'e20338@eng.pdn.ac.lk',
        password: hashedPassword,
        address: 'No 2, LLG Division, Poonagala',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'e20338@eng.pdn.ac.lk',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'e20338@eng.pdn.ac.lk',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/user-details', () => {
    let accessToken: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        firstName: 'Rishanthan',
        lastName: 'Sritharan',
        email: 'e20338@eng.pdn.ac.lk',
        password: hashedPassword,
        address: 'No 2, LLG Division, Poonagala',
      });

      // Login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'e20338@eng.pdn.ac.lk',
          password: 'password123',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should get user details with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/user-details')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'e20338@eng.pdn.ac.lk');
      expect(response.body).toHaveProperty('firstName', 'Rishanthan');
      expect(response.body).toHaveProperty('lastName', 'Sritharan');
      expect(response.body).toHaveProperty('address', 'No 2, LLG Division, Poonagala');
    });

    it('should not get user details without token', async () => {
      const response = await request(app)
        .get('/api/auth/user-details');

      expect(response.status).toBe(401);
    });
  });
}); 