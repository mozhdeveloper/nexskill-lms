/**
 * Lesson Content Item Types
 * Represents individual content items within a lesson (video, quiz, text, document)
 */

export interface LessonContentItem {
    id: string;
    lesson_id: string;
    course_id: string;
    module_id: string;
    content_type: 'video' | 'quiz' | 'text' | 'document' | 'notes';
    content_id: string | null; // UUID for quiz type, null for video/text/document/notes
    metadata: ContentMetadata;
    position: number;
    content_status: 'draft' | 'published' | 'pending_addition' | 'pending_deletion';
    created_at: string;
    updated_at: string;
}

/**
 * Metadata for different content types
 */
export interface ContentMetadata {
    // Common fields
    video_type?: 'cloudinary' | 'youtube' | 'vimeo' | 'external';
    url?: string;
    
    // Cloudinary-specific
    cloudinary_public_id?: string;
    cloudinary_secure_url?: string;
    
    // Video metadata
    duration?: number; // in seconds
    thumbnail_url?: string;
    
    // Text metadata
    word_count?: number;
    reading_time?: number; // in minutes
    
    // Document metadata
    file_name?: string;
    file_size?: number;
    download_url?: string;
    
    // Allow additional fields
    [key: string]: any;
}

/**
 * Student progress for a specific content item
 */
export interface StudentContentProgress {
    id: string;
    student_id: string;
    content_item_id: string;
    lesson_id: string;
    course_id: string;
    progress_percent: number;
    watched_seconds: number;
    is_completed: boolean;
    quiz_score: number | null;
    quiz_attempts: number;
    quiz_passed: boolean | null;
    completed_at: string | null;
    last_watched_at: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Lesson content item with joined data from lessons and quizzes tables
 */
export interface LessonContentItemWithData extends LessonContentItem {
    // Lesson fields
    lesson_title: string;
    lesson_description: string | null;
    estimated_duration_minutes: number | null;
    
    // Quiz fields (if content_type = 'quiz')
    quiz_title: string | null;
    quiz_description: string | null;
    instructions: string | null;
    passing_score: number | null;
    time_limit_minutes: number | null;
    quiz_max_attempts: number | null;
    quiz_requires_manual_grading: boolean | null;
}

/**
 * Progress summary for a lesson's content items
 */
export interface LessonProgressSummary {
    content_item_id: string;
    content_type: string;
    position: number;
    is_completed: boolean;
    progress_percent: number;
    watched_seconds: number;
    quiz_score: number | null;
    quiz_attempts: number;
}

/**
 * Helper type for creating new content items
 */
export interface CreateContentItemInput {
    lesson_id: string;
    course_id: string;
    module_id: string;
    content_type: 'video' | 'quiz' | 'text' | 'document' | 'notes';
    content_id?: string | null;
    metadata?: ContentMetadata;
    position?: number;
    content_status?: 'draft' | 'published' | 'pending_addition' | 'pending_deletion';
}

/**
 * Helper type for updating content items
 */
export interface UpdateContentItemInput {
    content_type?: 'video' | 'quiz' | 'text' | 'document' | 'notes';
    content_id?: string | null;
    metadata?: ContentMetadata;
    position?: number;
    content_status?: 'draft' | 'published' | 'pending_addition' | 'pending_deletion';
}

/**
 * Helper type for updating student progress
 */
export interface UpdateContentProgressInput {
    progress_percent?: number;
    watched_seconds?: number;
    is_completed?: boolean;
    quiz_score?: number | null;
    quiz_attempts?: number;
    quiz_passed?: boolean | null;
    completed_at?: string | null;
    last_watched_at?: string | null;
}
