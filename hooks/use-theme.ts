"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

/**
 * Resolve a preference into the concrete `theme-dark` class on <html>. Mirrors
 * the inline no-flash script in `app/layout.tsx` — both must apply the same rule
 * so there's no flash between the pre-paint script and React hydration.
 */
function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("theme-dark", dark);
}

function readStoredTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

// Minimal external store so the toggle's active state reads localStorage via
// `useSyncExternalStore` — no effect-driven setState, no hydration mismatch.
const listeners = new Set<() => void>();
function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}
function getSnapshot(): Theme {
  return readStoredTheme();
}
function getServerSnapshot(): Theme {
  return "system";
}

/**
 * Light/dark/system theme with no-flash hydration. The concrete class is set by
 * the inline script before paint; this hook owns updates — it persists the
 * choice and, while on "system", follows OS changes live.
 */
export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // While following the system, re-apply the class on OS changes (DOM only).
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    if (next === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
    applyTheme(next);
    listeners.forEach((l) => l());
  }, []);

  return { theme, setTheme };
}
