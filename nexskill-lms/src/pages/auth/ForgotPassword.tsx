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
              <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F7FF] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Forgot password?</h1>
              <p className="text-text-secondary text-sm">
                No worries, we'll send you reset instructions
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
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
                  className={`w-full px-5 py-3 bg-[#F5F7FF] rounded-full text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary-light transition-all ${
                    error ? 'ring-2 ring-red-400' : ''
                  }`}
                />
                {error && (
                  <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Send reset link
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-brand-primary transition-colors"
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
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-text-primary mb-3">Check your email</h2>
            <p className="text-text-secondary text-sm mb-2">
              We've sent password reset instructions to
            </p>
            <p className="text-brand-primary font-medium mb-6">{email}</p>

            <div className="p-4 bg-[#F5F7FF] rounded-3xl text-left mb-6">
              <p className="text-xs text-text-secondary">
                <span className="font-medium text-text-primary">💡 Tip:</span> The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>
            </div>

            <Link 
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-brand-primary transition-colors"
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
