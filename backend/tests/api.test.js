import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';

describe('IntellMeet Backend API Test Suite', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await mongoose.connection.close();
  });

  test('GET /api/v1/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.service, 'IntellMeet Backend API');
  });

  test('GET / returns 200 with platform welcome info', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'online');
  });

  test('POST /api/v1/auth/register fails with invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'invalid-email-format',
        password: 'Pass'
      });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/v1/auth/login fails with unregistered credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent_test_999@intellmeet.com',
        password: 'wrongpassword'
      });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('GET non-existent route returns 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route-endpoint');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
  });
});
