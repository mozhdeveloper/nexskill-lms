# Quick Start Guide: New Features

## For Coaches 🎓

### Upload PDF/PowerPoint Documents to Your Course

1. **Go to your course builder**
   - Navigate to: `/coach/courses/{courseId}`

2. **Click "Lessons & Media" tab**
   - This now shows your course media library instead of a placeholder!

3. **Upload documents**
   - Click "Upload Media" button
   - Select "PDF/PPT" tab
   - Choose your file (PDF, PowerPoint, Word, Excel, etc.)
   - File uploads to Cloudinary

4. **View all course media**
   - All images, videos, and documents are shown in one place
   - Filter by type to find what you need
   - See file sizes and upload dates

### Add Documents to Lessons

1. **Go to Curriculum tab**
   - Click on your course module
   - Click "Edit" on a lesson

2. **In the lesson editor**
   - Click "+ Add content" button
   - Select "PDF/Document"
   - Upload your document
   - Document block is added to the lesson

3. **Publish the lesson**
   - Click "Published" button to make it visible to students
   - Click "Save changes"

4. **Students can now access**
   - Lesson shows the document with a download link
   - They can open it in a new tab or download it

---

## For Students 👨‍🎓

### View Your Courses

1. **Go to Dashboard**
   - Navigate to: `/student/dashboard`

2. **See "Your courses" section**
   - Shows all courses you're enrolled in
   - See how many modules and lessons in each
   - View your progress percentage
   - Click to go to full curriculum view

3. **Click a course**
   - Opens the curriculum page
   - Shows all modules and lessons
   - Click "▶ Start Learning" to begin

### Access Lesson Documents

1. **Open a lesson**
   - Click on lesson from curriculum
   - Opens the lesson player

2. **Scroll through lesson content**
   - Text, images, videos as before
   - **Documents appear as downloadable files** ← NEW!
   - Click "Open Document" to view in browser
   - Or download to your computer

3. **Document management**
   - Open PDFs, PowerPoints, Word docs in your browser
   - Download for offline viewing
   - Print if needed

---

## What You Can Upload 📦

### Images
- JPG, PNG, GIF, WebP
- Use case: Course thumbnails, diagrams, screenshots

### Videos
- MP4, WebM, MOV
- Use case: Course lessons, tutorials, demonstrations

### Documents ← NEW!
- **PDF** (.pdf) - Textbooks, reference materials, guides
- **PowerPoint** (.pptx) - Slides, presentations
- **Word** (.docx) - Documents, handouts
- **Excel** (.xlsx) - Spreadsheets, data
- **And many more!** (.ppt, .xlsx, .zip, etc.)

---

## Technical Implementation 🔧

### What Changed
1. **MediaUploader component** now supports "document" type
2. **Lesson content blocks** can be of type "document"
3. **CourseMediaLibrary component** shows all media in one place
4. **Student dashboard** shows enrolled courses overview
5. **Lesson editor** has PDF/Document block option

### Files Modified
- `src/components/MediaUploader.tsx`
- `src/components/coach/lesson-editor/LessonEditorPanel.tsx`
- `src/components/coach/course-builder/CourseMediaLibrary.tsx` (NEW)
- `src/components/student/EnrolledCoursesOverview.tsx` (NEW)
- `src/pages/coach/CourseBuilder.tsx`
- `src/pages/student/StudentDashboard.tsx`
- `src/types/lesson.ts`

### No Database Migrations Required
- Uses existing `lessons.content_blocks` JSONB field
- Fully backward compatible
- Media stored in Cloudinary (same as images/videos)

---

## Common Questions ❓

**Q: Will this break my existing lessons?**  
A: No! All existing lessons continue to work. New features are added on top.

**Q: Where are documents stored?**  
A: In Cloudinary (same as images/videos). Secure CDN delivery.

**Q: Can students download documents?**  
A: Yes! Click "Open Document" in the lesson to view, or download button to save locally.

**Q: File size limits?**  
A: Depends on your Cloudinary plan. Typical limits are 100MB+ per file.

**Q: Can I reuse documents across lessons?**  
A: Currently they're embedded per lesson. Future versions will have a media library for sharing.

**Q: What if a document fails to upload?**  
A: Error message displays. Check file size and format, then try again.

**Q: Can students see documents before course starts?**  
A: Only if the lesson is published. Hidden lessons won't show content to students.

---

## Support & Troubleshooting 🆘

### Document won't upload
1. Check file size (should be < 100MB)
2. Verify file format is supported
3. Try renaming file to remove special characters
4. Check your internet connection

### Document not showing in lesson
1. Make sure lesson is published
2. Refresh the page
3. Clear browser cache
4. Check file URL in lesson editor

### Students can't access documents
1. Verify lesson is published
2. Verify student is enrolled in course
3. Check document URL is not broken
4. Ask student to try different browser

### Need more help?
- Check `IMPLEMENTATION_SUMMARY.md` for full technical details
- Review lesson types in `src/types/lesson.ts`
- Check Cloudinary integration in hooks

---

**Last Updated:** January 28, 2026  
**Version:** 1.0  
**Status:** Ready for testing
