import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Brain, Eye, EyeOff, ArrowLeft, Zap, Flame, Trophy, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { loginUser, registerUser, googleAuthApi } from '../api/authApi';

const BORDER = '#1a2540';
const CARD   = '#131929';
const CARD2  = '#0f1626';

const perks = [
  { icon: Zap,    color: '#6366f1', text: 'XP & levelling system' },
  { icon: Flame,  color: '#f97316', text: 'Daily streak tracking'  },
  { icon: Trophy, color: '#f59e0b', text: 'Achievement badges'      },
];

// ── Inner Google button — must be a child of GoogleOAuthProvider ──────────────
function GoogleSignInButton({ tab, onSuccess, onError, loading }) {
  const googleLogin = useGoogleLogin({
    onSuccess,
    onError,
    flow: 'implicit',
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={loading}
      className="w-full py-3 rounded-xl text-slate-200 text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ background: CARD, border: `1px solid ${BORDER}`, fontWeight: 500 }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = '#4285F4'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.09-6.09C34.46 2.99 29.5 1 24 1 14.82 1 7.01 6.48 3.6 14.28l7.06 5.48C12.43 13.72 17.73 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.7c-.55 2.94-2.2 5.44-4.68 7.12l7.19 5.59C43.26 37.17 46.52 31.3 46.52 24.5z"/>
          <path fill="#FBBC05" d="M10.66 28.24A14.6 14.6 0 0 1 9.5 24c0-1.48.25-2.91.66-4.24l-7.06-5.48A23.93 23.93 0 0 0 .5 24c0 3.87.93 7.52 2.6 10.72l7.56-6.48z"/>
          <path fill="#34A853" d="M24 46.5c5.5 0 10.12-1.82 13.5-4.96l-7.19-5.59c-1.82 1.22-4.15 1.95-6.31 1.95-6.27 0-11.57-4.22-13.34-9.9l-7.56 6.48C7.01 41.52 14.82 46.5 24 46.5z"/>
        </svg>
      )}
      {tab === 'login' ? 'Continue with Google' : 'Sign up with Google'}
    </button>
  );
}

