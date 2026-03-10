import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentAuthLayout from '../../layouts/StudentAuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useUiPreferences } from '../../context/UiPreferencesContext';
import { supabase } from '../../lib/supabaseClient';
import { defaultLandingRouteByRole, mapStringToRole } from '../../types/roles';

const CoachLogin: React.FC = () => {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const { setTheme } = useUiPreferences();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const DEMO_EMAIL = 'jordan.doe@nexskill.demo';
    const DEMO_PASSWORD = 'demo1234';

    const handleQuickLogin = async () => {
        setError(null);
        setIsSubmitting(true);
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
                            data: { first_name: 'Jordan', last_name: 'Doe', username: 'jordan_doe', role: 'coach' },
                        },
                    });

                    if (signUpError) {
                        setError(`Could not create demo account: ${signUpError.message}`);
                        setIsSubmitting(false);
                        return;
                    }

                    if (!signUpData.session) {
                        setError(
                            'Demo account created but email confirmation is required.\n' +
                            'In the Supabase dashboard → Authentication → Providers → Email, disable "Confirm email".',
                        );
                        setIsSubmitting(false);
                        return;
                    }

                    authUser = signUpData.user;

                    // Upsert profile after signup
                    if (authUser) {
                        await supabase.from('profiles').upsert({
                            id: authUser.id,
                            email: DEMO_EMAIL,
                            first_name: 'Jordan',
                            last_name: 'Doe',
                            username: 'jordan_doe',
                            role: 'coach',
                        });
                    }
                } else {
                    setError(signInError.message);
                    setIsSubmitting(false);
                    return;
                }
            } else {
                authUser = signInData?.user;
            }

            if (authUser) {
                // Ensure profile exists with correct role
                let { data: profileData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authUser.id)
                    .single();

                if (!profileData) {
                    // Profile missing — create it now
                    await supabase.from('profiles').upsert({
                        id: authUser.id,
                        email: DEMO_EMAIL,
                        first_name: 'Jordan',
                        last_name: 'Doe',
                        username: 'jordan_doe',
                        role: 'coach',
                    });
                    // Re-fetch so we use the real data
                    const { data: refetched } = await supabase
                        .from('profiles').select('role').eq('id', authUser.id).single();
                    profileData = refetched;
                }

                const role = mapStringToRole(profileData?.role ?? 'coach');
                if (role !== 'COACH') {
                    await supabase.auth.signOut();
                    setError('This demo account is not a coach. Check the profiles table role.');
                    setIsSubmitting(false);
                    return;
                }

                setTheme('dark');
                navigate(defaultLandingRouteByRole['COACH']);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unexpected error');
            setIsSubmitting(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Please enter both email and password.');
            return;
        }

        setIsSubmitting(true);

        try {
            const { data, error: signInError } = await signIn(formData.email, formData.password);

            if (signInError) {
                setError(signInError.message);
                setIsSubmitting(false);
                return;
            }

            // Directly fetch profile to get role and redirect
            if (data?.user) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError || !profileData) {
                    setError('Could not fetch user profile.');
                    setIsSubmitting(false);
                    return;
                }

                const role = mapStringToRole(profileData.role);

                // Verify user is a COACH
                if (role !== 'COACH') {
                    setError('This portal is for Coaches only. Please use the correct login portal.');
                    // Sign them out to prevent session issues
                    await supabase.auth.signOut();
                    setIsSubmitting(false);
                    return;
                }

                // Redirect to coach dashboard
                setTheme('dark');
                navigate(defaultLandingRouteByRole['COACH']);
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(message);
            setIsSubmitting(false);
        }
    };

    return (
        <StudentAuthLayout maxWidth="small">
            <div className="w-full max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Coach Login</h1>
                    <p className="text-xl font-medium text-brand-electric mb-1">Coach Access</p>
                    <p className="text-gray-400">Sign in to manage your courses and students</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5" noValidate>
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-brand-electric focus:border-brand-electric outline-none transition-all text-white placeholder-gray-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                            <Link to="/forgot-password" className="text-sm text-brand-electric hover:text-brand-neon transition-colors font-medium">Forgot Password?</Link>
                        </div>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-brand-electric focus:border-brand-electric outline-none transition-all pr-12 text-white placeholder-gray-500"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleInputChange}
                            className="h-4 w-4 bg-white/5 border-white/10 rounded text-brand-electric focus:ring-brand-electric"
                        />
                        <label className="ml-2 block text-sm text-gray-400">Remember me</label>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-brand-electric to-brand-neon text-black font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(0,123,255,0.3)] hover:shadow-[0_0_30px_rgba(0,123,255,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {isSubmitting ? 'Signing In...' : 'Sign In as Coach'}
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
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/20 hover:border-yellow-400/50 transition-all disabled:opacity-50"
                    >
                        ⚡ Quick Login — Demo Coach
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-3">
                    <p className="text-sm text-gray-400">
                        Want to become a Coach? <Link to="/coach/apply" className="text-brand-electric hover:text-brand-neon font-medium transition-colors">Apply Here</Link>
                    </p>
                    <div className="flex justify-center gap-4 text-xs text-gray-500">
                        <Link to="/student/login" className="hover:text-white transition-colors">Student Login</Link>
                        <span>|</span>
                        <Link to="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
                    </div>
                </div>
            </div>
        </StudentAuthLayout>
    );
};

export default CoachLogin;
