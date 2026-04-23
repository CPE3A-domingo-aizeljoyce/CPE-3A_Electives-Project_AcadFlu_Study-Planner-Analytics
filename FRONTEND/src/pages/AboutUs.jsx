import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Brain, ArrowLeft, Sun, Moon, Target, Eye, Code2, X, Github, Mail } from 'lucide-react';

const TEAM = [
  { name: 'Moran, Allysa Mae',  role: 'Lead UI/UX Designer',   color: '#06b6d4', github: 'https://github.com/CPE3A-moran-allysamae', email: 'allysamoran29@gmail.com' },
  { name: 'Domingo, Aizel Joyce', role: 'Frontend Engineer',     color: '#ec4899', github: 'https://github.com/CPE3A-domingo-aizeljoyce', email: 'aizeljoyce12@gmail.com' },
  { name: 'Sebastian, Randel',  role: 'Backend Architect',     color: '#22c55e', github: 'https://github.com/CPE3A-sebastian-randel', email: 'randels1417@gmail.com' },
  { name: 'Deliguer, Coleen',   role: 'Systems Analyst',       color: '#8b5cf6', github: 'https://github.com/CPE3A-deliguer-coleen', email: 'deliguercoleensuexx@gmail.com' },
  { name: 'Pastor, Jerry',      role: 'Full Stack Developer',  color: '#f97316', github: 'https://github.com/CPE3A-pastor-jerryjr', email: 'jhaypastor24@gmail.com' }
];

