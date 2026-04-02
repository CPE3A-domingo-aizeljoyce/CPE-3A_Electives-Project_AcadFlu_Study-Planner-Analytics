import { useNavigate } from 'react-router';
import { useState } from 'react';

import {
  Brain, Flame, Zap, Target, BarChart2, Trophy,
  Timer, BookOpen, ArrowRight, CheckCircle2, Star,
} from 'lucide-react';

const features = [
  { icon: Timer,    color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  title: 'Pomodoro Timer',  desc: 'Custom focus/break durations with beautiful circular progress and session tracking.' },
  { icon: Target,   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   title: 'Goal Tracking',   desc: 'Set study milestones, break them into tasks, and watch your progress compound daily.' },
  { icon: BarChart2,color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   title: 'Deep Analytics',  desc: 'Visualise your study patterns, peak hours, and subject distribution over time.' },
  { icon: Trophy,   color: '#f97316', bg: 'rgba(249,115,22,0.12)',  title: 'Achievements',    desc: 'Earn XP, unlock badges, and level up your Scholar rank as you hit milestones.' },
  { icon: BookOpen, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  title: 'Smart Notes',     desc: 'Linked, tag-able notes that connect directly to tasks and study sessions.' },
  { icon: Flame,    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   title: 'Streak System',   desc: 'Daily streaks and habit tracking keep you accountable and motivated.' },
];

const testimonials = [
  { name: 'Sofia R.',  role: 'Medical Student', text: "My GPA went from 3.2 to 3.8 in one semester using StudyFlow. The streak system is addictive in the best way.", avatar: 'SR', color: '#6366f1' },
  { name: 'James K.',  role: 'CS Undergrad',    text: "Finally a study app that doesn't feel like a chore. The pomodoro timer + XP system made me look forward to studying.", avatar: 'JK', color: '#22c55e' },
  { name: 'Priya M.',  role: 'Law Student',     text: "The analytics alone are worth it. Knowing exactly when I'm most productive has changed how I schedule my revision.", avatar: 'PM', color: '#f97316' },
];

const stats = [
  { value: '50K+', label: 'Active Students' },
  { value: '4.9★', label: 'Average Rating'  },
  { value: '2.4M', label: 'Sessions Logged' },
  { value: '93%',  label: 'Hit Their Goals' },
];

export function Landing() {
  const [activeLink, setActiveLink] = useState('');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: '#0d1117', fontFamily: "'Inter', sans-serif", color: '#e2e8f0' }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(26,37,64,0.6)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.45)' }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-base" style={{ fontWeight: 700, letterSpacing: '-0.3px' }}>StudyFlow</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
  {['Features', 'How it works', 'Testimonials'].map(item => {
    const isActive = activeLink === item;
    const targetId = item.toLowerCase().replace(/ /g, '-'); 

    return (
      <a 
        key={item} 
        href={`#${targetId}`}
        onClick={(e) => {
          e.preventDefault(); 
          setActiveLink(item); 
          

          document.getElementById(targetId)?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }}
        className={`text-sm transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`} 
        style={{ fontWeight: isActive ? 700 : 500 }}>
        {item}
      </a>
    );
  })}