// ── Main Login component ──────────────────────────────────────────────────────
export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login');

  const [showPass,      setShowPass]      = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [apiError,      setApiError]      = useState('');

  const [form,   setForm]   = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/app');
  }, [navigate]);

  // Show error if redirected back from a failed email verification
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'invalid_token')
      setApiError('Verification link is invalid or has expired. Please sign up again.');
    else if (error === 'server_error')
      setApiError('Something went wrong during verification. Please try again.');
  }, [searchParams]);

  // Reset form on tab switch
  useEffect(() => {
    setErrors({});
    setForm({ name: '', email: '', password: '', confirm: '' });
    setSuccess(false);
    setApiError('');
  }, [tab]);

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    if (apiError) setApiError('');
  };

  const sanitize = (val) =>
    val.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (tab === 'signup') {
      const name = sanitize(form.name);
      if (!name)             errs.name = 'Name is required';
      else if (name.length < 2)   errs.name = 'Name must be at least 2 characters';
      else if (name.length > 50)  errs.name = 'Name too long (max 50 chars)';
    }

    const email = sanitize(form.email);
    if (!email)                       errs.email = 'Email is required';
    else if (!emailRegex.test(email)) errs.email = 'Please enter a valid email';

    if (!form.password)               errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'At least 8 characters required';
    else if (tab === 'signup' && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      errs.password = 'Must include uppercase, lowercase, and a number';
    }

    if (tab === 'signup' && form.password !== form.confirm)
      errs.confirm = 'Passwords do not match';

    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');

    try {
      if (tab === 'signup') {
        await registerUser({
          name:     sanitize(form.name),
          email:    sanitize(form.email).toLowerCase(),
          password: form.password,   // Never sanitize passwords — send raw
        });
        // Don't navigate — show "check your email" screen instead
        setSuccess(true);

      } else {
        const data = await loginUser({
          email:    sanitize(form.email).toLowerCase(),
          password: form.password,
        });
        localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/app');
      }
    } catch (err) {
      if (err.requiresVerification) {
        setApiError('Please verify your email before logging in. Check your inbox for the link.');
      } else {
        setApiError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth handlers ─────────────────────────────────────────────────
  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setGoogleLoading(true);
      setApiError('');
      const data = await googleAuthApi(tokenResponse.access_token);
      localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/app');
    } catch (err) {
      setApiError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setApiError('Google sign-in was cancelled or failed. Please try again.');
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle = (field) => ({
    background: CARD2,
    border: `1px solid ${errors[field] ? '#ef4444' : BORDER}`,
    colorScheme: 'dark',
  });

  const focusStyle = { borderColor: '#6366f1' };
  const blurStyle  = (field) => ({ borderColor: errors[field] ? '#ef4444' : BORDER });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <div className="h-screen flex overflow-hidden" style={{ background: '#0d1117', fontFamily: "'Inter', sans-serif" }}>

        {/* Mobile Back Button */}
        <button onClick={() => navigate(-1)}
          className="lg:hidden fixed top-4 left-4 flex items-center gap-1.5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all z-50"
          style={{ fontWeight: 500 }}>
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* ── Left panel (desktop only) ── */}
        <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 overflow-y-auto"
          style={{ background: CARD2, borderRight: `1px solid ${BORDER}` }}>
          <div>
            <div className="flex items-center gap-2 mb-16">
              <button onClick={() => navigate(-1)} className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group flex-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-base" style={{ fontWeight: 700 }}>StudyFlow</span>
              </button>
            </div>

            <h2 className="text-white text-2xl mb-3" style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              Your academic<br />glow-up starts here.
            </h2>
            <p className="text-slate-500 text-sm mb-10" style={{ lineHeight: 1.7 }}>
              Join 50,000+ students who've transformed how they study — with science-backed techniques and gamified progress.
            </p>

            <div className="space-y-3 mb-10">
              {perks.map(p => (
                <div key={p.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${p.color}18` }}>
                    <p.icon className="w-4 h-4" style={{ color: p.color }} />
                  </div>
                  <span className="text-slate-400 text-sm" style={{ fontWeight: 500 }}>{p.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-slate-700 text-xs" style={{ lineHeight: 1.6, textAlign: 'center' }}>
            © 2026 StudyFlow · Built for learners<br />
            Developed by BS Computer Engineering Students<br />
            Bulacan State University
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-12 pb-12 relative overflow-y-auto w-full">

          {/* Mobile Logo */}
          <button onClick={() => navigate('/')} className="lg:hidden flex flex-col items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-base" style={{ fontWeight: 700 }}>StudyFlow</span>
          </button>

          <div className="w-full max-w-sm">

            {/* Tab switcher */}
            <div className="flex p-1 rounded-2xl mb-8" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              {['login', 'signup'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm transition-all duration-200"
                  style={tab === t
                    ? { background: '#6366f1', color: '#fff', fontWeight: 600, boxShadow: '0 0 16px rgba(99,102,241,0.4)' }
                    : { color: '#64748b', fontWeight: 500 }}>
                  {t === 'login' ? 'Log in' : 'Sign up'}
                </button>
              ))}
            </div>

            <div className="mb-7">
              <h1 className="text-white text-2xl mb-1" style={{ fontWeight: 800, letterSpacing: '-0.4px' }}>
                {tab === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-slate-500 text-sm">
                {tab === 'login'
                  ? 'Sign in to continue your study streak.'
                  : 'Start your free account — no credit card needed.'}
              </p>
            </div>

            {/* Global API error banner */}
            {apiError && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-4"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{apiError}</p>
              </div>
            )}

            {/* ── Success screen (email verification pending) ── */}
            {success ? (
              <div className="flex flex-col items-center gap-5 py-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <Mail className="w-8 h-8" style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <div className="text-white text-base mb-1" style={{ fontWeight: 700 }}>
                    Check your inbox!
                  </div>
                  <div className="text-slate-500 text-sm" style={{ lineHeight: 1.7 }}>
                    We sent a verification link to<br />
                    <span style={{ color: '#818cf8', fontWeight: 600 }}>{form.email}</span>
                  </div>
                  <div className="text-slate-600 text-xs mt-3" style={{ lineHeight: 1.6 }}>
                    Click the link in the email to activate your account.<br />
                    The link expires in 24 hours.
                  </div>
                </div>
                <div className="w-full pt-2 space-y-2">
                  <div className="text-slate-600 text-xs text-center">
                    Wrong email address?
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSuccess(false); setForm(prev => ({ ...prev, email: '', password: '', confirm: '' })); }}
                    className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white text-sm transition-all hover:bg-white/5"
                    style={{ border: `1px solid ${BORDER}`, fontWeight: 500 }}>
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSuccess(false); setTab('login'); }}
                    className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors block w-full pt-1"
                    style={{ fontWeight: 500 }}>
                    Back to Log in
                  </button>
                </div>
              </div>

            ) : (
              /* ── Auth form ── */
              <form onSubmit={submit} className="space-y-4" noValidate>

                {/* Full name (signup only) */}
                {tab === 'signup' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5" style={{ fontWeight: 500 }}>Full name</label>
                    <input
                      type="text"
                      placeholder="Juan dela Cruz"
                      value={form.name}
                      onChange={set('name')}
                      autoComplete="name"
                      maxLength={50}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                      style={inputStyle('name')}
                      onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                      onBlur={e  => Object.assign(e.currentTarget.style, blurStyle('name'))}
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5" style={{ fontWeight: 500 }}>Email</label>
                  <input
                    type="email"
                    placeholder="juan@email.com"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                    style={inputStyle('email')}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e  => Object.assign(e.currentTarget.style, blurStyle('email'))}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-400" style={{ fontWeight: 500 }}>Password</label>
                    {tab === 'login' && (
                      <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={set('password')}
                      autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                      style={inputStyle('password')}
                      onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                      onBlur={e  => Object.assign(e.currentTarget.style, blurStyle('password'))}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                  {tab === 'signup' && !errors.password && (
                    <p className="text-slate-600 text-xs mt-1">Min 8 chars with uppercase, lowercase, and number</p>
                  )}
                </div>

                {/* Confirm password (signup only) */}
                {tab === 'signup' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5" style={{ fontWeight: 500 }}>Confirm password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.confirm}
                        onChange={set('confirm')}
                        autoComplete="new-password"
                        className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                        style={inputStyle('confirm')}
                        onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                        onBlur={e  => Object.assign(e.currentTarget.style, blurStyle('confirm'))}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        tabIndex={-1}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading || googleLoading}
                  className="w-full py-3 rounded-xl text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.35)', fontWeight: 600 }}>
                  {loading
                    ? (tab === 'login' ? 'Signing in…' : 'Creating account…')
                    : (tab === 'login' ? 'Sign in' : 'Create account')}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px" style={{ background: BORDER }} />
                  <span className="text-slate-600 text-xs">or continue with</span>
                  <div className="flex-1 h-px" style={{ background: BORDER }} />
                </div>

                {/* Google button */}
                <GoogleSignInButton
                  tab={tab}
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  loading={googleLoading}
                />

                {/* Switch tab */}
                <p className="text-center text-slate-600 text-xs pt-1">
                  {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button type="button" onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors" style={{ fontWeight: 500 }}>
                    {tab === 'login' ? 'Sign up free' : 'Log in'}
                  </button>
                </p>

              </form>
            )}
          </div>
          <div style={{ flex: '1 0 auto' }} />
        </div>

      </div>
    </GoogleOAuthProvider>
  );
}