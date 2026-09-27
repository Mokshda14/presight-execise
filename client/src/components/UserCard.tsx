import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '../api/types';

const POPOVER_W = 224; // w-56

function MoreHobbies({ hobbies }: { hobbies: string[] }) {
  const [pos, setPos] = useState<{ x: number; y: number; up: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const open = pos !== null;
  const close = useCallback(() => setPos(null), []);

  const toggle = () => {
    if (open) return close();
    const r = btnRef.current!.getBoundingClientRect();
    const up = r.bottom > window.innerHeight - 160; // flip up near the bottom
    setPos({
      x: Math.max(8, Math.min(r.left, window.innerWidth - POPOVER_W - 8)),
      y: up ? r.top - 6 : r.bottom + 6,
      up,
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('scroll', close, true); // fixed position goes stale
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('scroll', close, true);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Show ${hobbies.length} more hobbies`}
        className="cursor-pointer rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      >
        +{hobbies.length}
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label="More hobbies"
            className={`fixed z-60 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900 ${
              pos.up ? '-translate-y-full' : ''
            }`}
            style={{ left: pos.x, top: pos.y }}
          >
            <p className="pb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
              More hobbies
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {hobbies.map((h) => (
                <li
                  key={h}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {h}
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}

export function UserCard({ user }: { user: User }) {
  const shown = user.hobbies.slice(0, 2);
  const hidden = user.hobbies.slice(2);
  const fullName = `${user.first_name} ${user.last_name}`;

  return (
    <div className="flex h-24 gap-4 rounded-lg border border-gray-200/60 bg-white/70 p-4 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/65">
      <img
        src={user.avatar}
        alt=""
        className="h-16 w-16 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800"
        loading="lazy"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-baseline justify-between gap-2">
          <span
            data-tip={fullName}
            data-tip-overflow="true"
            className="truncate font-semibold text-gray-900 dark:text-gray-100"
          >
            {fullName}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span data-tip={user.nationality} data-tip-overflow="true" className="truncate">
            {user.nationality}
          </span>
          <span>{user.age}</span>
        </div>
        <div className="flex gap-1.5">
          {shown.map((h) => (
            <span
              key={h}
              data-tip={h}
              data-tip-overflow="true"
              className="truncate rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {h}
            </span>
          ))}
          {hidden.length > 0 && <MoreHobbies hobbies={hidden} />}
        </div>
      </div>
    </div>
  );
}
