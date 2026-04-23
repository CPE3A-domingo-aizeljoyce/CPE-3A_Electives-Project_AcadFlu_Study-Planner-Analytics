import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import {
  Brain, Flame, Zap, Target, BarChart2, Trophy,
  Timer, BookOpen, ArrowRight, CheckCircle2, Sun, Moon, Menu, X
} from 'lucide-react';

const features = [
  { icon: Timer,    color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  title: 'Pomodoro Timer',  desc: 'Custom focus/break durations with beautiful circular progress and session tracking.' },
  { icon: Target,   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   title: 'Goal Tracking',   desc: 'Set study milestones, break them into tasks, and watch your progress compound daily.' },
  { icon: BarChart2,color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   title: 'Deep Analytics',  desc: 'Visualise your study patterns, peak hours, and subject distribution over time.' },
  { icon: Trophy,   color: '#f97316', bg: 'rgba(249,115,22,0.12)',  title: 'Achievements',    desc: 'Earn XP, unlock badges, and level up your Scholar rank as you hit milestones.' },
  { icon: BookOpen, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  title: 'Smart Notes',     desc: 'Linked, tag-able notes that connect directly to tasks and study sessions.' },
  { icon: Flame,    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   title: 'Streak System',   desc: 'Daily streaks and habit tracking keep you accountable and motivated.' },
];

const stats = [
  { value: '50K+', label: 'Active Students' },
  { value: '4.9★', label: 'Average Rating'  },
  { value: '2.4M', label: 'Sessions Logged' },
  { value: '93%',  label: 'Hit Their Goals' },
];

