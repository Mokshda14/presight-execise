export function SkeletonCard() {
  return (
    <div className="flex h-24 animate-pulse gap-4 rounded-lg border border-gray-200/60 bg-white/70 p-4 dark:border-gray-700/60 dark:bg-gray-900/65">
      <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-gray-600 dark:text-gray-300">No users match your filters.</p>
      <button
        onClick={onClear}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
      >
        Clear all filters
      </button>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert">
      <p className="text-red-600 dark:text-red-400">Something went wrong: {message}</p>
      <button
        onClick={onRetry}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-white/10"
      >
        Retry
      </button>
    </div>
  );
}
