import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchFacets } from '../api/client';
import { useDirectoryParams } from '../hooks/useDirectoryParams';
import { FacetList } from './FacetList';
import { ErrorState } from './ListStates';

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterSidebar() {
  const { params, update } = useDirectoryParams();
  const facetKey = { q: params.q, nationalities: params.nationalities, hobbies: params.hobbies };

  const query = useQuery({
    queryKey: ['facets', facetKey],
    queryFn: () => fetchFacets(params),
    placeholderData: keepPreviousData, // dim rather than unmount while refetching
  });

  if (query.isError) {
    return (
      <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
    );
  }

  const dimmed = query.isPlaceholderData || query.isPending;
  const facets = query.data ?? { hobbies: [], nationalities: [] };
  const activeCount = params.nationalities.length + params.hobbies.length;

  return (
    <div aria-busy={dimmed}>
      {activeCount > 0 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {activeCount} filter{activeCount > 1 ? 's' : ''} active
          </span>
          <button
            onClick={() => update({ nationalities: [], hobbies: [] })}
            className="text-sm font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Clear all
          </button>
        </div>
      )}
      <FacetList
        title="Hobbies"
        items={facets.hobbies}
        selected={params.hobbies}
        onToggle={(v) => update({ hobbies: toggle(params.hobbies, v) })}
        dimmed={dimmed}
      />
      <FacetList
        title="Nationalities"
        items={facets.nationalities}
        selected={params.nationalities}
        onToggle={(v) => update({ nationalities: toggle(params.nationalities, v) })}
        dimmed={dimmed}
      />
    </div>
  );
}
