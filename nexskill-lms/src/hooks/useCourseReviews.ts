import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Review {
  id: string;
  course_id: string;
  profile_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  // Joined data from profiles table
  user_name: string;
  user_avatar?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface UseCourseReviewsReturn {
  reviews: Review[];
  stats: ReviewStats | null;
  userReview: Review | null;
  loading: boolean;
  error: string | null;
  submitReview: (rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  updateReview: (reviewId: string, rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  deleteReview: (reviewId: string) => Promise<{ success: boolean; error?: string }>;
  refreshReviews: () => Promise<void>;
}

/**
 * Hook to manage course reviews
 * @param courseId - The course ID to fetch reviews for
 * @returns Review data and operations
 */
export function useCourseReviews(courseId: string | undefined): UseCourseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reviews for the course
  const fetchReviews = useCallback(async () => {
    if (!courseId) {
      setReviews([]);
      setStats(null);
      setUserReview(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch reviews with user profile data
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profile:profiles!reviews_profile_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Transform data
      const transformedReviews: Review[] = (reviewsData || []).map((r) => ({
        id: r.id,
        course_id: r.course_id,
        profile_id: r.profile_id,
        rating: r.rating,
        comment: r.comment || '',
        created_at: r.created_at,
        updated_at: r.updated_at,
        user_name: `${r.profile?.first_name || ''} ${r.profile?.last_name || ''}`.trim() || 'Anonymous',
      }));

      setReviews(transformedReviews);

      // Calculate stats
      const totalReviews = transformedReviews.length;
      const averageRating = totalReviews > 0
        ? Math.round((transformedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 0;

      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      transformedReviews.forEach((r) => {
        ratingDistribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
      });

      setStats({
        averageRating,
        totalReviews,
        ratingDistribution,
      });

      // Fetch current user's review
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userReviewData } = await supabase
          .from('reviews')
          .select('*')
          .eq('course_id', courseId)
          .eq('profile_id', user.id)
          .maybeSingle();

        if (userReviewData) {
          setUserReview({
            ...userReviewData,
            user_name: 'You',
          });
        } else {
          setUserReview(null);
        }
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to fetch reviews');
      setReviews([]);
      setStats(null);
      setUserReview(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Submit a new review
  const submitReview = useCallback(async (rating: number, comment: string): Promise<{ success: boolean; error?: string }> => {
    if (!courseId) {
      return { success: false, error: 'No course ID provided' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'You must be logged in to submit a review' };
      }

      // Check if user already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('course_id', courseId)
        .eq('profile_id', user.id)
        .maybeSingle();

      if (existingReview) {
        return { success: false, error: 'You have already reviewed this course' };
      }

      // Insert review
      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          course_id: courseId,
          profile_id: user.id,
          rating,
          comment: comment.trim() || null,
        });

      if (insertError) throw insertError;

      // Refresh reviews after submission
      await fetchReviews();

      return { success: true };
    } catch (err: any) {
      console.error('Error submitting review:', err);
      return { success: false, error: err.message || 'Failed to submit review' };
    }
  }, [courseId, fetchReviews]);

  // Update an existing review
  const updateReview = useCallback(async (
    reviewId: string,
    rating: number,
    comment: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'You must be logged in to update a review' };
      }

      // Verify ownership
      const { data: review } = await supabase
        .from('reviews')
        .select('profile_id')
        .eq('id', reviewId)
        .maybeSingle();

      if (!review) {
        return { success: false, error: 'Review not found' };
      }

      if (review.profile_id !== user.id) {
        return { success: false, error: 'You can only update your own reviews' };
      }

      // Update review
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          rating,
          comment: comment.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (updateError) throw updateError;

      // Refresh reviews after update
      await fetchReviews();

      return { success: true };
    } catch (err: any) {
      console.error('Error updating review:', err);
      return { success: false, error: err.message || 'Failed to update review' };
    }
  }, [fetchReviews]);

  // Delete a review
  const deleteReview = useCallback(async (reviewId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'You must be logged in to delete a review' };
      }

      // Verify ownership
      const { data: review } = await supabase
        .from('reviews')
        .select('profile_id')
        .eq('id', reviewId)
        .maybeSingle();

      if (!review) {
        return { success: false, error: 'Review not found' };
      }

      if (review.profile_id !== user.id) {
        return { success: false, error: 'You can only delete your own reviews' };
      }

      // Delete review
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (deleteError) throw deleteError;

      // Refresh reviews after deletion
      await fetchReviews();

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting review:', err);
      return { success: false, error: err.message || 'Failed to delete review' };
    }
  }, [fetchReviews]);

  // Refresh reviews manually
  const refreshReviews = useCallback(async () => {
    await fetchReviews();
  }, [fetchReviews]);

  // Fetch reviews on mount and when courseId changes
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    stats,
    userReview,
    loading,
    error,
    submitReview,
    updateReview,
    deleteReview,
    refreshReviews,
  };
}
