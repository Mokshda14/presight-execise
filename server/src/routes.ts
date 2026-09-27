import { Router } from 'express';
import type { DB } from './db.js';
import { getFacets, listUsers } from './queries.js';
import {
  facetsQuerySchema,
  usersQuerySchema,
  validateQuery,
  type FacetsQuery,
  type UsersQuery,
} from './validation.js';

export function createApiRouter(db: DB): Router {
  const router = Router();

  router.get('/users', validateQuery(usersQuerySchema), (_req, res) => {
    const { sort, dir, page, limit, ...filter } = res.locals.validated as UsersQuery;
    res.json(listUsers(db, filter, sort, dir, page, limit));
  });

  router.get('/facets', validateQuery(facetsQuerySchema), (_req, res) => {
    res.json(getFacets(db, res.locals.validated as FacetsQuery));
  });

  return router;
}
