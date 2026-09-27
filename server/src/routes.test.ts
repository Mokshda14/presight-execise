import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { fixtureDb } from './test-fixture';
import { createApiRouter } from './routes';

function makeApp() {
  const app = express();
  app.use('/api', createApiRouter(fixtureDb()));
  return app;
}

describe('GET /api/users', () => {
  let app: express.Express;
  beforeEach(() => { app = makeApp(); });

  it('returns users with pagination metadata and defaults', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 25, total: 6, hasMore: false });
    expect(res.body.users[0]).toHaveProperty('hobbies');
    // default sort: first_name asc
    expect(res.body.users[0].first_name).toBe('Alice');
  });

  it('applies combined filters from query params', async () => {
    const res = await request(app).get(
      '/api/users?q=a&nationalities=French&hobbies=Reading',
    );
    expect(res.status).toBe(200);
    expect(res.body.users.map((u: any) => u.first_name)).toEqual(['Alice', 'Carol']);
  });

  it('applies sort, dir, page, limit', async () => {
    const res = await request(app).get('/api/users?sort=age&dir=desc&page=2&limit=2');
    expect(res.body.users.map((u: any) => u.id)).toEqual([6, 4]); // [5,3] [6,4] [1,2]
  });

  it('rejects invalid sort with 400', async () => {
    const res = await request(app).get('/api/users?sort=email');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects invalid dir with 400', async () => {
    const res = await request(app).get('/api/users?dir=sideways');
    expect(res.status).toBe(400);
  });

  it('rejects non-numeric page and out-of-range limit with 400', async () => {
    expect((await request(app).get('/api/users?page=abc')).status).toBe(400);
    expect((await request(app).get('/api/users?limit=1000')).status).toBe(400);
  });

  it('rejects an unsafe-integer page with 400 instead of a raw DB error', async () => {
    const res = await request(app).get('/api/users?page=99999999999999999999999');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('trims surrounding whitespace in q', async () => {
    const trimmed = await request(app).get('/api/users?q=smith');
    const padded = await request(app).get(`/api/users?q=${encodeURIComponent('  smith  ')}`);
    expect(padded.status).toBe(200);
    expect(padded.body.total).toBe(trimmed.body.total);
    expect(padded.body.total).toBe(2); // Alice Smith, Carol Smith

    const whitespaceOnly = await request(app).get(`/api/users?q=${encodeURIComponent('   ')}`);
    expect(whitespaceOnly.body.total).toBe(6); // treated as no filter
  });

  it('dedupes repeated filter values so counts match the deduped set', async () => {
    const deduped = await request(app).get('/api/users?hobbies=Chess');
    const repeated = await request(app).get('/api/users?hobbies=Chess,Chess');
    expect(repeated.status).toBe(200);
    expect(repeated.body.total).toBe(deduped.body.total);
    expect(repeated.body.total).toBe(3);
  });
});

describe('validation error shape', () => {
  let app: express.Express;
  beforeEach(() => { app = makeApp(); });

  it('reports the offending param path in details on a 400', async () => {
    const res = await request(app).get('/api/users?sort=email');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid request');
    expect(res.body.details).toEqual([
      expect.objectContaining({ path: 'sort', message: expect.any(String) }),
    ]);
  });

  it('aggregates every invalid param into one 400 response', async () => {
    const res = await request(app).get('/api/users?sort=email&dir=sideways&limit=1000');
    expect(res.status).toBe(400);
    const paths = res.body.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['sort', 'dir', 'limit']));
    expect(res.body.details).toHaveLength(3);
  });
});

describe('GET /api/facets', () => {
  it('returns scoped facet lists', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/facets?q=smith');
    expect(res.status).toBe(200);
    expect(res.body.nationalities).toEqual([{ value: 'French', count: 2 }]);
    expect(res.body.hobbies[0]).toEqual({ value: 'Reading', count: 2 });
  });
});
