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