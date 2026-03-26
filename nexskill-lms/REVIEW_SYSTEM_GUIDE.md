# 📝 Course Review System - Implementation Guide

## Overview
A fully functional course review system that allows enrolled students to rate and review courses. Reviews are tied to both a specific course and a specific user, with proper access control via Row Level Security (RLS).

## Features

### For Students:
- ✅ Submit a rating (1-5 stars) for courses they're enrolled in
- ✅ Add an optional written comment
- ✅ Edit their own reviews
- ✅ Delete their own reviews
- ✅ View all reviews for a course
- ✅ See rating distribution (how many 5-star, 4-star, etc.)

### For Coaches (Future Use):
- ✅ View all reviews for their courses
- ✅ Access review analytics via helper functions
- 🔄 Moderate reviews (admin only)

### For Prospective Students:
- ✅ Read reviews before enrolling (for published courses)
- ✅ See overall rating and distribution

## Database Schema

### Reviews Table
```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one review per user per course
    UNIQUE(course_id, profile_id)
);
```

### Indexes
- `idx_reviews_course` - Fast lookup by course_id
- `idx_reviews_profile` - Fast lookup by user
- `idx_reviews_created` - Fast sorting by date (newest first)

## File Structure

```
src/
├── hooks/
│   └── useCourseReviews.ts          # Custom hook for review operations
├── components/
│   └── courses/
│       └── tabs/
│           └── CourseReviewsTab.tsx  # Review UI component
└── pages/
    └── student/
        └── CourseDetailRefactored.tsx # Uses CourseReviewsTab

supabase/
└── migrations/
    ├── 20260326_create_reviews_table.sql         # Table schema
    └── 20260326_create_reviews_rls_policies.sql  # RLS policies
```

## Setup Instructions

### Step 1: Run Database Migrations

1. **Create the reviews table:**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/20260326_create_reviews_table.sql
   ```

2. **Create RLS policies:**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/20260326_create_reviews_rls_policies.sql
   ```

### Step 2: Verify Setup

Check if the table was created:
```sql
SELECT * FROM reviews LIMIT 5;
```

Check if policies exist:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'reviews'
ORDER BY policyname;
```

### Step 3: Test the Review System

1. **As a Student:**
   - Navigate to a course detail page
   - Enroll in the course
   - Go to the "Reviews" tab
   - Click "Write a review"
   - Select a rating (1-5 stars)
   - Add an optional comment
   - Submit the review

2. **Verify Review Appears:**
   - Check that your review appears in the list
   - Verify the rating and comment are correct
   - Try editing the review
   - Try deleting the review

3. **As Another User:**
   - View the same course
   - Verify you can see the first user's review
   - Try submitting your own review

## API Reference

### useCourseReviews Hook

```typescript
import { useCourseReviews } from './hooks/useCourseReviews';

