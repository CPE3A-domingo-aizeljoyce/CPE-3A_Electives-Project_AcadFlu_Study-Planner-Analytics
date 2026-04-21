import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, ListTodo, Timer, BarChart2, Target, BookOpen, Trophy,
  Flame, Zap, X, Brain, Settings, ChevronLeft, ChevronRight,
  User, LogOut, Palette, Menu,
} from 'lucide-react';
import { useAppearance } from './AppearanceProvider';
import { logoutUser } from '../api/authApi';

import { fetchAchievements } from '../api/achievementsApi';

// ─── Reactive mobile-width hook ───────────────────────────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

function getLevelInfo(xp) {
  const LEVEL_NAMES = [
    'Novice','Apprentice','Student','Learner','Scholar',
    'Adept','Practitioner','Expert','Sage','Master',
    'Scholar','Expert','Grand Sage','Grand Master','Champion',
    'Elite','Legend','Supreme','Mythic','Legendary',
  ];
  const level    = Math.max(1, Math.floor(xp / 200) + 1);
  const levelXP  = (level - 1) * 200;
  const nextXP   = level * 200;
  const progress = Math.round(((xp - levelXP) / 200) * 100);
  const name     = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
  return { level, name, xp, levelXP, nextXP, progress };
}

// ─── Navigation items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/app',              icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/app/tasks',        icon: ListTodo,        label: 'Tasks'                  },
  { to: '/app/timer',        icon: Timer,           label: 'Study Timer'            },
  { to: '/app/analytics',    icon: BarChart2,       label: 'Analytics'              },
  { to: '/app/goals',        icon: Target,          label: 'Goals'                  },
  { to: '/app/notes',        icon: BookOpen,        label: 'Notes'                  },
  { to: '/app/achievements', icon: Trophy,          label: 'Achievements'           },
];

const SETTINGS_KEY = 'sf_settings';
const defaultProfile = { name: 'Moran', username: 'mrnski' };

const loadSavedProfile = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const payload = raw ? JSON.parse(raw) : null;
    return payload?.profile || defaultProfile;
  } catch {
    return defaultProfile;
  }
};

const getProfileInitials = (name) => {
  if (!name || !name.trim()) return '??';
  return name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
};

