import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SortDir, SortField } from '../api/types';

export interface DirectoryParams {
  q: string;
  nationalities: string[];
  hobbies: string[];
  sort: SortField;
  dir: SortDir;
}

const SORT_FIELDS: SortField[] = ['first_name', 'last_name', 'age', 'nationality'];

export const DEFAULTS: DirectoryParams = {
  q: '',
  nationalities: [],
  hobbies: [],
  sort: 'first_name',
  dir: 'asc',
};

function csv(sp: URLSearchParams, key: string): string[] {
  const raw = sp.get(key);
  return raw ? [...new Set(raw.split(',').filter(Boolean))] : [];
}

export function parseParams(sp: URLSearchParams): DirectoryParams {
  const sort = sp.get('sort') as SortField | null;
  const dir = sp.get('dir') as SortDir | null;
  return {
    q: (sp.get('q') ?? '').trim(),
    nationalities: csv(sp, 'nationalities'),
    hobbies: csv(sp, 'hobbies'),
    sort: sort && SORT_FIELDS.includes(sort) ? sort : DEFAULTS.sort,
    dir: dir === 'desc' ? 'desc' : 'asc',
  };
}

export function serializeParams(p: DirectoryParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.q) sp.set('q', p.q);
  if (p.nationalities.length) sp.set('nationalities', p.nationalities.join(','));
  if (p.hobbies.length) sp.set('hobbies', p.hobbies.join(','));
  if (p.sort !== DEFAULTS.sort) sp.set('sort', p.sort);
  if (p.dir !== DEFAULTS.dir) sp.set('dir', p.dir);
  return sp;
}

export function useDirectoryParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = parseParams(searchParams);

  const update = useCallback(
    (patch: Partial<DirectoryParams>) => {
      setSearchParams((prev) => serializeParams({ ...parseParams(prev), ...patch }), {
        replace: false,
      });
    },
    [setSearchParams],
  );

  return { params, update };
}
