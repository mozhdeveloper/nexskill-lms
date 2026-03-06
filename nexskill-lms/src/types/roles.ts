/**
 * Role-based access control types and utilities for NexSkill LMS
 * Defines all user roles and their associated metadata
 */
export type UserRole =
    | "PLATFORM_OWNER"
    | "ADMIN"
    | "COACH"
    | "SUB_COACH"
    | "CONTENT_EDITOR"
    | "COMMUNITY_MANAGER"
    | "SUPPORT_STAFF"
    | "STUDENT"
    | "ORG_OWNER"
    | "UNASSIGNED";
/**
 * Human-readable labels for each role
 */
export const labelByRole: Record<UserRole, string> = {
    PLATFORM_OWNER: "Platform Owner",
    ADMIN: "Administrator",
    COACH: "Coach",
    SUB_COACH: "Sub-Coach",
    CONTENT_EDITOR: "Content Editor",
    COMMUNITY_MANAGER: "Community Manager",
    SUPPORT_STAFF: "Support Staff",
    STUDENT: "Student",
    ORG_OWNER: "Organization Owner",
    UNASSIGNED: "Unassigned",
};
/**
 * Default landing route for each role after login
 */
export const defaultLandingRouteByRole: Record<UserRole, string> = {
    PLATFORM_OWNER: "/owner/dashboard",
    ADMIN: "/admin/dashboard",
    COACH: "/coach/dashboard",
    SUB_COACH: "/subcoach/dashboard",
    CONTENT_EDITOR: "/content/dashboard",
    COMMUNITY_MANAGER: "/community/dashboard",
    SUPPORT_STAFF: "/support/dashboard",
    STUDENT: "/student/dashboard",
    ORG_OWNER: "/org/dashboard",
    UNASSIGNED: "/verification-pending",
};
/**
 * Role descriptions for documentation and UI display
 */
export const roleDescriptions: Record<UserRole, string> = {
    PLATFORM_OWNER:
        "Super Admin with full platform control. Manages system configuration, billing, and all administrative functions.",
    ADMIN: "Platform administrator with extensive permissions. Manages users, courses, moderation, analytics, and system settings.",
    COACH: "Course instructor and mentor. Creates and manages courses, interacts with students, and accesses coaching tools.",
    SUB_COACH:
        "Assistant coach with limited course management capabilities. Supports primary coaches in content delivery.",
    CONTENT_EDITOR:
        "Specialist focused on course content creation and editing. Reviews and approves educational materials.",
    COMMUNITY_MANAGER:
        "Oversees community engagement, moderates discussions, and fosters a positive learning environment.",
    SUPPORT_STAFF:
        "Customer support specialist. Handles student inquiries, technical issues, and general platform assistance.",
    STUDENT:
        "Learner with access to courses, community features, coaching sessions, and personal progress tracking.",
    ORG_OWNER:
        "B2B organization owner. Manages team members, tracks organizational learning progress, and handles billing.",
    UNASSIGNED: "User with no assigned role. Pending verification.",
};
/**
 * Role emoji icons for visual identification
 */
export const roleIcons: Record<UserRole, string> = {
    PLATFORM_OWNER: "👑",
    ADMIN: "🔐",
    COACH: "👨‍🏫",
    SUB_COACH: "🧑‍🎓",
    CONTENT_EDITOR: "✍️",
    COMMUNITY_MANAGER: "💬",
    SUPPORT_STAFF: "🎧",
    STUDENT: "👨‍🎓",
    ORG_OWNER: "🏢",
    UNASSIGNED: "❓",
};
/**
 * Role color schemes for badges and UI elements
 */
export const roleColors: Record<
    UserRole,
    { bg: string; text: string; border: string }
