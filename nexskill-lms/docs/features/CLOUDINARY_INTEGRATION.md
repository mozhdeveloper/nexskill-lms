# Cloudinary Media Upload Integration

This document explains how to set up and use the Cloudinary integration for uploading images and videos in the Lesson Editor.

## Overview

The Cloudinary integration provides a seamless way to upload, manage, and display media (images and videos) in lesson content. It uses Cloudinary's Upload Widget for a user-friendly upload experience and stores media metadata for optimal display.

## Features

-   ✅ **Drag-and-drop uploads** via Cloudinary Upload Widget
-   ✅ **Image uploads** with automatic optimization
-   ✅ **Video uploads** with thumbnail generation
-   ✅ **Upload progress tracking**
-   ✅ **Media metadata storage** (dimensions, file size, duration)
-   ✅ **Responsive media display** with lazy loading
-   ✅ **YouTube video embedding** support
-   ✅ **Alt text and captions** for accessibility
-   ✅ **Error handling** and retry logic

## Setup Instructions

### 1. Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Navigate to your Dashboard to find your **Cloud Name**

### 2. Create an Upload Preset

1. Go to **Settings** → **Upload** → **Upload Presets**
2. Click **Add upload preset**
3. Configure the preset:
    - **Preset name**: `nexskill-lms-unsigned` (or your choice)
    - **Signing mode**: Select **Unsigned**
    - **Folder**: `nexskill-lms/lessons` (optional, helps organize uploads)
    - **Access mode**: Public (recommended for lessons)
    - **Allowed formats**: Set specific formats or leave as default
    - **Max file size**: Set appropriate limits (e.g., 10MB for images, 100MB for videos)
4. **Save** the preset

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local` in the project root:

    ```bash
    cp .env.example .env.local
    ```

2. Add your Cloudinary credentials to `.env.local`:

    ```env
    VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
    VITE_CLOUDINARY_UPLOAD_PRESET=nexskill-lms-unsigned
    ```

3. Replace the values:
    - `your_cloud_name_here` → Your Cloud Name from Cloudinary Dashboard
    - `nexskill-lms-unsigned` → Your upload preset name

### 4. Restart Development Server

```bash
npm run dev
```

## Usage

### In the Lesson Editor

1. **Add Image or Video Block**

    - Click "Add content" button
    - Select "Image" or "Video"

2. **Upload Media**

    - Click the "Upload image/video" button
    - The Cloudinary Upload Widget will open
    - Choose your upload method:
        - **Local files**: Browse and select from your computer
        - **URL**: Paste a direct URL to an image/video
        - **Camera**: Take a photo (on supported devices)

3. **Upload Progress**

    - Watch the upload progress bar
    - Media preview appears when upload completes

4. **Add Metadata**

    - **Alt text**: For accessibility (required for images)
    - **Caption**: Optional description displayed below media

5. **Video URLs** (Alternative)
    - For videos, you can also paste YouTube, Vimeo, or direct video URLs
    - The system will automatically embed YouTube videos

### Media Metadata Storage

When media is uploaded, the following metadata is automatically stored:

```typescript
{
  cloudinary_id: string,    // Cloudinary public ID
  public_id: string,        // Same as cloudinary_id
  url: string,              // Secure HTTPS URL to media
  resource_type: 'image' | 'video',
  format: string,           // e.g., 'jpg', 'mp4'
  width: number,            // Image/video width
  height: number,           // Image/video height
  duration: number,         // Video duration in seconds
  thumbnail_url: string,    // Video thumbnail (auto-generated)
  bytes: number,            // File size
  original_filename: string // Original uploaded filename
}
```

This metadata is stored in the `attributes.media_metadata` field of each content block.

## Components

### MediaUploader

Handles the upload UI and Cloudinary widget integration.

**Props:**

-   `resourceType`: 'image' | 'video'
-   `currentUrl`: Current media URL (optional)
-   `currentMetadata`: Existing metadata (optional)
-   `onUploadComplete`: Callback when upload succeeds
-   `onRemove`: Callback to remove media

**Example:**

```tsx
<MediaUploader
    resourceType="image"
    currentUrl={block.content}
    currentMetadata={block.attributes?.media_metadata}
    onUploadComplete={(metadata) => handleMediaUpload(block.id, metadata)}
    onRemove={() => handleContentUpdate("", block.id)}
/>
```

### MediaPreview

Displays images and videos with optimization and lazy loading.

**Props:**

-   `url`: Media URL
-   `resourceType`: 'image' | 'video'
-   `alt`: Alt text for images
-   `caption`: Caption to display below media
-   `metadata`: Media metadata object
-   `lazy`: Enable lazy loading (default: true)

**Example:**

```tsx
<MediaPreview
    url={block.content}
    resourceType="image"
    alt={block.attributes?.alt}
    caption={block.attributes?.caption}
    metadata={block.attributes?.media_metadata}
