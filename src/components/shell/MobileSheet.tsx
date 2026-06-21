import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useDragControls, useMotionValue, type PanInfo } from 'framer-motion';

/**
 * Mobile bottom sheet with two snap points — peek (first section visible) and
 * full (near-fullscreen takeover). Dragging is driven from the handle only
 * (dragControls + dragListener=false) so the sheet body scrolls natively
 * without fighting the drag gesture.
 *
 * Snap positions are translateY offsets in px: 0 = fully open (sheet at its
 * top), peekY = collapsed so only ~42vh peeks above the fold. Recomputed on
 * resize / orientation change.
 */

const SPRING = { type: 'spring', stiffness: 420, damping: 40 } as const;
// Visible sheet height when collapsed: just the grab handle, the
// Overview/Advanced bar, and the report heading down to ~its second line —
// enough to signal "drag me up", not the whole first section.
const PEEK_PX = 190;

export function MobileSheet({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [peekY, setPeekY] = useState(0);
  const y = useMotionValue(0);
  const controls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transition = reduce ? { duration: 0 } : SPRING;

  // Measure snap points before paint to start in peek without a flash.
  useLayoutEffect(() => {
    const compute = () => {
      const vh = window.innerHeight;
      const sheetH = sheetRef.current?.offsetHeight ?? vh * 0.92;
      const peek = Math.max(0, Math.round(sheetH - PEEK_PX));
      setPeekY(peek);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Snap to the current state whenever it (or the measured peek) changes.
  useEffect(() => {
    const controls2 = animate(y, expanded ? 0 : peekY, transition);
    return controls2.stop;
  }, [expanded, peekY, y, transition]);

  // Drag release: snap to whichever state the projected position (current +
  // fling velocity) is nearer to. A pure tap has ~zero offset and snaps back to
  // the current state (a no-op); the handle's onClick handles tap-to-toggle.
  const onDragEnd = (_: PointerEvent, info: PanInfo) => {
    const projected = y.get() + info.velocity.y * 0.2;
    setExpanded(projected < peekY / 2);
  };

  return (
    <motion.div
      ref={sheetRef}
      className="md:hidden fixed inset-x-0 bottom-0 z-40 h-[92dvh] flex flex-col bg-panel border-t border-edge-bright/70 rounded-t-[20px] shadow-[0_-12px_40px_rgb(var(--c-void)/0.7)]"
      style={{ y }}
      drag="y"
      dragControls={controls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: peekY }}
      dragElastic={0.04}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        aria-label={expanded ? 'Collapse report' : 'Expand report'}
        className="flex-none flex justify-center py-2.5 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => controls.start(e)}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="w-11 h-1 rounded-full bg-edge-bright" />
      </button>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </motion.div>
  );
}
