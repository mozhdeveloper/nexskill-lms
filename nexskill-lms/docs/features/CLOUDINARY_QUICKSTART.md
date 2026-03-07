# Cloudinary Integration - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Get Cloudinary Credentials

1. Sign up at [cloudinary.com](https://cloudinary.com) (Free tier available)
2. From your Dashboard, copy your **Cloud Name**
3. Go to **Settings** → **Upload** → **Upload Presets**
4. Click **Add upload preset**
5. Set **Signing mode** to **Unsigned**
6. Save and copy the **Preset name**

### Step 2: Configure Environment

Create or update `.env.local` in the project root:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name_here
```

Replace with your actual values from Step 1.

### Step 3: Restart Development Server

```bash
npm run dev
```

## ✅ Testing the Integration

1. Navigate to any course in your LMS
2. Open the Lesson Editor
3. Click **Add content** → **Image** or **Video**
4. Click the **Upload** button
5. Upload a test image or video
6. Verify the media appears in the editor

## 🎯 Features Available

-   ✨ Drag-and-drop uploads
-   📸 Image uploads with cropping
-   🎥 Video uploads with thumbnails
-   📊 Upload progress tracking
-   🔄 Replace/remove media
-   🌐 YouTube video embedding
-   ♿ Alt text and captions

## 📚 Full Documentation

See [CLOUDINARY_INTEGRATION.md](./CLOUDINARY_INTEGRATION.md) for:

-   Detailed setup instructions
-   Component usage examples
-   Troubleshooting guide
-   Security considerations
-   Performance optimization tips

## 🆘 Common Issues

### "Cloudinary credentials not configured"

-   Check `.env.local` exists in project root
-   Verify variable names start with `VITE_`
-   Restart dev server after changes

### Upload button does nothing

-   Check browser console for errors
-   Verify upload preset is set to "Unsigned"
-   Check Cloudinary account is active

### Images not displaying

-   Verify Cloudinary URLs are HTTPS
-   Check browser console for CORS errors
-   Try opening the URL directly

## 💰 Free Tier Limits

Cloudinary free tier includes:

-   25 GB storage
-   25 GB bandwidth/month
-   ~1,000 images or ~50 videos

Sufficient for most development and small production deployments.

## 🔐 Security Notes

This setup uses **unsigned uploads** for simplicity. For production:

-   Set appropriate file size limits in Cloudinary
-   Configure allowed file formats
-   Consider implementing signed uploads via backend

See full documentation for production recommendations.
