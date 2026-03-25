export interface LessonContentBlock {
    id: string;
    type:
    | "text"
    | "image"
    | "video"
    | "code"
    | "heading"
    | "list"
    | "quote"
    | "divider"
    | "embed"
    | "document";
    content: string; // HTML content for text blocks, URL for media
    attributes?: {
        // Common attributes
        caption?: string;
        // Heading-specific
        level?: number;
        // Code-specific
        language?: string;
        // Image-specific
        alt?: string;
        // Video-specific attributes
        external_url?: string; // For YouTube/Vimeo URLs
        source_url?: string; // For uploaded video URL from Cloudinary
        is_external?: boolean; // Flag for external videos
        autoplay?: boolean;
        controls?: boolean;
        loop?: boolean;
        muted?: boolean;
        // Media metadata for uploaded videos
        media_metadata?: {
            cloudinary_id: string;
            public_id: string;
            secure_url: string;
            resource_type: string;
            format: string;
            bytes: number;
            original_filename?: string;
            width?: number;
            height?: number;
            duration?: number;
            thumbnail_url?: string;
        };
        // Document-specific
        original_filename?: string;
        bytes?: number;
        [key: string]: any; // Allow additional custom attributes
    };
    position: number;
}

export type CompletionCriteria =
    | { type: "view"; min_time_seconds?: number }
    | { type: "quiz"; quiz_id?: string; min_score?: number }
    | { type: "manual" };

export interface Lesson {
    id: string;
    title: string;
    description?: string;
    content_blocks: LessonContentBlock[];
    estimated_duration_minutes?: number;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
    type?: "video" | "pdf" | "quiz" | "live" | "text" | "lesson";
    duration?: string; // For backward compatibility
    summary?: string; // For backward compatibility
    video?: { filename: string; duration: string }; // For backward compatibility
    resources?: Array<{ name: string; type: string; size: string }>; // For backward compatibility
    completion_criteria?: CompletionCriteria;
}

export interface Module {
    id: string;
    course_id?: string;
    title: string;
    description?: string;
    position?: number;
    is_published?: boolean;
    is_sequential?: boolean;
    drip_mode?: "immediate" | "days-after-enrollment" | "specific-date" | "after-previous";
    drip_days?: number;
    drip_date?: string;
    lessons: import('./content-item').ContentItem[];
    created_at?: string;
    updated_at?: string;
    course_goals?: any[]; // Allow for joined goals
}
