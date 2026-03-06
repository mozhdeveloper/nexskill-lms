import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
// import type { UserRole } from "../types/roles";
// import { defaultLandingRouteByRole } from "../types/roles";
import { supabase } from "../lib/supabaseClient";
import type { AuthError, User } from "@supabase/supabase-js";

/**
 * Auth context value shape
 */
interface AuthContextValue {
    // state
    user: User | null;
    loading: boolean;
    // methods
    signUp: (
        email: string,
        password: string,
        firstName?: string,
        lastName?: string,
        username?: string,
        role?: string,
        middleName?: string,
        nameExtension?: string
    ) => Promise<{ data: { user: User | null } | null; error: AuthError | null }>;
    signIn: (
        email: string,
        password: string
    ) => Promise<{ data: { user: User | null; session: unknown | null }; error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;

    // loginMock: (name: string, role: UserRole) => void;
    // logout: () => void;
    // switchRole: (role: UserRole) => void;
}

/**
 * Local storage key for persisting auth state
 */
// const AUTH_STORAGE_KEY = "nexskill_mock_auth";

/**
 * Create the auth context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
    children: ReactNode;
}

/**
 * AuthProvider component - manages mock authentication state
 * Persists user session to localStorage for cross-tab/reload consistency
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Load persisted auth state on mount
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    /**
     * Mock login - accepts name and role, generates fake user ID
     * Extracts first name from full display name for personalized greetings
     * */
    //   const loginMock = (name: string, role: UserRole) => {
    //     const trimmedName = name.trim() || 'Anonymous User';
    //     // Extract first name (first word before any space)
    //     const firstName = trimmedName.split(' ')[0];

    //     const user: User = {
    //       id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    //       name: trimmedName,
    //       firstName,
    //       role,
    //     };

    //     setCurrentUser(user);

    //     // Persist to localStorage
    //     try {
    //       localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    //     } catch (error) {
    //       console.error('Failed to persist auth state to localStorage:', error);

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const signUp = async (
        email: string,
        password: string,
        firstName?: string,
        lastName?: string,
        username?: string,
        role?: string,
        middleName?: string,
        nameExtension?: string
    ) => {
        const metadata = {
            username: username,
            first_name: firstName ?? null,
            last_name: lastName ?? null,
            middle_name: middleName ?? null,
            name_extension: nameExtension ?? null,
            role: role ?? null,
        };

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });

        return { data, error };
    };

    /**
     * Logout - clears user state and localStorage
     */
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    /**
     * Switch role (dev/testing utility) - keeps same user but changes role
     */
    // const switchRole = (role: UserRole) => {
    //     if (!currentUser) return;

    //     const updatedUser: User = {
    //         ...currentUser,
    //         role,
    //     };

    //     setCurrentUser(updatedUser);

    //     // Persist to localStorage
    //     try {
    //         localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    //     } catch (error) {
    //         console.error(
    //             "Failed to persist auth state to localStorage:",
    //             error
    //         );
    //     }
    // };

    /**
     * Get default landing route for current user's role
     */
    // TODO: Move to UserContext
    // const getDefaultRoute = (): string => {
    //     if (!currentUser) return "/login";
    //     return defaultLandingRouteByRole[currentUser.role];
    // };

    const value: AuthContextValue = {
        user,
        loading,
        signUp,
        signIn,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

/**
 * Hook to consume auth context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
