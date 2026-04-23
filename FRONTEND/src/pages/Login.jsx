import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Brain, Eye, EyeOff, ArrowLeft, Zap, Flame, Trophy, AlertCircle, Mail, Loader2, Sun, Moon } from 'lucide-react';
import { loginUser, registerUser, forgotPasswordApi } from '../api/authApi';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ── Levenshtein distance ───────────────────────────────────────────────────────
const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
};

const POPULAR_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'icloud.com', 'protonmail.com', 'live.com', 'msn.com',
  'aol.com', 'mail.com', 'ymail.com', 'googlemail.com',
];

const suggestDomain = (domain) => {
  if (!domain) return null;
  const lower = domain.toLowerCase();
  if (POPULAR_DOMAINS.includes(lower)) return null;
  let best = null, bestDist = Infinity;
  for (const d of POPULAR_DOMAINS) {
    const dist = levenshtein(lower, d);
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  return bestDist <= 2 ? best : null;
};

// ── Cloudflare DNS-over-HTTPS domain check ────────────────────────────────────
const verifyEmailDomain = async (email) => {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      { headers: { Accept: 'application/dns-json' } }
    );
    if (!res.ok) return true;
    const data = await res.json();
    return data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch {
    return true;
  }
};

const GoogleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.09-6.09C34.46 2.99 29.5 1 24 1 14.82 1 7.01 6.48 3.6 14.28l7.06 5.48C12.43 13.72 17.73 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.7c-.55 2.94-2.2 5.44-4.68 7.12l7.19 5.59C43.26 37.17 46.52 31.3 46.52 24.5z"/>
    <path fill="#FBBC05" d="M10.66 28.24A14.6 14.6 0 0 1 9.5 24c0-1.48.25-2.91.66-4.24l-7.06-5.48A23.93 23.93 0 0 0 .5 24c0 3.87.93 7.52 2.6 10.72l7.56-6.48z"/>
    <path fill="#34A853" d="M24 46.5c5.5 0 10.12-1.82 13.5-4.96l-7.19-5.59c-1.82 1.22-4.15 1.95-6.31 1.95-6.27 0-11.57-4.22-13.34-9.9l-7.56 6.48C7.01 41.52 14.82 46.5 24 46.5z"/>
  </svg>
);

const perks = [
  { icon: Zap,    color: '#6366f1', text: 'XP & levelling system' },
  { icon: Flame,  color: '#f97316', text: 'Daily streak tracking'  },
  { icon: Trophy, color: '#f59e0b', text: 'Achievement badges'      },
];

