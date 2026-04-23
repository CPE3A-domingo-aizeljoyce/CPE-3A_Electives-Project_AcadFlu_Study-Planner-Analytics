import { useState, useEffect, useRef } from 'react';
import { useAppearance, ACCENT_PALETTE } from '../components/AppearanceProvider';
import {
  User, Clock, Palette, Shield, ChevronRight,
  Check, Sun, Moon, Eye, EyeOff, AlertTriangle, X,
  Camera, Upload, Trash2, KeyRound,
} from 'lucide-react';
import {
  getSettingsApi, updateSettingsApi,
  changePasswordApi, deleteAccountApi, updateAvatarApi,
} from '../api/authApi';

// ── Constants ─────────────────────────────────────────────────────────────────
const sections = [
  { id: 'profile',    label: 'Profile',        icon: User,    desc: 'Manage your account information' },
  { id: 'timer',      label: 'Study Timer',    icon: Clock,   desc: 'Pomodoro and session settings'   },
  { id: 'appearance', label: 'Appearance',     icon: Palette, desc: 'Theme and display preferences'   },
  { id: 'privacy',    label: 'Privacy & Data', icon: Shield,  desc: 'Data and account security'       },
];

const LS_SETTINGS_KEY = 'sf_settings';

const defaultProfile = {
  name: '', email: '', avatar: null,
  bio: '', studyGoal: '4',
  isGoogleAccount: false, hasPassword: true,
};

const defaultTimer = {
  focusDuration: '25', shortBreak: '5', longBreak: '15',
  sessionsBeforeLong: '4', autoStartBreaks: true,
  autoStartSessions: false, soundEnabled: true,
};

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE  = 5 * 1024 * 1024; // 5 MB

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function loadSavedSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSettingsLocally(payload) {
  localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('studyTimerSettingsUpdated', { detail: payload }));
}

/** Resize + compress an image File to JPEG at maxPx × maxPx, returns base64 data URL */
function compressImage(file, maxPx = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale  = Math.min(maxPx / img.naturalWidth, maxPx / img.naturalHeight, 1);
      const w      = Math.round(img.naturalWidth  * scale);
      const h      = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(blobUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('Could not load image.')); };
    img.src = blobUrl;
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, accentRgb, colors }) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch" aria-checked={value}
      className="flex-shrink-0 rounded-full relative"
      style={{
        width: 42, height: 24,
        background: value
          ? `linear-gradient(135deg, rgba(${accentRgb},1), rgba(${accentRgb},0.88))`
          : colors.border,
        boxShadow: value
          ? `0 12px 24px rgba(${accentRgb},0.18)`
          : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        transition: 'background 260ms cubic-bezier(0.22,1,0.36,1)',
        border: 'none', cursor: 'pointer',
      }}
    >
      <div
        className="absolute top-0.5 rounded-full bg-white"
        style={{
          width: 19, height: 19, left: 2,
          transform: value ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 260ms cubic-bezier(0.22,1,0.36,1)',
          boxShadow: '0 2px 8px rgba(15,23,42,0.2)',
        }}
      />
    </button>
  );
}

