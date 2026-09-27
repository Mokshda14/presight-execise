// Opt-in state simulation for manual testing:
//   ?devMode=true            shows the state switcher
//   ?devMode=true&debug=...  forces loading / empty / error

export type DebugState = 'loading' | 'empty' | 'error';

const STATES: readonly DebugState[] = ['loading', 'empty', 'error'];

export function isDevMode(): boolean {
  return new URLSearchParams(window.location.search).get('devMode') === 'true';
}

export function debugState(): DebugState | null {
  if (!isDevMode()) return null;
  const v = new URLSearchParams(window.location.search).get('debug');
  return STATES.includes(v as DebugState) ? (v as DebugState) : null;
}

/** Simulated response for the active debug state, or null to fetch for real. */
export function simulate<T>(emptyPayload: T): Promise<T> | null {
  switch (debugState()) {
    case 'loading':
      return new Promise(() => {}); // never settles, keeps the query pending
    case 'empty':
      return Promise.resolve(emptyPayload);
    case 'error':
      return Promise.reject(new Error('Simulated failure (?debug=error)'));
    default:
      return null;
  }
}