> = {
    PLATFORM_OWNER: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-300",
    },
    ADMIN: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-300",
    },
    COACH: {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-300",
    },
    SUB_COACH: {
        bg: "bg-teal-100",
        text: "text-teal-800",
        border: "border-teal-300",
    },
    CONTENT_EDITOR: {
        bg: "bg-amber-100",
        text: "text-amber-800",
        border: "border-amber-300",
    },
    COMMUNITY_MANAGER: {
        bg: "bg-pink-100",
        text: "text-pink-800",
        border: "border-pink-300",
    },
    SUPPORT_STAFF: {
        bg: "bg-indigo-100",
        text: "text-indigo-800",
        border: "border-indigo-300",
    },
    STUDENT: {
        bg: "bg-cyan-100",
        text: "text-cyan-800",
        border: "border-cyan-300",
    },
    ORG_OWNER: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        border: "border-orange-300",
    },
    UNASSIGNED: {
        bg: "bg-gray-100",
        text: "text-gray-500",
        border: "border-gray-200",
    },
};
/**
 * Role capabilities/permissions summary (for display purposes)
 */
export const roleCapabilities: Record<UserRole, string[]> = {
    PLATFORM_OWNER: [
        "Full platform administration",
        "Infrastructure & deployment control",
        "Global settings & configurations",
        "All admin & user management",
        "Financial oversight & reporting",
        "System-wide analytics",
    ],
    ADMIN: [
        "User management & moderation",
        "Course moderation & approval",
        "Financial controls & payouts",
        "CRM & marketing automation",
        "System notifications & alerts",
        "Analytics & reporting",
        "Security & compliance",
    ],
    COACH: [
        "Create & manage courses",
        "Build curriculum & lessons",
        "Upload videos & resources",
        "Manage enrolled students",
        "Provide 1-on-1 coaching",
        "Track earnings & payouts",
        "AI-powered course tools",
    ],
    SUB_COACH: [
        "Assist with course delivery",
        "Support student engagement",
        "Access assigned courses",
        "Limited content editing",
        "Student communication",
    ],
    CONTENT_EDITOR: [
        "Create & edit course content",
        "Upload learning resources",
        "Manage course materials",
        "Content quality assurance",
        "Media library management",
    ],
    COMMUNITY_MANAGER: [
        "Moderate discussions & forums",
        "Manage community guidelines",
        "Foster student engagement",
        "Handle reported content",
        "Community analytics",
    ],
    SUPPORT_STAFF: [
        "Handle support tickets",
        "Assist students with issues",
        "Access user accounts (view)",
        "Platform troubleshooting",
        "Documentation & FAQs",
    ],
    STUDENT: [
        "Browse & enroll in courses",
        "Access learning materials",
        "Complete lessons & quizzes",
        "Participate in discussions",
        "Book coaching sessions",
        "Track progress & certificates",
        "AI study assistance",
    ],
    ORG_OWNER: [
        "Manage organization members",
        "Assign licenses & seats",
        "Corporate training programs",
        "Organization analytics",
        "Bulk user management",
        "Custom branding",
    ],
    UNASSIGNED: ["Wait for verification"],
};
/**
 * All available roles as an array (useful for dropdowns)
 */
export const allRoles: UserRole[] = [
    "PLATFORM_OWNER",
    "ADMIN",
    "COACH",
    "SUB_COACH",
    "CONTENT_EDITOR",
    "COMMUNITY_MANAGER",
    "SUPPORT_STAFF",
    "STUDENT",
    "ORG_OWNER",
    "UNASSIGNED",
];
/**
 * Maps a string value from Supabase to a valid UserRole type.
 * Returns the role if valid, or null if the string doesn't match any UserRole.
 *
 * @param role - String value from Supabase metadata or database
 * @returns Valid UserRole or null
 *
 * @example
 * const role = mapStringToRole("STUDENT"); // Returns "STUDENT" as UserRole
 * const invalid = mapStringToRole("invalid"); // Returns null
 */
export const mapStringToRole = (
    role: string | null | undefined
): UserRole | null => {
    if (!role) return null;
    // Type guard: check if the string is a valid UserRole
    if (allRoles.includes(role.toUpperCase() as UserRole)) {
        return role.toUpperCase() as UserRole;
    }
    return null;
};