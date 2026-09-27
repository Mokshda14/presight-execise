import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Tip {
  text: string;
  x: number;
  y: number;
  below: boolean;
}

const EDGE = 44; // below this distance from the top, the tip flips downward
const HALF_MAX_W = 140; // half of max-w-64, keeps a centered tip on screen

// One delegated listener for all `data-tip` elements, so rows recycling in the
// virtual list don't churn listeners. `data-tip-overflow` elements only get a
// tip while their text is actually truncated.
export function TooltipLayer() {
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    let anchor: HTMLElement | null = null;

    const hide = () => {
      if (anchor) {
        anchor = null;
        setTip(null);
      }
    };

    const showFor = (el: HTMLElement) => {
      if (el.hasAttribute('data-tip-overflow') && el.scrollWidth <= el.clientWidth) {
        hide();
        return;
      }
      const r = el.getBoundingClientRect();
      const below = r.top < EDGE;
      anchor = el;
      setTip({
        text: el.dataset.tip!,
        x: Math.min(Math.max(r.left + r.width / 2, HALF_MAX_W), window.innerWidth - HALF_MAX_W),
        y: below ? r.bottom : r.top,
        below,
      });
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.('[data-tip]') as HTMLElement | null;
      if (el === anchor) return;
      el ? showFor(el) : hide();
    };

    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', hide);
    document.addEventListener('scroll', hide, true); // fixed position goes stale
    document.addEventListener('mousedown', hide, true);
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', hide);
      document.removeEventListener('scroll', hide, true);
      document.removeEventListener('mousedown', hide, true);
    };
  }, []);

  if (!tip) return null;
  return createPortal(
    <div
      role="tooltip"
      className={`pointer-events-none fixed z-70 max-w-64 -translate-x-1/2 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900 ${
        tip.below ? 'translate-y-1.5' : '-mt-1.5 -translate-y-full'
      }`}
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.text}
    </div>,
    document.body,
  );
}
