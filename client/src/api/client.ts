import type { DirectoryParams } from '../hooks/useDirectoryParams';
import { serializeParams } from '../hooks/useDirectoryParams';
import { simulate } from './debug';
import type { FacetsResponse, UsersResponse } from './types';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* keep default message */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function fetchUsers(p: DirectoryParams, page: number): Promise<UsersResponse> {
  const simulated = simulate<UsersResponse>({ users: [], page, limit: 25, total: 0, hasMore: false });
  if (simulated) return simulated;

  const sp = serializeParams(p);
  // sort/dir sent explicitly even at defaults, so requests are self-describing
  sp.set('sort', p.sort);
  sp.set('dir', p.dir);
  sp.set('page', String(page));
  sp.set('limit', '25');
  return getJson<UsersResponse>(`/api/users?${sp.toString()}`);
}

export function fetchFacets(p: DirectoryParams): Promise<FacetsResponse> {
  const simulated = simulate<FacetsResponse>({ hobbies: [], nationalities: [] });
  if (simulated) return simulated;

  const sp = new URLSearchParams();
  if (p.q) sp.set('q', p.q);
  if (p.nationalities.length) sp.set('nationalities', p.nationalities.join(','));
  if (p.hobbies.length) sp.set('hobbies', p.hobbies.join(','));
  const qs = sp.toString();
  return getJson<FacetsResponse>(qs ? `/api/facets?${qs}` : '/api/facets');
}