const {
  reviews,           // Array of all reviews for the course
  stats,             // Review statistics (average, distribution)
  userReview,        // Current user's review (if exists)
  loading,           // Loading state
  error,             // Error state
  submitReview,      // Function to submit a new review
  updateReview,      // Function to update existing review
  deleteReview,      // Function to delete a review
  refreshReviews,    // Function to manually refresh data
} = useCourseReviews(courseId);
```

### Methods

#### submitReview(rating, comment)
Submit a new review for the course.
```typescript
const result = await submitReview(5, 'Great course!');
if (result.success) {
  console.log('Review submitted!');
} else {
  console.error(result.error);
}
```

#### updateReview(reviewId, rating, comment)
Update an existing review.
```typescript
const result = await updateReview(reviewId, 4, 'Updated review');
```

#### deleteReview(reviewId)
Delete a review.
```typescript
const result = await deleteReview(reviewId);
```

## Access Control (RLS)

### Who Can Do What?

| Action | Student | Coach | Admin |
|--------|---------|-------|-------|
| View reviews (published courses) | ✅ | ✅ | ✅ |
| View own review | ✅ | ✅ | ✅ |
| Submit review (if enrolled) | ✅ | ❌ | ✅ |
| Edit own review | ✅ | ❌ | ✅ |
| Delete own review | ✅ | ❌ | ✅ |
| View reviews for their courses | ❌ | ✅ | ✅ |
| Moderate any review | ❌ | ❌ | ✅ |

### Security Rules

1. **One review per user per course** - Enforced by UNIQUE constraint
2. **Must be enrolled to review** - Enforced by INSERT policy
3. **Can only edit/delete own reviews** - Enforced by UPDATE/DELETE policies
4. **Reviews visible for published courses** - Enforced by SELECT policy

## Coach Analytics (Future Use)

### Get Review Stats for All Courses
```sql
SELECT * FROM get_coach_review_stats(auth.uid());
```

Returns:
- course_id, course_title
- average_rating
- total_reviews
- rating_5, rating_4, rating_3, rating_2, rating_1

### Get Recent Reviews
```sql
SELECT * FROM get_coach_recent_reviews(auth.uid(), 20);
```

Returns:
- review_id, course_id, course_title
- rating, comment, created_at
- user_name

## Component Integration

### CourseReviewsTab Props

```typescript
interface CourseReviewsTabProps {
  courseId: string;        // Required: Course ID
  isEnrolled: boolean;     // Required: Is user enrolled?
  initialRating?: number;  // Optional: Fallback rating
  initialReviewCount?: number; // Optional: Fallback count
}
```

### Usage Example

```tsx
<CourseReviewsTab
  courseId={course.id}
  isEnrolled={isEnrolled}
  initialRating={course.rating}
  initialReviewCount={course.reviewCount}
/>
```

## Testing Checklist

- [ ] Database table created successfully
- [ ] RLS policies applied
- [ ] User can submit a review when enrolled
- [ ] User cannot submit a review when not enrolled
- [ ] User can only submit one review per course
- [ ] User can edit their own review
- [ ] User can delete their own review
- [ ] Reviews appear in the correct course
- [ ] Reviews from different courses don't mix
- [ ] Rating distribution displays correctly
- [ ] Average rating calculates correctly
- [ ] Date formatting works (Today, 1 day ago, etc.)
- [ ] Loading states display properly
- [ ] Error states display properly

## Troubleshooting

### Issue: "Failed to submit review"
**Cause:** User not enrolled or RLS policy blocking
**Solution:** 
1. Verify user is enrolled: `SELECT * FROM enrollments WHERE profile_id = 'USER_ID' AND course_id = 'COURSE_ID'`
2. Check RLS policies are applied

### Issue: "Reviews not showing"
**Cause:** Course not published or RLS issue
**Solution:**
1. Verify course is published: `SELECT is_published FROM courses WHERE id = 'COURSE_ID'`
2. Check browser console for errors
3. Verify RLS policies: Run the verification query above

### Issue: "Duplicate review error"
**Cause:** User already submitted a review
**Solution:** This is expected behavior. Users can only have one review per course. Use the edit function instead.

## Future Enhancements

- [ ] Add helpful/not helpful votes on reviews
- [ ] Add coach responses to reviews
- [ ] Add review reporting/moderation system
- [ ] Add email notifications for new reviews
- [ ] Add review analytics dashboard for coaches
- [ ] Add verified badge for completed students
- [ ] Add photo/video attachments to reviews

## Best Practices

1. **Always check enrollment** before allowing review submission
2. **Validate rating** is between 1-5
3. **Sanitize comments** to prevent XSS
4. **Show loading states** during async operations
5. **Provide clear feedback** on success/error
6. **Respect user privacy** - don't expose email addresses
7. **Moderate inappropriate content** - implement reporting system

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database setup with the verification queries
3. Review RLS policies in Supabase dashboard
4. Check network tab for failed API calls
