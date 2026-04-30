import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLockup from '../../components/brand/BrandLockup';

const CoachApplicationNotice: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-screen bg-[#121212] overflow-hidden text-white font-sans flex items-center justify-center p-6 relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-neon/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-lg relative z-10">
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-8">
                        <BrandLockup orientation="horizontal" variant="dark" />
                    </div>
                    
                    <div className="w-20 h-20 bg-brand-neon/10 border border-brand-neon/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-brand-neon">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h1 className="text-4xl font-black mb-4 tracking-tight">Application Received!</h1>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Thank you for applying to be a coach. Your application is currently <span className="text-brand-neon font-bold">Pending</span>.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8">
                    <h3 className="text-sm font-bold text-brand-neon uppercase tracking-widest mb-4">What's Next?</h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                            <p className="text-gray-300 text-sm">Our admin team will review your credentials and expertise areas.</p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                            <p className="text-gray-300 text-sm">Check your email for a confirmation message regarding your application status.</p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                            <p className="text-gray-300 text-sm">Once approved, you'll receive a notification and gain full access to the Coach Dashboard.</p>
                        </li>
                    </ul>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="w-full h-14 bg-white text-black font-extrabold text-base tracking-wide uppercase rounded-2xl shadow-lg hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    Return to Home
                </button>
                
                <p className="text-center mt-8 text-gray-500 text-xs">
                    Need help? Contact our support team at <a href="mailto:support@nexskill.com" className="text-gray-400 hover:text-white transition-colors">support@nexskill.com</a>
                </p>
            </div>
        </div>
    );
};

export default CoachApplicationNotice;
