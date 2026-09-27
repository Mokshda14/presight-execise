import { useEffect, useState } from 'react';
import { useDirectoryParams } from '../hooks/useDirectoryParams';

export function SearchInput() {
  const { params, update } = useDirectoryParams();
  const [value, setValue] = useState(params.q);

  // Resync on external URL changes (back/forward, clear all). Compared on trim
  // so a trailing space you're still typing doesn't get eaten.
  useEffect(() => {
    setValue((prev) => (prev.trim() === params.q ? prev : params.q));
  }, [params.q]);

  useEffect(() => {
    if (value.trim() === params.q) return;
    const t = setTimeout(() => update({ q: value.trim() }), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search by first or last name…"
      aria-label="Search users by name"
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:focus:border-gray-400"
    />
  );
}
