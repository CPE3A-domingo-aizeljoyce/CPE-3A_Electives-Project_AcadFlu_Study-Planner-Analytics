import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Brain, CheckCircle2, XCircle } from 'lucide-react';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const [status, setStatus]   = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token    = searchParams.get('token');
    const verified = searchParams.get('verified');
    const error    = searchParams.get('error');

    if (error || !token) {
      setStatus('error');
      setMessage('Verification failed or link has expired. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    localStorage.setItem('token', token);
    setStatus('success');
    setMessage(verified === 'true'
      ? 'Email verified! Taking you to your dashboard…'
      : 'Signed in! Taking you to your dashboard…'
    );
    setTimeout(() => navigate('/app'), 1800);
  }, []);

  return (
    <div className="h-screen flex items-center justify-center"
      style={{ background: '#0d1117', fontFamily: "'Inter', sans-serif" }}>
      <div className="flex flex-col items-center gap-5 text-center px-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>
          <Brain className="w-6 h-6 text-white" />
        </div>
        {status === 'loading' && (
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        )}
        {status === 'success' && <CheckCircle2 className="w-8 h-8" style={{ color: '#22c55e' }} />}
        {status === 'error'   && <XCircle      className="w-8 h-8" style={{ color: '#ef4444' }} />}
        <p className="text-sm" style={{ color: status === 'error' ? '#f87171' : '#94a3b8' }}>
          {message || 'Please wait…'}
        </p>
      </div>
    </div>
  );
}