// ─── Profile Dropdown ─────────────────────────────────────────────────────────
function ProfileDropdown({ colors, accent, lvl, realXP, profile, profileInitials, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const isMobile = useIsMobile(640);

  const posStyle = isMobile
    ? { top: 64, left: 8, right: 8, width: 'auto', maxWidth: '100%' }
    : { bottom: 80, left: 'var(--profile-left, 16px)', width: 240 };

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current?.contains(e.target)) return;
      if (e.target.closest('[data-profile-trigger]')) return;
      onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const go = (path) => { navigate(path); onClose(); };

  const menuItems = [
    { icon: User,     label: 'View Profile', path: '/app/settings' },
    { icon: Palette,  label: 'Appearance',   path: '/app/settings' },
    { icon: Settings, label: 'Settings',     path: '/app/settings' },
  ];

  return (
    <div ref={panelRef} className="fixed z-[9999] rounded-2xl overflow-hidden shadow-2xl"
      style={{ ...posStyle, background: colors.card, border: `1px solid ${colors.border}` }}>
      <div className="p-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm text-white flex-shrink-0"
            style={{ fontWeight: 800, background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 16px rgba(${accent.rgb},.4)` }}>
            {profileInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm truncate" style={{ fontWeight: 700, color: colors.text }}>{profile.name}</p>
            <p className="text-xs" style={{ color: accent.main, fontWeight: 500 }}>Pro Scholar</p>
          </div>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: colors.card2 ?? colors.bg }}>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs" style={{ color: colors.textMuted }}>Lv {lvl.level} · {lvl.name}</span>
            <span className="text-xs" style={{ fontWeight: 600, color: accent.main }}>{realXP.toLocaleString()} XP</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: colors.border }}>
            <div className="h-full rounded-full" style={{ width: `${lvl.progress}%`, background: `linear-gradient(90deg, ${accent.main}, ${accent.light})` }} />
          </div>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{(lvl.nextXP - realXP).toLocaleString()} XP to Level {lvl.level + 1}</p>
        </div>
      </div>
      <div className="p-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.label} onClick={() => go(item.path)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left"
              style={{ color: colors.textSub, background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = `rgba(${accent.rgb},.08)`}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: colors.textMuted }} />
              <span className="text-sm" style={{ fontWeight: 500 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="p-2 pt-0" style={{ borderTop: `1px solid ${colors.border}` }}>
        <button onClick={() => { logoutUser(); navigate('/'); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left"
          style={{ color: '#f87171', background: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm" style={{ fontWeight: 500 }}>Log out</span>
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────
function SidebarContent({ collapsed, isMobile, colors, accent, lvl, realXP, realStreak, showStreak, showXPBar, compactMode, animations, showProfile, setShowProfile, onClose, profile, profileInitials }) {
  const navPy = compactMode ? '0.4rem' : '0.6rem';
  const dur   = animations ? '280ms' : '0ms';

  const navActiveText   = colors.navActiveText === 'accent' ? accent.main : (colors.navActiveText || '#ffffff');
  const navActiveBg     = `linear-gradient(135deg, rgba(${accent.rgb},0.22), rgba(${accent.rgb},0.10))`;
  const navActiveShadow = `0 0 0 1px rgba(${accent.rgb},0.3), inset 0 1px 0 rgba(255,255,255,0.05)`;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0"
        style={{ padding: compactMode ? '12px 16px' : '20px 16px', borderBottom: `1px solid ${colors.border}` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 16px rgba(${accent.rgb},.35)` }}>
          <Brain className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <span className="text-sm flex-1" style={{ fontWeight: 700, color: colors.text }}>StudyFlow</span>
        )}
        {isMobile && (
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: colors.card, color: colors.textMuted, border: 'none', cursor: 'pointer' }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Streak badge */}
      {showStreak && (
        <div style={{ padding: compactMode ? '8px 12px 0' : '12px 12px 0', flexShrink: 0 }}>
          {(!collapsed || isMobile) ? (
            <div className="flex items-center gap-2.5 rounded-xl"
              style={{ padding: compactMode ? '8px 12px' : '10px 12px', background: 'linear-gradient(135deg, rgba(249,115,22,.15), rgba(249,115,22,.06))', border: '1px solid rgba(249,115,22,.25)' }}>
              <Flame className="w-4 h-4 flex-shrink-0" style={{ color: '#fb923c' }} />
              <div>
                <p className="text-xs" style={{ fontWeight: 600, color: '#fb923c' }}>{realStreak} {realStreak === 1 ? 'Day' : 'Days'} Streak</p>
                {!compactMode && <p className="text-xs" style={{ color: colors.textSub }}>Keep it going!</p>}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(249,115,22,.15)', border: '1px solid rgba(249,115,22,.25)' }}>
                <Flame className="w-4 h-4" style={{ color: '#fb923c' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto flex flex-col" style={{ padding: `${compactMode ? '8px' : '12px'} 12px`, gap: compactMode ? 2 : 3 }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            title={collapsed && !isMobile ? label : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: `${navPy} 12px`, borderRadius: 12, fontSize: 13,
              textDecoration: 'none',
              justifyContent: collapsed && !isMobile ? 'center' : undefined,
              transition: `background ${dur}, color ${dur}`,
              color: isActive ? navActiveText : colors.textSub,
              fontWeight: isActive ? 600 : 500,
              ...(isActive ? { background: navActiveBg, boxShadow: navActiveShadow } : {}),
            })}
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? accent.main : colors.textMuted, transition: `color ${dur}` }} />
                {(!collapsed || isMobile) && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* XP progress bar */}
      {showXPBar && (!collapsed || isMobile) && (
        <div className="mx-3 mb-3 rounded-xl flex-shrink-0"
          style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: compactMode ? '8px 12px' : '10px 12px' }}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" style={{ color: accent.main }} />
              <span className="text-xs" style={{ fontWeight: 600, color: colors.textSub }}>Lv {lvl.level} {lvl.name}</span>
            </div>
            <span className="text-xs" style={{ color: colors.textMuted }}>{realXP.toLocaleString()} / {lvl.nextXP.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: colors.border }}>
            <div className="h-full rounded-full" style={{
              width: `${lvl.progress}%`,
              background: `linear-gradient(90deg, ${accent.main}, ${accent.light})`,
              boxShadow: `0 0 8px rgba(${accent.rgb},.5)`,
              transition: animations ? 'width 600ms ease' : 'none',
            }} />
          </div>
        </div>
      )}

      {/* Bottom: Settings + Profile */}
      <div className="flex-shrink-0" style={{ padding: '0 12px 12px', borderTop: `1px solid ${colors.border}` }}>
        <NavLink to="/app/settings"
          title={collapsed && !isMobile ? 'Settings' : undefined}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: `${navPy} 12px`, borderRadius: 12, fontSize: 13,
            textDecoration: 'none',
            justifyContent: collapsed && !isMobile ? 'center' : undefined,
            marginTop: 12,
            transition: `background ${dur}, color ${dur}`,
            color: isActive ? navActiveText : colors.textSub,
            fontWeight: isActive ? 600 : 500,
          })}
        >
          {({ isActive }) => (
            <>
              <Settings className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? accent.main : colors.textMuted }} />
              {(!collapsed || isMobile) && <span>Settings</span>}
            </>
          )}
        </NavLink>

        {/* Profile row */}
        {(!collapsed || isMobile) ? (
          <div className="mt-1">
            <button
              data-profile-trigger
              onClick={() => setShowProfile(v => !v)}
              className="w-full flex items-center gap-2.5 rounded-xl transition-colors text-left"
              style={{ padding: `${navPy} 12px`, border: 'none', cursor: 'pointer', background: showProfile ? `rgba(${accent.rgb},.08)` : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = `rgba(${accent.rgb},.08)`}
              onMouseLeave={e => { if (!showProfile) e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white"
                  style={{ fontWeight: 700, background: `linear-gradient(135deg, ${accent.main}, ${accent.light})` }}>
                  {profileInitials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#22c55e', border: `2px solid ${colors.sidebar}` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate" style={{ fontWeight: 600, color: colors.text }}>{profile.name}</p>
                <p className="text-xs" style={{ color: accent.main, fontWeight: 500 }}>Pro Scholar</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex justify-center mt-2">
            <button
              data-profile-trigger
              onClick={() => setShowProfile(v => !v)}
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs text-white transition-opacity"
              style={{ fontWeight: 700, background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, border: 'none', cursor: 'pointer' }}>
              {profileInitials}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{ background: '#22c55e', border: `2px solid ${colors.sidebar}` }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export function Layout() {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const location = useLocation();
  const { accent, colors, compactMode, animations, showXPBar, showStreak } = useAppearance();

  
  const [realXP, setRealXP] = useState(0);
  const [realStreak, setRealStreak] = useState(0);

  const lvl     = getLevelInfo(realXP);
  const sbWidth = collapsed ? 72 : 240;
  const dur     = animations ? '280ms' : '0ms';

  useEffect(() => {
    const loadRealStats = async () => {
      try {
        const data = await fetchAchievements();
        if (data && data.stats) {
          setRealXP(data.stats.totalXP || 0);
          setRealStreak(data.stats.streak || 0);
        }
      } catch (error) {
        console.error('Failed to load real stats for sidebar:', error);
      }
    };
    loadRealStats();
  }, [location.pathname]); // Re-fetch every time user changes tabs

  useEffect(() => {
    document.documentElement.style.setProperty('--profile-left', `${sbWidth + 8}px`);
  }, [sbWidth]);

  useEffect(() => {
    setMobileOpen(false);
    setShowProfile(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const [profile, setProfile] = useState(() => loadSavedProfile());
  const profileInitials = getProfileInitials(profile.name);

  useEffect(() => {
    const handleSettingsUpdated = (event) => {
      const payload = event?.detail || null;
      if (payload?.profile) {
        setProfile(payload.profile);
      } else {
        setProfile(loadSavedProfile());
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === SETTINGS_KEY) {
        setProfile(loadSavedProfile());
      }
    };

    window.addEventListener('studyTimerSettingsUpdated', handleSettingsUpdated);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('studyTimerSettingsUpdated', handleSettingsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const sidebarProps = {
    colors, accent, lvl, realXP, realStreak, showStreak, showXPBar, compactMode, animations,
    showProfile, setShowProfile,
    profile, profileInitials,
  };

  return (
    <div className="sf-root flex h-screen overflow-hidden" style={{ background: colors.bg, fontFamily: "'Inter', sans-serif" }}>

      {/* Profile Panel */}
      {showProfile && (
        <ProfileDropdown
          animations={animations}
          colors={colors}
          accent={accent}
          lvl={lvl}
          realXP={realXP}
          profile={profile}
          profileInitials={profileInitials}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className="fixed top-0 left-0 h-full z-50 sm:hidden flex-shrink-0"
        style={{ width: 272, background: colors.sidebar, borderRight: `1px solid ${colors.border}`,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: `transform ${dur} cubic-bezier(0.4,0,0.2,1)`,
          boxShadow: mobileOpen ? '4px 0 32px rgba(0,0,0,.3)' : 'none' }}>
        <SidebarContent {...sidebarProps} collapsed={false} isMobile onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden sm:flex flex-col flex-shrink-0 relative h-full"
        style={{ width: sbWidth, background: colors.sidebar, borderRight: `1px solid ${colors.border}`,
          transition: `width ${dur} cubic-bezier(0.4,0,0.2,1)` }}>
        <button onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: accent.main, border: `2px solid ${colors.sidebar}`, cursor: 'pointer' }}>
          {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
        </button>
        <SidebarContent {...sidebarProps} collapsed={collapsed} isMobile={false} onClose={() => {}} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="sm:hidden flex items-center gap-3 px-4 flex-shrink-0"
          style={{ height: 56, background: colors.sidebar, borderBottom: `1px solid ${colors.border}` }}>
          <button onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: colors.card, color: colors.textSub, border: 'none', cursor: 'pointer' }}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})` }}>
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm" style={{ fontWeight: 700, color: colors.text }}>StudyFlow</span>
          </div>
          <button
            data-profile-trigger
            onClick={() => setShowProfile(v => !v)}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0"
            style={{ fontWeight: 700, background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, border: 'none', cursor: 'pointer' }}>
            {profileInitials}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{ background: '#22c55e', border: `2px solid ${colors.sidebar}` }} />
          </button>
        </header>

        <main key={location.pathname} className={`flex-1 overflow-y-auto ${animations ? 'animate-in fade-in slide-in-from-top-2' : ''}`} style={{ overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}