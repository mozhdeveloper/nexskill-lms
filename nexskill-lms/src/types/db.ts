export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export interface Category {
    id: number;
    name: string;
    slug: string;
    created_at?: string;
}
export interface Topic {
    id: number;
    name: string;
}
export interface Lesson {
    id: number;
    title: string;
    duration: string; // e.g., '15:30'
    module_id: number;
    video_url?: string;
    content?: string;
    is_preview?: boolean;
    order_index?: number;
    created_at?: string;
}
export interface Module {
    id: number;
    title: string;
    course_id: string;
    order_index?: number;
    lessons?: Lesson[];
    created_at?: string;
}
// Course Verification Types
export type CourseVerificationStatus = 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'rejected';

export interface Course {
    id: string;
    title: string;
    level?: CourseLevel;
    duration_hours?: number;
    price?: number;
    category_id?: number;
    coach_id?: string;
    created_at: string;
    updated_at: string;
    subtitle?: string;
    short_description?: string;
    long_description?: string;
    language?: string;
    visibility?: 'public' | 'unlisted' | 'private';
    verification_status?: CourseVerificationStatus;
    modules?: Module[]; // Relation
}

export interface AdminVerificationFeedback {
    id: string;
    course_id: string;
    lesson_id?: string | null;
    admin_id: string;
    content: string;
    is_resolved: boolean;
    created_at: string;
    // Joined fields
    admin?: Profile;
    lesson?: {
        id: string;
        title: string;
    };
}
export interface CoachProfile {
    id: string; // References Profile.id
    job_title?: string;
    bio?: string;
    experience_level?: 'Beginner' | 'Intermediate' | 'Expert';
    content_areas?: string[];
    tools?: string[];
    linkedin_url?: string;
    portfolio_url?: string;
    verification_status: 'pending' | 'verified' | 'rejected';
    created_at?: string;
    updated_at?: string;
}
export type UserRole = 'student' | 'coach' | 'admin' | 'unassigned';
export const defaultLandingRouteByRole: Record<UserRole, string> = {
    student: '/student/dashboard',
    coach: '/coach/dashboard',
    admin: '/admin/dashboard',
    unassigned: '/verification-pending'
};
export interface Profile {
    id: string;
    updated_at: string;
    username?: string;
    email?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    name_extension?: string;
    role: UserRole;
}

export type SessionStatus = 'scheduled' | 'in_progress' | 'live' | 'completed' | 'cancelled';

export interface LiveSession {
    id: string;
    course_id: string;
    coach_id: string;
    title: string;
    description?: string;
    scheduled_at: string;
    duration_minutes: number;
    meeting_link?: string;
    is_live: boolean;
    status: SessionStatus;
    recording_url?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    courses?: {
        title: string;
        category?: {
            name: string;
        };
    };
    coach?: {
        first_name: string;
        last_name: string;
        username?: string;
    };
    participants_count?: number;
}

// Chat & Messaging Types
export interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    course_id?: string;
    content: string;
    read_at?: string;
    created_at: string;
    updated_at: string;
}

export interface MessageWithProfiles extends Message {
    sender_profile?: Profile;
    recipient_profile?: Profile;
    course?: Course;
}

export interface Conversation {
    user1_id: string;
    user2_id: string;
    course_id?: string;
    last_message: string;
    last_message_at: string;
    last_sender_id: string;
    other_user_id: string;
    other_user_profile?: Profile;
    unread_count?: number;
}
