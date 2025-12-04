import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentAuthLayout from '../../layouts/StudentAuthLayout';

const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);

  // Dummy email for display
  const userEmail = 'user@example.com';

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join('');
    if (code.length === 6) {
      // Dummy verification - navigate to onboarding
      navigate('/onboarding-preferences');
    }
  };

  const handleResendCode = () => {
    setIsResending(true);
    // Simulate resend delay
    setTimeout(() => {
      setIsResending(false);
      alert('Verification code resent!');
    }, 2000);
  };

  return (
    <StudentAuthLayout maxWidth="small">
      <div className="max-w-md mx-auto text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-text-primary mb-3">Verify your email</h1>
        <p className="text-text-secondary text-sm mb-2">
          We've sent a verification code to
        </p>
        <p className="text-brand-primary font-medium mb-8">{userEmail}</p>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          {/* Code Inputs */}
          <div className="flex justify-center gap-3">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-semibold bg-[#F5F7FF] rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary-light transition-all"
                pattern="[0-9]"
                inputMode="numeric"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={verificationCode.join('').length !== 6}
            className="w-full py-3 px-6 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Verify email
          </button>
        </form>

        {/* Resend Code */}
        <div className="mt-6">
          <p className="text-sm text-text-secondary mb-2">
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending}
            className="text-sm text-brand-primary font-medium hover:text-brand-primary-light transition-colors disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-[#F5F7FF] rounded-3xl text-left">
          <p className="text-xs text-text-secondary">
            <span className="font-medium text-text-primary">💡 Tip:</span> Check your spam folder if you don't see the email. The code expires in 10 minutes.
          </p>
        </div>
      </div>
    </StudentAuthLayout>
  );
};

export default EmailVerification;
