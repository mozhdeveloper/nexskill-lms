import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUiPreferences } from '../../context/UiPreferencesContext';
import { supabase } from '../../lib/supabaseClient';
// import { useUser } from '../../context/UserContext';


const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setTheme } = useUiPreferences();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();
  // const { getDefaultRoute } = useUser();
  const [error, setError] = useState<string | null>(null);

  const DEMO_EMAIL = 'morgan.doe@nexskill.demo';
  const DEMO_PASSWORD = 'demo1234';

  const handleQuickLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      let authUser = null;

      // 1. Attempt sign in
      const { data: signInData, error: signInError } = await signIn(DEMO_EMAIL, DEMO_PASSWORD);

      if (signInError) {
        // Account doesn't exist yet — auto-create it
        if (
          signInError.message.toLowerCase().includes('invalid login credentials') ||
          signInError.message.toLowerCase().includes('user not found')
        ) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            options: {
              data: { first_name: 'Morgan', last_name: 'Doe', username: 'morgan_doe', role: 'admin' },
            },
          });

          if (signUpError) {
            setError(`Could not create demo account: ${signUpError.message}`);
            setIsLoading(false);
            return;
          }

          if (!signUpData.session) {
            setError(
              'Demo account created but email confirmation is required.\n' +
              'In the Supabase dashboard → Authentication → Providers → Email, disable "Confirm email".',
            );
            setIsLoading(false);
            return;
          }

          authUser = signUpData.user;

          // Upsert admin profile after signup
          if (authUser) {
            await supabase.from('profiles').upsert({
              id: authUser.id,
              email: DEMO_EMAIL,
              first_name: 'Morgan',
              last_name: 'Doe',
              username: 'morgan_doe',
              role: 'admin',
            });
          }
        } else {
          setError(signInError.message);
          setIsLoading(false);
          return;
        }
      } else {
        authUser = signInData?.user;
      }

      if (!authUser) {
        setError('Authentication failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Verify role in profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (!profile) {
        // Profile missing — create it
        await supabase.from('profiles').upsert({
          id: authUser.id,
          email: DEMO_EMAIL,
          first_name: 'Morgan',
          last_name: 'Doe',
          username: 'morgan_doe',
          role: 'admin',
        });
      }

      const userRole = profile?.role?.toLowerCase();
      if (!userRole || !['admin', 'platform_owner'].includes(userRole)) {
        await supabase.auth.signOut();
        setError('Demo account does not have admin privileges. Check the profiles table role.');
        setIsLoading(false);
        return;
      }

      setTheme('dark');
      setTimeout(() => navigate('/admin/dashboard'), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: signInError } = await signIn(formData.email, formData.password);

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      if (!authData?.user) {
        setError("Authentication failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // 2. Check if user has 'admin' or 'platform_owner' role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setError("Failed to verify admin privileges.");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Check for Admin or Platform Owner roles
      const allowedRoles = ['admin', 'platform_owner'];
      const userRole = profile?.role?.toLowerCase();

      if (!userRole || !allowedRoles.includes(userRole)) {
        setError("Unauthorized access. Admin privileges required.");
        // Sign out immediately
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Enforce Dark Mode on successful login
      setTheme('dark');

      // Small delay to ensure state propagates
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-neon/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-electric/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-electric/20 to-brand-neon/20 border border-white/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_15px_rgba(0,123,255,0.3)]">
              🛡️
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-400">NexSkill Platform Administration</p>
          </div>

          {/* Security Notice */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-yellow-500 mb-1">Restricted Area</p>
                <p className="text-xs text-yellow-500/80">
                  This login is for authorized platform administrators only. All access is logged and monitored.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg backdrop-blur-sm">
                {error}
              </div>
            )}
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@nexskill.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-brand-electric focus:border-brand-electric outline-none transition-all text-white placeholder-gray-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-brand-electric focus:border-brand-electric outline-none transition-all text-white placeholder-gray-500"
              />
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-white/5 border-white/10 rounded text-brand-electric focus:ring-brand-electric"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <Link
                to="/admin/forgot-password"
                className="text-sm font-semibold text-brand-electric hover:text-brand-neon transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-full font-semibold transition-all ${isLoading
                ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-brand-electric to-brand-neon text-black hover:shadow-[0_0_20px_rgba(0,123,255,0.4)] hover:scale-[1.02]'
                }`}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Admin Console'}
            </button>
          </form>

          {/* DEV: Quick Login */}
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 border-t border-white/10" />
              <span className="text-xs text-yellow-400/70 font-mono">DEV</span>
              <div className="flex-1 border-t border-white/10" />
            </div>
            <button
              type="button"
              onClick={handleQuickLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/20 hover:border-yellow-400/50 transition-all disabled:opacity-50"
            >
              ⚡ Quick Login — Demo Admin
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-sm text-gray-500">Other Portals</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* Links to Other Portals */}
          <div className="space-y-3">
            <Link
              to="/student/login"
              className="block w-full py-3 text-center bg-white/5 text-gray-300 font-semibold rounded-full hover:bg-white/10 hover:text-white transition-colors border border-white/5 hover:border-white/20"
            >
              👨‍🎓 Student Access
            </Link>
            <Link
              to="/coach/login"
              className="block w-full py-3 text-center bg-white/5 text-gray-300 font-semibold rounded-full hover:bg-white/10 hover:text-white transition-colors border border-white/5 hover:border-white/20"
            >
              🎓 Coach Access
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
