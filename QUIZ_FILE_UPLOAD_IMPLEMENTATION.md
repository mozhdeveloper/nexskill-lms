# File Upload & Video Submission Quiz Implementation Guide

## Overview
This document outlines the remaining changes needed to complete the file upload and video submission quiz functionality for students.

## Files Created
1. ✅ `src/components/quiz/QuestionFileUpload.tsx` - Student component for file uploads
2. ✅ `src/components/quiz/QuestionVideoSubmission.tsx` - Student component for video submissions

## Files Modified
1. ✅ `src/pages/student/QuizSession.tsx` - Partially updated
   - ✅ Imports added for QuestionFileUpload and QuestionVideoSubmission
   - ✅ Type definitions updated to include 'file-upload' | 'video-submission'
   - ✅ mapQuestionType helper updated to handle file_upload and video_submission
   - ✅ mapQuizQuestions now includes answerConfig mapping

## Remaining Changes Needed in QuizSession.tsx

### 1. Add State for File/Video Uploads (around line 190)
Add these state declarations after the existing state:

```typescript
// File/Video upload state
const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
const [uploadedVideos, setUploadedVideos] = useState<Record<string, File | null>>({});
const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
```

### 2. Add File/Video Upload Handlers (before handleSubmit)

```typescript
// File upload handler
const handleFilesChange = useCallback((questionId: string, files: File[]) => {
  setUploadedFiles((prev) => ({ ...prev, [questionId]: files }));
  // Mark question as answered
  setSelectedAnswers((prev) => ({ ...prev, [questionId]: `file_upload_${files.length}_files` }));
}, []);

// Video upload handler
const handleVideoChange = useCallback((questionId: string, file: File | null) => {
  setUploadedVideos((prev) => ({ ...prev, [questionId]: file }));
  // Mark question as answered
  if (file) {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: `video_upload_${file.name}` }));
  } else {
    setSelectedAnswers((prev) => {
      const newState = { ...prev };
      delete newState[questionId];
      return newState;
    });
  }
}, []);

// Upload files to Supabase storage
const uploadFilesToStorage = async (
  files: File[], 
  attemptId: string, 
  questionId: string
): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  
  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${attemptId}/${questionId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('quiz-submissions')
      .upload(fileName, file);
      
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }
    
    const { data: urlData } = supabase.storage
      .from('quiz-submissions')
      .getPublicUrl(fileName);
      
    uploadedUrls.push(urlData.publicUrl);
  }
  
  return uploadedUrls;
};

// Upload video to Supabase storage
const uploadVideoToStorage = async (
  video: File,
  attemptId: string,
  questionId: string
): Promise<string> => {
  const videoExt = video.name.split('.').pop() || 'mp4';
  const fileName = `${attemptId}/${questionId}/video.${videoExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('quiz-submissions')
    .upload(fileName, video);
    
  if (uploadError) {
    console.error('Error uploading video:', uploadError);
    throw uploadError;
  }
  
  const { data: urlData } = supabase.storage
    .from('quiz-submissions')
    .getPublicUrl(fileName);
    
  return urlData.publicUrl;
};
```

### 3. Update handleSubmit Function (around line 580)

Before calculating score, add file/video uploads:

```typescript
// Upload files and videos if any
setUploadingFiles(true);

const uploadedFileUrls: Record<string, any> = {};

// Upload files for file-upload questions
for (const question of questions) {
  if (question.type === 'file-upload' && uploadedFiles[question.id]) {
    try {
      const urls = await uploadFilesToStorage(
        uploadedFiles[question.id],
        currentAttempt.id,
        question.id
      );
      uploadedFileUrls[question.id] = { type: 'files', urls };
    } catch (error) {
      console.error(`Failed to upload files for question ${question.id}:`, error);
      alert(`Failed to upload files: ${error.message}`);
      setUploadingFiles(false);
      return;
    }
  }
  
  // Upload video for video-submission questions
  if (question.type === 'video-submission' && uploadedVideos[question.id]) {
    try {
      const url = await uploadVideoToStorage(
        uploadedVideos[question.id],
        currentAttempt.id,
        question.id
      );
      uploadedFileUrls[question.id] = { 
        type: 'video', 
        url, 
        filename: uploadedVideos[question.id].name 
      };
    } catch (error) {
      console.error(`Failed to upload video for question ${question.id}:`, error);
      alert(`Failed to upload video: ${error.message}`);
      setUploadingFiles(false);
      return;
    }
  }
}

setUploadingFiles(false);

