import { useState, useEffect } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import {
  Trophy, Zap, Star, Lock, Flame, Award,
  Rocket, Sunrise, Moon, Sparkles, Swords, Medal,
  Timer, PenLine, Crosshair, Gem, Hourglass, Brain,
  Crown, Shield, Library, RefreshCw,
} from 'lucide-react';
import { fetchAchievements, triggerAchievementCheck } from '../api/achievementsApi';

// ─── Icon map: backend iconKey → Lucide component ─────────────────────────────
const ICON_MAP = {
  Rocket, Sunrise, Moon, Sparkles, Swords, Medal,
  Timer, PenLine, Crosshair, Gem, Hourglass, Brain,
  Crown, Shield, Library,
};

// ─── Rarity styles ────────────────────────────────────────────────────────────
const rarityConfig = {
  common:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Common',    border: 'rgba(148,163,184,0.2)' },
  rare:      { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  label: 'Rare',      border: 'rgba(99,102,241,0.3)'  },
  epic:      { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Epic',      border: 'rgba(139,92,246,0.3)'  },
  legendary: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Legendary', border: 'rgba(251,191,36,0.3)'  },
};

// ─── Level names ──────────────────────────────────────────────────────────────
const LEVEL_NAMES = [
  'Novice','Apprentice','Student','Learner','Scholar',
  'Adept','Expert','Sage','Master','Champion',
  'Grandmaster','Prodigy','Virtuoso','Legend','Mythic',
  'Titan','Ascendant','Immortal','Divine','Transcendent',
];

function getLevelInfo(xp) {
  const level    = Math.max(1, Math.floor(xp / 200) + 1);
  const levelXP  = (level - 1) * 200;
  const nextXP   = level * 200;
  const progress = Math.round(((xp - levelXP) / 200) * 100);
  const name     = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
  return { level, name, xp, levelXP, nextXP, progress };
}

const ALL_CATEGORIES = ['All','Beginner','Habits','Streaks','Performance','Study','Timer','Goals','Progression'];

export function Achievements() {
  const { colors, accent } = useAppearance();

  const [achievements, setAchievements] = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [checking,     setChecking]     = useState(false);
  const [error,        setError]        = useState(null);
  const [filter,       setFilter]       = useState('All');
  const [showLocked,   setShowLocked]   = useState(true);

  // ── Load achievements from backend ────────────────────────────────────────
  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAchievements();
      setAchievements(data.achievements || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to load achievements:', err);
      setError('Failed to load achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Trigger a fresh check + reload ────────────────────────────────────────
  const handleCheck = async () => {
    try {
      setChecking(true);
      await triggerAchievementCheck();
      await loadAchievements();
    } catch (err) {
      console.error('Achievement check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  const lvl = stats ? getLevelInfo(stats.totalXP) : getLevelInfo(0);

  const filtered = achievements.filter(b => {
    const catMatch  = filter === 'All' || b.category === filter;
    const lockMatch = showLocked || b.unlocked;
    return catMatch && lockMatch;
  });

  const recentlyUnlocked = achievements
    .filter(b => b.unlocked && b.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 3);

  if (loading) {
    return (
      <div className="p-4 min-h-full flex items-center justify-center" style={{ background: colors.bg }}>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: accent.main, borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: colors.textMuted }}>Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 min-h-full flex items-center justify-center" style={{ background: colors.bg }}>
        <div className="text-center p-6 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <p className="text-sm mb-3" style={{ color: colors.textMuted }}>{error}</p>
          <button onClick={loadAchievements} className="px-4 py-2 rounded-xl text-sm"
            style={{ background: `rgba(${accent.rgb},0.15)`, color: accent.light, border: `1px solid rgba(${accent.rgb},0.3)` }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-full" style={{ background: colors.bg }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: 700, letterSpacing: '-0.4px', color: colors.text }}>Achievements</h1>
          <p className="text-sm mt-0.5" style={{ color: colors.textSub }}>
            {stats?.unlockedCount ?? 0}/{stats?.totalCount ?? 0} badges earned · {(stats?.totalXP ?? 0).toLocaleString()} total XP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCheck} disabled={checking}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
            style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{checking ? 'Checking...' : 'Refresh'}</span>
          </button>
          <button onClick={() => setShowLocked(!showLocked)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all shrink-0"
            style={showLocked
              ? { background: `rgba(${accent.rgb},0.15)`, color: accent.light, border: `1px solid rgba(${accent.rgb},0.3)`, fontWeight: 500 }
              : { background: colors.card, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showLocked ? 'Showing locked' : 'Hiding locked'}</span>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { icon: <Flame  className="w-4 h-4 text-orange-400" />, label: 'Current Streak', value: `${stats?.streak ?? 0} Days`,         sub: 'Keep it going!',                              bg: 'rgba(249,115,22,0.12)', color: '#f97316'   },
          { icon: <Trophy className="w-4 h-4 text-yellow-400" />, label: 'Badges Earned',  value: `${stats?.unlockedCount ?? 0}`,        sub: `${(stats?.totalCount ?? 0) - (stats?.unlockedCount ?? 0)} remaining`, bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
          { icon: <Zap    className="w-4 h-4 text-indigo-400" />, label: 'Total XP',       value: (stats?.totalXP ?? 0).toLocaleString(), sub: `Level ${lvl.level} · ${lvl.name}`,           bg: 'rgba(99,102,241,0.12)', color: accent.main },
          { icon: <Star   className="w-4 h-4 text-purple-400" />, label: 'Completion',     value: stats ? `${Math.round((stats.unlockedCount / stats.totalCount) * 100)}%` : '0%', sub: 'Achievement rate', bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>{s.icon}</div>
            </div>
            <div className="text-2xl" style={{ fontWeight: 700, color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: colors.textSub }}>{s.label}</div>
            <div className="text-xs" style={{ color: colors.textMuted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Badge grid */}
        <div className="lg:col-span-2">
          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className="px-3 py-1.5 rounded-xl text-xs transition-all"
                style={filter === cat
                  ? { background: `rgba(${accent.rgb},0.2)`, color: accent.light, border: `1px solid rgba(${accent.rgb},0.4)`, fontWeight: 600 }
                  : { background: colors.card, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Badges */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map(badge => {
              const rarity    = rarityConfig[badge.rarity] || rarityConfig.common;
              const IconComp  = ICON_MAP[badge.iconKey] || Trophy;
              const pct       = badge.progress?.total
                ? Math.round((badge.progress.current / badge.progress.total) * 100)
                : 0;
              return (
                <div key={badge.id} className="p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] relative overflow-hidden"
                  style={{
                    background:  badge.unlocked ? rarity.bg : `rgba(${accent.rgb},0.02)`,
                    border:      `1px solid ${badge.unlocked ? rarity.border : colors.border}`,
                    boxShadow:   badge.unlocked ? `0 4px 20px ${rarity.color}20` : 'none',
                    opacity:     badge.unlocked ? 1 : 0.6,
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${badge.color}20`, border: `1px solid ${badge.color}30` }}>
                      <IconComp className="w-5 h-5" style={{ color: badge.unlocked ? badge.color : colors.textMuted }} />
                      {!badge.unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                          style={{ background: 'rgba(13,17,23,0.6)' }}>
                          <Lock className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: `${rarity.color}20`, color: rarity.color, fontWeight: 600 }}>
                      {rarity.label}
                    </span>
                  </div>

                  <div className="text-xs mb-0.5" style={{ fontWeight: 600, color: colors.text }}>{badge.name}</div>
                  <div className="text-xs mb-2 leading-4" style={{ color: colors.textMuted }}>{badge.description}</div>

                  {badge.unlocked ? (
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" style={{ color: accent.main }} />
                      <span className="text-xs" style={{ fontWeight: 600, color: accent.main }}>+{badge.xp} XP</span>
                      {badge.unlockedAt && (
                        <span className="text-xs ml-auto" style={{ color: colors.textMuted }}>
                          {new Date(badge.unlockedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ) : badge.progress?.total > 1 ? (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs" style={{ color: colors.textMuted }}>{badge.progress.current}/{badge.progress.total}</span>
                        <span className="text-xs" style={{ color: colors.textMuted }}>{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: colors.border }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: rarity.color }} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: colors.textMuted }}>+{badge.xp} XP on unlock</span>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-8" style={{ color: colors.textMuted }}>
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No badges in this category</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">

          {/* Level card */}
          <div className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                style={{ fontWeight: 800, fontSize: 18, background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 20px rgba(${accent.rgb},0.4)` }}>
                {lvl.level}
              </div>
              <div>
                <div className="text-base" style={{ fontWeight: 700, color: colors.text }}>Level {lvl.level}</div>
                <div className="text-sm" style={{ color: accent.main }}>{lvl.name}</div>
              </div>
            </div>
            <div className="h-2 rounded-full mb-2" style={{ background: colors.border }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${lvl.progress}%`, background: `linear-gradient(90deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 8px rgba(${accent.rgb},0.5)` }} />
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: colors.textMuted }}>{(stats?.totalXP ?? 0).toLocaleString()} XP</span>
              <span className="text-xs" style={{ color: colors.textMuted }}>{lvl.nextXP.toLocaleString()} XP</span>
            </div>
            <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
              {(lvl.nextXP - (stats?.totalXP ?? 0)).toLocaleString()} XP to Level {lvl.level + 1}
            </p>
          </div>

          {/* Streak heatmap */}
          <div className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm" style={{ fontWeight: 600, color: colors.text }}>Study Streak</h3>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4" style={{ color: '#fb923c' }} />
                <span className="text-sm" style={{ fontWeight: 700, color: '#fb923c' }}>{stats?.streak ?? 0} days</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                const streak  = stats?.streak ?? 0;
                const active  = i >= (35 - streak) && i < 35;
                const isToday = i === 34;
                return (
                  <div key={i} className="aspect-square rounded"
                    style={{
                      background: isToday ? accent.main : active ? `rgba(${accent.rgb},0.5)` : colors.border,
                      boxShadow:  isToday ? `0 0 6px rgba(${accent.rgb},0.5)` : 'none',
                    }} />
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: colors.textMuted }}>Last 5 weeks · Keep going!</p>
          </div>

          {/* Recently unlocked */}
          <div className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <h3 className="text-sm mb-4" style={{ fontWeight: 600, color: colors.text }}>Recently Unlocked</h3>
            <div className="space-y-3">
              {recentlyUnlocked.length === 0 && (
                <p className="text-xs text-center py-2" style={{ color: colors.textMuted }}>
                  No achievements unlocked yet — keep studying!
                </p>
              )}
              {recentlyUnlocked.map(badge => {
                const rarity   = rarityConfig[badge.rarity] || rarityConfig.common;
                const IconComp = ICON_MAP[badge.iconKey] || Trophy;
                return (
                  <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: rarity.bg, border: `1px solid ${rarity.border}` }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${badge.color}20` }}>
                      <IconComp className="w-4 h-4" style={{ color: badge.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate" style={{ fontWeight: 600, color: colors.text }}>{badge.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Zap className="w-3 h-3" style={{ color: accent.main }} />
                        <span className="text-xs" style={{ color: accent.main, fontWeight: 600 }}>+{badge.xp} XP</span>
                      </div>
                    </div>
                    <Award className="w-4 h-4 flex-shrink-0" style={{ color: rarity.color }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}