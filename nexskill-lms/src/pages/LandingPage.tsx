import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLockup from '../components/brand/BrandLockup';
import GlassCard from '../components/ui/GlassCard';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#121212] overflow-x-hidden text-white font-sans selection:bg-brand-neon selection:text-black">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-brand-neon/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 py-6 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="pointer-events-auto">
                        <BrandLockup orientation="horizontal" variant="dark" />
                    </div>
                    <div className="flex gap-4 sm:gap-6 pointer-events-auto">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2.5 rounded-full text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all font-mono tracking-wide"
                        >
                            LOG IN
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-6 py-2.5 rounded-full text-sm font-bold bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
                        >
                            GET STARTED
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative w-full min-h-screen flex items-center pt-32 pb-20 lg:pt-0 lg:pb-0 z-10">
                <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                    {/* Left: Text Content */}
                    <div className="space-y-8 relative z-20 flex flex-col items-center lg:items-start text-center lg:text-left">
                        <div className="inline-block px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-brand-neon text-xs font-bold tracking-widest uppercase mb-2 animate-fade-in shadow-[0_0_15px_rgba(57,255,20,0.15)]">
                            The Future of Learning
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tighter">
                            MASTER <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon via-white to-brand-electric animate-gradient-x">
                                THE FUTURE
                            </span>
                        </h1>
                        <p className="text-lg lg:text-xl text-gray-400 leading-relaxed font-light lg:border-l-4 lg:border-brand-neon lg:pl-8 max-w-2xl">
                            Unlock your potential with NexSkill. <br className="hidden lg:block" />
                            A unified platform combining expert mentorship with cutting-edge AI tools.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 pt-4 w-full sm:w-auto">
                            <button
                                onClick={() => navigate('/signup')}
                                className="px-10 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-brand-neon to-brand-electric text-black shadow-[0_0_30px_rgba(57,255,20,0.4)] hover:shadow-[0_0_50px_rgba(57,255,20,0.6)] hover:scale-105 transition-all transform active:scale-95 w-full sm:w-auto"
                            >
                                Start Learning
                            </button>
                            <button
                                onClick={() => navigate('/coach/apply')}
                                className="px-10 py-4 rounded-xl text-lg font-bold bg-black/40 border border-white/20 text-white hover:bg-white/10 hover:border-brand-electric/50 transition-all backdrop-blur-md group w-full sm:w-auto"
                            >
                                Become a Coach <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Portals - Staggered Layout preserved but scale removed */}
                    <div className="relative w-full flex flex-col gap-8 lg:block lg:h-[600px] perspective-1000 mt-16 lg:mt-0">
                        {/* Card 1: Student */}
                        <div
                            className="relative w-full max-w-md mx-auto lg:absolute lg:top-[5%] lg:left-[5%] lg:w-[400px] z-30 lg:hover:z-40 transition-all duration-500 hover:scale-[1.02] lg:hover:scale-105 cursor-pointer"
                            onClick={() => navigate('/login')}
                        >
                            <GlassCard variant="dark" className="border-t-4 border-t-brand-neon p-8 shadow-2xl shadow-black/50">
                                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-brand-neon to-green-600 mb-6 flex items-center justify-center text-black font-bold text-3xl shadow-lg shadow-brand-neon/20">🎓</div>
                                <h3 className="text-3xl font-bold mb-3 text-white">Student Portal</h3>
                                <p className="text-gray-400 text-base leading-relaxed">Personalized learning paths adapted to your pace.</p>
                                <div className="mt-8 flex items-center text-brand-neon font-bold text-sm tracking-wide uppercase">
                                    Access Portal <span className="ml-2">→</span>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Card 2: Coach */}
                        <div
                            className="relative w-full max-w-md mx-auto lg:absolute lg:top-[30%] lg:right-[0%] lg:w-[400px] z-20 lg:hover:z-40 transition-all duration-500 hover:scale-[1.02] lg:hover:scale-105 cursor-pointer"
                            onClick={() => navigate('/coach/login')}
                        >
                            <GlassCard variant="dark" className="border-t-4 border-t-brand-electric p-8 shadow-2xl shadow-black/50">
                                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-brand-electric to-blue-600 mb-6 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-brand-electric/20">👨‍🏫</div>
                                <h3 className="text-3xl font-bold mb-3 text-white">Coach Portal</h3>
                                <p className="text-gray-400 text-base leading-relaxed">Tools to monetize your expertise globally.</p>
                                <div className="mt-8 flex items-center text-brand-electric font-bold text-sm tracking-wide uppercase">
                                    Access Portal <span className="ml-2">→</span>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Card 3: Admin */}
                        <div
                            className="relative w-full max-w-md mx-auto lg:absolute lg:bottom-[5%] lg:left-[10%] lg:w-[400px] z-10 lg:hover:z-40 transition-all duration-500 hover:scale-[1.02] lg:hover:scale-105 cursor-pointer"
                            onClick={() => navigate('/admin/login')}
                        >
                            <GlassCard variant="dark" className="border-t-4 border-t-purple-500 p-8 shadow-2xl shadow-black/50">
                                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-6 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-purple-500/20">🛡️</div>
                                <h3 className="text-3xl font-bold mb-3 text-white">Admin Access</h3>
                                <p className="text-gray-400 text-base leading-relaxed">Platform management and analytics control.</p>
                                <div className="mt-8 flex items-center text-purple-400 font-bold text-sm tracking-wide uppercase">
                                    Secure Login <span className="ml-2">→</span>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-24 bg-[#0F1115] relative z-10">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Why NexSkill?</h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">Experience the next evolution of educational technology.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                        {[
                            { title: "Immersive Learning", desc: "Interactive 3D labs and real-time collaboration with fellow students.", icon: "🌌" },
                            { title: "AI Mentorship", desc: "24/7 guidance tailored to your specific learning style and pace.", icon: "🤖" },
                            { title: "Global Community", desc: "Connect with peers, mentors, and industry experts worldwide.", icon: "🌍" }
                        ].map((feature, idx) => (
                            <GlassCard key={idx} variant="dark" className="p-8 hover:border-brand-neon/50 hover:-translate-y-2 group h-full">
                                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300 transform origin-left">{feature.icon}</div>
                                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-brand-neon transition-colors">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black py-12 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
                    <BrandLockup orientation="horizontal" variant="dark" />
                    <p className="text-gray-500 text-sm">© {new Date().getFullYear()} NexSkill. All rights reserved.</p>
                    <div className="flex gap-8 text-gray-500 font-medium text-sm">
                        <a href="#" className="hover:text-brand-neon transition-colors">Privacy</a>
                        <a href="#" className="hover:text-brand-neon transition-colors">Terms</a>
                        <a href="#" className="hover:text-brand-neon transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;