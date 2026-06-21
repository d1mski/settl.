import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query. Mirrors the matchMedia + change-listener
 * pattern used in ThemeContext. Returns the current match state, updating on
 * viewport changes (resize, orientation, devtools breakpoint flips).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