</div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white transition-colors" style={{ fontWeight: 500 }}>
            Log in
          </button>
          <button onClick={() => navigate('/login?tab=signup')}
            className="px-4 py-2 rounded-xl text-sm text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.35)', fontWeight: 600 }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 md:px-12 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontWeight: 600 }}>
          <Zap className="w-3.5 h-3.5" />
          The #1 gamified study planner for students
        </div>

        <h1 className="max-w-3xl text-4xl md:text-6xl text-white mb-6" style={{ fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
          Study smarter.{' '}
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Level up faster.
          </span>
        </h1>

        <p className="max-w-xl text-slate-400 text-lg mb-10" style={{ lineHeight: 1.7 }}>
          StudyFlow combines Pomodoro timers, habit tracking, deep analytics, and gamified XP into one distraction-free workspace built for serious learners.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
          <button onClick={() => navigate('/login?tab=signup')}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white text-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4), 0 8px 24px rgba(0,0,0,0.3)', fontWeight: 600 }}>
            Start for free <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/app')}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-slate-300 text-sm hover:text-white transition-all"
            style={{ background: '#131929', border: '1px solid #1a2540', fontWeight: 500 }}>
            View demo →
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-white text-2xl" style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>{s.value}</div>
              <div className="text-slate-500 text-xs mt-0.5" style={{ fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* App Preview */}
      <section className="px-4 md:px-12 mb-24" style={{ overflowX: 'hidden' }}>
        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative"
          style={{ border: '1px solid #1a2540', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.1)' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#0f1626', borderBottom: '1px solid #1a2540' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
            <div className="flex-1 mx-4 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: '#131929', color: '#334155' }}>
              app.studyflow.io/dashboard
            </div>
          </div>
          <div className="relative" style={{ minHeight: 200, background: '#0f1626', padding: '1.5rem 1rem' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Focus Sessions', val: '8',     sub: 'today',     color: '#6366f1' },
                { label: 'Study Streak',   val: '12🔥',  sub: 'days',      color: '#f97316' },
                { label: 'XP Earned',      val: '2,340', sub: 'this week', color: '#22c55e' },
              ].map(c => (
                <div key={c.label} className="p-4 rounded-2xl"
                  style={{ background: 'rgba(13,17,23,0.9)', border: `1px solid ${c.color}40`, backdropFilter: 'blur(12px)' }}>
                  <div className="text-xs mb-1" style={{ color: '#64748b' }}>{c.label}</div>
                  <div className="text-2xl" style={{ fontWeight: 800, color: c.color, letterSpacing: '-0.5px' }}>{c.val}</div>
                  <div className="text-xs" style={{ color: '#334155' }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 md:px-12 mb-24">
       <div className="max-w-5xl mx-auto">
  <div className="text-center mb-12">
    <div className="text-xs mb-3" style={{ color: '#4f46e5', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Everything you need</div>
    <h2 className="text-3xl md:text-4xl" style={{ color: 'black', fontWeight: 800, letterSpacing: '-0.8px' }}>Built for how students actually learn</h2>
  </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(f => (
              <div key={f.title} className="p-5 rounded-2xl group hover:scale-[1.02] transition-all duration-200" style={{ background: '#131929', border: '1px solid #1a2540' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <div className="text-white text-sm mb-1.5" style={{ fontWeight: 600 }}>{f.title}</div>
                <div className="text-slate-500 text-sm" style={{ lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 md:px-12 mb-24">
        <div className="max-w-3xl mx-auto text-center">
  <div className="text-xs mb-3" style={{ color: '#4f46e5', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Simple to start</div>
  <h2 className="text-3xl md:text-4xl mb-12" style={{ color: 'black', fontWeight: 800, letterSpacing: '-0.8px' }}>Up and running in 60 seconds</h2>
  <div className="flex flex-col gap-6">
            {[
              { step: '01', title: 'Create your account',       desc: 'Sign up for free — no credit card needed. Set your study subjects and weekly goals.',               color: '#6366f1' },
              { step: '02', title: 'Add tasks & start a timer', desc: 'Build your task list, pick what to work on, and hit start. The Pomodoro timer handles the rest.',  color: '#22c55e' },
              { step: '03', title: 'Earn XP & track progress',  desc: 'Complete sessions to earn XP, maintain streaks, unlock achievements, and level up your rank.',      color: '#f97316' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-5 p-5 rounded-2xl text-left" style={{ background: '#131929', border: '1px solid #1a2540' }}>
                <div className="text-3xl flex-shrink-0" style={{ fontWeight: 800, color: s.color, opacity: 0.4, letterSpacing: '-1px' }}>{s.step}</div>
                <div>
                  <div className="text-white text-sm mb-1" style={{ fontWeight: 600 }}>{s.title}</div>
                  <div className="text-slate-500 text-sm" style={{ lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 md:px-12 mb-24">
        <div className="max-w-5xl mx-auto">
  <div className="text-center mb-12">
    <div className="text-xs mb-3" style={{ color: '#4f46e5', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Student love</div>
    <h2 className="text-3xl md:text-4xl mb-12" style={{ color: 'black', fontWeight: 800, letterSpacing: '-0.8px' }}>Real results, real students</h2>
  </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map(t => (
              <div key={t.name} className="p-5 rounded-2xl flex flex-col gap-4" style={{ background: '#131929', border: '1px solid #1a2540' }}>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: '#f59e0b' }} />
                  ))}
                </div>
                <p className="text-slate-400 text-sm" style={{ lineHeight: 1.7 }}>"{t.text}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0"
                    style={{ fontWeight: 700, background: `linear-gradient(135deg, ${t.color}, ${t.color}99)` }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white text-xs" style={{ fontWeight: 600 }}>{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 mb-24">
        <div className="max-w-3xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.5)' }}>
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl mb-4" style={{ color: 'black', fontWeight: 800, letterSpacing: '-0.8px' }}>Ready to level up?</h2>
<p className="mb-8 max-w-md mx-auto" style={{ color: '#333333', lineHeight: 1.7 }}>
   Join 50,000+ students who've transformed their study habits with StudyFlow. It's completely free to start.
</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => navigate('/login?tab=signup')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4)', fontWeight: 600 }}>
              Create free account <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/login')}
      className="px-8 py-3.5 rounded-2xl text-sm transition-all hover:bg-gray-100"
      style={{ color: '#475569', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', fontWeight: 600 }}>
      Already have an account
</button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-6">
            {['No credit card required', 'Free forever plan', 'Cancel anytime'].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                <span className="text-slate-500 text-xs">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

     {/* Footer */}
<footer className="px-6 md:px-12 py-4" style={{ borderTop: '1px solid #1a2540' }}>
  <div className="w-full flex items-center justify-start">
    <div className="text-slate-500 text-[10px] md:text-xs text-left" style={{ lineHeight: '1.4' }}>
      <p style={{ fontWeight: 500 }}>Developed by BS Computer Engineering Students</p>
      <p>Bulacan State University</p>
      <p>© 2026</p>
    </div>
  </div>
</footer>
    </div>
  );
}