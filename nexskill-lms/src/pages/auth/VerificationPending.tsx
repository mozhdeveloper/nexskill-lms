import React from 'react';
import { Link } from 'react-router-dom';
import StudentAuthLayout from '../../layouts/StudentAuthLayout';

const VerificationPending: React.FC = () => {
    return (
        <StudentAuthLayout>
            <div className="text-center max-w-md mx-auto py-12">
                <div className="text-6xl mb-6">⏳</div>
                <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-4">
                    Application Under Review
                </h1>
                <p className="text-text-secondary dark:text-slate-400 mb-8 leading-relaxed">
                    Thank you for applying to become a coach at NexSkill! Our team is currently reviewing your profile.
                    We verify all coach applications within 24-48 hours to ensure the highest quality of education for our students.
                </p>

                <div className="bg-[#F5F7FF] dark:bg-slate-800 p-6 rounded-2xl mb-8 text-left">
                    <h3 className="font-semibold text-text-primary dark:text-white mb-2">What happens next?</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <span className="text-brand-primary mt-1">1</span>
                            <span className="text-sm text-text-secondary dark:text-slate-400">Our team reviews your experience and portfolio.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-brand-primary mt-1">2</span>
                            <span className="text-sm text-text-secondary dark:text-slate-400">
                                You'll receive an email with the verification status. If verified, an activation link will be also be given.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-brand-primary mt-1">3</span>
                            <span className="text-sm text-text-secondary dark:text-slate-400">Once verified, you can start creating courses!</span>
                        </li>
                    </ul>
                </div>

                <Link
                    to="/"
                    className="inline-block px-8 py-3 bg-brand-primary text-white font-medium rounded-full hover:bg-brand-primary-light transition-colors shadow-button-primary"
                >
                    Return to Home
                </Link>
            </div>
        </StudentAuthLayout>
    );
};

export default VerificationPending;
