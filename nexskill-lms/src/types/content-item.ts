import { Lesson } from "./lesson";
import { Quiz } from "./quiz";

export type ContentType = "lesson" | "quiz";

export interface ContentItem {
    id: string;
    type: ContentType;
    title: string;
    description?: string;
    content_blocks?: any[]; // For lessons
    estimated_duration_minutes?: number;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
    duration?: string;
    summary?: string;
    // Quiz-specific fields
    instructions?: string;
    passing_score?: number;
    time_limit_minutes?: number;
    max_attempts?: number;
    requires_manual_grading?: boolean;
    available_from?: string;
    due_date?: string;
    late_submission_allowed?: boolean;
    late_penalty_percent?: number;
    // Additional fields that might be needed
    position?: number;
    module_id?: string;
}

// Helper functions to convert between specific types and ContentItem
export const lessonToContentItem = (lesson: Lesson): ContentItem => ({
    id: lesson.id,
    type: "lesson",
    title: lesson.title,
    description: lesson.description,
    content_blocks: lesson.content_blocks,
    estimated_duration_minutes: lesson.estimated_duration_minutes,
    is_published: lesson.is_published,
    created_at: lesson.created_at,
    updated_at: lesson.updated_at,
    duration: lesson.duration,
    summary: lesson.summary,
});

export const quizToContentItem = (quiz: Quiz): ContentItem => ({
    id: quiz.id,
    type: "quiz",
    title: quiz.title,
    description: quiz.description,
    instructions: quiz.instructions,
    passing_score: quiz.passing_score,
    time_limit_minutes: quiz.time_limit_minutes,
    max_attempts: quiz.max_attempts,
    requires_manual_grading: quiz.requires_manual_grading,
    is_published: quiz.is_published,
    created_at: quiz.created_at,
    updated_at: quiz.updated_at,
    available_from: quiz.available_from,
    due_date: quiz.due_date,
    late_submission_allowed: quiz.late_submission_allowed,
    late_penalty_percent: quiz.late_penalty_percent,
});

// Force the file to be treated as a module
export {};