import { createContext, useContext, useState, useEffect, useRef } from 'react';

export const ACCENT_PALETTE = {
  indigo: { main: '#6366f1', light: '#8b5cf6', rgb: '99,102,241'  },
  blue:   { main: '#3b82f6', light: '#60a5fa', rgb: '59,130,246'  },
  purple: { main: '#8b5cf6', light: '#a78bfa', rgb: '139,92,246'  },
  cyan:   { main: '#06b6d4', light: '#22d3ee', rgb: '6,182,212'   },
  green:  { main: '#22c55e', light: '#4ade80', rgb: '34,197,94'   },
  rose:   { main: '#f43f5e', light: '#fb7185', rgb: '244,63,94'   },
};

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

const LS_KEY  = 'sf_appearance';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const defaultState = {
  theme:       'dark',
  accentColor: 'indigo',
  compactMode: false,
  animations:  true,
  showXPBar:   true,
  showStreak:  true,
};

// Load from localStorage immediately — prevents theme flash on page load
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return defaultState;
}

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

const AppearanceCtx = createContext(null);

export function AppearanceProvider({ children }) {
  const [state, setState] = useState(loadState);

  // Ref to skip saving back to server immediately after we load FROM the server
  // (prevents unnecessary write right after a read)
  const skipNextServerSave = useRef(false);
  // Ref to skip the very first render's save effect
  const isFirstRender = useRef(true);

  // ── Apply to DOM + localStorage whenever state changes ─────────────────────
  useEffect(() => {
    applyToDOM(state);
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  // ── On mount: load appearance from server if user is logged in ──────────────
  // This is the authoritative source — overrides localStorage with DB value
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${BASE_URL}/api/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.appearance) return;
        const serverAppearance = data.appearance;
        // Mark that the next state change is from server load, not user action
        skipNextServerSave.current = true;
        setState(prev => ({ ...prev, ...serverAppearance }));
      })
      .catch(() => {
        // Silently fail — localStorage value stays applied
      });
  }, []); // ← runs only once on mount

  // ── Save appearance to server whenever user changes it ─────────────────────
  useEffect(() => {
    // Skip the very first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Skip if this change came from a server load (not a user action)
    if (skipNextServerSave.current) {
      skipNextServerSave.current = false;
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Debounce — wait 700ms after last change before saving
    const timer = setTimeout(() => {
      fetch(`${BASE_URL}/api/settings`, {
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ appearance: state }),
      }).catch(() => {
        // Silently fail — next save will catch up
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [state]);

  const patch  = (partial) => setState(prev => ({ ...prev, ...partial }));
  const colors = state.theme === 'dark' ? DARK : LIGHT;
  const accent = ACCENT_PALETTE[state.accentColor] ?? ACCENT_PALETTE.indigo;

  return (
    <AppearanceCtx.Provider value={{
      ...state,
      colors,
      accent,
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
  return useContext(AppearanceCtx);
}