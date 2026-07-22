import { useEffect, useState } from 'react';

/**
 * Responsive breakpoint helpers for the Excellon DS.
 *
 * Breakpoints mirror the Tailwind defaults used across the app:
 *   sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536 (px, min-width).
 *
 * These hooks are for JS-driven layout decisions only (e.g. rendering a
 * table as cards on mobile). Purely visual adaptation should prefer CSS
 * media queries / Tailwind responsive utilities. SSR-safe (defaults to the
 * desktop layout before hydration to avoid layout flashes on the server).
 */

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/** Subscribe to a media query. Returns false during SSR / before mount. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mql = window.matchMedia(query);
    const handleChange = () => setMatches(mql.matches);

    handleChange();
    // addEventListener is supported in all evergreen browsers; the older
    // addListener fallback keeps Safari < 14 from throwing.
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    }
    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, [query]);

  return matches;
}

/** True when the viewport is at least the given breakpoint (min-width). */
export function useMinWidth(breakpoint: BreakpointKey): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

export interface BreakpointState {
  /** < md (768px) — phone layout. */
  isMobile: boolean;
  /** >= md and < lg — tablet layout. */
  isTablet: boolean;
  /** >= lg (1024px) — desktop layout. */
  isDesktop: boolean;
}

/**
 * Coarse layout buckets for the common "phone / tablet / desktop" split.
 * Defaults to desktop before mount so the initial paint matches the
 * historical fixed layout (avoids a mobile flash on desktop).
 */
export function useBreakpoint(): BreakpointState {
  const isMdUp = useMinWidth('md');
  const isLgUp = useMinWidth('lg');

  return {
    isMobile: !isMdUp,
    isTablet: isMdUp && !isLgUp,
    isDesktop: isLgUp,
  };
}