// ── Main Login component ──────────────────────────────────────────────────────
export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login');
  const [isLight, setIsLight] = useState(() => localStorage.getItem('public_theme') === 'light');

  useEffect(() => {
    const handleStorage = () => setIsLight(localStorage.getItem('public_theme') === 'light');
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    setIsLight(prev => {
      const next = !prev;
      localStorage.setItem('public_theme', next ? 'light' : 'dark');
      window.dispatchEvent(new Event('storage'));
      return next;
    });
  };

  const BG        = isLight ? '#f8fafc' : '#0d1117';
  const BORDER    = isLight ? 'rgba(203, 213, 225, 0.7)' : '#1a2540';
  const CARD      = isLight ? '#ffffff' : '#131929';
  const CARD2     = isLight ? '#ffffff' : '#0f1626';
  const TEXT_MAIN = isLight ? '#0f172a' : '#ffffff';
  const TEXT_SUB  = isLight ? '#475569' : '#94a3b8';
  const SHADOW    = isLight ? '0 12px 35px rgba(0,0,0,0.08)' : 'none';

  useEffect(() => {
    document.body.style.backgroundColor = BG;
  }, [BG]);

  const [showPass,      setShowPass]      = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [apiError,      setApiError]      = useState('');

  const [form,   setForm]   = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const [domainChecking, setDomainChecking] = useState(false);
  const [domainInvalid,  setDomainInvalid]  = useState(false);
  const domainCheckRef = useRef(null);

  const [view,          setView]          = useState('auth');
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotError,   setForgotError]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem('rememberMe') !== 'false'
  );

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/app');
  }, [navigate]);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'invalid_token')
      setApiError('Verification link is invalid or has expired. Please sign up again.');
    else if (error === 'server_error')
      setApiError('Something went wrong during verification. Please try again.');
    else if (error === 'google_cancelled')
      setApiError('Google sign-in was cancelled. Please try again.');
    else if (error === 'google_failed')
      setApiError('Google sign-in failed. Please try again.');
  }, [searchParams]);

  useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail');
    if (saved) setForm(prev => ({ ...prev, email: saved }));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail') || '';
    setErrors({});
    setForm({ name: '', email: saved, password: '', confirm: '' });
    setSuccess(false);
    setApiError('');
    setDomainInvalid(false);
    setDomainChecking(false); // ✅ FIXED: reset loading spinner on tab switch
  }, [tab]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    if (apiError) setApiError('');
    if (key === 'email') setDomainInvalid(false);
  };

  const sanitize = (val) =>
    val.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const handleEmailBlur = async (e) => {
    Object.assign(e.currentTarget.style, blurStyle('email'));

    const val    = form.email.trim().toLowerCase();
    const domain = val.split('@')[1] || '';

    if (!val || !EMAIL_REGEX.test(val)) return;

    const suggestion = suggestDomain(domain);
    if (suggestion) {
      setErrors(prev => ({
        ...prev,
        email: `Looks like a typo — did you mean @${suggestion}?`,
      }));
      return;
    }

    if (!POPULAR_DOMAINS.includes(domain)) {
      setDomainChecking(true);
      setDomainInvalid(false);

      const id = Symbol();
      domainCheckRef.current = id;

      const ok = await verifyEmailDomain(val);

      if (domainCheckRef.current !== id) return;
      setDomainChecking(false);

      if (!ok) {
        setDomainInvalid(true);
        setErrors(prev => ({
          ...prev,
          email: `"@${domain}" doesn't look like a valid email domain.`,
        }));
      }
    }
  };

  const validate = () => {
    const errs = {};

    if (tab === 'signup') {
      const name = sanitize(form.name);
      if (!name)                  errs.name = 'Name is required';
      else if (name.length < 2)   errs.name = 'Name must be at least 2 characters';
      else if (name.length > 50)  errs.name = 'Name too long (max 50 chars)';
    }

    const email  = form.email.trim().toLowerCase();
    const domain = email.split('@')[1] || '';

    if (!email) {
      errs.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      errs.email = 'Please enter a valid email address (e.g. juan@gmail.com)';
    } else {
      const suggestion = suggestDomain(domain);
      if (suggestion) {
        errs.email = `Looks like a typo — did you mean @${suggestion}?`;
      } else if (domainInvalid) {
        errs.email = `"@${domain}" doesn't look like a valid email domain.`;
      }
    }

    if (!form.password)                errs.password = 'Password is required';
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
        const domainOk = await verifyEmailDomain(form.email.trim().toLowerCase());
        if (!domainOk) {
          const domain = form.email.trim().split('@')[1] || '';
          setErrors(prev => ({
            ...prev,
            email: `"@${domain}" doesn't look like a valid email domain.`,
          }));
          return;
        }

        await registerUser({
          name:     sanitize(form.name),
          email:    form.email.trim().toLowerCase(),
          password: form.password,
        });
        setSuccess(true);

      } else {
        const data = await loginUser({
          email:    form.email.trim().toLowerCase(),
          password: form.password,
        });

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', form.email.trim().toLowerCase());
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.setItem('rememberMe', 'false');
        }

        localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/app');
      }
    } catch (err) {
      if (err.requiresVerification) {
        setApiError('Please verify your email before logging in. Check your inbox for the link.');
      } else if (err.isGoogleSignIn || err.message?.toLowerCase().includes('google sign-in')) {
        // ✅ FIX: Show a clear error message instead of auto-redirecting to Google.
        // The old code auto-called handleGoogleLogin() here, which caused Google-only
        // accounts to be silently logged in even when the user typed a wrong password.
        // Now the user must consciously click the "Continue with Google" button.
        setApiError("This account uses Google sign-in. Please use the 'Continue with Google' button below.");
      } else {
        setApiError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setView('forgot');
    setForgotEmail(form.email.trim());
    setForgotError('');
    setForgotSuccess(false);
  };

  const closeForgot = () => {
    setView('auth');
    setForgotEmail('');
    setForgotError('');
    setForgotSuccess(false);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const email  = forgotEmail.trim().toLowerCase();
    const domain = email.split('@')[1] || '';

    if (!email) { setForgotError('Email is required.'); return; }
    if (!EMAIL_REGEX.test(email)) { setForgotError('Please enter a valid email address.'); return; }

    const suggestion = suggestDomain(domain);
    if (suggestion) {
      setForgotError(`Looks like a typo — did you mean @${suggestion}?`);
      return;
    }

    if (!POPULAR_DOMAINS.includes(domain)) {
      const ok = await verifyEmailDomain(email);
      if (!ok) {
        setForgotError(`"@${domain}" doesn't look like a valid email domain.`);
        return;
      }
    }

    setForgotLoading(true);
    setForgotError('');
    try {
      const data = await forgotPasswordApi(email);
      if (data?.isGoogleAccount) {
        setForgotError(data.message);
      } else {
        setForgotSuccess(true);
      }
    } catch (err) {
      setForgotError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleLogin = async (hintEmail = '') => {
    try {
      setGoogleLoading(true);
      setApiError('');
      const params = hintEmail ? `?hint=${encodeURIComponent(hintEmail)}` : '';
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google/url${params}`
      );
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setApiError('Could not connect to Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  const inputStyle = (field) => ({
    background:  CARD2,
    border:      `1px solid ${errors[field] ? '#ef4444' : BORDER}`,
    color:       TEXT_MAIN,
    colorScheme: isLight ? 'light' : 'dark',
  });

  const focusStyle = { borderColor: '#6366f1' };
  const blurStyle  = (field) => ({ borderColor: errors[field] ? '#ef4444' : BORDER });

  return (
    <div className="h-screen flex overflow-hidden relative z-0 transition-colors duration-300" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>

      {/* GLOBAL BACKGROUND GLOW */}
      {isLight && (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(37,99,235,0.15) 0%, transparent 100%)', filter: 'blur(80px)' }} />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(99,102,241,0.12) 0%, transparent 100%)', filter: 'blur(80px)' }} />
        </div>
      )}

      {/* ── Left panel ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 overflow-y-auto transition-colors duration-300 relative z-10"
        style={{ background: CARD2, borderRight: `1px solid ${BORDER}` }}>

        <div>
          <div className="flex items-center justify-between mb-16 relative w-full">
            <div className="flex items-center gap-2">
              <button
                onClick={() => view === 'forgot' ? closeForgot() : navigate(-1)}
                className="flex items-center justify-center p-2 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: TEXT_SUB }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)', boxShadow: isLight ? '0 4px 15px rgba(37,99,235,0.3)' : '0 0 20px rgba(99,102,241,0.4)' }}>
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-base" style={{ color: TEXT_MAIN, fontWeight: 800, letterSpacing: '-0.3px' }}>AcadFlu</span>
              </button>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full transition-all duration-200 hover:scale-110"
              style={{ color: TEXT_SUB, background: isLight ? '#e2e8f0' : '#1e293b', boxShadow: isLight ? '0 4px 10px rgba(0,0,0,0.05)' : '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>

          <h2 className="text-2xl mb-3" style={{ color: TEXT_MAIN, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Your academic<br />glow-up starts here.
          </h2>

          <p className="text-sm mb-10" style={{ color: TEXT_SUB, lineHeight: 1.7 }}>
            Join 50,000+ students who've transformed how they study — with science-backed techniques and gamified progress.
          </p>

          <div className="space-y-3 mb-10">
            {perks.map(p => (
              <div key={p.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${p.color}18` }}>
                  <p.icon className="w-4 h-4" style={{ color: p.color }} />
                </div>
                <span className="text-sm" style={{ color: TEXT_SUB, fontWeight: 500 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: TEXT_SUB, lineHeight: 1.6, textAlign: 'center' }}>
          © 2026 AcadFlu · Built for learners<br />
          Developed by BS Computer Engineering Students<br />
          Bulacan State University
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 lg:py-12 pb-12 relative overflow-y-auto w-full z-10">

        {/* Mobile header */}
        <div className="lg:hidden w-full max-w-sm flex items-center justify-between mb-8">
          <button
            onClick={() => view === 'forgot' ? closeForgot() : navigate(-1)}
            className="p-2.5 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: TEXT_SUB }}>
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)', boxShadow: isLight ? '0 4px 15px rgba(37,99,235,0.3)' : '0 0 20px rgba(99,102,241,0.4)' }}>
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-base" style={{ color: TEXT_MAIN, fontWeight: 800 }}>AcadFlu</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all hover:scale-110"
            style={{ color: TEXT_SUB, background: isLight ? '#e2e8f0' : '#1e293b' }}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full max-w-sm">

          {/* ══ FORGOT PASSWORD VIEW ══ */}
          {view === 'forgot' ? (
            forgotSuccess ? (
              <div className="flex flex-col items-center gap-5 py-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <Mail className="w-8 h-8" style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <div className="text-base mb-1" style={{ color: TEXT_MAIN, fontWeight: 700 }}>Check your inbox!</div>
                  <div className="text-sm" style={{ color: TEXT_SUB, lineHeight: 1.7 }}>
                    We sent a password reset link to<br />
                    <span style={{ color: '#818cf8', fontWeight: 600 }}>{forgotEmail}</span>
                  </div>
                  <div className="text-xs mt-3" style={{ color: TEXT_SUB, lineHeight: 1.6 }}>
                    Click the link in the email to reset your password.<br />
                    The link expires in 1 hour.
                  </div>
                </div>
                <button type="button" onClick={closeForgot}
                  className="text-indigo-500 hover:text-indigo-400 text-sm transition-colors"
                  style={{ fontWeight: 500 }}>
                  ← Back to Log in
                </button>
              </div>

            ) : (
              <>
                <div className="mb-7">
                  <button type="button" onClick={closeForgot}
                    className="flex items-center gap-1.5 text-sm transition-colors mb-5"
                    style={{ color: TEXT_SUB, fontWeight: 500 }}>
                    <ArrowLeft className="w-4 h-4" /> Back to Log in
                  </button>
                  <h1 className="text-2xl mb-1" style={{ color: TEXT_MAIN, fontWeight: 800, letterSpacing: '-0.4px' }}>
                    Reset your password
                  </h1>
                  <p className="text-sm" style={{ color: TEXT_SUB }}>Enter your email and we'll send you a reset link.</p>
                </div>

                {forgotError && (
                  <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-4"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-500 text-sm">{forgotError}</p>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4" noValidate>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: TEXT_SUB, fontWeight: 500 }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="juan@gmail.com"
                      value={forgotEmail}
                      onChange={e => { setForgotEmail(e.target.value); if (forgotError) setForgotError(''); }}
                      autoComplete="email"
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle('email')}
                      onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                      onBlur={e  => Object.assign(e.currentTarget.style, blurStyle('email'))}
                    />
                  </div>
                  <button type="submit" disabled={forgotLoading}
                    className="w-full py-3 rounded-xl text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)', boxShadow: isLight ? '0 8px 20px rgba(37,99,235,0.25)' : '0 0 24px rgba(99,102,241,0.35)', fontWeight: 600 }}>
                    {forgotLoading ? 'Sending reset link…' : 'Send reset link'}
                  </button>
                </form>
              </>
            )

          ) : (
            /* ══ AUTH VIEW ══ */
            <>
              {/* Tab switcher */}
              <div className="flex p-1 rounded-2xl mb-8" style={{ background: CARD, border: `1px solid ${BORDER}`, boxShadow: SHADOW }}>
                {['login', 'signup'].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className="flex-1 py-2.5 rounded-xl text-sm transition-all duration-200"
                    style={tab === t
                      ? { background: isLight ? '#2563eb' : '#6366f1', color: '#fff', fontWeight: 600, boxShadow: isLight ? '0 4px 15px rgba(37,99,235,0.3)' : '0 0 16px rgba(99,102,241,0.4)' }
                      : { color: TEXT_SUB, fontWeight: 500 }}>
                    {t === 'login' ? 'Log in' : 'Sign up'}
                  </button>
                ))}
              </div>

              <div className="mb-7">
                <h1 className="text-2xl mb-1" style={{ color: TEXT_MAIN, fontWeight: 800, letterSpacing: '-0.4px' }}>
                  {tab === 'login' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="text-sm" style={{ color: TEXT_SUB }}>
                  {tab === 'login'
                    ? 'Sign in to continue your study streak.'
                    : 'Start your free account — no credit card needed.'}
                </p>
              </div>

              {apiError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-4"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-500 text-sm">{apiError}</p>
                </div>
              )}

              {/* ── Email verification pending screen ── */}
              {success ? (
                <div className="flex flex-col items-center gap-5 py-8 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <Mail className="w-8 h-8" style={{ color: '#818cf8' }} />
                  </div>

                  <div>
                    <div className="text-base mb-1" style={{ color: TEXT_MAIN, fontWeight: 700 }}>Check your inbox!</div>
                    <div className="text-sm" style={{ color: TEXT_SUB, lineHeight: 1.7 }}>
                      We sent a verification link to<br />
                      <span style={{ color: '#818cf8', fontWeight: 600 }}>{form.email}</span>
                    </div>
                    <div className="text-xs mt-3" style={{ color: TEXT_SUB, lineHeight: 1.6 }}>
                      Click the link in the email to activate your account.<br />
                      The link expires in 24 hours.
                    </div>
                  </div>

                  <div className="w-full pt-1 space-y-2">
                    <div className="text-xs text-center" style={{ color: TEXT_SUB }}>Wrong email address?</div>
                    <button
                      type="button"
                      onClick={() => { setSuccess(false); setForm(prev => ({ ...prev, email: '', password: '', confirm: '' })); }}
                      className="w-full py-2.5 rounded-xl text-sm transition-all hover:opacity-70"
                      style={{ color: TEXT_SUB, border: `1px solid ${BORDER}`, fontWeight: 500 }}>
                      Use a different email
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSuccess(false); setTab('login'); }}
                      className="text-indigo-500 hover:text-indigo-400 text-sm transition-colors block w-full pt-1"
                      style={{ fontWeight: 500 }}>
                      Back to Log in
                    </button>
                  </div>
                </div>

              ) : (
                /* ── Auth form ── */
                <form onSubmit={submit} className="space-y-4" noValidate>

                  {tab === 'signup' && (
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: TEXT_SUB, fontWeight: 500 }}>Full name</label>
                      <input
                        type="text"
                        placeholder="Juan dela Cruz"
                        value={form.name}
                        onChange={set('name')}
                        autoComplete="name"
                        maxLength={50}
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                        style={inputStyle('name')}
                        onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                        onBlur={e  => Object.assign(e.currentTarget.style, blurStyle('name'))}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: TEXT_SUB, fontWeight: 500 }}>Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="juan@gmail.com"
                        value={form.email}
                        onChange={set('email')}
                        autoComplete="email"
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                        style={inputStyle('email')}
                        onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                        onBlur={handleEmailBlur}
                      />
                      {domainChecking && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                        </div>
                      )}
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs" style={{ color: TEXT_SUB, fontWeight: 500 }}>Password</label>
                      {tab === 'login' && (
                        <button type="button" onClick={openForgot}
                          className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
                          style={{ fontWeight: 500 }}>
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
                        className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all"
                        style={inputStyle('password')}
                        onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                        onBlur={e  => Object.assign(e.currentTarget.style, blurStyle('password'))}
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: TEXT_SUB }}
                        tabIndex={-1}>
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    {tab === 'signup' && !errors.password && (
                      <p className="text-xs mt-1" style={{ color: TEXT_SUB }}>Min 8 chars with uppercase, lowercase, and number</p>
                    )}
                  </div>

                  {tab === 'signup' && (
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: TEXT_SUB, fontWeight: 500 }}>Confirm password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={form.confirm}
                          onChange={set('confirm')}
                          autoComplete="new-password"
                          className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition-all"
                          style={inputStyle('confirm')}
                          onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                          onBlur={e  => Object.assign(e.currentTarget.style, blurStyle('confirm'))}
                        />
                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: TEXT_SUB }}
                          tabIndex={-1}>
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
                    </div>
                  )}

                  {tab === 'login' && (
                    <div className="flex items-center gap-2.5 cursor-pointer select-none"
                      onClick={() => setRememberMe(v => !v)}>
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: rememberMe ? (isLight ? '#2563eb' : '#6366f1') : 'transparent',
                          border:     `1.5px solid ${rememberMe ? (isLight ? '#2563eb' : '#6366f1') : BORDER}`,
                        }}>
                        {rememberMe && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: TEXT_SUB, fontWeight: 500 }}>Remember me</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading || googleLoading || domainChecking}
                    className="w-full py-3 rounded-xl text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)', boxShadow: isLight ? '0 8px 20px rgba(37,99,235,0.25)' : '0 0 24px rgba(99,102,241,0.35)', fontWeight: 600 }}>
                    {loading
                      ? (tab === 'login' ? 'Signing in…' : 'Creating account…')
                      : (tab === 'login' ? 'Sign in' : 'Create account')}
                  </button>

                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px" style={{ background: BORDER }} />
                    <span className="text-xs" style={{ color: TEXT_SUB }}>or continue with</span>
                    <div className="flex-1 h-px" style={{ background: BORDER }} />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    disabled={googleLoading}
                    className="w-full py-3 rounded-xl text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT_MAIN, fontWeight: 500, boxShadow: SHADOW }}
                    onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.borderColor = '#4285F4'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
                  >
                    {googleLoading
                      ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      : <GoogleIcon size={18} />
                    }
                    {tab === 'login' ? 'Continue with Google' : 'Sign up with Google'}
                  </button>

                  <p className="text-center text-xs pt-1" style={{ color: TEXT_SUB }}>
                    {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button type="button" onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
                      className="text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 500 }}>
                      {tab === 'login' ? 'Sign up free' : 'Log in'}
                    </button>
                  </p>

                </form>
              )}
            </>
          )}
        </div>
        <div style={{ flex: '1 0 auto' }} />
      </div>

    </div>
  );
}