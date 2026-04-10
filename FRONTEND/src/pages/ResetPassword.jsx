import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Brain, Eye, EyeOff, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { resetPasswordApi } from '../api/authApi';

const BORDER = '#1a2540';
const CARD   = '#131929';
const CARD2  = '#0f1626';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  // If no token in URL, redirect immediately
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset link. Please request a new one.');
    }
  }, [token]);

  const validate = () => {
    if (!password)              return 'Password is required.';
    if (password.length < 8)   return 'At least 8 characters required.';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return 'Must include uppercase, lowercase, and a number.';
    if (password !== confirm)   return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');

    try {
      const data = await resetPasswordApi({ token, password });
      // Auto-login after successful reset
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      }
      setSuccess(true);
      setTimeout(() => navigate('/app'), 2000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const focusBorder  = (e) => (e.currentTarget.style.borderColor = '#6366f1');
  const blurBorder   = (e) => (e.currentTarget.style.borderColor = BORDER);
  const inputStyle   = { background: CARD2, border: `1px solid ${BORDER}`, colorScheme: 'dark' };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0d1117', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Logo */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2.5 mb-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
        >
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="text-white text-base" style={{ fontWeight: 700 }}>StudyFlow</span>
      </button>

      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: CARD, border: `1px solid ${BORDER}` }}
      >
        {/* ── Success state ── */}
        {success ? (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              <CheckCircle2 className="w-7 h-7" style={{ color: '#22c55e' }} />
            </div>
            <div>
              <div className="text-white text-base mb-1" style={{ fontWeight: 700 }}>
                Password reset!
              </div>
              <div className="text-slate-500 text-sm" style={{ lineHeight: 1.7 }}>
                Your password has been updated.<br />Taking you to your dashboard…
              </div>
            </div>
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mt-1" />
          </div>

        ) : !token ? (
          /* ── No token state ── */
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <XCircle className="w-7 h-7" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div className="text-white text-base mb-1" style={{ fontWeight: 700 }}>
                Invalid reset link
              </div>
              <div className="text-slate-500 text-sm" style={{ lineHeight: 1.7 }}>
                This link is missing or invalid.<br />Please request a new password reset.
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl text-white text-sm transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 600 }}
            >
              Back to Log in
            </button>
          </div>

        ) : (
          /* ── Reset password form ── */
          <>
            <div className="mb-6">
              <h1 className="text-white text-2xl mb-1" style={{ fontWeight: 800, letterSpacing: '-0.4px' }}>
                Set new password
              </h1>
              <p className="text-slate-500 text-sm">
                Choose a strong password for your account.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-4"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* New password */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5" style={{ fontWeight: 500 }}>
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                    style={inputStyle}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-slate-600 text-xs mt-1">Min 8 chars with uppercase, lowercase, and number</p>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5" style={{ fontWeight: 500 }}>
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); if (error) setError(''); }}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                    style={inputStyle}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.35)', fontWeight: 600 }}
              >
                {loading ? 'Resetting password…' : 'Reset password'}
              </button>

              <p className="text-center text-slate-600 text-xs pt-1">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Log in
                </button>
              </p>

            </form>
          </>
        )}
      </div>
    </div>
  );
}