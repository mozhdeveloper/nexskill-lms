import React from 'react';
import BrandLockup from '../components/brand/BrandLockup';

interface AuthSplitLayoutProps {
    children: React.ReactNode;
    imageSrc?: string;
    imageAlt?: string;
}

const AuthSplitLayout: React.FC<AuthSplitLayoutProps> = ({
    children,
    imageSrc = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=2000",
    imageAlt = "NexSkill Education"
}) => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-slate-900 overflow-hidden">
            {/* Left Column: Visual Brand / Education Image */}
            <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 to-indigo-900/60 z-10" />
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="absolute inset-0 w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-1000"
                />
                <div className="relative z-20 flex flex-col justify-end p-12 lg:p-20 text-white h-full w-full">
                    <div className="max-w-md">
                        <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                            Unlock Your Potential with NexSkill.
                        </h1>
                        <p className="text-lg text-blue-50 opacity-90 leading-relaxed font-light">
                            Join a global community of learners and world-class mentors. Elevate your career with industry-leading skills.
                        </p>
                    </div>
                    <div className="mt-12 flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <img
                                    key={i}
                                    src={`https://picsum.photos/seed/${i + 10}/100/100`}
                                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                                    alt="User"
                                />
                            ))}
                        </div>
                        <p className="text-sm font-medium text-white/80">Joined by 10k+ learners</p>
                    </div>
                </div>
            </div>

            {/* Right Column: Authentication Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 lg:p-20 bg-white dark:bg-slate-900">
                <div className="w-full max-w-md">
                    {/* Logo Brand with Slogan */}
                    <div className="mb-10">
                        <BrandLockup orientation="vertical" />
                    </div>

                    {children}

                    <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">
                            &copy; 2025 NexSkill Learning Platforms. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthSplitLayout;