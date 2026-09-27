export type SortField = 'first_name' | 'last_name' | 'age' | 'nationality';
export type SortDir = 'asc' | 'desc';

export interface User {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies: string[];
}

export interface UserFilter {
  q?: string;
  nationalities?: string[];
  hobbies?: string[];
}

export interface UsersResponse {
  users: User[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface FacetsResponse {
  hobbies: FacetValue[];
  nationalities: FacetValue[];
}
