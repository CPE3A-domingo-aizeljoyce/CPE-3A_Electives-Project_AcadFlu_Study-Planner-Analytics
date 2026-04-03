import { useState } from 'react';
import { useAppearance, ACCENT_PALETTE } from '../components/AppearanceProvider';
import { User, Bell, Clock, Palette, Shield, ChevronRight, Check, Sun, Moon } from 'lucide-react';

const sections = [
  { id: 'profile',       label: 'Profile',        icon: User,    desc: 'Manage your account information' },
  { id: 'notifications', label: 'Notifications',  icon: Bell,    desc: 'Alerts and reminders'            },
  { id: 'timer',         label: 'Study Timer',    icon: Clock,   desc: 'Pomodoro and session settings'  },
  { id: 'appearance',   label: 'Appearance',     icon: Palette, desc: 'Theme and display preferences'  },
  { id: 'privacy',       label: 'Privacy & Data', icon: Shield,  desc: 'Data and account security'      },
];

function Toggle({ value, onChange, accentRgb, colors }) {
  return (
    <button onClick={() => onChange(!value)} role="switch" aria-checked={value}
      className="flex-shrink-0 rounded-full relative"
      style={{ width: 40, height: 22, background: value ? `rgb(${accentRgb})` : colors.border, boxShadow: value ? `0 0 10px rgba(${accentRgb},0.4)` : 'none', transition: 'background 200ms', border: 'none', cursor: 'pointer' }}>
      <div className="absolute top-0.5 rounded-full bg-white"
        style={{ width: 18, height: 18, left: 2, transform: value ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1)' }} />
    </button>
  );
}

export function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const {
    theme, accent, accentColor, colors,
    compactMode, animations, showXPBar, showStreak,
    setTheme, setAccent, setCompact, setAnimations, setShowXPBar, setShowStreak,
  } = useAppearance();

  const [profile, setProfile] = useState({
    name: 'Alex Johnson', email: 'alex@studyflow.app', username: 'alexj',
    bio: 'CS student passionate about math and physics. Aiming for a perfect GPA!',
    timezone: 'America/New_York', studyGoal: '4',
  });
  const [notifs, setNotifs] = useState({
    taskReminders: true, breakReminders: true, dailyDigest: false,
    achievementAlerts: true, streakWarning: true, weeklyReport: true,
    emailNotifs: false, soundAlerts: true,
  });
  const [timer, setTimer] = useState({
    focusDuration: '25', shortBreak: '5', longBreak: '15',
    sessionsBeforeLong: '4', autoStartBreaks: true, autoStartSessions: false,
    soundEnabled: true, notifyOnComplete: true,
  });
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const inputStyle = { background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text, colorScheme: colors.inputScheme };

  function InputField({ label, value, onChange, type = 'text', placeholder = '' }) {
    return (
      <div>
        <label className="block text-xs mb-1.5" style={{ fontWeight: 500, color: colors.textSub }}>{label}</label>
        <input type={type} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
          value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {

      case 'profile':
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-5 p-5 rounded-2xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl text-white"
                  style={{ fontWeight: 800, background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 20px rgba(${accent.rgb},0.4)` }}>
                  AJ
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#22c55e', border: `2px solid ${colors.bg}` }}>
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              </div>
              <div>
                <div className="text-base" style={{ fontWeight: 700, color: colors.text }}>{profile.name}</div>
                <div className="text-sm" style={{ color: accent.main }}>Level 12 Scholar</div>
                <div className="text-xs mt-1" style={{ color: colors.textMuted }}>Member since Jan 2026 · 2,340 XP</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Full Name"     value={profile.name}     onChange={v => setProfile({ ...profile, name: v })} />
              <InputField label="Username"      value={profile.username} onChange={v => setProfile({ ...profile, username: v })} />
              <InputField label="Email Address" type="email" value={profile.email} onChange={v => setProfile({ ...profile, email: v })} />
              <div>
                <label className="block text-xs mb-1.5" style={{ fontWeight: 500, color: colors.textSub }}>Timezone</label>
                <select className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
                  value={profile.timezone} onChange={e => setProfile({ ...profile, timezone: e.target.value })}>
                  <option value="America/New_York">Eastern Time (UTC-5)</option>
                  <option value="America/Chicago">Central Time (UTC-6)</option>
                  <option value="America/Los_Angeles">Pacific Time (UTC-8)</option>
                  <option value="Europe/London">London (UTC+0)</option>
                  <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
                </select>
              </div>
              <div className="col-span-full">
                <label className="block text-xs mb-1.5" style={{ fontWeight: 500, color: colors.textSub }}>Bio</label>
                <textarea className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ ...inputStyle, minHeight: 80 }}
                  value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ fontWeight: 500, color: colors.textSub }}>Daily Study Goal (hours)</label>
                <input type="number" min="1" max="16" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle} value={profile.studyGoal} onChange={e => setProfile({ ...profile, studyGoal: e.target.value })} />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-3">
            {[
              { key: 'taskReminders',     label: 'Task Reminders',         desc: 'Get notified before scheduled study sessions' },
              { key: 'breakReminders',    label: 'Break Reminders',        desc: 'Remind me to take breaks during long sessions' },
              { key: 'achievementAlerts', label: 'Achievement Alerts',     desc: 'Notify when you earn a new badge or level up' },
              { key: 'streakWarning',     label: 'Streak Warning',         desc: 'Alert when your streak is at risk of breaking' },
              { key: 'dailyDigest',       label: 'Daily Digest',           desc: "Morning summary of today's study plan" },
              { key: 'weeklyReport',      label: 'Weekly Report',          desc: 'Summary of your weekly performance' },
              { key: 'emailNotifs',       label: 'Email Notifications',    desc: 'Receive updates via email' },
              { key: 'soundAlerts',       label: 'Sound Alerts',           desc: 'Play audio cues for timer and events' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
                <div>
                  <div className="text-sm" style={{ fontWeight: 500, color: colors.text }}>{n.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{n.desc}</div>
                </div>
                <Toggle value={notifs[n.key]} onChange={v => setNotifs({ ...notifs, [n.key]: v })} accentRgb={accent.rgb} colors={colors} />
              </div>
            ))}
          </div>
        );

      case 'timer':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Focus Duration', key: 'focusDuration', color: accent.main },
                { label: 'Short Break',    key: 'shortBreak',    color: '#22c55e'   },
                { label: 'Long Break',     key: 'longBreak',     color: '#06b6d4'   },
              ].map(t => (
                <div key={t.key} className="p-4 rounded-2xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
                  <div className="text-xs mb-3" style={{ fontWeight: 500, color: colors.textSub }}>{t.label}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTimer({ ...timer, [t.key]: String(Math.max(1, Number(timer[t.key]) - 1)) })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.textSub }}>−</button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl" style={{ fontWeight: 700, color: t.color }}>{timer[t.key]}</span>
                      <span className="text-xs ml-1" style={{ color: colors.textMuted }}>min</span>
                    </div>
                    <button onClick={() => setTimer({ ...timer, [t.key]: String(Number(timer[t.key]) + 1) })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.textSub }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { key: 'autoStartBreaks',   label: 'Auto-start Breaks',             desc: 'Automatically start break timer after focus session' },
                { key: 'autoStartSessions', label: 'Auto-start Sessions',           desc: 'Automatically start next session after break' },
                { key: 'soundEnabled',      label: 'Timer Sounds',                  desc: 'Play sound when timer completes' },
                { key: 'notifyOnComplete',  label: 'Session Complete Notification', desc: 'Show notification when a session ends' },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
                  <div>
                    <div className="text-sm" style={{ fontWeight: 500, color: colors.text }}>{s.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{s.desc}</div>
                  </div>
                  <Toggle value={timer[s.key]} onChange={v => setTimer({ ...timer, [s.key]: v })} accentRgb={accent.rgb} colors={colors} />
                </div>
              ))}
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-5">
            {/* Theme */}
            <div className="p-5 rounded-2xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
              <div className="text-sm mb-1" style={{ fontWeight: 600, color: colors.text }}>Theme</div>
              <p className="text-xs mb-4" style={{ color: colors.textMuted }}>Choose your preferred interface appearance.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'dark',  label: 'Dark Mode',  Icon: Moon, bg: '#0d1117', card: '#131929', border: '#1a2540' },
                  { id: 'light', label: 'Light Mode', Icon: Sun,  bg: '#f0f4f8', card: '#ffffff', border: '#e2e8f0' },
                ].map(({ id, label, Icon, bg, card, border: pb }) => {
                  const isActive = theme === id;
                  return (
                    <button key={id} onClick={() => setTheme(id)} className="relative p-4 rounded-2xl text-left transition-all"
                      style={{ background: card, border: `2px solid ${isActive ? accent.main : pb}`, boxShadow: isActive ? `0 0 16px rgba(${accent.rgb},0.25)` : 'none' }}>
                      <div className="rounded-xl overflow-hidden mb-3" style={{ background: bg, border: `1px solid ${pb}` }}>
                        <div className="flex gap-1 p-2" style={{ background: card, borderBottom: `1px solid ${pb}` }}>
                          <div className="w-3 h-1.5 rounded" style={{ background: isActive ? accent.main : '#6366f180' }} />
                          <div className="w-5 h-1.5 rounded" style={{ background: id === 'dark' ? '#2a3550' : '#e2e8f0' }} />
                        </div>
                        <div className="p-2 space-y-1">
                          <div className="h-1.5 rounded" style={{ background: id === 'dark' ? '#1a2540' : '#e2e8f0', width: '70%' }} />
                          <div className="h-1.5 rounded" style={{ background: id === 'dark' ? '#131929' : '#f1f5f9', width: '50%' }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: id === 'dark' ? '#818cf8' : '#f97316' }} />
                          <span className="text-sm" style={{ fontWeight: 600, color: id === 'dark' ? '#e2e8f0' : '#0f172a' }}>{label}</span>
                        </div>
                        {isActive && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: accent.main }}>
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color */}
            <div className="p-5 rounded-2xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
              <div className="text-sm mb-1" style={{ fontWeight: 600, color: colors.text }}>Accent Color</div>
              <p className="text-xs mb-4" style={{ color: colors.textMuted }}>Applied instantly across buttons, highlights and progress bars.</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(ACCENT_PALETTE).map(([name, pal]) => (
                  <button key={name} onClick={() => setAccent(name)} title={name}
                    className="relative w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: pal.main,
                      boxShadow: accentColor === name ? `0 0 0 2px ${colors.bg}, 0 0 0 4px ${pal.main}` : 'none',
                      transform: accentColor === name ? 'scale(1.18)' : 'scale(1)',
                      transition: 'transform 200ms, box-shadow 200ms',
                    }}>
                    {accentColor === name && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: colors.textMuted }}>
                Selected: <span className="capitalize" style={{ color: accent.main }}>{accentColor}</span>
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              {[
                { key: 'compact', label: 'Compact Mode',         desc: 'Reduce padding and spacing for more content on screen', value: compactMode, set: setCompact    },
                { key: 'anim',    label: 'Animations',           desc: 'Enable smooth transitions and motion effects',          value: animations,  set: setAnimations  },
                { key: 'xpbar',   label: 'Show XP Progress Bar', desc: 'Display level progress bar in the sidebar',             value: showXPBar,   set: setShowXPBar   },
                { key: 'streak',  label: 'Show Streak Counter',  desc: 'Display your streak banner in the sidebar',             value: showStreak,  set: setShowStreak  },
              ].map(row => (
                <div key={row.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
                  <div>
                    <div className="text-sm" style={{ fontWeight: 500, color: colors.text }}>{row.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{row.desc}</div>
                  </div>
                  <Toggle value={row.value} onChange={row.set} accentRgb={accent.rgb} colors={colors} />
                </div>
              ))}
            </div>

            {/* Live preview */}
            <div className="p-4 rounded-2xl" style={{ background: colors.card2, border: `1px solid rgba(${accent.rgb},0.25)` }}>
              <div className="text-xs mb-3" style={{ fontWeight: 500, color: colors.textSub }}>Live Preview</div>
              <div className="flex items-center gap-3 flex-wrap">
                <button className="px-4 py-2 rounded-xl text-white text-sm"
                  style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 16px rgba(${accent.rgb},0.35)`, fontWeight: 600 }}>
                  Primary Button
                </button>
                <div className="px-3 py-1.5 rounded-lg text-sm"
                  style={{ background: `rgba(${accent.rgb},0.15)`, border: `1px solid rgba(${accent.rgb},0.3)`, color: accent.main, fontWeight: 500 }}>
                  Badge
                </div>
                <div className="flex-1 min-w-[120px]">
                  <div className="h-2 rounded-full" style={{ background: colors.border }}>
                    <div className="h-full rounded-full" style={{ width: '62%', background: `linear-gradient(90deg, ${accent.main}, ${accent.light})` }} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: colors.textMuted }}>XP Progress · 62%</div>
                </div>
              </div>
            </div>
            <p className="text-xs px-1" style={{ color: colors.textMuted }}>✓ All appearance changes are applied instantly and saved automatically.</p>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
              <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: colors.text }}>Change Password</h4>
              <div className="space-y-3">
                <InputField label="Current Password"     type="password" value="" onChange={() => {}} placeholder="••••••••" />
                <InputField label="New Password"         type="password" value="" onChange={() => {}} placeholder="••••••••" />
                <InputField label="Confirm New Password" type="password" value="" onChange={() => {}} placeholder="••••••••" />
                <button className="px-4 py-2 rounded-xl text-white text-sm"
                  style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600 }}>
                  Update Password
                </button>
              </div>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
              <h4 className="text-sm mb-3" style={{ fontWeight: 600, color: colors.text }}>Data & Export</h4>
              <div className="space-y-2">
                {['Export study data (JSON)','Export notes (Markdown)','Download analytics report'].map(item => (
                  <button key={item} className="w-full flex items-center justify-between p-3 rounded-xl text-sm"
                    style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.textSub }}>
                    <span>{item}</span>
                    <ChevronRight className="w-4 h-4" style={{ color: colors.textMuted }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <h4 className="text-red-400 text-sm mb-2" style={{ fontWeight: 600 }}>Danger Zone</h4>
              <p className="text-xs mb-3" style={{ color: colors.textMuted }}>These actions are irreversible. Proceed with caution.</p>
              <button className="px-4 py-2 rounded-xl text-red-400 text-sm hover:bg-red-400/10 transition-colors"
                style={{ border: '1px solid rgba(239,68,68,0.3)', fontWeight: 500 }}>
                Delete Account & All Data
              </button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="p-4 min-h-full" style={{ background: colors.bg }}>
      <div className="mb-5">
        <h1 className="text-2xl" style={{ fontWeight: 700, letterSpacing: '-0.4px', color: colors.text }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: colors.textSub }}>Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar nav */}
        <div className="space-y-1.5">
          {sections.map(s => {
            const Icon     = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={isActive
                  ? { background: `rgba(${accent.rgb},0.12)`, border: `1px solid rgba(${accent.rgb},0.3)` }
                  : { background: colors.card, border: `1px solid ${colors.border}` }}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? accent.main : colors.textMuted }} />
                <div>
                  <div className="text-sm" style={{ fontWeight: 500, color: isActive ? colors.text : colors.textSub }}>{s.label}</div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>{s.desc}</div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" style={{ color: accent.main }} />}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div className="lg:col-span-3">
          <div className="p-6 rounded-2xl mb-4" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <h2 className="text-base mb-5" style={{ fontWeight: 600, color: colors.text }}>
              {sections.find(s => s.id === activeSection)?.label}
            </h2>
            {renderSection()}
          </div>
          {activeSection !== 'appearance' && activeSection !== 'privacy' && (
            <div className="flex items-center gap-3">
              <button onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600, boxShadow: `0 0 20px rgba(${accent.rgb},0.3)` }}>
                {saved && <Check className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
              <p className="text-xs" style={{ color: colors.textMuted }}>Changes are saved to your local session</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}