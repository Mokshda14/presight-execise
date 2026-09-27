import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { openDb, applySchema } from './db.js';
import { seedIfEmpty } from './seed.js';
import { createApiRouter } from './routes.js';
import { openApiSpec } from './openapi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT ?? 3000);
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '..', 'data', 'users.db');
const STATIC_DIR = process.env.STATIC_DIR;
const staticDir = STATIC_DIR ? path.resolve(STATIC_DIR) : undefined;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = openDb(DB_PATH);
applySchema(db);
seedIfEmpty(db);

const app = express();
app.use(compression());
app.get('/api/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'User Directory API docs',
}));
app.use('/api', createApiRouter(db));
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (staticDir && fs.existsSync(staticDir)) {
  // assets/ filenames are content-hashed, so they can be cached forever.
  // index.html stays revalidated so deploys take effect.
  app.use(
    express.static(staticDir, {
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  // SPA fallback
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(staticDir, 'index.html'));
    }
    next();
  });
}

// keep errors as JSON, never Express's HTML page
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  },
);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
