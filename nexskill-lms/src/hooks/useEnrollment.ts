import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export const useEnrollment = (courseId: string | undefined) => {
  const { user } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // ── Check enrollment status ──────────────────────────────────────────────
  useEffect(() => {
    if (!user || !courseId) return;

    const checkEnrollment = async () => {
      try {
        setChecking(true);

        // Use count to check if any enrollment exists (handles duplicates)
        const { count, error } = await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", user.id)
          .eq("course_id", courseId);

        if (error) {
          console.error("[useEnrollment] Error checking enrollment:", error);
          return;
        }

        setIsEnrolled((count || 0) > 0);
      } catch (err) {
        console.error("[useEnrollment] Unexpected error:", err);
      } finally {
        setChecking(false);
      }
    };

    checkEnrollment();
  }, [user, courseId]);

  // ── Enroll ───────────────────────────────────────────────────────────────
  const enroll = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!user || !courseId) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("enrollments").insert({
        profile_id: user.id,
        course_id: courseId,
      });

      if (error) {
        console.error("[useEnrollment] Enroll error:", error);
        return { success: false, error: error.message };
      }

      setIsEnrolled(true);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  // ── Unenroll ─────────────────────────────────────────────────────────────
  const unenroll = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!user || !courseId) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      setLoading(true);

      // CRITICAL: Delete all student progress for this course first
      // This includes: quiz attempts, responses, submissions, feedback,
      // lesson progress, module progress, and lesson access status
      const { data: cleanupResult, error: cleanupError } = await supabase
        .rpc('delete_student_course_progress', {
          p_user_id: user.id,
          p_course_id: courseId,
        });

      if (cleanupError) {
        console.error("[useEnrollment] Progress cleanup error:", cleanupError);
        return { success: false, error: cleanupError.message };
      }

      if (!cleanupResult?.success) {
        console.error("[useEnrollment] Cleanup failed:", cleanupResult?.error);
        return { success: false, error: cleanupResult?.error || "Failed to clean up progress" };
      }

      console.log("[useEnrollment] Progress cleanup complete:", cleanupResult);

      // Now delete the enrollment
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("profile_id", user.id)
        .eq("course_id", courseId);

      if (error) {
        console.error("[useEnrollment] Unenroll error:", error);
        return { success: false, error: error.message };
      }

      setIsEnrolled(false);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  return {
    isEnrolled,
    checking,
    loading,
    enroll,
    unenroll,
  };
};