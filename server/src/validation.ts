import { z } from 'zod';
import type { NextFunction, Request, Response } from 'express';
import type { SortDir, SortField } from './types.js';

const SORT_FIELDS = ['first_name', 'last_name', 'age', 'nationality'] as const satisfies readonly SortField[];
const SORT_DIRS = ['asc', 'desc'] as const satisfies readonly SortDir[];

export const MAX_LIMIT = 100;

/** "a, b,,a" -> ["a","b"] */
const commaList = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const items = [...new Set(value.split(',').map((s) => s.trim()).filter(Boolean))];
    return items.length ? items : undefined;
  });

function intParam(fallback: number, min: number, max: number, message: string) {
  return z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return fallback;
      const n = /^\d+$/.test(value) ? Number(value) : NaN;
      if (!Number.isSafeInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: 'custom', message });
        return z.NEVER;
      }
      return n;
    });
}

const filterShape = {
  q: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    }),
  nationalities: commaList,
  hobbies: commaList,
};

export const facetsQuerySchema = z.object(filterShape);

export const usersQuerySchema = z.object({
  ...filterShape,
  sort: z.enum(SORT_FIELDS).default('first_name'),
  dir: z.enum(SORT_DIRS).default('asc'),
  page: intParam(1, 1, Number.MAX_SAFE_INTEGER, 'must be a positive integer'),
  limit: intParam(25, 1, MAX_LIMIT, `must be an integer between 1 and ${MAX_LIMIT}`),
});

export type UsersQuery = z.infer<typeof usersQuerySchema>;
export type FacetsQuery = z.infer<typeof facetsQuerySchema>;

/** Parsed query lands on res.locals.validated; every issue is reported at once. */
export function validateQuery(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.') || 'query',
          message: issue.message,
        })),
      });
      return;
    }
    res.locals.validated = result.data;
    next();
  };
}