// Mark questions with uploads as requiring manual grading
questions.forEach((q) => {
  if ((q.type === 'file-upload' || q.type === 'video-submission') && uploadedFileUrls[q.id]) {
    requiresManualGrading = true;
  }
});
```

### 4. Update QuizResponse Saving (around line 700)

When saving responses, include file/video URLs:

```typescript
const responses = questions.map((q) => {
  const userAnswer = selectedAnswers[q.id];
  let isCorrect = false;

  if (q.type === 'true-false') {
    isCorrect = userAnswer === q.correctAnswer;
  } else if (q.type === 'file-upload' || q.type === 'video-submission') {
    // File/video uploads always require manual grading
    isCorrect = false; // Will be graded by coach
  } else {
    isCorrect = userAnswer === q.correctOptionId;
  }

  let pointsEarned = isCorrect ? q.points : 0;
  
  // Apply penalty to individual question points if late submission
  if (isLateSubmission && quizMeta.late_penalty_percent > 0 && isCorrect) {
    pointsEarned = Math.max(0, q.points - Math.round((q.points * quizMeta.late_penalty_percent) / 100));
  }

  // Include uploaded file/video URLs in response_data
  const responseData: any = { 
    answer: userAnswer ?? null,
    uploaded_files: uploadedFileUrls[q.id] || null,
  };

  return {
    attempt_id: currentAttempt.id,
    question_id: q.id,
    response_data: responseData,
    points_earned: pointsEarned,
    points_possible: q.points,
    is_correct: isCorrect,
    requires_grading: q.requires_manual_grading || (q.type === 'file-upload') || (q.type === 'video-submission'),
  };
});
```

### 5. Update Question Rendering (around line 970)

Add rendering for file-upload and video-submission questions:

```typescript
{/* Question Card */}
<div className="glass-card rounded-3xl p-8 mb-6 mt-6">
  {currentQuestion.type === 'multiple-choice' && (
    <QuestionMultipleChoice
      question={{ ...currentQuestion, options: currentQuestion.options || [] }}
      selectedOptionId={selectedAnswers[currentQuestion.id] as string}
      onSelect={handleAnswerSelect}
    />
  )}
  {currentQuestion.type === 'true-false' && (
    <QuestionTrueFalse
      question={currentQuestion}
      value={selectedAnswers[currentQuestion.id] as boolean}
      onChange={handleAnswerSelect}
    />
  )}
  {currentQuestion.type === 'image-choice' && (
    <QuestionImageChoice
      question={{
        ...currentQuestion,
        options: (currentQuestion.options || []).map((o) => ({
          id: o.id,
          label: o.label,
          imageUrl: o.imageUrl || '',
        })),
      }}
      selectedOptionId={selectedAnswers[currentQuestion.id] as string}
      onSelect={handleAnswerSelect}
    />
  )}
  {currentQuestion.type === 'file-upload' && (
    <QuestionFileUpload
      question={{
        ...currentQuestion,
        answerConfig: currentQuestion.answerConfig,
      }}
      onFilesChange={handleFilesChange}
      existingFiles={uploadedFiles[currentQuestion.id] || []}
    />
  )}
  {currentQuestion.type === 'video-submission' && (
    <QuestionVideoSubmission
      question={{
        ...currentQuestion,
        answerConfig: currentQuestion.answerConfig,
      }}
      onVideoChange={handleVideoChange}
      existingVideo={uploadedVideos[currentQuestion.id] || null}
    />
  )}
</div>
```

### 6. Update Submit Button (around line 1010)

Add uploading state to submit button:

```typescript
{isLastQuestion ? (
  <button
    onClick={handleSubmit}
    disabled={submitting || uploadingFiles}
    className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
  >
    {uploadingFiles ? 'Uploading Files...' : submitting ? 'Submitting...' : 'Submit Quiz'}
  </button>
) : (
```

## Database Setup Required

Create a Supabase Storage bucket named `quiz-submissions`:

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `quiz-submissions`
3. Set to **Public** access
4. Add RLS policies if needed for security

## Testing Checklist

- [ ] Create a quiz with file upload question (coach side)
- [ ] Create a quiz with video submission question (coach side)
- [ ] Student can see file upload question and upload files
- [ ] Student can see video submission question and upload video
- [ ] Files are uploaded to Supabase storage correctly
- [ ] File/video URLs are saved in quiz_responses.response_data
- [ ] Quiz submission marks questions as requiring manual grading
- [ ] Coach can review uploaded files/videos in QuizReviewDetail
- [ ] Quiz submission trigger creates quiz_submissions record for approval

## Notes

- File upload and video submission questions ALWAYS require manual grading
- The coach review dashboard will need to display the uploaded files/videos from the response_data
- Consider adding file size validation and video duration validation before submission
- The `quiz-submissions` storage bucket should have cleanup policies for old submissions
