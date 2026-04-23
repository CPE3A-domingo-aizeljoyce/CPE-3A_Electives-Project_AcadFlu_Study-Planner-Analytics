import { createContext, useContext, useState, useEffect, useRef } from 'react';

// ── Accent palette ────────────────────────────────────────────────────────────
export const ACCENT_PALETTE = {
  indigo: { main: '#6366f1', light: '#8b5cf6', rgb: '99,102,241'  },
  blue:   { main: '#3b82f6', light: '#60a5fa', rgb: '59,130,246'  },
  purple: { main: '#8b5cf6', light: '#a78bfa', rgb: '139,92,246'  },
  cyan:   { main: '#06b6d4', light: '#22d3ee', rgb: '6,182,212'   },
  green:  { main: '#22c55e', light: '#4ade80', rgb: '34,197,94'   },
  rose:   { main: '#f43f5e', light: '#fb7185', rgb: '244,63,94'   },
};

// ── Color palettes ────────────────────────────────────────────────────────────
const DARK = {
  bg: '#0d1117', card: '#131929', card2: '#0f1626', border: '#1a2540',
  sidebar: '#0f1626', text: '#e2e8f0', textSub: '#94a3b8', textMuted: '#64748b',
  navActiveText: '#ffffff', chartGrid: '#1a2540',
  tooltipBg: '#1a2235', tooltipBorder: '#2a3550', inputScheme: 'dark',
};

const LIGHT = {
  bg: '#f0f4f8', card: '#ffffff', card2: '#f1f5f9', border: '#e2e8f0',
  sidebar: '#ffffff', text: '#0f172a', textSub: '#475569', textMuted: '#94a3b8',
  navActiveText: 'accent', chartGrid: '#e2e8f0',
  tooltipBg: '#ffffff', tooltipBorder: '#e2e8f0', inputScheme: 'light',
};

// ── Constants ─────────────────────────────────────────────────────────────────
const LS_KEY   = 'sf_appearance';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const defaultState = {
  theme:       'dark',
  accentColor: 'indigo',
  compactMode: false,
  animations:  true,
  showXPBar:   true,
  showStreak:  true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Read cached appearance from localStorage (used for instant, flicker-free initial render) */
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return defaultState;
}

/** Apply appearance values to the DOM immediately (CSS variables + class names) */
function applyToDOM(state) {
  const pal  = ACCENT_PALETTE[state.accentColor] ?? ACCENT_PALETTE.indigo;
  const cols = state.theme === 'dark' ? DARK : LIGHT;
  const root = document.documentElement;

  root.style.setProperty('--accent',        pal.main);
  root.style.setProperty('--accent-light',  pal.light);
  root.style.setProperty('--accent-rgb',    pal.rgb);
  root.style.setProperty('--sf-bg',         cols.bg);
  root.style.setProperty('--sf-card',       cols.card);
  root.style.setProperty('--sf-card2',      cols.card2);
  root.style.setProperty('--sf-border',     cols.border);
  root.style.setProperty('--sf-text',       cols.text);
  root.style.setProperty('--sf-text-sub',   cols.textSub);
  root.style.setProperty('--sf-text-muted', cols.textMuted);
  root.style.setProperty('--background',    cols.bg);
  root.style.setProperty('--foreground',    cols.text);
  root.style.setProperty('--border',        cols.border);

  root.setAttribute('data-theme', state.theme);
  if (state.theme === 'dark') { root.classList.add('dark');  root.classList.remove('light'); }
  else                        { root.classList.add('light'); root.classList.remove('dark');  }

  if (state.compactMode) root.setAttribute('data-compact', 'true');
  else                   root.removeAttribute('data-compact');

  if (!state.animations) root.setAttribute('data-no-anim', 'true');
  else                   root.removeAttribute('data-no-anim');
}

/**
 * Fetch the user's saved appearance from the backend.
 * Returns null if not logged in, on error, or if no appearance data found.
 */
