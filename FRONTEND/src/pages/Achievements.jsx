import { useState } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import {
  Trophy, Zap, Star, Lock, Flame, Award,
  Rocket, Sunrise, Moon, Sparkles, Swords, Medal,
  Timer, PenLine, Crosshair, Gem, Hourglass, Brain,
  Crown, Shield, Library,
} from 'lucide-react';

// ─── Helper ───────────────────────────────────────────────────────────────────
function getLevelInfo(xp) {
  const names = ['Novice','Apprentice','Student','Learner','Scholar','Adept','Expert','Sage','Master','Champion'];
  const level    = Math.max(1, Math.floor(xp / 200) + 1);
  const levelXP  = (level - 1) * 200;
  const nextXP   = level * 200;
  const progress = Math.round(((xp - levelXP) / 200) * 100);
  const name     = names[Math.min(level - 1, names.length - 1)];
  return { level, name, xp, levelXP, nextXP, progress };
}

// ─── Dummy data ───────────────────────────────────────────────────────────────
const DEMO_XP     = 2340;
const DEMO_STREAK = 12;

const rarityConfig = {
  common:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Common',    border: 'rgba(148,163,184,0.2)' },
  rare:      { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  label: 'Rare',      border: 'rgba(99,102,241,0.3)'  },
  epic:      { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Epic',      border: 'rgba(139,92,246,0.3)'  },
  legendary: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Legendary', border: 'rgba(251,191,36,0.3)'  },
};

const allBadges = [
  { id: 1,  name: 'First Steps',      description: 'Complete your first study session',       icon: Rocket,    color: '#22c55e', xp: 50,   unlocked: true,  category: 'Beginner',    rarity: 'common'    },
  { id: 2,  name: 'Early Bird',       description: 'Study before 8 AM',                       icon: Sunrise,   color: '#fbbf24', xp: 100,  unlocked: true,  category: 'Habits',      rarity: 'common'    },
  { id: 3,  name: 'Night Owl',        description: 'Study after 10 PM',                       icon: Moon,      color: '#818cf8', xp: 100,  unlocked: true,  category: 'Habits',      rarity: 'common'    },
  { id: 4,  name: 'Streak Starter',   description: 'Achieve a 3-day study streak',            icon: Sparkles,  color: '#f472b6', xp: 150,  unlocked: true,  category: 'Streaks',     rarity: 'common'    },
  { id: 5,  name: 'Week Warrior',     description: 'Achieve a 7-day study streak',            icon: Swords,    color: '#6366f1', xp: 250,  unlocked: true,  category: 'Streaks',     rarity: 'rare'      },
  { id: 6,  name: 'Marathon',         description: 'Study for 4+ hours in a single day',      icon: Medal,     color: '#fb923c', xp: 200,  unlocked: true,  category: 'Performance', rarity: 'rare'      },
  { id: 7,  name: 'Pomodoro Master',  description: 'Complete 10 pomodoro sessions',           icon: Timer,     color: '#34d399', xp: 200,  unlocked: true,  category: 'Timer',       rarity: 'rare'      },
  { id: 8,  name: 'Note Taker',       description: 'Create 10 study notes',                   icon: PenLine,   color: '#60a5fa', xp: 150,  unlocked: true,  category: 'Study',       rarity: 'common'    },
  { id: 9,  name: 'Goal Setter',      description: 'Create and complete 5 goals',             icon: Crosshair, color: '#f97316', xp: 300,  unlocked: false, category: 'Goals',       rarity: 'rare',      progress: { current: 3,  total: 5  } },
  { id: 10, name: 'Perfect Week',     description: 'Complete all goals for an entire week',   icon: Gem,       color: '#a78bfa', xp: 500,  unlocked: false, category: 'Performance', rarity: 'epic',      progress: { current: 5,  total: 7  } },
  { id: 11, name: 'Century Club',     description: 'Accumulate 100 total study hours',        icon: Hourglass, color: '#38bdf8', xp: 750,  unlocked: false, category: 'Performance', rarity: 'epic',      progress: { current: 74, total: 100 } },
  { id: 12, name: 'Subject Master',   description: 'Complete 50 sessions in one subject',     icon: Brain,     color: '#c084fc', xp: 600,  unlocked: false, category: 'Study',       rarity: 'epic',      progress: { current: 32, total: 50  } },
  { id: 13, name: 'Consistency King', description: 'Achieve a 30-day study streak',           icon: Crown,     color: '#fbbf24', xp: 1000, unlocked: false, category: 'Streaks',     rarity: 'legendary', progress: { current: 12, total: 30  } },
  { id: 14, name: 'Scholar Supreme',  description: 'Reach Level 20',                          icon: Shield,    color: '#f87171', xp: 2000, unlocked: false, category: 'Progression', rarity: 'legendary', progress: { current: 12, total: 20  } },
  { id: 15, name: 'Knowledge Hoarder',description: 'Create 50 study notes',                  icon: Library,   color: '#4ade80', xp: 500,  unlocked: false, category: 'Study',       rarity: 'epic',      progress: { current: 18, total: 50  } },
];

const categories = ['All','Beginner','Habits','Streaks','Performance','Study','Timer','Goals','Progression'];

export function Achievements() {
  const [filter, setFilter]         = useState('All');
  const [showLocked, setShowLocked] = useState(true);
  const { colors, accent }          = useAppearance();

  const lvl           = getLevelInfo(DEMO_XP);
  const unlockedCount = allBadges.filter(b => b.unlocked).length;
  const totalXP       = allBadges.filter(b => b.unlocked).reduce((sum, b) => sum + b.xp, 0);

  const filtered = allBadges.filter(b => {
    const catMatch  = filter === 'All' || b.category === filter;
    const lockMatch = showLocked || b.unlocked;
    return catMatch && lockMatch;
  });

  return (
    <div className="p-4 min-h-full" style={{ background: colors.bg }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: 700, letterSpacing: '-0.4px', color: colors.text }}>Achievements</h1>
          <p className="text-sm mt-0.5" style={{ color: colors.textSub }}>{unlockedCount}/{allBadges.length} badges earned · {totalXP.toLocaleString()} total XP</p>
        </div>
        <button onClick={() => setShowLocked(!showLocked)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all shrink-0"
          style={showLocked
            ? { background: `rgba(${accent.rgb},0.15)`, color: accent.light, border: `1px solid rgba(${accent.rgb},0.3)`, fontWeight: 500 }
            : { background: colors.card, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{showLocked ? 'Showing locked' : 'Hiding locked'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { icon: <Flame  className="w-4 h-4 text-orange-400" />, label: 'Current Streak', value: `${DEMO_STREAK} Days`, sub: 'Best: 18 days',              bg: 'rgba(249,115,22,0.12)',  color: '#f97316'   },
          { icon: <Trophy className="w-4 h-4 text-yellow-400" />, label: 'Badges Earned',  value: `${unlockedCount}`,    sub: `${allBadges.length - unlockedCount} remaining`, bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
          { icon: <Zap    className="w-4 h-4 text-indigo-400" />, label: 'Total XP',       value: totalXP.toLocaleString(), sub: `Level ${lvl.level} ${lvl.name}`, bg: 'rgba(99,102,241,0.12)',  color: accent.main },
          { icon: <Star   className="w-4 h-4 text-purple-400" />, label: 'Completion',     value: `${Math.round((unlockedCount / allBadges.length) * 100)}%`, sub: 'Achievement rate', bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
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
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className="px-3 py-1.5 rounded-xl text-xs transition-all"
                style={filter === cat
                  ? { background: `rgba(${accent.rgb},0.2)`, color: accent.light, border: `1px solid rgba(${accent.rgb},0.4)`, fontWeight: 600 }
                  : { background: colors.card, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map(badge => {
              const rarity = rarityConfig[badge.rarity];
              const IconComp = badge.icon;
              return (
                <div key={badge.id} className="p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] relative overflow-hidden"
                  style={{
                    background: badge.unlocked ? rarity.bg : `rgba(${accent.rgb},0.02)`,
                    border: `1px solid ${badge.unlocked ? rarity.border : colors.border}`,
                    boxShadow: badge.unlocked ? `0 4px 20px ${rarity.color}15` : 'none',
                    opacity: badge.unlocked ? 1 : 0.6,
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${badge.color}20`, border: `1px solid ${badge.color}30` }}>
                      <IconComp className="w-5 h-5" style={{ color: badge.unlocked ? badge.color : colors.textMuted }} />
                      {!badge.unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(13,17,23,0.6)' }}>
                          <Lock className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: `${rarity.color}20`, color: rarity.color, fontWeight: 600 }}>
                      {rarity.label}
                    </span>
                  </div>
                  <div className="text-xs mb-0.5" style={{ fontWeight: 600, color: colors.text }}>{badge.name}</div>
                  <div className="text-xs mb-2 leading-4" style={{ color: colors.textMuted }}>{badge.description}</div>
                  {badge.unlocked ? (
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" style={{ color: accent.main }} />
                      <span className="text-xs" style={{ fontWeight: 600, color: accent.main }}>+{badge.xp} XP</span>
                    </div>
                  ) : badge.progress ? (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs" style={{ color: colors.textMuted }}>{badge.progress.current}/{badge.progress.total}</span>
                        <span className="text-xs" style={{ color: colors.textMuted }}>{Math.round((badge.progress.current / badge.progress.total) * 100)}%</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: colors.border }}>
                        <div className="h-full rounded-full" style={{ width: `${(badge.progress.current / badge.progress.total) * 100}%`, background: rarity.color }} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: colors.textMuted }}>+{badge.xp} XP on unlock</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Level card */}
          <div className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg text-white"
                style={{ fontWeight: 800, background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 20px rgba(${accent.rgb},0.4)` }}>
                {lvl.level}
              </div>
              <div>
                <div className="text-base" style={{ fontWeight: 700, color: colors.text }}>Level {lvl.level}</div>
                <div className="text-sm" style={{ color: accent.main }}>{lvl.name}</div>
              </div>
            </div>
            <div className="h-2 rounded-full mb-2" style={{ background: colors.border }}>
              <div className="h-full rounded-full" style={{ width: `${lvl.progress}%`, background: `linear-gradient(90deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 8px rgba(${accent.rgb},0.5)` }} />
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: colors.textMuted }}>{DEMO_XP.toLocaleString()} XP</span>
              <span className="text-xs" style={{ color: colors.textMuted }}>{lvl.nextXP.toLocaleString()} XP</span>
            </div>
            <p className="text-xs mt-2" style={{ color: colors.textMuted }}>{(lvl.nextXP - DEMO_XP).toLocaleString()} XP to reach Level {lvl.level + 1}</p>
          </div>

          {/* Streak heatmap (simplified) */}
          <div className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm" style={{ fontWeight: 600, color: colors.text }}>Study Streak</h3>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4" style={{ color: '#fb923c' }} />
                <span className="text-sm" style={{ fontWeight: 700, color: '#fb923c' }}>{DEMO_STREAK} days</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                const active = i < DEMO_STREAK && i >= (35 - DEMO_STREAK - 7);
                const today  = i === 34;
                return (
                  <div key={i} className="aspect-square rounded"
                    style={{
                      background: today ? accent.main : active ? `rgba(${accent.rgb},0.5)` : colors.border,
                      boxShadow: today ? `0 0 6px rgba(${accent.rgb},0.5)` : 'none',
                    }} />
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: colors.textMuted }}>Last 5 weeks · Keep going!</p>
          </div>

          {/* Recent unlocks */}
          <div className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <h3 className="text-sm mb-4" style={{ fontWeight: 600, color: colors.text }}>Recently Unlocked</h3>
            <div className="space-y-3">
              {allBadges.filter(b => b.unlocked).slice(-3).reverse().map(badge => {
                const rarity = rarityConfig[badge.rarity];
                const IconComp = badge.icon;
                return (
                  <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: rarity.bg, border: `1px solid ${rarity.border}` }}>
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
                    <Award className="w-4 h-4" style={{ color: rarity.color }} />
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