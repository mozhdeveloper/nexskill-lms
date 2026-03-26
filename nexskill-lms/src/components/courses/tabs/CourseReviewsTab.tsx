import React, { useState } from "react";
import { useCourseReviews } from "../../../hooks/useCourseReviews.js";

interface CourseReviewsTabProps {
  courseId: string;
  isEnrolled: boolean;
  initialRating?: number;
  initialReviewCount?: number;
}

const CourseReviewsTab: React.FC<CourseReviewsTabProps> = ({
  courseId,
  isEnrolled,
  initialRating = 0,
  initialReviewCount = 0,
}) => {
  const {
    reviews,
    stats,
    userReview,
    loading,
    error,
    submitReview,
    updateReview,
    deleteReview,
  } = useCourseReviews(courseId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setFeedbackMessage({ type: 'error', text: 'Please select a star rating' });
      return;
    }

    setIsSubmitting(true);
    
    const result = userReview 
      ? await updateReview(userReview.id, rating, comment)
      : await submitReview(rating, comment);

    setIsSubmitting(false);

    if (result.success) {
      setFeedbackMessage({ 
        type: 'success', 
        text: userReview ? 'Review updated successfully!' : 'Review submitted successfully!' 
      });
      setShowReviewForm(false);
      setRating(0);
      setComment("");
    } else {
      setFeedbackMessage({ type: 'error', text: result.error || 'Failed to submit review' });
    }

    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleEditReview = () => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment || '');
      setShowReviewForm(true);
    }
  };

  const handleDeleteReview = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your review?\n\nThis action cannot be undone.'
    );

    if (!confirmed) return;

    if (userReview) {
      const result = await deleteReview(userReview.id);
      if (result.success) {
        setFeedbackMessage({ type: 'success', text: 'Review deleted successfully!' });
        setShowReviewForm(false);
        setRating(0);
        setComment("");
      } else {
        setFeedbackMessage({ type: 'error', text: result.error || 'Failed to delete review' });
      }
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  const renderStars = (ratingValue: number, interactive = false, size = 'md') => {
    const starSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-xl';
    
    if (interactive) {
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <span
                className={`${starSize} ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-500'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                ★
              </span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${starSize} ${
              star <= ratingValue ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
            }`}
          >
            {star <= ratingValue ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-text-secondary">Loading reviews...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-text-secondary">Failed to load reviews</p>
        <p className="text-xs text-text-muted mt-1">{error}</p>
      </div>
    );
  }

  const averageRating = stats?.averageRating || initialRating;
  const totalReviews = stats?.totalReviews || initialReviewCount;

  return (
    <div className="space-y-6">
      {/* Feedback Message */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl ${
            feedbackMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* Summary Stats */}
      <div className="flex items-start gap-8 pb-6 border-b border-[#EDF0FB] dark:border-gray-700">
        <div className="text-center">
          <div className="text-5xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center mb-2">
            {renderStars(Math.round(averageRating))}
          </div>
          <div className="text-sm text-text-muted dark:text-dark-text-muted">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {/* Rating Distribution */}
        {stats && stats.totalReviews > 0 && (
          <div className="flex-1 max-w-md">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex gap-0.5 text-sm w-16">
                      <span className="text-yellow-500">★</span>
                      <span className="text-text-secondary">{stars}</span>
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-text-muted w-8 text-right">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Write Review Button / Form */}
      {isEnrolled && (
        <div className="bg-[#F5F7FF] dark:bg-gray-800 rounded-2xl p-6">
          {!showReviewForm && !userReview ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-1">
                  Share your experience
                </h3>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  Help other students by reviewing this course
                </p>
              </div>
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
              >
                Write a review
              </button>
            </div>
          ) : !showReviewForm && userReview ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-1">
                  Your review
                </h3>
                <div className="flex items-center gap-2">
                  {renderStars(userReview.rating, false, 'sm')}
                  <span className="text-sm text-text-secondary">
                    {formatDate(userReview.created_at)}
                  </span>
                </div>
                {userReview.comment && (
                  <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                    {userReview.comment}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditReview}
                  className="px-4 py-2 text-sm font-medium text-brand-primary border border-brand-primary rounded-full hover:bg-brand-primary hover:text-white transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteReview}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                  {userReview ? 'Edit your review' : 'Write a review'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setRating(userReview?.rating || 0);
                    setComment(userReview?.comment || '');
                  }}
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Your rating
                </label>
                {renderStars(rating, true, 'lg')}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Your review (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? What did you learn? Would you recommend this course?"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#EDF0FB] dark:border-gray-700 bg-white dark:bg-gray-800 text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
                <p className="text-xs text-text-muted mt-1">
                  Be respectful and constructive. Reviews should be about the course content.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : userReview ? 'Update review' : 'Submit review'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!isEnrolled && !userReview && (
        <div className="bg-[#F5F7FF] dark:bg-gray-800 rounded-2xl p-6 text-center">
          <p className="text-text-secondary">
            Enroll in this course to write a review
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews && reviews.length > 0 ? (
          <>
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
              Student Reviews ({reviews.length})
            </h3>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="pb-6 border-b border-[#EDF0FB] dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xl text-white font-bold flex-shrink-0">
                      {review.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-text-primary dark:text-dark-text-primary">
                            {review.user_name}
                          </p>
                          <p className="text-xs text-text-muted dark:text-dark-text-muted">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating, false, 'sm')}
                          {review.updated_at !== review.created_at && (
                            <span className="text-xs text-text-muted">(edited)</span>
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⭐</div>
            <p className="text-text-muted dark:text-dark-text-muted">
              {isEnrolled
                ? 'Be the first to review this course!'
                : 'No reviews yet. Enroll to be the first!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseReviewsTab;
