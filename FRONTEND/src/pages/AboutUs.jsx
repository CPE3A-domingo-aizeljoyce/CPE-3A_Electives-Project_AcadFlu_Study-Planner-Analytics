import { useNavigate } from 'react-router';
import { Brain, ArrowLeft, GraduationCap, Github, Mail } from 'lucide-react';

const TOP_ROW = [
  { 
    name: 'Moran, Allysa Mae',  
    role: 'Lead UI/UX Designer',   
    imageUrl: '', 
    color: '#06b6d4', 
    gradient: 'linear-gradient(135deg, #06b6d4, #38bdf8)',
    github: 'https://github.com/CPE3A-moran-allysamae',
    email: 'allysamoran29@gmail.com'
  },
  { 
    name: 'Domingo, Aizel Joyce', 
    role: 'Frontend Engineer',     
    imageUrl: '', 
    color: '#ec4899', 
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    github: 'https://github.com/CPE3A-domingo-aizeljoyce',
    email: 'aizeljoyce12@gmail.com'
  }
];

const BOTTOM_ROW = [
  { 
    name: 'Sebastian, Randel',  
    role: 'Backend Architect',     
    imageUrl: '', 
    color: '#22c55e', 
    gradient: 'linear-gradient(135deg, #22c55e, #4ade80)',
    github: 'https://github.com/CPE3A-sebastian-randel',
    email: 'randels1417@gmail.com'
  },
  { 
    name: 'Deliguer, Coleen',   
    role: 'Systems Analyst',       
    imageUrl: '', 
    color: '#8b5cf6', 
    gradient: 'linear-gradient(135deg, #8b5cf6, #c084fc)',
    github: 'https://github.com/CPE3A-deliguer-coleen',
    email: 'deliguercoleensuexx@gmail.com'
  },
  { 
    name: 'Pastor, Jerry',      
    role: 'Full Stack Developer',  
    imageUrl: '', 
    color: '#f97316', 
    gradient: 'linear-gradient(135deg, #f97316, #fbbf24)',
    github: 'https://github.com/CPE3A-pastor-jerryjr',
    email: 'jhaypastor24@gmail.com'
  }
];

export function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117', fontFamily: "'Inter', sans-serif", color: '#e2e8f0' }}>

      {/* Nav */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 flex items-center px-4 py-3 sm:px-6 sm:py-5"
        style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(26,37,64,0.6)' }}
      >
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 px-6 flex flex-col items-center text-center">
        
        {/* ACADFLU LOGO CENTERED */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.45)' }}>
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-3xl" style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>AcadFlu</span>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mb-6"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontWeight: 600 }}>
          <GraduationCap className="w-4 h-4" />
          BS Computer Engineering
        </div>
        <h1 className="text-4xl md:text-5xl text-white mb-5" style={{ fontWeight: 800, letterSpacing: '-1px' }}>
          Meet the Creators
        </h1>
        <p className="max-w-2xl mx-auto text-slate-400 text-lg" style={{ lineHeight: 1.7 }}>
          We are a team of passionate Computer Engineering students from Bulacan State University. AcadFlu is our solution to the ultimate student dilemma: staying focused in a world full of distractions.
        </p>
      </section>

      {/* Team Grid - FORCED PYRAMID LAYOUT (Using CSS Grid) */}
      <section className="px-6 md:px-12 mb-32 flex-grow"> 
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-10">
          
          {/* Top Row (2 Members) - Explicitly forced to 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
            {TOP_ROW.map((member, i) => (
              <div key={`top-${i}`} className="p-8 rounded-3xl flex flex-col items-center text-center group transition-all duration-300 hover:-translate-y-1" 
                style={{ background: '#131929', border: '1px solid #1a2540', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                
                <div className="w-28 h-28 rounded-full mb-5 flex items-center justify-center text-4xl font-bold text-white relative overflow-hidden"
                  style={{ background: member.gradient }}>
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                
                <h3 className="text-xl text-white mb-1.5" style={{ fontWeight: 700 }}>{member.name}</h3>
                <p className="text-sm mb-5" style={{ color: member.color, fontWeight: 600 }}>{member.role}</p>
                
                <p className="text-sm text-slate-400 mb-8 px-2" style={{ lineHeight: 1.6 }}>
                  Computer Engineering student dedicated to building efficient and user-friendly systems.
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${member.email}`} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Row (3 Members) - Explicitly forced to 3 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {BOTTOM_ROW.map((member, i) => (
              <div key={`bottom-${i}`} className="p-8 rounded-3xl flex flex-col items-center text-center group transition-all duration-300 hover:-translate-y-1" 
                style={{ background: '#131929', border: '1px solid #1a2540', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                
                <div className="w-28 h-28 rounded-full mb-5 flex items-center justify-center text-4xl font-bold text-white relative overflow-hidden"
                  style={{ background: member.gradient }}>
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                
                <h3 className="text-xl text-white mb-1.5" style={{ fontWeight: 700 }}>{member.name}</h3>
                <p className="text-sm mb-5" style={{ color: member.color, fontWeight: 600 }}>{member.role}</p>
                
                <p className="text-sm text-slate-400 mb-8 px-2" style={{ lineHeight: 1.6 }}>
                  Computer Engineering student dedicated to building efficient and user-friendly systems.
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${member.email}`} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 mt-auto" style={{ borderTop: '1px solid #1a2540' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" style={{ color: '#8b5cf6' }} />
            <span className="text-slate-400 text-sm" style={{ fontWeight: 600 }}>AcadFlu Team</span>
          </div>
          <div className="text-slate-600 text-xs text-center sm:text-right">
            © 2026 Bulacan State University<br />
            BSCpE Main Campus
          </div>
        </div>
      </footer>
    </div>
  );
}