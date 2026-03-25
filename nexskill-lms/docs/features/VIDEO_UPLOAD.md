# Video Upload Feature Documentation

## Overview

This feature allows coaches to upload video files directly from their local device to Cloudinary, and then store the returned video URL in the Supabase lessons table.

## Features

- **Direct Client-Side Upload**: No backend server or Multer required
- **File Validation**: Validates video format and size before upload
- **Progress Tracking**: Real-time upload progress indicator
- **Video Preview**: Preview uploaded video with thumbnail
- **Dual Input Options**: Switch between video link and file upload
- **Cloudinary Integration**: Unsigned upload preset for secure client-side uploads

## Setup

### 1. Cloudinary Configuration

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name from the dashboard
3. Create an unsigned upload preset:
   - Go to Settings > Upload > Upload presets
   - Click "Add upload preset"
   - Set **Signing mode** to "Unsigned"
   - Set **Folder** to: `nexskill-lms/lessons/videos`
   - Set **Max file size** to: `100000` KB (100MB)
   - Set **Allowed formats** to: `mp4,mov,avi,webm,mkv,flv,wmv`
   - Enable **Video upload**
   - Save the preset name

### 2. Environment Variables

Add to your `.env.local` file:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset_here
```

## Implementation

### File Structure

```
src/
├── services/
│   ├── cloudinaryVideoUpload.service.ts    # Cloudinary upload logic
│   └── lessonVideo.service.ts              # Supabase integration
├── components/
│   └── coach/
│       └── lesson-editor/
│           └── VideoBlockEditor.tsx        # Video upload UI component
└── types/
    └── lesson.ts                           # Updated with source_url and media_metadata
```

### Usage Example

#### In Lesson Editor

```tsx
import VideoBlockEditor from './coach/lesson-editor/VideoBlockEditor';
import { saveVideoToLesson } from './services/lessonVideo.service';

// In your lesson editor component
<VideoBlockEditor
    block={videoBlock}
    onChange={handleBlockChange}
    onSave={async (videoUrl, metadata) => {
        const result = await saveVideoToLesson(lessonId, videoUrl, metadata);
        if (!result.success) {
            console.error('Failed to save video:', result.error);
        }
    }}
/>
```

### API Reference

#### CloudinaryVideoUploadService

```typescript
// Validate video file
CloudinaryVideoUploadService.validateVideoFile(file: File): { 
    valid: boolean; 
    error?: string 
}

// Get video duration
CloudinaryVideoUploadService.getVideoDuration(file: File): Promise<number>

// Upload video to Cloudinary
CloudinaryVideoUploadService.uploadVideo(
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResponse>

// Generate thumbnail URL
CloudinaryVideoUploadService.generateThumbnailUrl(
    publicId: string, 
    width?: number
): string

// Generate optimized video URL
CloudinaryVideoUploadService.generateOptimizedVideoUrl(
    publicId: string, 
    options?: { width?: number; quality?: string }
): string
```

#### LessonVideoService (Supabase)

```typescript
// Save video URL to lessons table
saveVideoToLesson(
    lessonId: string,
    videoUrl: string,
    metadata?: VideoMetadata
): Promise<{ success: boolean; error?: string }>

// Update lesson content blocks
updateLessonContentBlocks(
    lessonId: string,
    contentBlocks: any[]
): Promise<{ success: boolean; error?: string }>

// Get lesson by ID
getLesson(lessonId: string): Promise<Lesson | null>
```

## Data Structure

### Lesson Content Block (Video)

```typescript
{
    id: string;
    type: "video";
    content: string; // Cloudinary secure_url
    position: number;
    attributes: {
        source_url: string; // Cloudinary secure_url
        is_external: boolean; // false for uploaded videos
        media_metadata: {
            cloudinary_id: string;
            public_id: string;
            secure_url: string;
            resource_type: "video";
            format: string;
            bytes: number;
            original_filename: string;
            width: number;
            height: number;
            duration: number;
            thumbnail_url: string;
        };
    }
}
```

## Validation

### Supported Video Formats
- MP4 (.mp4)
- QuickTime (.mov)
- AVI (.avi)
- WebM (.webm)
- MKV (.mkv)
- FLV (.flv)
- WMV (.wmv)

### File Size Limit
- Maximum: 100MB

### Validation Errors
- Invalid file type
- File too large
- Empty file
- Network errors during upload

## UI Behavior

### Upload Flow
1. User selects "Upload Video" tab
2. Clicks upload area or drags file
3. File is validated
4. Upload progress shown (0-100%)
5. Video preview displayed after successful upload
6. Option to reupload or remove video

### States
- **Idle**: Upload area with instructions
- **Uploading**: Progress bar and percentage
- **Success**: Video preview with metadata
- **Error**: Error message with dismiss option

## Security Considerations

### Unsigned Upload Preset
- Configure allowed formats in Cloudinary dashboard
- Set max file size limit
- Restrict to specific folder
- Consider adding tags for organization

### Future Enhancements (Signed Uploads)
For more secure uploads, implement signed uploads:
1. Create backend endpoint to generate signatures
2. Use signature in upload request
3. Validate upload on server

## Troubleshooting

### Common Issues

**Upload fails immediately**
- Check `VITE_CLOUDINARY_CLOUD_NAME` is correct
- Verify upload preset exists and is unsigned
- Check file size and format

**Progress not showing**
- Ensure browser supports XMLHttpRequest upload events
- Check network tab for upload progress

**Video not playing**
- Verify video format is supported
- Check Cloudinary delivery URL
- Ensure proper MIME type

**Supabase update fails**
- Check lesson ID exists
- Verify RLS policies allow updates
- Check content_blocks structure

## Testing Checklist

- [ ] Upload small video file (< 10MB)
- [ ] Upload large video file (close to 100MB limit)
- [ ] Upload invalid file type (should show error)
- [ ] Upload oversized file (should show error)
- [ ] Cancel upload during progress
- [ ] Reupload different video
- [ ] Remove uploaded video
- [ ] Switch between link and upload modes
- [ ] Verify video saved to Supabase
- [ ] Verify video plays correctly
- [ ] Verify thumbnail generates correctly

## Performance Optimization

### Recommendations
1. Use Cloudinary transformations for different quality levels
2. Implement lazy loading for video previews
3. Consider using Cloudinary's adaptive bitrate streaming
4. Cache thumbnail URLs
5. Implement upload retry logic for failed uploads

## Migration Notes

### From Previous Cloudinary Implementation
- Removed widget-based upload
- Direct file upload using XMLHttpRequest
- Added progress tracking
- Enhanced error handling
- Added video metadata storage

### Database Schema
No schema changes required. Video data stored in existing `content_blocks` JSONB column.

## Support

For issues or questions:
1. Check Cloudinary dashboard for upload logs
2. Review browser console for errors
3. Check Supabase logs for database errors
4. Verify environment variables are set correctly
