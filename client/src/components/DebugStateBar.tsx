import { debugState, isDevMode, type DebugState } from '../api/debug';

const STATES: DebugState[] = ['loading', 'empty', 'error'];

// Shown only with ?devMode=true. Picking a state reloads with ?debug=<state>
// so queries start from a clean cache.
export function DebugStateBar() {
  if (!isDevMode()) return null;
  const active = debugState();

  const apply = (state: DebugState | null) => {
    const url = new URL(window.location.href);
    if (state) {
      url.searchParams.set('debug', state);
    } else {
      url.searchParams.delete('debug');
    }
    window.location.assign(url);
  };

  return (
    <div className="fixed right-3 bottom-3 z-50 flex items-center gap-1.5 rounded-full border border-gray-300 bg-white/80 px-3 py-1.5 text-xs shadow-lg backdrop-blur-md dark:border-gray-600 dark:bg-gray-950/80">
      <span className="font-semibold text-gray-500 uppercase dark:text-gray-400">Test state</span>
      {STATES.map((s) => (
        <button
          key={s}
          onClick={() => apply(active === s ? null : s)}
          aria-pressed={active === s}
          className={`rounded-full px-2 py-0.5 capitalize ${
            active === s
              ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
              : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-white/10'
          }`}
        >
          {s}
        </button>
      ))}
      {active && (
        <button
          onClick={() => apply(null)}
          className="rounded-full px-2 py-0.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-white/10"
        >
          off
        </button>
      )}
    </div>
  );
}
