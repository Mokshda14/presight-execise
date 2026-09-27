import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterSidebar } from './FilterSidebar';
import * as api from '../api/client';

vi.mock('../api/client');

function renderSidebar(initialEntry = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={qc}>
        <FilterSidebar />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('FilterSidebar states', () => {
  it('shows the error state and recovers on Retry', async () => {
    vi.mocked(api.fetchFacets).mockRejectedValueOnce(new Error('facets down'));
    renderSidebar();
    expect(await screen.findByText(/Something went wrong: facets down/)).toBeInTheDocument();

    vi.mocked(api.fetchFacets).mockResolvedValue({
      hobbies: [{ value: 'Chess', count: 3 }],
      nationalities: [],
    });
    fireEvent.click(screen.getByText('Retry'));
    expect(await screen.findByText('Chess')).toBeInTheDocument();
  });

  it('shows Clear all only while filters are active, and clears them', async () => {
    vi.mocked(api.fetchFacets).mockResolvedValue({ hobbies: [], nationalities: [] });
    renderSidebar('/?hobbies=Chess,Reading');
    expect(await screen.findByText('2 filters active')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear all'));
    expect(screen.queryByText(/filters? active/)).not.toBeInTheDocument();
  });
});