/>
```

## Architecture

### Service Layer

-   `CloudinaryService` (`services/cloudinary.service.ts`)
    -   Manages Cloudinary script loading
    -   Opens upload widget
    -   Handles upload transformations
    -   Generates optimized URLs

### Hooks

-   `useCloudinaryUpload` (`hooks/useCloudinaryUpload.ts`)
    -   Encapsulates upload logic
    -   Manages upload state (loading, progress, errors)
    -   Provides clean API for components

### Type Definitions

-   `media.types.ts` - TypeScript interfaces for media metadata

## Security Considerations

### Unsigned Uploads

This implementation uses **unsigned uploads** for simplicity and client-side operation. This means:

✅ **Advantages:**

-   No backend required
-   Simple setup
-   Fast integration

⚠️ **Considerations:**

-   Upload preset settings control what can be uploaded
-   Set appropriate file size limits in Cloudinary
-   Configure allowed formats
-   Use folder organization for better management

### Production Recommendations

For production environments, consider:

1. **Signed Uploads** (Backend Required)

    - Implement a backend endpoint to generate signed upload parameters
    - Provides more security and control
    - Prevents unauthorized uploads

2. **Upload Restrictions**

    - Set max file sizes in Cloudinary preset
    - Limit allowed file formats
    - Implement rate limiting

3. **Content Moderation**
    - Enable Cloudinary's automatic moderation features
    - Review uploads periodically

## Troubleshooting

### Widget Not Loading

**Problem:** Upload button doesn't do anything
**Solution:**

-   Check browser console for errors
-   Verify environment variables are set correctly
-   Ensure `.env.local` is in the project root
-   Restart development server after changing `.env.local`

### Upload Fails

**Problem:** Upload starts but fails
**Solution:**

-   Check Cloudinary upload preset is set to "Unsigned"
-   Verify preset name matches environment variable
-   Check file size limits in preset settings
-   Review Cloudinary account quota

### Images Not Displaying

**Problem:** Uploaded images don't show in preview
**Solution:**

-   Check browser console for CORS errors
-   Verify Cloudinary account is active
-   Check that URLs are HTTPS
-   Try opening the URL directly in a browser

### Missing Environment Variables

**Problem:** "Cloudinary credentials not configured" error
**Solution:**

-   Ensure `.env.local` exists in project root
-   Verify variable names start with `VITE_`
-   Restart development server
-   Check for typos in variable names

## File Size Limits

**Default Limits:**

-   Images: 10 MB
-   Videos: 100 MB

**To Change:**

1. Update limits in Cloudinary upload preset settings
2. Or adjust in `cloudinary.service.ts`:
    ```typescript
    maxFileSize: 10485760, // 10MB in bytes
    ```

## Supported Formats

**Images:**

-   JPG, JPEG
-   PNG
-   GIF
-   WebP
-   SVG

**Videos:**

-   MP4
-   MOV
-   AVI
-   WMV
-   FLV
-   WebM

**External Videos:**

-   YouTube (auto-embed)
-   Vimeo
-   Direct video URLs

## Performance Optimization

### Image Optimization

-   Automatic format conversion (WebP when supported)
-   Responsive sizing
-   Lazy loading
-   Cloudinary CDN delivery

### Video Optimization

-   Automatic thumbnail generation
-   Adaptive bitrate streaming (Cloudinary feature)
-   Lazy loading with poster images
-   Cloudinary CDN delivery

## Migration Notes

### Updating Existing Lessons

Lessons created before Cloudinary integration will continue to work:

-   Old URL-based images/videos display normally
-   New uploads will have metadata and optimizations
-   No migration required

### Database Schema

The implementation extends the existing `lesson_content_blocks` structure:

-   Uses the existing `attributes` JSONB field
-   Stores `media_metadata` within attributes
-   No database migration required

## Cost Considerations

**Cloudinary Free Tier:**

-   25 GB storage
-   25 GB bandwidth/month
-   25 transform credits/month

This is sufficient for:

-   ~1,000 optimized images
-   ~50 short videos (5-10 min each)

**Monitoring Usage:**

-   Check Cloudinary Dashboard regularly
-   Set up usage alerts
-   Consider upgrading if limits are reached

## Additional Resources

-   [Cloudinary Documentation](https://cloudinary.com/documentation)
-   [Upload Widget Reference](https://cloudinary.com/documentation/upload_widget)
-   [Transformation Guide](https://cloudinary.com/documentation/image_transformations)
-   [Video Transformation Guide](https://cloudinary.com/documentation/video_manipulation_and_delivery)

## Support

For issues or questions:

1. Check this documentation
2. Review Cloudinary documentation
3. Check browser console for errors
4. Contact the development team