export function AboutUs() {
  const navigate = useNavigate();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [isLight, setIsLight] = useState(() => localStorage.getItem('public_theme') === 'light');

  // Sync theme changes
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

  const theme = isLight ? {
    bg: '#f8fafc',
    navBg: 'rgba(255,255,255,0.85)',
    border: 'rgba(226,232,240,0.8)',
    textMain: '#0f172a',
    textSub: '#475569',
    card: '#ffffff',
    modalCard: '#f1f5f9',
    baseShadow: '0 12px 35px rgba(0,0,0,0.08)',
    hoverShadow: 'rgba(37,99,235,0.25)'
  } : {
    bg: '#0d1117',
    navBg: 'rgba(13,17,23,0.85)',
    border: 'rgba(26,37,64,0.6)',
    textMain: '#ffffff',
    textSub: '#94a3b8',
    card: '#131929',
    modalCard: '#0f1626',
    hoverShadow: 'rgba(99,102,241,0.15)'
  };

  // Force body background
  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
  }, [theme.bg]);

  return (
    <div className="min-h-screen flex flex-col relative z-0 transition-colors duration-300" style={{ background: theme.bg, fontFamily: "'Inter', sans-serif", color: theme.textSub }}>
      
      {/* GLOBAL BACKGROUND GLOW */}
      {isLight && (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(37,99,235,0.15) 0%, transparent 100%)', filter: 'blur(100px)' }} />
        </div>
      )}
      {/* Nav */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-5 transition-colors duration-300"
        style={{ background: theme.navBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${theme.border}` }}
      >
        <button onClick={() => navigate('/')} className="flex items-center gap-2 transition-colors hover:opacity-70" style={{ color: theme.textMain, fontWeight: 600 }}>
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full transition-colors"
          style={{ color: theme.textSub, background: isLight ? '#e2e8f0' : '#1e293b' }}
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </nav>

      {/* Header & Intro */}
      <section className="pt-32 md:pt-40 pb-12 px-6 flex flex-col items-center text-center max-w-3xl mx-auto">
        
        {/* ACADFLU LOGO AND NAME */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.45)', border: `1px solid ${isLight ? '#000000' : 'transparent'}` }}>
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl" style={{ color: theme.textMain, fontWeight: 800, letterSpacing: '-1px' }}>AcadFlu</span>
        </div>

        {/* ABOUT US TITLE */}
        <h1 className="text-2xl md:text-3xl mb-8 inline-block" style={{ 
          fontWeight: 800, 
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: isLight ? 'none' : '0 4px 20px rgba(139, 92, 246, 0.25)'
        }}>
          About Us
        </h1>
        
        <p className="text-base md:text-lg" style={{ color: theme.textSub, lineHeight: 1.7, fontWeight: 500 }}>
          AcadFlu was born out of the ultimate student dilemma: staying focused in a world full of distractions. 
          We built this platform to gamify the learning experience, combining proven techniques like the Pomodoro 
          method with rewarding progress systems to make productivity engaging rather than exhausting.<br/><br/>
        </p>
      </section>

      {/* Vision & Mission Grid */}
      <section className="px-6 md:px-12 w-full max-w-5xl mx-auto mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Vision -ADDED HOVER ANIMATION */}
          <div className="p-8 md:p-10 rounded-3xl flex flex-col items-center text-center cursor-default hover:-translate-y-2 transition-all duration-300" 
            style={{ background: theme.card, border: `1px solid ${theme.border}` }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 20px 40px ${theme.hoverShadow}`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform hover:scale-110" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Eye className="w-7 h-7" style={{ color: '#6366f1' }} />
            </div>
            <h3 className="text-2xl mb-4" style={{ color: theme.textMain, fontWeight: 800 }}>Our Vision</h3>
            <p style={{ color: theme.textSub, lineHeight: 1.7, fontWeight: 500, textAlign: 'center' }}>
              To empower students worldwide by transforming the way they learn—turning academic challenges into engaging, trackable, and achievable milestones through gamified technology.
            </p>
          </div>

          {/* Mission -ADDED HOVER ANIMATION */}
          <div className="p-8 md:p-10 rounded-3xl flex flex-col items-center text-center cursor-default hover:-translate-y-2 transition-all duration-300" 
            style={{ background: theme.card, border: `1px solid ${theme.border}` }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 20px 40px ${theme.hoverShadow}`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform hover:scale-110" style={{ background: 'rgba(34,197,94,0.1)' }}>
              <Target className="w-7 h-7" style={{ color: '#22c55e' }} />
            </div>
            <h3 className="text-2xl mb-4" style={{ color: theme.textMain, fontWeight: 800 }}>Our Mission</h3>
            <p style={{ color: theme.textSub, lineHeight: 1.7, fontWeight: 500, textAlign: 'center' }}>
              To provide a comprehensive, distraction-free study planner that integrates focus timers, habit tracking, and deep analytics to help learners build consistent study routines without burnout.
            </p>
          </div>

        </div>
      </section>

      {/* Meet the Developers Button */}
      <section className="px-6 mb-24 flex justify-center flex-grow">
        <button 
          onClick={() => setShowTeamModal(true)}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white text-lg transition-all hover:scale-105 active:scale-95"
          style={{ 
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
            boxShadow: '0 0 30px rgba(99,102,241,0.4)', 
            fontWeight: 700,
            border: `1px solid ${isLight ? '#000000' : 'transparent'}`
          }}>
          <Code2 className="w-6 h-6" />
          Meet the Developers
        </button>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 mt-auto" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" style={{ color: '#8b5cf6' }} />
            <span className="text-sm" style={{ color: theme.textMain, fontWeight: 700 }}>AcadFlu Team</span>
          </div>
          <div className="text-xs text-center sm:text-right" style={{ color: theme.textSub, fontWeight: 500 }}>
           Developed by BS Computer Engineering Students<br />
            Bulacan State University <br/>
            2026
          </div>
        </div>
      </footer>

      {/* TEAM MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowTeamModal(false)}>
          
          <div className="relative w-full max-w-md p-8 rounded-3xl flex flex-col gap-5 transform transition-all"
            style={{ background: theme.card, border: `1px solid ${theme.border}`, boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}>
            
            <button onClick={() => setShowTeamModal(false)} className="absolute top-5 right-5 hover:opacity-70" style={{ color: theme.textSub }}>
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Code2 className="w-6 h-6" style={{ color: '#6366f1' }} />
              </div>
              <h3 className="text-2xl" style={{ color: theme.textMain, fontWeight: 800, letterSpacing: '-0.5px' }}>The Developers</h3>
              <p className="text-sm mt-1" style={{ color: theme.textSub, fontWeight: 500 }}>BS Computer Engineering</p>
            </div>

            <div className="flex flex-col gap-3">
              {TEAM.map(member => (
                <div key={member.name} className="flex items-center justify-between p-4 rounded-2xl hover:-translate-y-1.5 transition-all duration-300 group" 
                  style={{ background: theme.modalCard, border: `1px solid ${theme.border}` }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 10px 20px ${theme.hoverShadow}`}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  
                  {/* Left Side: Name and Role */}
                  <div className="flex flex-col text-left">
                    <span style={{ color: theme.textMain, fontWeight: 700, fontSize: '15px' }}>
                      {member.name}
                    </span>
                    <span style={{ color: member.color, fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>{member.role}</span>
                  </div>

                  {/* Right Side: GitHub and Mail Icons */}
                  <div className="flex items-center gap-2">
                    <a href={member.github} target="_blank" rel="noopener noreferrer" 
                      className="p-2 rounded-full transition-colors hover:scale-110" 
                      style={{ background: isLight ? '#e2e8f0' : '#1e293b', color: theme.textMain }}>
                      <Github className="w-4 h-4" />
                    </a>
                    <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${member.email}`} target="_blank" rel="noopener noreferrer" 
                      className="p-2 rounded-full transition-colors hover:scale-110" 
                      style={{ background: isLight ? '#e2e8f0' : '#1e293b', color: theme.textMain }}>
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowTeamModal(false)} 
              className="w-full mt-2 py-3 rounded-xl text-sm transition-all hover:opacity-80"
              style={{ background: theme.textMain, color: theme.bg, fontWeight: 700 }}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}