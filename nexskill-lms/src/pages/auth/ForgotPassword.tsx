import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentAuthLayout from '../../layouts/StudentAuthLayout';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format');
      return;
    }

    // Dummy submission - navigate to reset password
    setIsSubmitted(true);
    setTimeout(() => {
      navigate('/reset-password');
    }, 2000);
  };

  return (
    <StudentAuthLayout maxWidth="small">
      <div className="max-w-md mx-auto">
        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                <svg className="w-8 h-8 text-brand-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Forgot password?</h1>
              <p className="text-gray-400 text-sm">
                No worries, we'll send you reset instructions
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your email"
                  className={`w-full px-5 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-neon focus:border-brand-neon transition-all backdrop-blur-sm ${error ? 'ring-1 ring-red-500/50 border-red-500/30' : ''
                    }`}
                />
                {error && (
                  <p className="mt-1 text-xs text-red-400">{error}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-brand-neon to-brand-electric text-black font-bold rounded-full shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Send reset link
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-neon transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to login
              </Link>
            </div>
          </>
        ) : (
          // Success State
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-400/20 to-green-600/20 border border-green-500/30 rounded-full flex items-center justify-center backdrop-blur-sm shadow-[0_0_20px_rgba(57,255,20,0.2)]">
              <svg className="w-8 h-8 text-brand-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
            <p className="text-gray-400 text-sm mb-2">
              We've sent password reset instructions to
            </p>
            <p className="text-brand-neon font-medium mb-6">{email}</p>

            <div className="p-4 bg-white/5 border border-white/10 rounded-3xl text-left mb-6 backdrop-blur-sm">
              <p className="text-xs text-gray-400">
                <span className="font-medium text-brand-electric">💡 Tip:</span> The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-neon transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to login
            </Link>
          </div>
        )}
      </div>
    </StudentAuthLayout>
  );
};

export default ForgotPassword;
