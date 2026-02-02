import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentAuthLayout from '../../layouts/StudentAuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useUiPreferences } from '../../context/UiPreferencesContext';
import { supabase } from '../../lib/supabaseClient';
import { defaultLandingRouteByRole, mapStringToRole } from '../../types/roles';

const StudentLogin: React.FC = () => {
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

                // Verify user is a STUDENT
                if (role !== 'STUDENT') {
                    setError('This portal is for Students only. Please use the correct login portal.');
                    // Sign them out to prevent session issues
                    await supabase.auth.signOut();
                    setIsSubmitting(false);
                    return;
                }

                // Redirect to student dashboard
                setTheme('dark');
                navigate(defaultLandingRouteByRole['STUDENT']);
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
                    <h1 className="text-3xl font-bold text-white mb-2">Student Login</h1>
                    <p className="text-xl font-medium text-brand-neon mb-1">Student Access</p>
                    <p className="text-gray-400">Sign in to continue your learning journey</p>
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
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-brand-neon focus:border-brand-neon outline-none transition-all text-white placeholder-gray-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                            <Link to="/forgot-password" className="text-sm text-brand-neon hover:text-brand-electric transition-colors font-medium">Forgot Password?</Link>
                        </div>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-brand-neon focus:border-brand-neon outline-none transition-all pr-12 text-white placeholder-gray-500"
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
                            className="h-4 w-4 bg-white/5 border-white/10 rounded text-brand-neon focus:ring-brand-neon"
                        />
                        <label className="ml-2 block text-sm text-gray-400">Remember me</label>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-brand-neon to-brand-electric text-black font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {isSubmitting ? 'Signing In...' : 'Sign In as Student'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-3">
                    <p className="text-sm text-gray-400">
                        Don't have an account? <Link to="/signup" className="text-brand-neon hover:text-brand-electric font-medium transition-colors">Create Account</Link>
                    </p>
                    <div className="flex justify-center gap-4 text-xs text-gray-500">
                        <Link to="/coach/login" className="hover:text-white transition-colors">Coach Login</Link>
                        <span>|</span>
                        <Link to="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
                    </div>
                </div>
            </div>
        </StudentAuthLayout>
    );
};

export default StudentLogin;
