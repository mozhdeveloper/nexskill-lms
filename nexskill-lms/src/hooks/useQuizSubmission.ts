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

      // Fetch all pending submissions for this coach's course
      const { data, error } = await supabase
        .from('quiz_submissions')
        .select(`
          *,
          quizzes!inner(
            title,
            module_content_items!inner(
              modules!inner(
                course_id
              )
            )
          ),
          quiz_attempts!inner(
            user_id
          )
        `)
        .eq('quizzes.module_content_items.modules.course_id', courseId)
        .in('status', ['pending_review', 'failed', 'resubmission_required'])
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Fetch student profiles for the submissions
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((s) => s.quiz_attempts.user_id))];
        
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
          const profile = profileMap.get(submission.quiz_attempts.user_id);
          return {
            ...submission,
            student_email: profile?.email,
            student_name: profile?.name,
            quiz_title: submission.quizzes.title,
          };
        });

        setSubmissions(enrichedSubmissions);
      } else {
        setSubmissions([]);
      }
    } catch (err: any) {
      console.error('Error fetching coach quiz submissions:', err);
      setError(err.message);
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