export function Landing() {
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLight, setIsLight] = useState(() => localStorage.getItem('public_theme') === 'light');

  const toggleTheme = () => {
    setIsLight(prev => {
      const next = !prev;
      localStorage.setItem('public_theme', next ? 'light' : 'dark');
      window.dispatchEvent(new Event('storage'));
      return next;
    });
  };

  const theme = isLight ? {
    bg: '#f8fafc', 
    navBg: 'rgba(255,255,255,0.85)',
    border: 'rgba(203, 213, 225, 0.7)', 
    textSub: '#475569', 
    card: '#ffffff',
    baseShadow: '0 12px 35px rgba(0,0,0,0.08)',
    hoverShadow: 'rgba(37,99,235,0.25)', 
    heroGlow: 'rgba(37,99,235,0.45)',
    primaryBtn: 'linear-gradient(135deg, #2563eb, #6366f1)' 
  } : {
    bg: '#0d1117',
    navBg: 'rgba(13,17,23,0.85)',
    border: 'rgba(26,37,64,0.6)',
    textMain: '#ffffff',
    textSub: '#94a3b8',
    card: '#131929',
    baseShadow: 'none',
    hoverShadow: 'rgba(99,102,241,0.15)',
    heroGlow: 'rgba(99,102,241,0.12)',
    primaryBtn: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
  };

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
  }, [theme.bg]);

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: theme.bg, color: theme.textSub}}>

      {/* Nav */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-3 md:px-6 md:py-5 transition-colors duration-300 overflow-x-hidden"
        style={{ background: theme.navBg, borderBottom: `1px solid ${theme.border}`, backdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center gap-2 md:gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: theme.primaryBtn, boxShadow: isLight ? '0 4px 15px rgba(37,99,235,0.3)' : '0 0 20px rgba(99,102,241,0.45)' }}>
            <Brain className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <span className="text-sm md:text-base truncate hidden min-[340px]:block" style={{ color: theme.textMain, fontWeight: 800, letterSpacing: '-0.3px' }}>AcadFlu</span>
        </div>

        {/* Center Links - Hidden on Mobile */}
        <div className="hidden md:flex items-center justify-center gap-8 flex-1 whitespace-nowrap">
          <a href="#features" className="text-sm transition-colors hover:opacity-70" style={{ color: theme.textSub, fontWeight: 600 }}>
            Features
          </a>
          <a href="#how-it-works" className="text-sm transition-colors hover:opacity-70" style={{ color: theme.textSub, fontWeight: 600 }}>
            How it works
          </a>
          <button onClick={() => navigate('/about')} className="text-sm transition-colors hover:opacity-70" style={{ color: theme.textSub, fontWeight: 600 }}>
            About Us
          </button>
        </div>

        <div className="flex items-center justify-end gap-1.5 md:gap-3 flex-1 whitespace-nowrap">
          <button 
            onClick={toggleTheme} 
            className="p-1.5 md:p-2 rounded-full transition-colors flex-shrink-0"
            style={{ color: theme.textSub, background: isLight ? '#e2e8f0' : '#1e293b' }}
          >
            {isLight ? <Moon className="w-4 h-4 md:w-4 md:h-4" /> : <Sun className="w-4 h-4 md:w-4 md:h-4" />}
          </button>

          {/* Buttons remain visible on mobile */}
          <button onClick={() => navigate('/login')} className="px-2 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm transition-colors" style={{ color: theme.textSub, fontWeight: 600 }}>
            Log in
          </button>
          <button onClick={() => navigate('/login?tab=signup')}
            className="px-2 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm text-white transition-all hover:scale-105"
            style={{ background: theme.primaryBtn, boxShadow: isLight ? '0 8px 20px rgba(37,99,235,0.25)' : '0 0 20px rgba(99,102,241,0.35)', fontWeight: 600 }}>
            Get Started
          </button>

          {/* Hamburger Menu - Visible only on mobile */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 md:hidden rounded-lg transition-colors flex-shrink-0" style={{ color: theme.textSub, background: isLight ? '#e2e8f0' : '#1e293b' }}>
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Pop-up */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center md:hidden animate-in fade-in" style={{ background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(13,17,23,0.6)', backdropFilter: 'blur(16px)' }}>
          <div className="flex flex-col items-center gap-8 text-center pt-16">
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-xl" style={{ color: theme.textMain, fontWeight: 700 }}>Features</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-xl" style={{ color: theme.textMain, fontWeight: 700 }}>How it works</a>
            <button onClick={() => { navigate('/about'); setIsMenuOpen(false); }} className="text-xl" style={{ color: theme.textMain, fontWeight: 700 }}>About Us</button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative px-6 md:px-12 flex flex-col items-center text-center overflow-hidden pt-32 pb-20 md:pt-[200px] md:pb-[100px]">
        
        {/* 🌟 FIXED: Visible, Hardcoded Gradient Glow (No image needed) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full pointer-events-none -z-10"
          style={{ 
            background: `radial-gradient(closest-side, ${theme.heroGlow} 0%, transparent 100%)`, 
            filter: 'blur(50px)' 
          }} />
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6 shadow-sm"
          style={{ background: isLight ? '#ffffff' : 'rgba(99,102,241,0.12)', border: `1px solid ${theme.border}`, color: isLight ? '#2563eb' : '#6366f1', fontWeight: 700 }}>
          <Zap className="w-3.5 h-3.5" />
          The #1 gamified study planner for students
        </div>

        <h1 className="max-w-3xl text-4xl sm:text-5xl md:text-6xl mb-6" style={{ color: theme.textMain, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
          Study smarter.{' '}
          <span style={{ 
            backgroundImage: isLight ? 'linear-gradient(135deg, #2563eb, #06b6d4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}>
            Level up faster.
          </span>
        </h1>

        <p className="max-w-xl text-lg mb-10" style={{ color: theme.textSub, lineHeight: 1.7, fontWeight: 500 }}>
          AcadFlu combines Pomodoro timers, habit tracking, deep analytics, and gamified XP into one distraction-free workspace built for serious learners.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
          <button onClick={() => navigate('/login?tab=signup')}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white text-sm transition-all hover:scale-105"
            style={{ background: theme.primaryBtn, boxShadow: isLight ? '0 10px 25px rgba(37,99,235,0.3)' : '0 0 30px rgba(99,102,241,0.4)', fontWeight: 600 }}>
            Start for free <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
      
      {/* App Preview */}
      <section className="px-4 md:px-12 mb-24" style={{ overflowX: 'hidden' }}>
        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative transition-all duration-300"
          style={{ border: `1px solid ${theme.border}`, boxShadow: theme.baseShadow }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: isLight ? '#f1f5f9' : theme.card, borderBottom: `1px solid ${theme.border}` }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
            <div className="flex-1 mx-2 sm:mx-4 h-6 rounded-lg flex items-center justify-center text-[10px] sm:text-xs truncate px-2" style={{ background: theme.card, color: theme.textSub, border: `1px solid ${theme.border}`, boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}>
              acadflu.com/dashboard
            </div>
          </div>
          <div className="relative" style={{ minHeight: 200, background: theme.card, padding: '1.5rem 1rem' }}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Focus Sessions', val: '8',     sub: 'today',     color: '#6366f1' },
                { label: 'Study Streak',   val: '12🔥',  sub: 'days',      color: '#f97316' },
                { label: 'XP Earned',      val: '2,340', sub: 'this week', color: '#22c55e' },
              ].map(c => (
                <div key={c.label} className="p-4 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 cursor-default"
                  style={{ background: theme.card, border: `1px solid ${isLight ? 'rgba(203,213,225,0.5)' : c.color + '40'}`, boxShadow: theme.baseShadow }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 15px 30px ${theme.hoverShadow}`}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = theme.baseShadow}>
                  <div className="text-xs mb-1" style={{ color: theme.textSub, fontWeight: 600 }}>{c.label}</div>
                  <div className="text-2xl" style={{ fontWeight: 800, color: c.color, letterSpacing: '-0.5px' }}>{c.val}</div>
                  <div className="text-xs" style={{ color: theme.textSub, fontWeight: 500 }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 md:px-12 mb-24 pt-20" style={{ scrollMarginTop: '100px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs mb-3" style={{ color: isLight ? '#2563eb' : '#6366f1', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Everything you need</div>
            <h2 className="text-3xl md:text-4xl" style={{ color: theme.textMain, fontWeight: 800, letterSpacing: '-0.8px' }}>Built for how students actually learn</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="p-6 rounded-3xl transition-all duration-300 hover:-translate-y-2 cursor-default" 
                style={{ background: theme.card, border: `1px solid ${theme.border}`, boxShadow: theme.baseShadow }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 20px 40px ${theme.hoverShadow}`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = theme.baseShadow}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform hover:scale-110" style={{ background: f.bg }}>
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <div className="text-base mb-2" style={{ color: theme.textMain, fontWeight: 800 }}>{f.title}</div>
                <div className="text-sm" style={{ color: theme.textSub, lineHeight: 1.7, fontWeight: 500 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
     <section id="how-it-works" className="px-6 md:px-12 mb-24 pt-20" style={{ scrollMarginTop: '100px' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs mb-3" style={{ color: isLight ? '#2563eb' : '#6366f1', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Simple to start</div>
          <h2 className="text-3xl md:text-4xl mb-12" style={{ color: theme.textMain, fontWeight: 800, letterSpacing: '-0.8px' }}>Up and running in 60 seconds</h2>
          <div className="flex flex-col gap-6">
            {[
              { step: '01', title: 'Create your account',       desc: 'Sign up for free — no credit card needed. Set your study subjects and weekly goals.',               color: '#6366f1' },
              { step: '02', title: 'Add tasks & start a timer', desc: 'Build your task list, pick what to work on, and hit start. The Pomodoro timer handles the rest.',  color: '#22c55e' },
              { step: '03', title: 'Earn XP & track progress',  desc: 'Complete sessions to earn XP, maintain streaks, unlock achievements, and level up your rank.',      color: '#f97316' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4 sm:gap-5 p-5 sm:p-6 rounded-3xl text-left transition-all duration-300 hover:-translate-y-2 cursor-default" 
                style={{ background: theme.card, border: `1px solid ${theme.border}`, boxShadow: theme.baseShadow }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 20px 40px ${theme.hoverShadow}`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = theme.baseShadow}>
                <div className="text-4xl flex-shrink-0" style={{ fontWeight: 800, color: s.color, opacity: isLight ? 0.3 : 0.7, letterSpacing: '-2px', marginTop: '-4px' }}>{s.step}</div>
                <div>
                  <div className="text-base mb-1.5" style={{ color: theme.textMain, fontWeight: 800 }}>{s.title}</div>
                  <div className="text-sm" style={{ color: theme.textSub, lineHeight: 1.7, fontWeight: 500 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
     <section className="px-6 md:px-12 mb-24">
        {/* 🌟 FIXED: Reverted back to max-w-3xl and rounded-3xl */}
        <div className="max-w-3xl mx-auto rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-2"
          style={{ background: theme.card, border: `1px solid ${theme.border}`, boxShadow: theme.baseShadow }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = `0 30px 60px ${theme.hoverShadow}`}
          onMouseLeave={e => e.currentTarget.style.boxShadow = theme.baseShadow}>
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none"
               style={{ background: `radial-gradient(circle at top, ${theme.heroGlow} 0%, transparent 70%)` }} />

          <div className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: theme.primaryBtn, boxShadow: isLight ? '0 10px 25px rgba(37,99,235,0.3)' : '0 0 30px rgba(99,102,241,0.5)' }}>
            <Brain className="w-7 h-7 text-white" />
          </div>

          <h2 className="relative z-10 text-3xl md:text-4xl mb-4" style={{ color: theme.textMain, fontWeight: 800, letterSpacing: '-0.8px' }}>Ready to level up?</h2>
          <p className="relative z-10 mb-8 max-w-md mx-auto" style={{ color: theme.textSub, lineHeight: 1.7, fontWeight: 500 }}>
            Join 50,000+ students who've transformed their study habits with AcadFlu. It's completely free to start.
          </p>
          <div className="relative z-10 flex flex-row flex-wrap items-center justify-center gap-3">
            <button onClick={() => navigate('/login?tab=signup')}
              className="px-4 py-3 sm:px-8 sm:py-4 text-white text-sm sm:text-base font-semibold rounded-xl transition-all hover:scale-105"
              style={{ background: theme.primaryBtn, boxShadow: isLight ? '0 10px 25px rgba(37,99,235,0.3)' : '0 0 20px rgba(99,102,241,0.35)', fontWeight: 600 }}>
              Create free account
            </button>
            <button onClick={() => navigate('/login')} 
              className="px-2 py-3 sm:px-8 sm:py-4 text-xs min-[360px]:text-sm sm:text-base font-semibold rounded-xl whitespace-nowrap transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ background: 'transparent', color: theme.textMain, border: `1px solid ${isLight ? '#cbd5e1' : theme.border}`, fontWeight: 700 }}>
              Already have an account
            </button>
          </div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6">
            {['No credit card required', 'Free forever plan', 'Cancel anytime'].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                <span className="text-xs" style={{ color: theme.textSub, fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: theme.primaryBtn }}>
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm" style={{ color: theme.textMain, fontWeight: 800 }}>AcadFlu</span>
          </div>
          <div className="text-xs" style={{ color: theme.textSub, lineHeight: 1.6, textAlign: 'center', fontWeight: 500 }}>
            © 2026 AcadFlu. Built for learners.<br />
            Developed by BS Computer Engineering Students<br />
            Bulacan State University
          </div>
        </div>
      </footer>
    </div>
  );
}