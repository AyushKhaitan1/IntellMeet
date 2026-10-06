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

  // Frontend contract integration tests (Vaishali client compatibility)
  describe('Frontend Client Compatibility Layer', () => {
    let authToken = '';
    let createdRoomId = '';
    const uniqueEmail = `frontend_test_${Date.now()}@intellmeet.com`;

    test('POST /api/auth/signup returns flat token, _id, name, and email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Frontend Test User',
          email: uniqueEmail,
          password: 'Password@123'
        });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.token, 'Token must be present at top level');
      assert.ok(res.body._id, 'User _id must be present at top level');
      assert.strictEqual(res.body.name, 'Frontend Test User');
      authToken = res.body.token;
    });

    test('POST /api/auth/login returns flat token and verifies credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'Password@123'
        });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token, 'Token must be returned on login');
      authToken = res.body.token;
    });

    test('POST /api/meetings creates meeting with roomId for frontend', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Frontend Sprint Review',
          date: '2026-10-10',
          startTime: '10:00',
          endTime: '11:00'
        });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body._id, 'Meeting must have _id');
      assert.ok(res.body.roomId, 'Meeting must have roomId');
      assert.strictEqual(res.body.title, 'Frontend Sprint Review');
      assert.strictEqual(res.body.date, '2026-10-10');
      assert.strictEqual(res.body.startTime, '10:00');
      assert.strictEqual(res.body.endTime, '11:00');
      createdRoomId = res.body.roomId;
    });

    test('GET /api/meetings returns array of meetings for dashboard', async () => {
      const res = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body), 'Response must be an Array');
      assert.ok(res.body.length > 0, 'Must have at least one meeting');
      assert.ok(res.body[0].roomId, 'Meeting item must have roomId');
    });

    test('GET /api/meetings/:roomId/summary returns summary and actionItems', async () => {
      const res = await request(app)
        .get(`/api/meetings/${createdRoomId}/summary`)
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(typeof res.body.summary === 'string', 'Summary must be a string');
      assert.ok(Array.isArray(res.body.actionItems), 'actionItems must be an array');
    });

    test('POST /api/tasks creates task without requiring workspace ID', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Verify WebRTC Streams', status: 'todo' });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body._id, 'Task must have _id');
      assert.strictEqual(res.body.title, 'Verify WebRTC Streams');
    });

    test('GET /api/tasks returns array of tasks for team board', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body), 'Tasks must be an array');
      assert.ok(res.body.length > 0);
    });
  });
});
