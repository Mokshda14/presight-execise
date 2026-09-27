import type { FacetValue } from '../api/types';

interface Props {
  title: string;
  items: FacetValue[];
  selected: string[];
  onToggle: (value: string) => void;
  dimmed: boolean;
}

export function FacetList({ title, items, selected, onToggle, dimmed }: Props) {
  const inList = new Set(items.map((i) => i.value));
  const pinned = selected
    .map((s) => items.find((i) => i.value === s) ?? { value: s, count: null });
  const rest = items.filter((i) => !selected.includes(i.value));

  const row = (value: string, count: number | null) => (
    <label
      key={value}
      className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-white/10"
    >
      <span className="flex min-w-0 items-center gap-2">
        <input
          type="checkbox"
          checked={selected.includes(value)}
          onChange={() => onToggle(value)}
          className="accent-gray-900 dark:accent-gray-200"
        />
        <span className="truncate">{value}</span>
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500">{count ?? '—'}</span>
    </label>
  );

  return (
    <section className={dimmed ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
      <h3 className="px-2 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      {pinned.map((i) => row(i.value, i.count))}
      {rest.map((i) => row(i.value, i.count))}
      {inList.size === 0 && pinned.length === 0 && (
        <p className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500">No values</p>
      )}
    </section>
  );
}
