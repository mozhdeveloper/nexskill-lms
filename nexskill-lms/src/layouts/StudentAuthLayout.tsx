import React from 'react';
import BrandLockup from '../components/brand/BrandLockup';

interface StudentAuthLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'small' | 'large' | 'full';
}

const StudentAuthLayout: React.FC<StudentAuthLayoutProps> = ({
  children,
  maxWidth = 'small'
}) => {
  // Use maxWidth to silence lint error and provide flexibility
  const containerClass = maxWidth === 'full' ? 'max-w-full' : (maxWidth === 'large' ? 'max-w-[1400px]' : 'max-w-[1200px]');

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden relative">
      {/* Ambient Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-neon/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-electric/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className={`w-full ${containerClass} h-full min-h-[600px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10`}>

        {/* Left Column - Image/Branding */}
        <div className="hidden md:flex md:w-1/2 bg-black/40 relative overflow-hidden">
          {/* Background Abstract 3D Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-neon/5 to-brand-electric/10"></div>

          {/* Content */}
          <div className="relative z-10 p-10 lg:p-12 flex flex-col justify-between h-full text-white">
            <div>
              {/* Logo */}
              <div className="inline-block mb-8">
                <BrandLockup orientation="horizontal" variant="dark" />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight drop-shadow-lg">
                Future-Proof <br />
                <span className="text-brand-neon">Your Skills</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                Join the next generation of learners mastering skills with AI-powered guidance and world-class mentors.
              </p>

              {/* Stats */}
              <div className="flex gap-4 pt-4">
                <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 min-w-[100px]">
                  <div className="text-2xl font-bold text-brand-neon">10K+</div>
                  <div className="text-xs text-gray-400 mt-1">Active Learners</div>
                </div>
                <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 min-w-[100px]">
                  <div className="text-2xl font-bold text-brand-electric">500+</div>
                  <div className="text-xs text-gray-400 mt-1">Expert Coaches</div>
                </div>
              </div>
            </div>

            {/* Decorative dots */}
            <div className="flex gap-2 mt-8">
              <div className="w-2 h-2 rounded-full bg-brand-neon shadow-[0_0_8px_rgba(57,255,20,0.8)]"></div>
              <div className="w-2 h-2 rounded-full bg-white/20"></div>
              <div className="w-2 h-2 rounded-full bg-white/20"></div>
            </div>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center overflow-y-auto bg-black/20">
          <div className="md:hidden mb-8 flex justify-center">
            <BrandLockup orientation="horizontal" variant="dark" />
          </div>
          {children}

          {/* Footer / Copyright */}
          <div className="mt-8 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} NexSkill. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAuthLayout;