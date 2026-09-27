import { useEffect, useRef, useState } from 'react';
import { FilterSidebar } from '../components/FilterSidebar';
import { SearchInput } from '../components/SearchInput';
import { SortControls } from '../components/SortControls';
import { ThemeToggle } from '../components/ThemeToggle';
import { UserList } from '../components/UserList';
import { DEFAULTS, useDirectoryParams } from '../hooks/useDirectoryParams';

const PANEL =
  'rounded-xl bg-white/60 shadow-sm backdrop-blur-sm dark:bg-gray-950/55';

export function DirectoryPage() {
  const { params, update } = useDirectoryParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [columns, setColumns] = useState<1 | 3>(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activeFilters = params.nationalities.length + params.hobbies.length;
  const clearAll = () => update({ ...DEFAULTS });

  useEffect(() => {
    if (!sheetOpen) return;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheetOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sheetOpen]);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-6xl flex-col gap-4 p-4 text-gray-900 dark:text-gray-100">
      <header className={`flex flex-wrap items-center gap-3 p-3 ${PANEL}`}>
        <h1 className="text-xl font-bold">User Directory</h1>
        <div className="min-w-48 flex-1">
          <SearchInput />
        </div>
        <SortControls />
        <button
          onClick={() => setColumns(columns === 1 ? 3 : 1)}
          aria-label={columns === 1 ? 'Switch to grid view' : 'Switch to list view'}
          title={columns === 1 ? 'Switch to grid view' : 'Switch to list view'}
          className="hidden rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 md:block dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/10"
        >
          {columns === 1 ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="4" rx="1" />
              <rect x="3" y="10" width="18" height="4" rx="1" />
              <rect x="3" y="16" width="18" height="4" rx="1" />
            </svg>
          )}
        </button>
        <ThemeToggle />
        <button
          onClick={() => setSheetOpen(true)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm md:hidden dark:border-gray-600"
        >
          Filters{activeFilters > 0 && (
            <span className="ml-1.5 rounded-full bg-gray-900 px-1.5 py-0.5 text-xs text-white dark:bg-gray-100 dark:text-gray-900">
              {activeFilters}
            </span>
          )}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 gap-4">
        <aside className={`hidden w-64 shrink-0 overflow-y-auto p-3 md:block ${PANEL}`}>
          <FilterSidebar />
        </aside>
        <main className={`min-h-0 flex-1 p-3 ${PANEL}`}>
          <UserList onClearFilters={clearAll} columns={columns} />
        </main>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-xl dark:bg-gray-950">
            <div className="flex items-center justify-between pb-2">
              <h2 className="font-semibold">Filters</h2>
              <button
                ref={closeButtonRef}
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <FilterSidebar />
          </div>
        </div>
      )}
    </div>
  );
}