function AlertBox({ type, message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div
      className="flex items-center gap-2 p-3 rounded-xl text-xs"
      style={{
        background: isError ? 'rgba(239,68,68,0.1)'            : 'rgba(34,197,94,0.1)',
        border:     isError ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(34,197,94,0.25)',
        color:      isError ? '#f87171'                        : '#4ade80',
      }}
    >
      {isError
        ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
        : <Check         className="w-3.5 h-3.5 flex-shrink-0" />
      }
      <span>{message}</span>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, inputStyle, colors }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ fontWeight: 500, color: colors.textSub }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ ...inputStyle, paddingRight: '2.75rem' }}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function AvatarDisplay({ src, name, size = 96, accent, rounded = '1rem' }) {
  const [failed, setFailed] = useState(false);

  // Reset failed flag when src changes (new upload replaces old or avatar is removed)
  useEffect(() => { setFailed(false); }, [src]);

  const initials = getInitials(name);
  const showImg  = src && !failed;

  return (
    <div
      style={{
        width: size, height: size, borderRadius: rounded,
        overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: showImg
          ? 'transparent'
          : `linear-gradient(135deg, ${accent.main}, ${accent.light})`,
        boxShadow: `0 0 24px rgba(${accent.rgb},0.35)`,
      }}
    >
      {showImg ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span style={{ fontSize: size * 0.3, color: '#fff', fontWeight: 800 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

function DeleteModal({ onConfirm, onCancel, colors }) {
  const [confirmText, setConfirmText] = useState('');
  const [loading,     setLoading]     = useState(false);
  const canConfirm = confirmText === 'DELETE' && !loading;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: colors.card, border: '1px solid rgba(239,68,68,0.35)' }}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base text-red-400" style={{ fontWeight: 700 }}>Delete Account</h3>
            <p className="text-xs mt-1" style={{ color: colors.textMuted, lineHeight: 1.6 }}>
              This will permanently delete your account and{' '}
              <span style={{ fontWeight: 700, color: '#f87171' }}>all your data</span>
              {' '}— tasks, sessions, goals, notes, achievements. This{' '}
              <span style={{ fontWeight: 700, color: '#f87171' }}>cannot be undone</span>.
            </p>
          </div>
          <button onClick={onCancel} style={{ color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-xs mb-1.5" style={{ fontWeight: 500, color: colors.textSub }}>
            Type <span style={{ fontWeight: 700, color: '#f87171', letterSpacing: '0.05em' }}>DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="Type DELETE here"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: colors.card2, border: '1px solid rgba(239,68,68,0.3)', color: colors.text }}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub, fontWeight: 500, cursor: 'pointer' }}
          >Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm text-white"
            style={{
              background: canConfirm ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(239,68,68,0.25)',
              fontWeight: 600,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              border: 'none',
            }}
          >
            {loading ? 'Deleting…' : 'Delete Forever'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const {
    theme, accent, accentColor, colors,
    compactMode, animations, showXPBar, showStreak,
    setTheme, setAccent, setCompact, setAnimations, setShowXPBar, setShowStreak,
  } = useAppearance();

  // ── Profile + timer state ────────────────────────────────────────────────
  const [profile,   setProfile]   = useState(defaultProfile);
  const [timer,     setTimer]     = useState(defaultTimer);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading,   setLoading]   = useState(true);

  // ── Avatar upload state ──────────────────────────────────────────────────
  const fileInputRef              = useRef(null);
  const [previewUrl,        setPreviewUrl]        = useState('');
  const [isChoosingAvatar,  setIsChoosingAvatar]  = useState(false);
  const [isDragging,        setIsDragging]        = useState(false);
  const [avatarLoading,     setAvatarLoading]     = useState(false);
  const [avatarError,       setAvatarError]       = useState('');
  const [avatarSuccess,     setAvatarSuccess]     = useState('');

  // ── Password state ───────────────────────────────────────────────────────
  const [pwFields, setPwFields] = useState({ current: '', newPw: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState({ loading: false, error: '', success: '' });

  // ── Delete state ─────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError,     setDeleteError]     = useState('');

  // ── Load settings ────────────────────────────────────────────────────────
  useEffect(() => {
    // Show cached data instantly
    const local = loadSavedSettings();
    if (local?.profile) setProfile(p => ({ ...defaultProfile, ...local.profile }));
    if (local?.timer)   setTimer(t  => ({ ...defaultTimer,   ...local.timer }));

    // Fetch authoritative data from backend
    getSettingsApi()
      .then(data => {
        const p = {
          name:            data.profile?.name            ?? '',
          email:           data.profile?.email           ?? '',
          avatar:          data.profile?.avatar          ?? null,
          bio:             data.profile?.bio             ?? '',
          studyGoal:       String(data.profile?.studyGoal ?? '4'),
          isGoogleAccount: data.profile?.isGoogleAccount ?? false,
          hasPassword:     data.profile?.hasPassword     ?? true,
        };
        const t = {
          focusDuration:      String(data.timer?.focusDuration      ?? 25),
          shortBreak:         String(data.timer?.shortBreak         ?? 5),
          longBreak:          String(data.timer?.longBreak          ?? 15),
          sessionsBeforeLong: String(data.timer?.sessionsBeforeLong ?? 4),
          autoStartBreaks:    data.timer?.autoStartBreaks   ?? true,
          autoStartSessions:  data.timer?.autoStartSessions ?? false,
          soundEnabled:       data.timer?.soundEnabled      ?? true,
        };
        setProfile(p);
        setTimer(t);
        saveSettingsLocally({ profile: p, timer: t });
      })
      .catch(err => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── Save profile + timer ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError('');
    const payload = {
      profile: { name: profile.name, bio: profile.bio, studyGoal: Number(profile.studyGoal) },
      timer,
    };
    // Update localStorage with avatar preserved
    const current = loadSavedSettings() || {};
    saveSettingsLocally({ ...current, profile: { ...profile, ...payload.profile }, timer });
    try {
      await updateSettingsApi(payload);
      // Sync name to stored user object
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u.name !== profile.name)
          localStorage.setItem('user', JSON.stringify({ ...u, name: profile.name }));
      } catch {}
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err.error || err.message || 'Failed to save settings.');
    }
  };

  // ── Avatar helpers ────────────────────────────────────────────────────────

  const handleFileSelect = async (file) => {
    if (!file) return;
    setAvatarError('');
    setAvatarSuccess('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Only JPG, PNG, WebP, and GIF images are supported.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Please choose a file under 5 MB.`);
      return;
    }

    setAvatarLoading(true);
    try {
      const compressed = await compressImage(file);
      setPreviewUrl(compressed);
      setIsChoosingAvatar(false); // close drop zone, show preview+actions
    } catch {
      setAvatarError('Could not process image. Please try a different file.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSaveAvatar = async () => {
    if (!previewUrl) return;
    setAvatarLoading(true);
    setAvatarError('');
    try {
      const result = await updateAvatarApi(previewUrl);
      const newAvatar = result.avatar;

      // Update profile state
      setProfile(p => ({ ...p, avatar: newAvatar }));

      // Update localStorage so Layout sidebar reflects change immediately
      const current = loadSavedSettings() || {};
      saveSettingsLocally({ ...current, profile: { ...profile, avatar: newAvatar } });

      setPreviewUrl('');
      setIsChoosingAvatar(false);
      setAvatarSuccess('Profile picture updated successfully!');
      setTimeout(() => setAvatarSuccess(''), 3500);
    } catch (err) {
      setAvatarError(err.error || err.message || 'Failed to update profile picture. Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleCancelAvatar = () => {
    setPreviewUrl('');
    setIsChoosingAvatar(false);
    setAvatarError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    setAvatarError('');
    try {
      await updateAvatarApi(null);
      setProfile(p => ({ ...p, avatar: null }));
      const current = loadSavedSettings() || {};
      saveSettingsLocally({ ...current, profile: { ...profile, avatar: null } });
      setPreviewUrl('');
      setIsChoosingAvatar(false);
      setAvatarSuccess('Profile picture removed.');
      setTimeout(() => setAvatarSuccess(''), 2500);
    } catch (err) {
      setAvatarError(err.error || err.message || 'Failed to remove profile picture.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // ── Change/Set password ──────────────────────────────────────────────────
  const handleChangePassword = async () => {
    const { current, newPw, confirm } = pwFields;
    const isSettingNew = profile.isGoogleAccount && !profile.hasPassword;

    if (!isSettingNew && !current) {
      setPwStatus({ loading: false, error: 'Current password is required.', success: '' }); return;
    }
    if (!newPw || !confirm) {
      setPwStatus({ loading: false, error: 'Please fill in all password fields.', success: '' }); return;
    }
    if (newPw !== confirm) {
      setPwStatus({ loading: false, error: 'New passwords do not match.', success: '' }); return;
    }
    if (newPw.length < 8) {
      setPwStatus({ loading: false, error: 'New password must be at least 8 characters.', success: '' }); return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPw)) {
      setPwStatus({ loading: false, error: 'Password must include uppercase, lowercase, and a number.', success: '' }); return;
    }

    setPwStatus({ loading: true, error: '', success: '' });
    try {
      const res = await changePasswordApi({ currentPassword: current, newPassword: newPw, confirmPassword: confirm });
      setPwFields({ current: '', newPw: '', confirm: '' });
      if (isSettingNew) setProfile(p => ({ ...p, hasPassword: true }));
      setPwStatus({ loading: false, error: '', success: res.message || 'Password updated successfully.' });
      setTimeout(() => setPwStatus(s => ({ ...s, success: '' })), 4000);
    } catch (err) {
      setPwStatus({ loading: false, error: err.error || err.message || 'Failed to update password.', success: '' });
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    try {
      await deleteAccountApi();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem(LS_SETTINGS_KEY);
      localStorage.removeItem('sf_appearance');
      window.location.href = '/login';
    } catch (err) {
      const detail = err.detail ? ` (${err.detail})` : '';
      setDeleteError((err.message || 'Failed to delete account.') + detail);
      setShowDeleteModal(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle = {
    background:  colors.card2,
    border:      `1px solid ${colors.border}`,
    color:       colors.text,
    colorScheme: colors.inputScheme,
  };

  // ── Section renderers ─────────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {

      // ────────── PROFILE ──────────────────────────────────────────────────
      case 'profile':
        return (
          <div className="space-y-5">

            {/* ── Profile Picture card ───────────────────────────────────── */}
            <div className="p-5 rounded-2xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
              <div className="text-sm mb-4" style={{ fontWeight: 600, color: colors.text }}>Profile Picture</div>

              <div className="flex flex-col sm:flex-row gap-5">
                {/* Left: avatar preview */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="relative">
                    <AvatarDisplay
                      src={previewUrl || profile.avatar}
                      name={profile.name}
                      size={88}
                      accent={accent}
                      rounded="16px"
                    />
                    {/* Loading spinner overlay */}
                    {avatarLoading && (
                      <div
                        className="absolute inset-0 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.55)' }}
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white border-t-transparent"
                          style={{ animation: 'spin 0.75s linear infinite' }}
                        />
                      </div>
                    )}
                    {/* Preview indicator dot */}
                    {previewUrl && !avatarLoading && (
                      <div
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: accent.main, border: `2px solid ${colors.bg}` }}
                      >
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  {previewUrl && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `rgba(${accent.rgb},0.12)`, color: accent.main, fontWeight: 500 }}
                    >
                      Preview
                    </span>
                  )}
                </div>

                {/* Right: controls */}
                <div className="flex-1 min-w-0">
                  {!isChoosingAvatar ? (
                    <>
                      <p className="text-xs mb-3" style={{ color: colors.textMuted, lineHeight: 1.6 }}>
                        Upload a profile photo to personalize your account.
                        A square image (min 128×128 px) works best.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          onClick={() => { setIsChoosingAvatar(true); setAvatarError(''); setAvatarSuccess(''); }}
                          disabled={avatarLoading}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                          style={{
                            background: `rgba(${accent.rgb},0.1)`,
                            border: `1px solid rgba(${accent.rgb},0.25)`,
                            color: accent.main, fontWeight: 500,
                            cursor: avatarLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {profile.avatar || previewUrl ? 'Change Photo' : 'Upload Photo'}
                        </button>

                        {profile.avatar && !previewUrl && (
                          <button
                            onClick={handleRemoveAvatar}
                            disabled={avatarLoading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                            style={{
                              background: 'rgba(239,68,68,0.07)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              color: '#f87171', fontWeight: 500,
                              cursor: avatarLoading ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: colors.textMuted }}>
                        Supported: JPG, PNG, WebP, GIF · Max 5 MB
                      </p>
                    </>
                  ) : (
                    /* ── Drag & Drop Zone ────────────────────────────────── */
                    <div className="space-y-2">
                      <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer"
                        style={{
                          minHeight: 120,
                          padding: '20px 16px',
                          border: `2px dashed ${isDragging ? accent.main : colors.border}`,
                          background: isDragging ? `rgba(${accent.rgb},0.07)` : colors.card,
                          transition: 'border-color 200ms, background 200ms',
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: isDragging ? `rgba(${accent.rgb},0.15)` : `rgba(${accent.rgb},0.08)` }}
                        >
                          <Upload className="w-5 h-5" style={{ color: isDragging ? accent.main : colors.textMuted }} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm" style={{ fontWeight: 600, color: isDragging ? accent.main : colors.text }}>
                            {isDragging ? 'Drop to upload' : 'Drop your photo here'}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                            or <span style={{ color: accent.main, fontWeight: 500 }}>click to browse</span>
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: colors.textMuted }}>
                          JPG, PNG, WebP, GIF · Max 5 MB
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={e => { handleFileSelect(e.target.files?.[0]); e.target.value = ''; }}
                        />
                      </div>
                      <button
                        onClick={handleCancelAvatar}
                        className="text-xs"
                        style={{ color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                      >
                        ← Back
                      </button>
                    </div>
                  )}

                  {/* Status messages */}
                  {avatarError   && <div className="mt-3"><AlertBox type="error"   message={avatarError}   /></div>}
                  {avatarSuccess && <div className="mt-3"><AlertBox type="success" message={avatarSuccess} /></div>}

                  {/* Preview action buttons */}
                  {previewUrl && !avatarLoading && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleSaveAvatar}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm"
                        style={{
                          background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`,
                          fontWeight: 600, border: 'none', cursor: 'pointer',
                          boxShadow: `0 0 16px rgba(${accent.rgb},0.3)`,
                        }}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save Photo
                      </button>
                      <button
                        onClick={handleCancelAvatar}
                        className="px-4 py-2 rounded-xl text-sm"
                        style={{
                          background: colors.card2,
                          border: `1px solid ${colors.border}`,
                          color: colors.textSub, fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Account summary card ───────────────────────────────────── */}
            <div
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: colors.card2, border: `1px solid ${colors.border}` }}
            >
              <AvatarDisplay
                src={previewUrl || profile.avatar}
                name={profile.name}
                size={52}
                accent={accent}
                rounded="12px"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate" style={{ fontWeight: 700, color: colors.text }}>
                  {profile.name || 'Your Name'}
                </div>
                <div className="text-xs truncate" style={{ color: colors.textMuted }}>{profile.email}</div>
              </div>
              {profile.isGoogleAccount && (
                <div
                  className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{ background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.25)', color: '#4285f4' }}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </div>
              )}
            </div>

            {/* ── Profile fields ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ fontWeight: 500, color: colors.textSub }}>Full Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ fontWeight: 500, color: colors.textSub }}>Email Address</label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }}
                  value={profile.email}
                  disabled
                />
                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>Email cannot be changed here.</p>
              </div>
              <div className="col-span-full">
                <label className="block text-xs mb-1.5" style={{ fontWeight: 500, color: colors.textSub }}>Bio</label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ ...inputStyle, minHeight: 80 }}
                  value={profile.bio}
                  onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell others a bit about yourself…"
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ fontWeight: 500, color: colors.textSub }}>Daily Study Goal (hours)</label>
                <input
                  type="number" min="1" max="16"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                  value={profile.studyGoal}
                  onChange={e => setProfile({ ...profile, studyGoal: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      // ────────── TIMER ──────────────────────────────────────────────────
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
                    <button
                      onClick={() => setTimer({ ...timer, [t.key]: String(Math.max(1, Number(timer[t.key]) - 1)) })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.textSub, cursor: 'pointer' }}
                    >−</button>
                    <div className="flex-1 flex items-center justify-center">
                      <input
                        type="number" min="1"
                        className="bg-transparent border-none outline-none text-center"
                        style={{ fontWeight: 700, color: t.color, width: '3rem', fontSize: '1.5rem' }}
                        value={timer[t.key]}
                        onChange={e => setTimer({ ...timer, [t.key]: e.target.value })}
                      />
                      <span className="text-xs ml-1" style={{ color: colors.textMuted }}>min</span>
                    </div>
                    <button
                      onClick={() => setTimer({ ...timer, [t.key]: String(Number(timer[t.key]) + 1) })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.textSub, cursor: 'pointer' }}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { key: 'autoStartBreaks',   label: 'Auto-start Breaks',   desc: 'Automatically start break timer after focus session' },
                { key: 'autoStartSessions', label: 'Auto-start Sessions', desc: 'Automatically start next session after break'        },
                { key: 'soundEnabled',      label: 'Timer Sounds',        desc: 'Play sound when timer completes'                     },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
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

      // ────────── APPEARANCE ────────────────────────────────────────────
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
                    <button key={id} onClick={() => setTheme(id)}
                      className="relative p-4 rounded-2xl text-left"
                      style={{ background: card, border: `2px solid ${isActive ? accent.main : pb}`, boxShadow: isActive ? `0 0 16px rgba(${accent.rgb},0.25)` : 'none', cursor: 'pointer' }}>
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
                      boxShadow:  accentColor === name ? `0 0 0 2px ${colors.bg}, 0 0 0 4px ${pal.main}` : 'none',
                      transform:  accentColor === name ? 'scale(1.18)' : 'scale(1)',
                      transition: 'transform 200ms, box-shadow 200ms',
                      cursor: 'pointer', border: 'none',
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
                <div key={row.key} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
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
                  style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 16px rgba(${accent.rgb},0.35)`, fontWeight: 600, border: 'none', cursor: 'default' }}>
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
            <p className="text-xs px-1" style={{ color: colors.textMuted }}>
              ✓ Appearance changes are applied instantly and saved to your account.
            </p>
          </div>
        );

      // ────────── PRIVACY & DATA ────────────────────────────────────────
      case 'privacy': {
        const isGoogleOnly  = profile.isGoogleAccount && !profile.hasPassword;

        return (
          <div className="space-y-4">
            {/* Password section */}
            <div className="p-5 rounded-2xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
              {isGoogleOnly ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound className="w-4 h-4" style={{ color: accent.main }} />
                    <h4 className="text-sm" style={{ fontWeight: 600, color: colors.text }}>Set a Password</h4>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl mb-4"
                    style={{ background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)' }}>
                    <p className="text-xs" style={{ color: '#4285f4', lineHeight: 1.6 }}>
                      Your account uses <strong>Google Sign-In</strong> and has no local password yet.
                      Set one to also be able to sign in with your email.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <PasswordField label="New Password"         value={pwFields.newPw}  onChange={v => setPwFields({ ...pwFields, newPw: v })}  placeholder="Min. 8 chars, uppercase, lowercase, number" inputStyle={inputStyle} colors={colors} />
                    <PasswordField label="Confirm New Password" value={pwFields.confirm} onChange={v => setPwFields({ ...pwFields, confirm: v })} placeholder="Repeat new password"                        inputStyle={inputStyle} colors={colors} />
                    <AlertBox type="error"   message={pwStatus.error}   />
                    <AlertBox type="success" message={pwStatus.success} />
                    <button onClick={handleChangePassword} disabled={pwStatus.loading}
                      className="px-5 py-2.5 rounded-xl text-white text-sm"
                      style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600, border: 'none', cursor: pwStatus.loading ? 'not-allowed' : 'pointer' }}>
                      {pwStatus.loading ? 'Setting…' : 'Set Password'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="text-sm mb-4" style={{ fontWeight: 600, color: colors.text }}>Change Password</h4>
                  <div className="space-y-3">
                    <PasswordField label="Current Password"     value={pwFields.current} onChange={v => setPwFields({ ...pwFields, current: v })} placeholder="Enter your current password"                inputStyle={inputStyle} colors={colors} />
                    <PasswordField label="New Password"         value={pwFields.newPw}   onChange={v => setPwFields({ ...pwFields, newPw: v })}   placeholder="Min. 8 chars, uppercase, lowercase, number" inputStyle={inputStyle} colors={colors} />
                    <PasswordField label="Confirm New Password" value={pwFields.confirm}  onChange={v => setPwFields({ ...pwFields, confirm: v })}  placeholder="Repeat new password"                        inputStyle={inputStyle} colors={colors} />
                    <AlertBox type="error"   message={pwStatus.error}   />
                    <AlertBox type="success" message={pwStatus.success} />
                    <button onClick={handleChangePassword} disabled={pwStatus.loading}
                      className="px-5 py-2.5 rounded-xl text-white text-sm"
                      style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600, border: 'none', cursor: pwStatus.loading ? 'not-allowed' : 'pointer' }}>
                      {pwStatus.loading ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Danger Zone */}
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <h4 className="text-red-400 text-sm mb-2" style={{ fontWeight: 600 }}>Danger Zone</h4>
              <p className="text-xs mb-4" style={{ color: colors.textMuted }}>
                These actions are permanent and cannot be undone. Proceed with caution.
              </p>
              {deleteError && <div className="mb-3"><AlertBox type="error" message={deleteError} /></div>}
              <button
                onClick={() => { setDeleteError(''); setShowDeleteModal(true); }}
                className="px-4 py-2 rounded-xl text-red-400 text-sm"
                style={{ border: '1px solid rgba(239,68,68,0.3)', fontWeight: 500, background: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Delete Account &amp; All Data
              </button>
            </div>
          </div>
        );
      }

      default: return null;
    }
  };

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 min-h-full" style={{ background: colors.bg }}>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          colors={colors}
        />
      )}

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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
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
          <div
            key={activeSection}
            className="p-6 rounded-2xl mb-4 animate-in fade-in slide-in-from-top-2"
            style={{ background: colors.card, border: `1px solid ${colors.border}` }}
          >
            <h2 className="text-base mb-5" style={{ fontWeight: 600, color: colors.text }}>
              {sections.find(s => s.id === activeSection)?.label}
            </h2>
            {renderSection()}
          </div>

          {/* Save button — profile and timer only */}
          {(activeSection === 'profile' || activeSection === 'timer') && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`,
                  fontWeight: 600,
                  boxShadow:  `0 0 20px rgba(${accent.rgb},0.3)`,
                  border: 'none', cursor: 'pointer',
                }}
              >
                {saved && <Check className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
              {saveError
                ? <span className="text-xs" style={{ color: '#f87171' }}>{saveError}</span>
                : <p className="text-xs" style={{ color: colors.textMuted }}>
                    {activeSection === 'profile' ? 'Note: save profile picture separately using the Save Photo button above.' : 'Saves to your account.'}
                  </p>
              }
            </div>
          )}
        </div>
      </div>

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}