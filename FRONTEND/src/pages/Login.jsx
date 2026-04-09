import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Brain, Eye, EyeOff, ArrowLeft, Zap, Flame, Trophy, CheckCircle2 } from 'lucide-react';

const BORDER = '#1a2540';
const CARD   = '#131929';
const CARD2  = '#0f1626';

const perks = [
  { icon: Zap,    color: '#6366f1', text: 'XP & levelling system' },
  { icon: Flame,  color: '#f97316', text: 'Daily streak tracking'  },
  { icon: Trophy, color: '#f59e0b', text: 'Achievement badges'      },
];

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'login');

  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);

  const [form,   setForm]   = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    setForm({ name: '', email: '', password: '', confirm: '' });
    setSuccess(false);
  }, [tab]);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (tab === 'signup' && !form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (form.password.length < 6) errs.password = 'At least 6 characters';
    if (tab === 'signup' && form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (tab === 'signup') {
        setSuccess(true);
        setTimeout(() => navigate('/app'), 1500);
      } else {
        navigate('/app');
      }
    }, 1200);
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#0d1117', fontFamily: "'Inter', sans-serif" }}>
      {/* Mobile Back Button (Fixed to viewport, always accessible) */}
      <button onClick={() => navigate(-1)} 
        className="lg:hidden fixed top-4 left-4 flex items-center gap-1.5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all z-50"
        style={{ fontWeight: 500 }}>
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Left panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 overflow-y-auto"
        style={{ background: CARD2, borderRight: `1px solid ${BORDER}` }}>
        <div>
          <div className="flex items-center gap-2 mb-16">
            <button onClick={() => navigate(-1)} className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              style={{ fontWeight: 500 }}>
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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${p.color}18` }}>
                  <p.icon className="w-4 h-4" style={{ color: p.color }} />
                </div>
                <span className="text-slate-400 text-sm" style={{ fontWeight: 500 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-slate-700 text-xs"
          style={{ lineHeight: 1.6, textAlign: 'center' }}>
          © 2026 StudyFlow · Built for learners<br />
          Developed by BS Computer Engineering Students<br />
          Bulacan State University
        </div>
      </div>

      {/* Right panel (form) */}
      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-12 pb-12 relative overflow-y-auto w-full">
        {/* Mobile Logo */}
        <button onClick={() => navigate('/')} className="lg:hidden flex flex-col items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
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
              {tab === 'login' ? 'Sign in to continue your study streak.' : 'Start your free account — no credit card needed.'}
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: '#22c55e' }} />
              </div>
              <div>
                <div className="text-white text-base mb-1" style={{ fontWeight: 700 }}>Account created!</div>
                <div className="text-slate-500 text-sm">Redirecting to your dashboard…</div>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {tab === 'signup' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5" style={{ fontWeight: 500 }}>Full name</label>
                  <input type="text" placeholder="Moran" value={form.name} onChange={set('name')}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                    style={{ background: CARD2, border: `1px solid ${errors.name ? '#ef4444' : BORDER}`, colorScheme: 'dark' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
                    onBlur={e  => (e.currentTarget.style.borderColor = errors.name ? '#ef4444' : BORDER)} />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1.5" style={{ fontWeight: 500 }}>Email</label>
                <input type="email" placeholder="secret@gmail.com" value={form.email} onChange={set('email')}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                  style={{ background: CARD2, border: `1px solid ${errors.email ? '#ef4444' : BORDER}`, colorScheme: 'dark' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={e  => (e.currentTarget.style.borderColor = errors.email ? '#ef4444' : BORDER)} />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

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
                  <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')}
                    className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                    style={{ background: CARD2, border: `1px solid ${errors.password ? '#ef4444' : BORDER}`, colorScheme: 'dark' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
                    onBlur={e  => (e.currentTarget.style.borderColor = errors.password ? '#ef4444' : BORDER)} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              {tab === 'signup' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5" style={{ fontWeight: 500 }}>Confirm password</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={form.confirm} onChange={set('confirm')}
                      className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                      style={{ background: CARD2, border: `1px solid ${errors.confirm ? '#ef4444' : BORDER}`, colorScheme: 'dark' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={e  => (e.currentTarget.style.borderColor = errors.confirm ? '#ef4444' : BORDER)} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.35)', fontWeight: 600 }}>
                {loading
                  ? (tab === 'login' ? 'Signing in…' : 'Creating account…')
                  : (tab === 'login' ? 'Sign in' : 'Create account')}
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: BORDER }} />
                <span className="text-slate-600 text-xs">or continue with</span>
                <div className="flex-1 h-px" style={{ background: BORDER }} />
              </div>

              {/* Google Sign-In Button — frontend UI only, backend integration coming soon */}
              <button
                type="button"
                onClick={() => {
                  // TODO: Connect to backend Google OAuth endpoint
                  // window.location.href = '/api/auth/google';
                  alert('Google sign-in coming soon!');
                }}
                className="w-full py-3 rounded-xl text-slate-200 text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-3 group"
                style={{ background: CARD, border: `1px solid ${BORDER}`, fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#4285F4')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                {/* Google Logo SVG */}
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.09-6.09C34.46 2.99 29.5 1 24 1 14.82 1 7.01 6.48 3.6 14.28l7.06 5.48C12.43 13.72 17.73 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.7c-.55 2.94-2.2 5.44-4.68 7.12l7.19 5.59C43.26 37.17 46.52 31.3 46.52 24.5z"/>
                  <path fill="#FBBC05" d="M10.66 28.24A14.6 14.6 0 0 1 9.5 24c0-1.48.25-2.91.66-4.24l-7.06-5.48A23.93 23.93 0 0 0 .5 24c0 3.87.93 7.52 2.6 10.72l7.56-6.48z"/>
                  <path fill="#34A853" d="M24 46.5c5.5 0 10.12-1.82 13.5-4.96l-7.19-5.59c-1.82 1.22-4.15 1.95-6.31 1.95-6.27 0-11.57-4.22-13.34-9.9l-7.56 6.48C7.01 41.52 14.82 46.5 24 46.5z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                {tab === 'login' ? 'Continue with Google' : 'Sign up with Google'}
              </button>

              <button type="button" onClick={() => navigate('/app')}
                className="w-full py-3 rounded-xl text-slate-300 text-sm hover:text-white transition-all hover:bg-white/5"
                style={{ background: CARD, border: `1px solid ${BORDER}`, fontWeight: 500 }}>
                Continue with demo account
              </button>

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
  );
}
