import type { PostgrestError } from "@supabase/supabase-js";
import {
    createContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
    useContext,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { UserRole } from "../types/roles";
import { defaultLandingRouteByRole, mapStringToRole } from "../types/roles";
// Actually mapStringToRole is used, let me check if I should move it or just fix imports.
// I didn't move mapStringToRole to db.ts yet. I should probably check roles.ts content.
// For now, let's assume roles.ts still exists and has mapStringToRole. 
// If I moved UserRole and defaultLandingRouteByRole to db.ts, I should import them from there.
interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    updated_at: string;
    created_at: string;
    role: UserRole;
}
interface UserContextValue {
    profile: UserProfile | null;
    loading: boolean;
    // Use Partial<UserProfile> to allow updating any combination of fields
    updateProfile: (
        updates: Partial<UserProfile>
    ) => Promise<{ error: PostgrestError | null }>;
    refreshProfile: () => Promise<void>;
    getDefaultRoute: () => Promise<string>;
    switchRole: (role: UserRole) => void;
}
export const UserContext = createContext<UserContextValue | undefined>(
    undefined
);
export const UserProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { user } = useAuth();
    // Explicitly type the state
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const fetchProfile = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
            if (error) throw error;
            if (
                !data ||
                typeof data.id !== "string" ||
                typeof data.email !== "string"
            ) {
                console.error("Invalid profile data received:", data);
                setProfile(null);
                return;
            }
            // Map the role string to UserRole type (now case-insensitive)
            const mappedRole = mapStringToRole(data.role);
            if (!mappedRole) {
                console.error(
                    "Invalid role received from database:",
                    data.role
                );
                setProfile(null);
                return;
            }
            // Map snake_case to camelCase
            const mappedProfile: UserProfile = {
                id: data.id,
                email: data.email,
                firstName: data.first_name || "",
                lastName: data.last_name || "",
                username: data.username || "",
                updated_at: data.updated_at,
                created_at: data.created_at,
                role: mappedRole,
            };
            setProfile(mappedProfile);
        } catch (error) {
            console.error("Error fetching/syncing profile:", error);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [user]);
    useEffect(() => {
        if (user) {
            fetchProfile();
        } else {
            setProfile(null);
            setLoading(false);
        }
    }, [user, fetchProfile]);
    const updateProfile = useCallback(
        async (updates: Partial<UserProfile>) => {
            try {
                if (!user) throw new Error("No active user session");
                // Map camelCase back to snake_case for Supabase
                const supabaseUpdates: Record<string, unknown> = { ...updates };
                if (updates.firstName !== undefined) {
                    supabaseUpdates.first_name = updates.firstName;
                    delete supabaseUpdates.firstName;
                }
                if (updates.lastName !== undefined) {
                    supabaseUpdates.last_name = updates.lastName;
                    delete supabaseUpdates.lastName;
                }
                const { data, error } = await supabase
                    .from("profiles")
                    .update(supabaseUpdates)
                    .eq("id", user.id)
                    .select() // Select the updated row
                    .single();
                if (error) throw error;
                // Basic validation of returned row before updating local state
                if (data && typeof data.id === "string") {
                    // Map the role string to UserRole type if role exists in data
                    let mappedRole = profile?.role;
                    if (data.role) {
                        const newRole = mapStringToRole(data.role);
                        if (newRole) {
                            mappedRole = newRole;
                        } else {
                            console.error(
                                "Invalid role in update response:",
                                data.role
                            );
                            return {
                                error: {
                                    message: "Invalid role",
                                } as PostgrestError,
                            };
                        }
                    }
                    // Map snake_case to camelCase
                    const updatedProfile: UserProfile = {
                        id: data.id,
                        email: data.email,
                        firstName: data.first_name || "",
                        lastName: data.last_name || "",
                        username: data.username || "",
                        updated_at: data.updated_at,
                        created_at: data.created_at,
                        role: mappedRole as UserRole,
                    };
                    setProfile(updatedProfile);
                } else {
                    console.error(
                        "Invalid profile returned from update:",
                        data
                    );
                }
                return { error: null };
            } catch (error) {
                console.error(
                    "Error updating profile:",
                    error as PostgrestError
                );
                return { error: error as PostgrestError };
            }
        },
        [user, profile]
    );

    const getDefaultRoute = useCallback(async (): Promise<string> => {
        // Retry mechanism to wait for profile if it's null but user might be logged in
        let currentProfile = profile;
        if (!currentProfile) {
            // Wait a moment and try fetching again if not loaded
            // loops max 5 times (500ms total)
            for (let i = 0; i < 5; i++) {
                await new Promise(r => setTimeout(r, 100));
                if (profile) {
                    currentProfile = profile;
                    break;
                }
                // If not in state, try checking supabase session directly as fallback?
                // Actually fetchProfile updates state.
            }
        }

        // Final check
        if (!currentProfile) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Force fetch if user exists but profile doesnt
                // We can try one-off fetch here to be sure
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (data && data.role) {
                    const mappedRole = mapStringToRole(data.role);
                    if (mappedRole) return defaultLandingRouteByRole[mappedRole];
                }
            }
            return "/login";
        }

        // Check if user is a student AND hasn't completed onboarding
        if (currentProfile.role === 'STUDENT') {
            try {
                // Fetch student_profile to check if onboarding fields are filled
                const { data: studentProfile, error } = await supabase
                    .from('student_profiles')
                    .select('current_skill_level')
                    .eq('user_id', currentProfile.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error checking student profile:', error);
                    // If there's an error, just go to default route
                    return defaultLandingRouteByRole[currentProfile.role];
                }

                // Check if student_profile exists and has onboarding data
                // If current_skill_level is null or student_profile doesn't exist, redirect to onboarding
                if (!studentProfile || !studentProfile.current_skill_level) {
                    return '/student/onboarding-preferences';
                }
            } catch (err) {
                console.error('Error in getDefaultRoute:', err);
            }
        }

        return defaultLandingRouteByRole[currentProfile.role];
    }, [profile]);
    const switchRole = useCallback((role: UserRole) => {
        if (!profile) return;
        setProfile(prev => prev ? { ...prev, role } : null);
    }, [profile]);
    const value = useMemo(
        () => ({
            profile,
            loading,
            updateProfile,
            refreshProfile: fetchProfile,
            getDefaultRoute,
            switchRole,
        }),
        [profile, loading, fetchProfile, updateProfile, getDefaultRoute, switchRole]
    );
    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};