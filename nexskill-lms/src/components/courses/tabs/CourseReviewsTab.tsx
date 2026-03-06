import React from "react";

interface Review {
    id: string;
    userName: string;
    avatar?: string;
    date: string;
    rating: number;
    comment: string;
}

interface CourseReviewsTabProps {
    reviews: Review[];
    rating: number;
    reviewCount: number;
}

const CourseReviewsTab: React.FC<CourseReviewsTabProps> = ({
    reviews,
    rating,
    reviewCount,
}) => {
    return (
        <div className="space-y-6">
            {reviews && reviews.length > 0 ? (
                <>
                    <div className="flex items-center gap-8 pb-6 border-b border-[#EDF0FB] dark:border-gray-700">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-1">
                                {rating.toFixed(1)}
                            </div>
                            <div className="text-yellow-500 text-xl mb-1">★★★★★</div>
                            <div className="text-sm text-text-muted dark:text-dark-text-muted">
                                {reviewCount} reviews
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="pb-6 border-b border-[#EDF0FB] dark:border-gray-700 last:border-0"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xl text-white font-bold flex-shrink-0">
                                        {review.avatar || review.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-medium text-text-primary dark:text-dark-text-primary">
                                                    {review.userName}
                                                </p>
                                                <p className="text-xs text-text-muted dark:text-dark-text-muted">
                                                    {review.date}
                                                </p>
                                            </div>
                                            <div className="text-yellow-500 text-sm">
                                                {'★'.repeat(review.rating)}
                                                {'☆'.repeat(5 - review.rating)}
                                            </div>
                                        </div>
                                        <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                                            {review.comment}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">⭐</div>
                    <p className="text-text-muted">
                        No reviews yet. Be the first to review this course!
                    </p>
                </div>
            )}
        </div>
    );
};

export default CourseReviewsTab;
