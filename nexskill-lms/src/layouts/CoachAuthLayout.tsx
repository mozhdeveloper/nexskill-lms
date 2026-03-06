import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLockup from '../components/brand/BrandLockup';

interface CoachAuthLayoutProps {
    children: React.ReactNode;
}

const CoachAuthLayout: React.FC<CoachAuthLayoutProps> = ({ children }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-400"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                        </button>
                        <BrandLockup orientation="horizontal" />
                    </div>

                    <div className="hidden sm:block text-sm text-gray-500 font-medium">
                        Join the Network
                    </div>
                </div>

                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Coach Application</h1>
                        <p className="text-gray-600 dark:text-gray-400">Apply to become a mentor and share your expertise with the world.</p>
                    </div>
                    {children}
                </div>

                <div className="mt-12 text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} NexSkill. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default CoachAuthLayout;
