import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentAuthLayout from '../../layouts/StudentAuthLayout';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Dummy reset - navigate to login
      navigate('/login');
    }
  };

  return (
    <StudentAuthLayout maxWidth="small">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F7FF] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Set new password</h1>
          <p className="text-text-secondary text-sm">
            Your new password must be different from previously used passwords
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Input */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Create a new password"
                className={`w-full px-5 py-3 pr-12 bg-[#F5F7FF] rounded-full text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary-light transition-all ${
                  errors.newPassword ? 'ring-2 ring-red-400' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your new password"
              className={`w-full px-5 py-3 bg-[#F5F7FF] rounded-full text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary-light transition-all ${
                errors.confirmPassword ? 'ring-2 ring-red-400' : ''
              }`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="p-4 bg-[#F5F7FF] rounded-3xl">
            <p className="text-xs font-medium text-text-primary mb-2">Password must contain:</p>
            <ul className="space-y-1 text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <span className={formData.newPassword.length >= 8 ? 'text-green-500' : 'text-text-muted'}>
                  {formData.newPassword.length >= 8 ? '✓' : '○'}
                </span>
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                <span className={/[A-Z]/.test(formData.newPassword) ? 'text-green-500' : 'text-text-muted'}>
                  {/[A-Z]/.test(formData.newPassword) ? '✓' : '○'}
                </span>
                One uppercase letter
              </li>
              <li className="flex items-center gap-2">
                <span className={/[0-9]/.test(formData.newPassword) ? 'text-green-500' : 'text-text-muted'}>
                  {/[0-9]/.test(formData.newPassword) ? '✓' : '○'}
                </span>
                One number
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-6 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Reset password
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
      </div>
    </StudentAuthLayout>
  );
};

export default ResetPassword;
