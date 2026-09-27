import type { SortDir, SortField } from '../api/types';
import { useDirectoryParams } from '../hooks/useDirectoryParams';

const FIELD_LABELS: Record<SortField, string> = {
  first_name: 'First name',
  last_name: 'Last name',
  age: 'Age',
  nationality: 'Nationality',
};

export function SortControls() {
  const { params, update } = useDirectoryParams();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-gray-500 dark:text-gray-400">Sort</label>
      <select
        id="sort"
        value={params.sort}
        onChange={(e) => update({ sort: e.target.value as SortField })}
        className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
      >
        {(Object.keys(FIELD_LABELS) as SortField[]).map((f) => (
          <option key={f} value={f}>{FIELD_LABELS[f]}</option>
        ))}
      </select>
      <select
        aria-label="Sort direction"
        value={params.dir}
        onChange={(e) => update({ dir: e.target.value as SortDir })}
        className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </div>
  );
}
