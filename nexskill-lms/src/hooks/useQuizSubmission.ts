import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import type {
  QuizSubmission,
  QuizSubmissionStatusResult,
  QuizFeedback,
  LessonAccessStatus,
} from '../types/quiz';

// ============================================
// Quiz Submission Hook
// ============================================

export function useQuizSubmission(quizId: string | undefined) {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<QuizSubmissionStatusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissionStatus = useCallback(async () => {
    if (!quizId || !user) {
      setSubmission(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the database function to get submission status
      const { data, error } = await supabase
        .rpc('get_student_quiz_submission_status', {
          p_user_id: user.id,
          p_quiz_id: quizId,
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setSubmission(data[0]);
      } else {
        setSubmission(null);
      }
    } catch (err: any) {
      console.error('Error fetching quiz submission status:', err);
      setError(err.message);
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }, [quizId, user]);

  useEffect(() => {
    fetchSubmissionStatus();
  }, [fetchSubmissionStatus]);

  return { submission, loading, error, refetch: fetchSubmissionStatus };
}

// ============================================
// Lesson Access Status Hook
// ============================================

export function useLessonAccessStatus(courseId: string | undefined) {
  const { user } = useAuth();
  const [accessStatus, setAccessStatus] = useState<LessonAccessStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccessStatus = useCallback(async () => {
    if (!courseId || !user) {
      setAccessStatus([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the database function to get lesson access status
      const { data, error } = await supabase
        .rpc('get_course_lesson_access_status', {
          p_user_id: user.id,
          p_course_id: courseId,
        });

      if (error) throw error;

      setAccessStatus(data || []);
    } catch (err: any) {
      console.error('Error fetching lesson access status:', err);
      setError(err.message);
      setAccessStatus([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  useEffect(() => {
    fetchAccessStatus();
  }, [fetchAccessStatus]);

  const isLessonLocked = useCallback(
    (lessonId: string) => {
      const status = accessStatus.find((s) => s.lesson_id === lessonId);
      return status?.is_locked ?? true; // Default to locked if not found
    },
    [accessStatus]
  );

  return {
    accessStatus,
    loading,
    error,
    isLessonLocked,
    refetch: fetchAccessStatus,
  };
}

// ============================================
// Quiz Feedback Hook
// ============================================

export function useQuizFeedback(submissionId: string | undefined) {
  const [feedback, setFeedback] = useState<QuizFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!submissionId) {
      setFeedback([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('quiz_feedback')
        .select('*')
        .eq('quiz_submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedback(data || []);
    } catch (err: any) {
      console.error('Error fetching quiz feedback:', err);
      setError(err.message);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return { feedback, loading, error, refetch: fetchFeedback };
}

// ============================================
// Coach Quiz Submissions Hook (for coach dashboard)
// ============================================

export function useCoachQuizSubmissions(courseId: string | undefined) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<
    (QuizSubmission & {
      student_email?: string;
      student_name?: string;
      quiz_title?: string;
      lesson_title?: string;
      quiz_score?: number;
      quiz_max_score?: number;
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!courseId || !user) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Get all quiz IDs for this course
      const { data: modules, error: modErr } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      if (modErr) throw modErr;

      const moduleIds = modules?.map(m => m.id) || [];
      if (moduleIds.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      const { data: contentItems, error: ciErr } = await supabase
        .from('module_content_items')
        .select('content_id')
        .in('module_id', moduleIds)
        .eq('content_type', 'quiz');

      if (ciErr) throw ciErr;

      const quizIds = contentItems?.map(ci => ci.content_id) || [];
      if (quizIds.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Step 2: Get quiz titles
      const { data: quizzes, error: qErr } = await supabase
        .from('quizzes')
        .select('id, title')
        .in('id', quizIds);

      if (qErr) throw qErr;

      const quizTitles: Record<string, string> = {};
      quizzes?.forEach(q => { quizTitles[q.id] = q.title; });

      // Step 3: Fetch submissions (without join to avoid timeout)
      const { data, error: subErr } = await supabase
        .from('quiz_submissions')
        .select('*')
        .in('quiz_id', quizIds)
        .in('status', ['pending_review', 'failed', 'resubmission_required'])
        .order('submitted_at', { ascending: false });

      if (subErr) throw subErr;

      // Step 4: Fetch attempt scores separately (batched)
      if (data && data.length > 0) {
        const attemptIds = data.map(s => s.quiz_attempt_id);
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('id, user_id, score, max_score')
          .in('id', attemptIds);

        const attemptMap: Record<string, { user_id: string; score: number; max_score: number }> = {};
        attempts?.forEach(a => { attemptMap[a.id] = a; });

        // Step 5: Fetch student profiles
        const userIds = [...new Set(data.map(s => attemptMap[s.quiz_attempt_id]?.user_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', userIds);

        const profileMap = new Map();
        profiles?.forEach((p) => {
          profileMap.set(p.id, {
            email: p.email,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          });
        });

        const enrichedSubmissions = data.map((submission) => {
          const attempt = attemptMap[submission.quiz_attempt_id];
          const profile = attempt ? profileMap.get(attempt.user_id) : null;
          return {
            ...submission,
            student_email: profile?.email,
            student_name: profile?.name,
            quiz_title: quizTitles[submission.quiz_id] || 'Unknown Quiz',
            quiz_score: attempt?.score,
            quiz_max_score: attempt?.max_score,
          };
        });

        setSubmissions(enrichedSubmissions);
      } else {
        setSubmissions([]);
      }
    } catch (err: any) {
      console.error('Error fetching coach quiz submissions:', err);
      setError(err.message || 'Failed to fetch submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { submissions, loading, error, refetch: fetchSubmissions };
}

// ============================================
// Utility Functions
// ============================================

export async function updateQuizSubmissionStatus(
  submissionId: string,
  status: 'passed' | 'failed' | 'resubmission_required',
  reviewNotes?: string
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('quiz_submissions')
      .update({
        status,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    return { error };
  } catch (err) {
    console.error('Error updating quiz submission status:', err);
    return { error: err };
  }
}

export async function createQuizFeedback(
  submissionId: string,
  coachId: string,
  comment: string,
  mediaUrls: Array<{ url: string; type: 'image' | 'video' | 'document'; filename: string; size?: number }> = [],
  isResubmissionFeedback = false
): Promise<{ error: any }> {
  try {
    const { error } = await supabase.from('quiz_feedback').insert({
      quiz_submission_id: submissionId,
      coach_id: coachId,
      comment,
      media_urls: mediaUrls,
      is_resubmission_feedback: isResubmissionFeedback,
    });

    return { error };
  } catch (err) {
    console.error('Error creating quiz feedback:', err);
    return { error: err };
  }
}

export async function checkLessonLocked(
  userId: string,
  lessonId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('is_lesson_locked', {
        p_user_id: userId,
        p_lesson_id: lessonId,
      });

    if (error) {
      console.error('Error checking lesson lock:', error);
      return true; // Default to locked on error
    }

    return data;
  } catch (err) {
    console.error('Error checking lesson lock:', err);
    return true; // Default to locked on error
  }
}

// ============================================
// NEW: Attempt Control & Validation Functions
// ============================================

export interface QuizAttemptValidation {
  can_attempt: boolean;
  reason: string;
  attempts_used: number;
  max_attempts: number | null;
  has_pending_submission: boolean;
}

/**
 * Check if a student can attempt a quiz based on configuration and previous attempts
 */
export async function checkQuizAttemptPermission(
  userId: string,
  quizId: string
): Promise<QuizAttemptValidation> {
  try {
    const { data, error } = await supabase
      .rpc('can_attempt_quiz', {
        p_user_id: userId,
        p_quiz_id: quizId,
      });

    if (error) {
      console.error('Error checking quiz attempt permission:', error);
      return {
        can_attempt: false,
        reason: 'Error checking attempt permission',
        attempts_used: 0,
        max_attempts: null,
        has_pending_submission: false,
      };
    }

    if (data && data.length > 0) {
      return data[0];
    }

    return {
      can_attempt: false,
      reason: 'No data returned',
      attempts_used: 0,
      max_attempts: null,
      has_pending_submission: false,
    };
  } catch (err) {
    console.error('Error checking quiz attempt permission:', err);
    return {
      can_attempt: false,
      reason: 'Error checking attempt permission',
      attempts_used: 0,
      max_attempts: null,
      has_pending_submission: false,
    };
  }
}

export interface QuizSubmissionValidation {
  is_valid: boolean;
  validation_errors: string[];
  answered_count: number;
  total_questions: number;
  skipped_questions: string[];
}

/**
 * Validate quiz submission completeness (check for skipped questions)
 */
export async function validateQuizSubmissionComplete(
  attemptId: string
): Promise<QuizSubmissionValidation> {
  try {
    const { data, error } = await supabase
      .rpc('validate_quiz_submission', {
        p_attempt_id: attemptId,
      });

    if (error) {
      console.error('Error validating quiz submission:', error);
      return {
        is_valid: false,
        validation_errors: ['Error validating submission'],
        answered_count: 0,
        total_questions: 0,
        skipped_questions: [],
      };
    }

    if (data && data.length > 0) {
      return data[0];
    }

    return {
      is_valid: false,
      validation_errors: ['No data returned'],
      answered_count: 0,
      total_questions: 0,
      skipped_questions: [],
    };
  } catch (err) {
    console.error('Error validating quiz submission:', err);
    return {
      is_valid: false,
      validation_errors: ['Error validating submission'],
      answered_count: 0,
      total_questions: 0,
      skipped_questions: [],
    };
  }
}

export interface LessonAccessValidation {
  can_access: boolean;
  is_locked: boolean;
  lock_reason: string | null;
  previous_lesson_id: string | null;
}

/**
 * Check if a student can access a lesson based on sequential progression
 */
export async function checkLessonAccess(
  userId: string,
  lessonId: string
): Promise<LessonAccessValidation> {
  try {
    const { data, error } = await supabase
      .rpc('can_access_lesson', {
        p_user_id: userId,
        p_lesson_id: lessonId,
      });

    if (error) {
      console.error('Error checking lesson access:', error);
      return {
        can_access: false,
        is_locked: true,
        lock_reason: 'Error checking lesson access',
        previous_lesson_id: null,
      };
    }

    if (data && data.length > 0) {
      return data[0];
    }

    return {
      can_access: true,
      is_locked: false,
      lock_reason: null,
      previous_lesson_id: null,
    };
  } catch (err) {
    console.error('Error checking lesson access:', err);
    return {
      can_access: false,
      is_locked: true,
      lock_reason: 'Error checking lesson access',
      previous_lesson_id: null,
    };
  }
}
