// ============================================
// Content Block Types (Shared by Lessons & Quizzes)
// ============================================

export interface ContentBlock {
    id: string;
    type: "text" | "heading" | "image" | "video" | "code";
    content: string;
    position: number;
    attributes?: {
        // For heading blocks
        level?: 1 | 2 | 3;

        // For image blocks
        alt?: string;
        caption?: string;

        // For video blocks
        external_url?: string;
        is_external?: boolean;
        thumbnail_url?: string;
        autoplay?: boolean;
        controls?: boolean;
        loop?: boolean;
        muted?: boolean;

        // For code blocks
        language?: string;

        // Allow additional custom attributes
        [key: string]: any;
    };
}

// ============================================
// Answer Configuration Types
// ============================================

export interface MultipleChoiceOption {
    id: string;
    text: string;
    is_correct: boolean;
}

export interface MultipleChoiceConfig {
    options: MultipleChoiceOption[];
    allow_multiple: boolean;
    randomize_options: boolean;
}

export interface TrueFalseConfig {
    correct_answer: boolean;
}

export interface ShortAnswerConfig {
    max_length?: number;
    accepted_answers?: string[];
    case_sensitive?: boolean;
}

export interface EssayConfig {
    min_words?: number;
    max_words?: number;
    rubric?: string;
}

export interface FileUploadConfig {
    accepted_file_types: string[];
    max_file_size_mb: number;
    max_files: number;
    instructions?: string;
}

export interface VideoSubmissionConfig {
    max_duration_minutes?: number;
    max_file_size_mb: number;
    accepted_formats: string[];
    instructions?: string;
}

export type AnswerConfig =
    | MultipleChoiceConfig
    | TrueFalseConfig
    | ShortAnswerConfig
    | EssayConfig
    | FileUploadConfig
    | VideoSubmissionConfig;

// ============================================
// Response Data Types
// ============================================

export interface ResponseData {
    selected_options?: string[];
    text_response?: string;
    file_ids?: string[];
    video_id?: string;
    time_spent_seconds?: number;
    submission_timestamp: string;
}

// ============================================
// Core Quiz Types
// ============================================

export type QuestionType =
    | "multiple_choice"
    | "true_false"
    | "short_answer"
    | "essay"
    | "file_upload"
    | "video_submission";

export interface QuizQuestion {
    id?: string;
    quiz_id: string;
    position: number;
    question_type: QuestionType;
    question_content: ContentBlock[];
    points: number;
    requires_manual_grading: boolean;
    answer_config: AnswerConfig;
    max_attempts?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Quiz {
    id: string;
    title: string;
    description?: string;
    instructions?: string;
    passing_score?: number;
    time_limit_minutes?: number;
    max_attempts?: number;
    attempt_control_enabled?: boolean; // OFF = default 1 attempt, ON = custom max_attempts
    quiz_type?: 'standard' | 'coach_reviewed'; // Explicit quiz type
    allow_skipped_questions?: boolean; // Whether students can skip questions
    requires_manual_grading: boolean;
    requires_coach_approval?: boolean;
    is_published: boolean;
    available_from?: string;
    due_date?: string;
    late_submission_allowed: boolean;
    late_penalty_percent: number;
    created_at?: string;
    updated_at?: string;
}

// ============================================
// Attempt & Response Types
// ============================================

export type AttemptStatus = "in_progress" | "submitted" | "graded";

export interface QuizAttempt {
    id: string;
    user_id: string;
    quiz_id: string;
    attempt_number: number;
    status: AttemptStatus;
    score?: number;
    max_score?: number;
    passed?: boolean;
    started_at: string;
    submitted_at?: string;
    graded_at?: string;
    graded_by?: string;
    created_at: string;
    updated_at: string;
}

export interface QuizResponse {
    id: string;
    attempt_id: string;
    question_id: string;
    response_data: ResponseData;
    points_earned?: number;
    points_possible: number;
    is_correct?: boolean;
    requires_grading: boolean;
    grader_feedback?: string;
    graded_at?: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// Submission File Types
// ============================================

export interface QuizSubmissionFile {
    id: string;
    response_id: string;
    bucket_name: string;
    bucket_path: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
    uploaded_at: string;
    created_at: string;
    updated_at: string;
}

export interface QuizSubmissionVideo {
    id: string;
    response_id: string;
    bucket_name: string;
    bucket_path: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
    duration_seconds?: number;
    thumbnail_path?: string;
    processing_status: "pending" | "processing" | "completed" | "failed";
    processing_error?: string;
    uploaded_at: string;
    processed_at?: string;
    created_at: string;
    updated_at: string;
}

// ============================================
// Editor-specific Types
// ============================================

export interface QuizWithQuestions extends Quiz {
    questions: QuizQuestion[];
}

export interface ValidationError {
    field: string;
    message: string;
    questionIndex?: number;
}

export interface QuizValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings?: ValidationError[];
}

// ============================================
// Quiz Approval & Feedback Types
// ============================================

export type QuizSubmissionStatus = 'pending_review' | 'passed' | 'failed' | 'resubmission_required';

export interface QuizSubmission {
    id: string;
    user_id: string;
    quiz_id: string;
    quiz_attempt_id: string;
    status: QuizSubmissionStatus;
    submitted_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
    review_notes?: string;
    created_at: string;
    updated_at: string;
}

export interface QuizFeedbackMedia {
    url: string;
    type: 'image' | 'video' | 'document';
    filename: string;
    size?: number;
}

export interface QuizFeedback {
    id: string;
    quiz_submission_id: string;
    coach_id: string;
    comment: string;
    media_urls: QuizFeedbackMedia[];
    is_resubmission_feedback: boolean;
    created_at: string;
    updated_at: string;
}

export interface LessonAccessStatus {
    lesson_id: string;
    is_locked: boolean;
    unlock_reason?: 'coach_approved' | 'first_lesson' | 'no_prerequisite';
    unlocked_at?: string;
}

export interface QuizSubmissionStatusResult {
    submission_id: string;
    status: QuizSubmissionStatus;
    latest_attempt_id: string;
    submitted_at: string;
    reviewed_at?: string;
    review_notes?: string;
    has_feedback: boolean;
}

// Force the file to be treated as a module
export {};
