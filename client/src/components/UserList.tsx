import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { fetchUsers } from '../api/client';
import { useDirectoryParams } from '../hooks/useDirectoryParams';
import { UserCard } from './UserCard';
import { EmptyState, ErrorState, SkeletonCard } from './ListStates';

const ROW_HEIGHT = 104; // 96 card + 8 gap

interface Props {
  onClearFilters: () => void;
  columns?: 1 | 3;
}

export function UserList({ onClearFilters, columns = 1 }: Props) {
  const { params } = useDirectoryParams();

  const query = useInfiniteQuery({
    queryKey: ['users', params],
    queryFn: ({ pageParam }) => fetchUsers(params, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  const users = query.data?.pages.flatMap((p) => p.users) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const rowCount = Math.ceil(users.length / columns);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: query.hasNextPage ? rowCount + 1 : rowCount, // +1 = loader row
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // load the next page once the loader row scrolls into view
  const virtualItems = virtualizer.getVirtualItems();
  const lastItem = virtualItems.at(-1);
  useEffect(() => {
    if (
      lastItem &&
      lastItem.index >= rowCount - 1 &&
      query.hasNextPage &&
      !query.isFetchingNextPage
    ) {
      query.fetchNextPage();
    }
  }, [lastItem?.index, rowCount, query.hasNextPage, query.isFetchingNextPage]);

  if (query.isPending) {
    return (
      <div className="space-y-2 p-1">
        {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  if (query.isError) {
    return <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />;
  }
  if (users.length === 0) {
    return <EmptyState onClear={onClearFilters} />;
  }

  return (
    <div className="flex h-full flex-col">
      <p className="pb-2 text-sm text-gray-500 dark:text-gray-400">{total.toLocaleString()} users</p>
      <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualItems.map((vi) => {
            const isLoader = vi.index >= rowCount;
            const rowUsers = users.slice(vi.index * columns, vi.index * columns + columns);
            return (
              <div
                key={vi.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: vi.size,
                  transform: `translateY(${vi.start}px)`,
                }}
                className="pb-2 pr-1"
              >
                {isLoader ? (
                  <div className="flex justify-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    Loading more…
                  </div>
                ) : columns === 1 ? (
                  <UserCard user={rowUsers[0]} />
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {rowUsers.map((u) => <UserCard key={u.id} user={u} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
