import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserList } from './UserList';
import * as api from '../api/client';

vi.mock('../api/client');

const EMPTY_PAGE = { users: [], page: 1, limit: 25, total: 0, hasMore: false };

function renderList(onClear = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <UserList onClearFilters={onClear} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return onClear;
}

describe('UserList states', () => {
  it('shows skeleton cards while the first page is loading', () => {
    vi.mocked(api.fetchUsers).mockReturnValue(new Promise(() => {})); // never settles
    renderList();
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(6);
  });

  it('shows the empty state and wires up Clear all filters', async () => {
    vi.mocked(api.fetchUsers).mockResolvedValue(EMPTY_PAGE);
    const onClear = renderList();
    expect(await screen.findByText('No users match your filters.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Clear all filters'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('shows the error state and recovers on Retry', async () => {
    vi.mocked(api.fetchUsers).mockRejectedValueOnce(new Error('network down'));
    renderList();
    expect(await screen.findByText(/Something went wrong: network down/)).toBeInTheDocument();

    vi.mocked(api.fetchUsers).mockResolvedValue(EMPTY_PAGE);
    fireEvent.click(screen.getByText('Retry'));
    expect(await screen.findByText('No users match your filters.')).toBeInTheDocument();
  });
});