async function fetchAppearanceFromBackend() {
  const token = localStorage.getItem('token');
  if (!token) return null;     // not logged in — skip silently

  try {
    const res = await fetch(`${BASE_URL}/api/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.appearance ?? null;
  } catch (err) {
    // Network error, backend down, etc. — graceful fallback
    console.warn('[AppearanceProvider] Could not load from backend:', err.message);
    return null;
  }
}

/**
 * Save the current appearance state to the backend (database).
 * Fire-and-forget — errors are logged but never thrown.
 */
async function saveAppearanceToBackend(appearance) {
  const token = localStorage.getItem('token');
  if (!token) return;     // not logged in — skip silently

  try {
    const res = await fetch(`${BASE_URL}/api/settings`, {
      method:  'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ appearance }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[AppearanceProvider] DB save failed:', err.error || err.message);
    }
  } catch (err) {
    console.warn('[AppearanceProvider] DB save network error:', err.message);
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppearanceCtx = createContext(null);

export function AppearanceProvider({ children }) {
  // Initialize from localStorage immediately — prevents any flash on first paint
  const [state, setState] = useState(loadFromLocalStorage);

  /**
   * isHydrating = true while the initial backend fetch is in flight.
   * Prevents the "save to DB" effect from firing during the DB→state hydration,
   * which would wastefully write back the same data we just loaded.
   */
  const isHydrating = useRef(true);
  const saveTimer   = useRef(null);

  // ── Effect 1: Apply state to DOM + localStorage on every change ───────────
  useEffect(() => {
    applyToDOM(state);
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  // ── Effect 2: On mount — fetch authoritative appearance from backend ───────
  useEffect(() => {
    fetchAppearanceFromBackend()
      .then(dbData => {
        if (dbData) {
          // Merge with defaults to handle any missing fields from older DB records
          const merged = { ...defaultState, ...dbData };
          setState(merged);
          // applyToDOM + localStorage are handled by Effect 1 above
        }
      })
      .catch(() => {
        // Should not reach here (fetchAppearanceFromBackend never throws),
        // but kept for safety
      })
      .finally(() => {
        // Use setTimeout(0) to push this AFTER React has processed the setState
        // above and run Effect 3 for the hydration re-render.
        // This guarantees the hydration's state change does NOT trigger a DB save.
        setTimeout(() => {
          isHydrating.current = false;
        }, 0);
      });

    // Cleanup: cancel any pending save timer when component unmounts
    return () => clearTimeout(saveTimer.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 3: Save to backend when user changes a setting (debounced) ─────
  useEffect(() => {
    // Skip during initial hydration (state loaded from DB, no need to re-save)
    if (isHydrating.current) return;

    // Debounce: wait 600ms after last change before calling API.
    // This prevents hammering the backend while the user is clicking
    // through accent colors quickly.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveAppearanceToBackend(state);
    }, 600);

    // Cleanup: cancel pending save if state changes again before timer fires
    return () => clearTimeout(saveTimer.current);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ─────────────────────────────────────────────────────────
  const patch  = (partial) => setState(prev => ({ ...prev, ...partial }));
  const colors = state.theme === 'dark' ? DARK : LIGHT;
  const accent = ACCENT_PALETTE[state.accentColor] ?? ACCENT_PALETTE.indigo;

  return (
    <AppearanceCtx.Provider value={{
      // Raw state
      theme:       state.theme,
      accentColor: state.accentColor,
      compactMode: state.compactMode,
      animations:  state.animations,
      showXPBar:   state.showXPBar,
      showStreak:  state.showStreak,
      // Derived
      colors,
      accent,
      // Setters — each calls patch() which triggers Effect 3 (save to DB)
      setTheme:      (t) => patch({ theme: t }),
      setAccent:     (a) => patch({ accentColor: a }),
      setCompact:    (v) => patch({ compactMode: v }),
      setAnimations: (v) => patch({ animations: v }),
      setShowXPBar:  (v) => patch({ showXPBar: v }),
      setShowStreak: (v) => patch({ showStreak: v }),
    }}>
      {children}
    </AppearanceCtx.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceCtx);
  if (!ctx) throw new Error('useAppearance must be used inside <AppearanceProvider>');
  return ctx;
}