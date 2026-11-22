import { useCallback, useEffect, useRef, useState } from 'react';

type IOSOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};
type HeadingEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };

const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
const needsIOSPermission = () =>
  typeof DeviceOrientationEvent !== 'undefined' &&
  typeof (DeviceOrientationEvent as IOSOrientationEvent).requestPermission === 'function';

/** Shortest-path unwrap so 359° -> 1° animates +2°, not -358°. */
export function unwrapHeading(prev: number | null, next: number): number {
  if (prev === null) return next;
  const delta = ((next - prev) % 360 + 540) % 360 - 180;
  return prev + delta;
}

/** Compass heading in degrees clockwise from true north, unwrapped (may exceed 0..360). Null when no sensor. */
export function readHeading(e: HeadingEvent, screenAngle: number): number | null {
  if (typeof e.webkitCompassHeading === 'number') return e.webkitCompassHeading + screenAngle;
  if (e.absolute && typeof e.alpha === 'number') return 360 - e.alpha + screenAngle;
  return null;
}

/**
 * Phone compass heading. Touch devices only. iOS needs a user tap (`request`)
 * before events flow; Android fires `deviceorientationabsolute` straight away.
 */
export function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [needsPermission, setNeedsPermission] = useState(() => isTouch() && needsIOSPermission());
  const [listening, setListening] = useState(() => isTouch() && !needsIOSPermission());
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!listening) return;
    const onEvent = (e: Event) => {
      const raw = readHeading(e as HeadingEvent, screen.orientation?.angle ?? 0);
      if (raw === null) return;
      const next = unwrapHeading(last.current, raw);
      // ponytail: 1° deadband keeps re-renders down; sensor jitter is bigger than that anyway
      if (last.current !== null && Math.abs(next - last.current) < 1) return;
      last.current = next;
      setHeading(next);
    };
    const type = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(type, onEvent);
    return () => window.removeEventListener(type, onEvent);
  }, [listening]);

  const request = useCallback(async () => {
    try {
      const res = await (DeviceOrientationEvent as IOSOrientationEvent).requestPermission!();
      if (res === 'granted') setListening(true);
    } finally {
      setNeedsPermission(false);
    }
  }, []);

  return { heading, needsPermission, request };
}
