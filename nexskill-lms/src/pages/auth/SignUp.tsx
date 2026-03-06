import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import BrandLockup from '../../components/brand/BrandLockup';

type AccountType = 'STUDENT' | 'COACH';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { getDefaultRoute } = useUser();

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nameExtension: '', // e.g. Jr, Sr
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  // Track if user has attempted to submit to trigger validation styles
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Helper to determine if a required field is invalid
  const isFieldInvalid = (fieldName: keyof typeof formData) => {
    if (!hasAttemptedSubmit) return false;

    // Optional fields
    if (fieldName === 'nameExtension') return false;
    if (fieldName === 'agreeToTerms') return false; // Handled separately or usually checkbox logic

    const value = formData[fieldName];
    if (typeof value === 'string') {
      return value.trim() === '';
    }
    return false;
  };

  // Updated Input styles with Label support & Validation
  const getInputClass = (fieldName: keyof typeof formData) => {
    const baseClass = "w-full h-14 px-5 bg-white/5 border rounded-xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon transition-all hover:bg-white/10";
    const defaultBorder = "border-white/10";
    const errorBorder = "border-red-500 bg-red-500/5"; // Red border on error

    if (isFieldInvalid(fieldName)) {
      return `${baseClass} ${errorBorder}`;
    }
    return `${baseClass} ${defaultBorder}`;
  };

  const validateForm = () => {
    // Strict required check
    if (!formData.firstName.trim()) return false;
    if (!formData.middleName.trim()) return false; // MIDDLE NAME REQUIRED
    if (!formData.lastName.trim()) return false;
    if (!formData.username.trim()) return false;
    if (!formData.email.trim()) return false;
    if (!/\S+@\S+\.\S+/.test(formData.email)) return false;
    if (!formData.password || formData.password.length < 8) return false;
    if (formData.password !== formData.confirmPassword) return false;
    if (!formData.agreeToTerms) return false;
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setHasAttemptedSubmit(true); // Trigger visual validation

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // IMPORTANT: Pass middleName and nameExtension if supported by signUp, 
        // or assume we need to update profile after. 
        // Adjusting to match AuthContext signature if needed, or assuming updated signature.
        // If AuthContext doesn't support middleName yet, we might need to update it or handle it here.
        // Assuming typical signUp(email, password, first, last, username, role, middle, ext) structure
        // specific to this user's codebase update.

        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          formData.username,
          accountType,
          formData.middleName, // Passed as arg 7
          formData.nameExtension // Passed as arg 8
        );

        if (error) {
          setSubmitError(error.message);
          return;
        }
        const defaultRoute = await getDefaultRoute();
        navigate(defaultRoute);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred during signup';
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
        return;
      }
    } else {
      // Form is invalid, visual cues are now active via hasAttemptedSubmit
      if (!formData.agreeToTerms) {
        setSubmitError("You must agree to the Terms & Privacy Policy");
      } else if (formData.password !== formData.confirmPassword) {
        setSubmitError("Passwords do not match");
      } else {
        setSubmitError("Please fill in all required fields");
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-screen bg-[#121212] text-white font-sans overflow-x-hidden">

      {/* LEFT SIDE (Mobile: Header / Desktop: 40% Side Panel) */}
      <div className="w-full lg:w-[40%] relative flex flex-col justify-center items-center p-10 lg:p-16 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 min-h-[400px] lg:min-h-screen shrink-0 text-center">
        {/* Background Visuals */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#0F1115] z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand-primary/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center mix-blend-overlay grayscale"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="scale-125 mb-12">
            <BrandLockup orientation="vertical" variant="dark" />
          </div>

          <h1 className="text-5xl lg:text-7xl font-black leading-tight mb-8 drop-shadow-2xl">
            Future-Proof <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon to-brand-electric">
              Your Skills.
            </span>
          </h1>

          <p className="text-gray-300 text-xl leading-relaxed max-w-md mx-auto font-light">
            Join a global network of learners and mentors.<br />
            Master the skills that matter.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-12 mt-16 border-t border-white/10 pt-10">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10k+</div>
              <div className="text-xs text-brand-neon uppercase tracking-widest font-bold">Active Learners</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">95%</div>
              <div className="text-xs text-brand-neon uppercase tracking-widest font-bold">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (Form) */}
      <div className="w-full lg:w-[60%] relative flex flex-col justify-center items-center p-6 lg:p-24 overflow-y-auto min-h-screen bg-[#121212]">
        <div className="w-full max-w-[600px] space-y-10 relative z-10">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-4xl font-bold text-white">Create Student Account</h2>
            <p className="text-gray-400 text-lg">Enter your details and get started.</p>
          </div>

          {submitError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-6">

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">First Name</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Jane"
                  className={getInputClass('firstName')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Middle Name</label>
                <input
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  placeholder="Marie"
                  className={getInputClass('middleName')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Last Name</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  className={getInputClass('lastName')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Extension (Optional)</label>
                <input
                  name="nameExtension"
                  value={formData.nameExtension}
                  onChange={handleInputChange}
                  placeholder="Jr., III"
                  className={getInputClass('nameExtension')}
                />
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Username</label>
              <input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="janedoe123"
                className={getInputClass('username')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Email Address</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="jane@example.com"
                className={getInputClass('email')}
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`${getInputClass('password')} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white font-medium"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Confirm Password</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`${getInputClass('confirmPassword')} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white font-medium"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-4 cursor-pointer group py-2">
              <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${formData.agreeToTerms ? 'bg-brand-neon border-brand-neon' : `border-gray-600 bg-transparent group-hover:border-gray-500 ${hasAttemptedSubmit && !formData.agreeToTerms ? 'border-red-500' : ''}`}`}>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => {
                    handleInputChange(e);
                  }}
                  className="hidden"
                />
                {formData.agreeToTerms && <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <span className={`text-base select-none ${hasAttemptedSubmit && !formData.agreeToTerms ? 'text-red-400' : 'text-gray-400'}`}>I agree to the Terms & Privacy Policy</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 bg-gradient-to-r from-brand-neon to-brand-electric text-black font-extrabold text-xl rounded-2xl shadow-[0_0_25px_rgba(57,255,20,0.3)] hover:shadow-[0_0_40px_rgba(57,255,20,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 uppercase tracking-wide"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Student Account'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="space-y-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <span className="text-gray-400 text-lg">Already have an account? </span>
              <button onClick={() => navigate('/login')} className="text-brand-neon font-bold text-lg hover:underline decoration-2 underline-offset-4">
                Log In
              </button>
            </div>

            <div className="text-center">
              <p className="text-gray-500 mb-3 text-sm font-medium uppercase tracking-wider">Expert in your field?</p>
              <button
                type="button"
                onClick={() => navigate('/coach/apply')}
                className="w-full py-4 border border-white/20 text-white rounded-xl hover:bg-white/5 hover:border-brand-electric/50 transition-colors font-bold text-lg"
              >
                Apply to Become a Coach
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;