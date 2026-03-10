import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  GraduationCap, BookOpen, Shield, ChevronRight,
  Sparkles, Users, Brain, Globe, Zap, ArrowRight,
  Play, CheckCircle2, Star, TrendingUp, Award,
  MonitorPlay, UserCheck, BarChart3
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────── Design Tokens ─────────────── */
const T = {
  void: '#0A0A14',
  surface: '#111120',
  card: '#16162A',
  border: '#252545',
  accent: '#304DB5',
  neon: '#22c55e',
  electric: '#3b82f6',
  plasma: '#7B61FF',
  ghost: '#F0EFF4',
  muted: '#8888AA',
  white: '#FFFFFF',
};

/* ─────────────── Noise Overlay (SVG filter) ─────────────── */
const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03]">
    <svg width="100%" height="100%">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </div>
);

/* ─────────────── Magnetic Button ─────────────── */
const MagneticButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, onClick, variant = 'primary', className = '', size = 'md' }) => {
  const ref = useRef<HTMLButtonElement>(null);

  const baseClasses = 'relative overflow-hidden font-semibold tracking-tight transition-all duration-300 cursor-pointer rounded-[2rem] inline-flex items-center justify-center gap-2';

  const sizeClasses = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-8 py-3.5 text-base',
    lg: 'px-10 py-4.5 text-lg',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#304DB5] to-[#3b82f6] text-white shadow-[0_0_40px_rgba(48,77,181,0.3)] hover:shadow-[0_0_60px_rgba(48,77,181,0.5)]',
    secondary: 'bg-white/[0.06] border border-white/[0.12] text-white backdrop-blur-xl hover:bg-white/[0.1] hover:border-white/[0.2]',
    ghost: 'text-[#8888AA] hover:text-white',
    accent: 'bg-gradient-to-r from-[#22c55e] to-[#3b82f6] text-black font-bold shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)]',
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onMouseEnter={() => {
        if (ref.current) gsap.to(ref.current, { scale: 1.03, y: -1, duration: 0.3, ease: 'power2.out' });
      }}
      onMouseLeave={() => {
        if (ref.current) gsap.to(ref.current, { scale: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      }}
    >
      {children}
    </button>
  );
};

/* ─────────────── Portal Card ─────────────── */
const PortalCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  accentColor: string;
  glowColor: string;
  onClick: () => void;
  ctaText: string;
  badge?: string;
}> = ({ icon, title, description, features, accentColor, glowColor, onClick, ctaText, badge }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="portal-card group relative cursor-pointer"
      onMouseEnter={() => {
        if (cardRef.current) gsap.to(cardRef.current, { scale: 1.02, y: -8, duration: 0.4, ease: 'power2.out' });
      }}
      onMouseLeave={() => {
        if (cardRef.current) gsap.to(cardRef.current, { scale: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      }}
    >
      {/* Glow */}
      <div
        className="absolute -inset-[1px] rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
        style={{ background: `linear-gradient(135deg, ${accentColor}40, transparent 60%)` }}
      />
      <div
        className="relative rounded-[2rem] p-8 lg:p-10 border border-white/[0.06] overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${T.card} 0%, ${T.surface} 100%)` }}
      >
        {/* Ambient glow inside card */}
        <div
          className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"
          style={{ background: glowColor }}
        />

        {badge && (
          <div
            className="absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
            style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}
          >
            {badge}
          </div>
        )}

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`, boxShadow: `0 8px 30px ${accentColor}40` }}
        >
          {icon}
        </div>

        <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>{title}</h3>
        <p className="text-[#8888AA] text-base leading-relaxed mb-6">{description}</p>

        {/* Feature list */}
        <ul className="space-y-3 mb-8">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-[#AAAACC]">
              <CheckCircle2 size={16} style={{ color: accentColor }} className="flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div
          className="flex items-center gap-2 font-bold text-sm tracking-wide uppercase transition-all duration-300 group-hover:gap-3"
          style={{ color: accentColor }}
        >
          {ctaText}
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Typewriter Effect ────────────── */
const TypewriterFeed: React.FC<{ messages: string[]; accentColor: string }> = ({ messages, accentColor }) => {
  const [currentMsg, setCurrentMsg] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let charIdx = 0;
    const msg = messages[currentMsg];
    setDisplayText('');

    const typeInterval = setInterval(() => {
      if (charIdx < msg.length) {
        setDisplayText(msg.substring(0, charIdx + 1));
        charIdx++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setCurrentMsg((prev) => (prev + 1) % messages.length);
        }, 2500);
      }
    }, 45);

    return () => clearInterval(typeInterval);
  }, [currentMsg, messages]);

  return (
    <div className="font-mono text-sm leading-relaxed">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
        <span className="text-xs uppercase tracking-widest" style={{ color: accentColor }}>Live Feed</span>
      </div>
      <span className="text-[#CCCCEE]">{displayText}</span>
      <span
        className="inline-block w-[2px] h-4 ml-0.5 -mb-0.5 transition-opacity duration-100"
        style={{ background: accentColor, opacity: cursorVisible ? 1 : 0 }}
      />
    </div>
  );
};

/* ─────────────── Stats Counter ─────────────── */
const StatCounter: React.FC<{ value: string; label: string; suffix?: string }> = ({ value, label, suffix = '' }) => (
  <div className="text-center">
    <div className="text-3xl lg:text-4xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
      {value}<span className="text-[#304DB5]">{suffix}</span>
    </div>
    <div className="text-sm text-[#8888AA] mt-1 font-mono uppercase tracking-wider">{label}</div>
  </div>
);

/* ═══════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════ */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const philosophyRef = useRef<HTMLElement>(null);
  const portalsRef = useRef<HTMLElement>(null);
  const protocolRef = useRef<HTMLElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);

  /* ── GSAP Master Animation Context ── */
  useEffect(() => {
    const ctx = gsap.context(() => {

      /* ─── HERO animations ─── */
      gsap.fromTo('.hero-badge', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 });
      gsap.fromTo('.hero-title-1', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.4 });
      gsap.fromTo('.hero-title-2', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.6 });
      gsap.fromTo('.hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.9 });
      gsap.fromTo('.hero-cta', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 1.1, stagger: 0.12 });
      gsap.fromTo('.hero-stat', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 1.4, stagger: 0.1 });
      gsap.fromTo('.hero-visual', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.8 });

      /* ─── PORTALS section ─── */
      gsap.fromTo('.portal-card', { opacity: 0, y: 60 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15,
        scrollTrigger: { trigger: portalsRef.current, start: 'top 75%' },
      });

      /* ─── FEATURES section ─── */
      gsap.fromTo('.feature-card', { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: featuresRef.current, start: 'top 75%' },
      });

      /* ─── PHILOSOPHY section ─── */
      gsap.fromTo('.philosophy-line', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15,
        scrollTrigger: { trigger: philosophyRef.current, start: 'top 70%' },
      });

      /* ─── PROTOCOL section ─── */
      gsap.fromTo('.protocol-step', { opacity: 0, y: 60, scale: 0.95 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', stagger: 0.2,
        scrollTrigger: { trigger: protocolRef.current, start: 'top 70%' },
      });

    });

    return () => ctx.revert();
  }, []);

  /* ── Navbar scroll observer ── */
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white selection:bg-[#304DB5]/40 selection:text-white overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <NoiseOverlay />

      {/* ═══════════ A. NAVBAR — "The Floating Island" ═══════════ */}
      <nav
        ref={navRef}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-[2rem] ${
          navScrolled
            ? 'bg-[#0A0A14]/70 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.4)] px-6 py-3'
            : 'bg-transparent px-6 py-4'
        }`}
      >
        <div className="flex items-center gap-8 lg:gap-12">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#304DB5] to-[#3b82f6] flex items-center justify-center shadow-[0_0_20px_rgba(48,77,181,0.4)]">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'Sora, sans-serif' }}>NEXSKILL</span>
          </div>

          {/* Nav links — desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {['Platform', 'Features', 'How It Works', 'Pricing'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  const id = item.toLowerCase().replace(/\s+/g, '-');
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-[#8888AA] hover:text-white transition-colors duration-300 font-medium"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-3 ml-auto">
            <MagneticButton variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Log In
            </MagneticButton>
            <MagneticButton variant="primary" size="sm" onClick={() => navigate('/signup')}>
              Get Started <ChevronRight size={16} />
            </MagneticButton>
          </div>
        </div>
      </nav>

      {/* ═══════════ B. HERO — "The Opening Shot" ═══════════ */}
      <header ref={heroRef} className="relative min-h-[100dvh] flex items-end pb-20 lg:items-center lg:pb-0 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0">
          {/* Deep radial gradients */}
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-[#304DB5]/[0.08] blur-[150px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[#7B61FF]/[0.06] blur-[150px]" />
          <div className="absolute top-[30%] right-[20%] w-[500px] h-[500px] rounded-full bg-[#22c55e]/[0.04] blur-[120px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A14] to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 w-full pt-32 lg:pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left — Copy */}
            <div className="space-y-8">
              <div className="hero-badge opacity-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-xs font-semibold tracking-widest uppercase text-[#22c55e] font-mono">Platform Live</span>
              </div>

              <div>
                <h1 className="hero-title-1 opacity-0 text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Mastery is the
                </h1>
                <h1 className="hero-title-2 opacity-0 text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-normal leading-[1.05] tracking-[-0.01em] italic text-transparent bg-clip-text bg-gradient-to-r from-[#304DB5] via-[#3b82f6] to-[#22c55e]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  new currency.
                </h1>
              </div>

              <p className="hero-subtitle opacity-0 text-lg lg:text-xl text-[#8888AA] leading-relaxed max-w-xl">
                NexSkill unifies expert coaching, AI-powered learning paths, and a global
                community — so every skill you build compounds into real-world value.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 hero-cta opacity-0">
                <MagneticButton variant="accent" size="lg" onClick={() => navigate('/signup')}>
                  <Play size={18} /> Start Learning Free
                </MagneticButton>
                <MagneticButton variant="secondary" size="lg" onClick={() => navigate('/coach/apply')}>
                  Become a Coach <ArrowRight size={18} />
                </MagneticButton>
              </div>

              {/* Trust stats */}
              <div className="flex flex-wrap gap-10 pt-4">
                {[
                  { value: '10K', suffix: '+', label: 'Learners' },
                  { value: '500', suffix: '+', label: 'Courses' },
                  { value: '4.9', suffix: '\u2605', label: 'Avg Rating' },
                ].map((s, i) => (
                  <div key={i} className="hero-stat opacity-0">
                    <StatCounter {...s} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Hero Visual (Floating Dashboard) */}
            <div className="hero-visual opacity-0 relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-[560px] ml-auto">
                {/* Orbiting ring */}
                <div className="absolute inset-8 rounded-full border border-white/[0.04]" style={{ animation: 'spin 30s linear infinite' }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#304DB5] shadow-[0_0_15px_rgba(48,77,181,0.6)]" />
                </div>
                <div className="absolute inset-20 rounded-full border border-white/[0.03]" style={{ animation: 'spin 20s linear infinite reverse' }}>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                </div>

                {/* Central platform card */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] p-6 rounded-[2rem] bg-gradient-to-b from-[#16162A] to-[#111120] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#304DB5] to-[#3b82f6] flex items-center justify-center">
                      <GraduationCap size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>NexSkill</div>
                      <div className="text-xs text-[#8888AA] font-mono">Learning Platform</div>
                    </div>
                  </div>
                  <TypewriterFeed
                    messages={[
                      '\u2192 Student enrolled in React Bootcamp',
                      '\u2192 Coach earned \u20B14,800 this week',
                      '\u2192 AI generated study plan for Maria',
                      '\u2192 98% course completion rate',
                      '\u2192 New coaching session booked',
                      '\u2192 Certificate issued to John D.',
                    ]}
                    accentColor={T.neon}
                  />
                </div>

                {/* Floating mini cards */}
                <div className="absolute top-[12%] right-[5%] p-3 rounded-2xl bg-[#16162A]/90 border border-white/[0.06] backdrop-blur-sm" style={{ animation: 'landing-float 6s ease-in-out infinite' }}>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#22c55e]" />
                    <span className="text-xs font-bold text-[#22c55e] font-mono">+23%</span>
                    <span className="text-xs text-[#8888AA]">this month</span>
                  </div>
                </div>
                <div className="absolute bottom-[15%] left-[5%] p-3 rounded-2xl bg-[#16162A]/90 border border-white/[0.06] backdrop-blur-sm" style={{ animation: 'landing-float 5s ease-in-out infinite 1s' }}>
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-[#F59E0B]" fill="#F59E0B" />
                    <span className="text-xs font-bold text-white font-mono">4.9</span>
                    <span className="text-xs text-[#8888AA]">rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════ C. PORTALS — Role-Based Access ═══════════ */}
      <section ref={portalsRef} id="platform" className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A14] via-[#0D0D1A] to-[#0A0A14]" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] mb-6">
              <span className="text-xs font-semibold tracking-widest uppercase text-[#304DB5] font-mono">Choose Your Path</span>
            </div>
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
              One Platform. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#304DB5] to-[#3b82f6]">Every Role.</span>
            </h2>
            <p className="text-lg text-[#8888AA] max-w-2xl mx-auto">
              Whether you learn, teach, or manage — NexSkill adapts to your needs with dedicated portals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <PortalCard
              icon={<GraduationCap size={24} className="text-white" />}
              title="Student Portal"
              description="Personalized learning journeys powered by AI, with real-time progress tracking and community support."
              features={[
                'AI-powered study plans & recommendations',
                'Interactive courses with live coaching',
                'Progress tracking & certificates',
                'Peer community & discussion forums',
              ]}
              accentColor={T.neon}
              glowColor={T.neon}
              onClick={() => navigate('/student/login')}
              ctaText="Start Learning"
              badge="Most Popular"
            />

            <PortalCard
              icon={<BookOpen size={24} className="text-white" />}
              title="Coach Portal"
              description="Build, price, and publish courses with powerful tools. Grow your audience and earn on your terms."
              features={[
                'Drag-and-drop course builder',
                'Flexible pricing with 80% revenue share',
                'Student analytics & engagement tools',
                'Live coaching sessions & scheduling',
              ]}
              accentColor={T.electric}
              glowColor={T.electric}
              onClick={() => navigate('/coach/login')}
              ctaText="Start Teaching"
            />

            <PortalCard
              icon={<Shield size={24} className="text-white" />}
              title="Admin Control"
              description="Full platform oversight with real-time analytics, financial controls, and user management."
              features={[
                'Real-time financial dashboards',
                'User & content moderation tools',
                'Platform-wide analytics & KPIs',
                'System health monitoring & alerts',
              ]}
              accentColor={T.plasma}
              glowColor={T.plasma}
              onClick={() => navigate('/admin/login')}
              ctaText="Secure Access"
            />
          </div>
        </div>
      </section>

      {/* ═══════════ D. FEATURES — "Interactive Functional Artifacts" ═══════════ */}
      <section ref={featuresRef} id="features" className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A14] to-[#0D0D1A]" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] mb-6">
              <Sparkles size={14} className="text-[#304DB5]" />
              <span className="text-xs font-semibold tracking-widest uppercase text-[#304DB5] font-mono">Why NexSkill</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
              Built for <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#304DB5] to-[#22c55e]" style={{ fontFamily: "'Instrument Serif', serif" }}>real mastery.</span>
            </h2>
            <p className="text-lg text-[#8888AA] max-w-2xl mx-auto">Not another course marketplace. A complete skill-building operating system.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Brain size={24} />, title: 'AI-Powered Learning', desc: 'Intelligent study plans that adapt to your pace, knowledge gaps, and learning style in real time.', color: T.neon },
              { icon: <Users size={24} />, title: 'Expert Coaching', desc: 'Learn directly from industry professionals through live sessions, feedback, and mentorship.', color: T.electric },
              { icon: <Globe size={24} />, title: 'Global Community', desc: 'Connect with learners, coaches, and teams worldwide. Collaborate, compete, and grow together.', color: T.plasma },
              { icon: <MonitorPlay size={24} />, title: 'Rich Course Builder', desc: 'Coaches create immersive courses with video, quizzes, code labs, and interactive modules.', color: '#F59E0B' },
              { icon: <UserCheck size={24} />, title: 'Verified Certificates', desc: 'Earn blockchain-backed certificates that prove your skills to employers worldwide.', color: '#EC4899' },
              { icon: <BarChart3 size={24} />, title: 'Revenue Analytics', desc: 'Coaches track earnings, fees, and student engagement with real-time financial dashboards.', color: '#06B6D4' },
            ].map((f, i) => (
              <div
                key={i}
                className="feature-card group opacity-0 p-8 rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-[#16162A] to-[#111120] hover:border-white/[0.12] transition-all duration-500"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${f.color}15`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-300" style={{ fontFamily: 'Sora, sans-serif' }}>{f.title}</h3>
                <p className="text-[#8888AA] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ E. PHILOSOPHY — "The Manifesto" ═══════════ */}
      <section ref={philosophyRef} className="relative py-24 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-[#0D0D1A]" />
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(48,77,181,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(34,197,94,0.2) 0%, transparent 50%)',
        }} />

        <div className="relative z-10 max-w-[1100px] mx-auto px-6 text-center">
          <p className="philosophy-line opacity-0 text-xl lg:text-2xl text-[#666688] leading-relaxed mb-8">
            Most education platforms focus on: <span className="text-[#8888AA]">content volume, passive video watching, and vanity certificates.</span>
          </p>
          <p className="philosophy-line opacity-0 text-3xl lg:text-5xl xl:text-6xl font-bold leading-[1.15] tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            We focus on:{' '}
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#304DB5] via-[#3b82f6] to-[#22c55e]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              real skill mastery
            </span>
            {' '}through mentorship, practice, and{' '}
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] to-[#304DB5]" style={{ fontFamily: "'Instrument Serif', serif" }}>
              measurable outcomes.
            </span>
          </p>
        </div>
      </section>

      {/* ═══════════ F. PROTOCOL — "How It Works" ═══════════ */}
      <section ref={protocolRef} id="how-it-works" className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D1A] to-[#0A0A14]" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] mb-6">
              <span className="text-xs font-semibold tracking-widest uppercase text-[#304DB5] font-mono">The Protocol</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
              From zero to <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#304DB5] to-[#22c55e]" style={{ fontFamily: "'Instrument Serif', serif" }}>mastery.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Choose Your Path',
                desc: 'Browse AI-recommended courses or connect with an expert coach. Our platform matches you with the right learning trajectory.',
                color: T.neon,
                icon: <Sparkles size={32} />,
              },
              {
                step: '02',
                title: 'Learn & Practice',
                desc: 'Engage with interactive lessons, real-world projects, live coaching sessions, and AI-driven exercises that adapt to your progress.',
                color: T.electric,
                icon: <Brain size={32} />,
              },
              {
                step: '03',
                title: 'Prove & Earn',
                desc: 'Earn verified certificates, build a portfolio of real work, and for coaches \u2014 monetize your expertise with an 80/20 revenue split.',
                color: T.plasma,
                icon: <Award size={32} />,
              },
            ].map((step, i) => (
              <div
                key={i}
                className="protocol-step opacity-0 relative p-10 rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-[#16162A] to-[#111120] overflow-hidden group"
              >
                {/* Step number watermark */}
                <div
                  className="absolute top-6 right-6 text-[5rem] font-extrabold leading-none opacity-[0.04] select-none"
                  style={{ color: step.color, fontFamily: 'Sora, sans-serif' }}
                >
                  {step.step}
                </div>

                {/* Animated accent */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"
                  style={{ background: `linear-gradient(90deg, ${step.color}, transparent)` }}
                />

                <div className="mb-6" style={{ color: step.color }}>{step.icon}</div>
                <div className="font-mono text-sm tracking-widest mb-3" style={{ color: step.color }}>STEP {step.step}</div>
                <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>{step.title}</h3>
                <p className="text-[#8888AA] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ G. PRICING / CTA ═══════════ */}
      <section id="pricing" className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-[#0A0A14]" />
        <div className="relative z-10 max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
              Start for <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] to-[#304DB5]" style={{ fontFamily: "'Instrument Serif', serif" }}>free.</span>
            </h2>
            <p className="text-lg text-[#8888AA] max-w-2xl mx-auto">
              Join thousands of learners and coaches on NexSkill. No credit card required to begin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free tier */}
            <div className="p-8 rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-[#16162A] to-[#111120]">
              <div className="text-sm font-mono tracking-widest text-[#8888AA] uppercase mb-2">Student</div>
              <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Free</div>
              <div className="text-sm text-[#666688] mb-6">Forever</div>
              <ul className="space-y-3 mb-8">
                {['Browse free courses', 'AI study plan', 'Community access', 'Progress tracking'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#AAAACC]">
                    <CheckCircle2 size={14} className="text-[#22c55e] flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <MagneticButton variant="secondary" className="w-full" onClick={() => navigate('/signup')}>
                Get Started
              </MagneticButton>
            </div>

            {/* Pro tier — highlighted */}
            <div className="relative p-8 rounded-[2rem] border-2 border-[#304DB5]/50 bg-gradient-to-b from-[#1a1a3a] to-[#111120] shadow-[0_0_60px_rgba(48,77,181,0.15)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-[#304DB5] text-xs font-bold text-white tracking-wider uppercase">
                Recommended
              </div>
              <div className="text-sm font-mono tracking-widest text-[#304DB5] uppercase mb-2">Pro Learner</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{'\u20B1'}499</span>
                <span className="text-sm text-[#8888AA]">/mo</span>
              </div>
              <div className="text-sm text-[#666688] mb-6">Full platform access</div>
              <ul className="space-y-3 mb-8">
                {['All free features', 'Premium course library', '1-on-1 coaching sessions', 'Verified certificates', 'Priority AI support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#CCCCEE]">
                    <CheckCircle2 size={14} className="text-[#304DB5] flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <MagneticButton variant="primary" className="w-full" onClick={() => navigate('/signup')}>
                Start Pro Trial
              </MagneticButton>
            </div>

            {/* Coach tier */}
            <div className="p-8 rounded-[2rem] border border-white/[0.06] bg-gradient-to-b from-[#16162A] to-[#111120]">
              <div className="text-sm font-mono tracking-widest text-[#8888AA] uppercase mb-2">Coach</div>
              <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>80%</div>
              <div className="text-sm text-[#666688] mb-6">Revenue share per sale</div>
              <ul className="space-y-3 mb-8">
                {['Course builder tools', 'Student analytics', 'Live coaching suite', 'Earnings dashboard', 'Global audience reach'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#AAAACC]">
                    <CheckCircle2 size={14} className="text-[#3b82f6] flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <MagneticButton variant="secondary" className="w-full" onClick={() => navigate('/coach/apply')}>
                Apply as Coach
              </MagneticButton>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ H. FOOTER ═══════════ */}
      <footer className="relative pt-20 pb-12 rounded-t-[4rem] overflow-hidden" style={{ background: T.void }}>
        <div className="absolute inset-0 border-t border-white/[0.06]" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#304DB5] to-[#3b82f6] flex items-center justify-center">
                  <Zap size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'Sora, sans-serif' }}>NEXSKILL</span>
              </div>
              <p className="text-sm text-[#666688] leading-relaxed mb-4">
                Master Your Skill. Build Your Future.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-xs text-[#666688] font-mono">System Operational</span>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4 tracking-wider uppercase" style={{ fontFamily: 'Sora, sans-serif' }}>Platform</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Student Login', path: '/student/login' },
                  { label: 'Coach Login', path: '/coach/login' },
                  { label: 'Admin Login', path: '/admin/login' },
                  { label: 'Sign Up', path: '/signup' },
                ].map((link) => (
                  <li key={link.label}>
                    <button onClick={() => navigate(link.path)} className="text-sm text-[#666688] hover:text-white transition-colors duration-300">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4 tracking-wider uppercase" style={{ fontFamily: 'Sora, sans-serif' }}>Resources</h4>
              <ul className="space-y-3">
                {['Browse Courses', 'Become a Coach', 'Help Center', 'Community'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-[#666688] hover:text-white transition-colors duration-300 cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4 tracking-wider uppercase" style={{ fontFamily: 'Sora, sans-serif' }}>Legal</h4>
              <ul className="space-y-3">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact Us'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-[#666688] hover:text-white transition-colors duration-300 cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#444466]">
              &copy; {new Date().getFullYear()} NexSkill. All rights reserved.
            </p>
            <p className="text-xs text-[#333355] font-mono">
              Built with precision. Designed for mastery.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;