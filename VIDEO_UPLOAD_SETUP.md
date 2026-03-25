# Video Upload Setup Guide - Multer + Cloudinary

This guide explains how to set up video upload functionality using a backend server with Multer and Cloudinary.

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │   Backend       │      │   Cloudinary    │
│   (React/Vite)  │─────▶│   (Express)     │─────▶│   (Storage)     │
│                 │      │   + Multer      │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Quick Start

### Step 1: Setup Backend Server

1. **Navigate to server folder:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   copy .env.example .env
   ```

4. **Configure Cloudinary credentials in `.env`:**
   ```env
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

### Step 2: Configure Frontend

1. **Update frontend `.env.local`:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

2. **Start the frontend:**
   ```bash
   cd ../nexskill-lms
   npm run dev
   ```

### Step 3: Get Cloudinary Credentials

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up or log in
3. Go to **Dashboard**
4. Copy these values to your `.env` files:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

## How It Works

### Upload Flow

1. **User selects video file** in the frontend
2. **Frontend validates** file type and size
3. **Frontend sends file** to backend API (`POST /api/upload/video`)
4. **Backend receives file** via Multer middleware
5. **Multer uploads to Cloudinary** using CloudinaryStorage
6. **Cloudinary processes video** and returns URL
7. **Backend sends response** with video details to frontend
8. **Frontend saves URL** to Supabase database

### File Structure

```
nexskill-lms/
├── server/                    # Backend server
│   ├── config/
│   │   └── cloudinary.js     # Cloudinary + Multer config
│   ├── routes/
│   │   └── upload.js         # Upload API routes
│   ├── .env                  # Server environment variables
│   ├── server.js             # Express server
│   └── package.json
│
└── nexskill-lms/             # Frontend application
    ├── src/
    │   ├── services/
    │   │   └── cloudinaryVideoUpload.service.ts
    │   └── components/
    │       └── coach/
    │           └── lesson-editor/
    │               └── VideoBlockEditor.tsx
    └── .env.local            # Frontend environment variables
```

## API Endpoints

### Upload Video
```
POST http://localhost:5000/api/upload/video
Content-Type: multipart/form-data

Form Data:
- video: [video file]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/.../video.mp4",
    "public_id": "nexskill-lms/lessons/videos/abc123",
    "thumbnail_url": "https://res.cloudinary.com/.../thumb.jpg",
    "duration": 120.5,
    "bytes": 12345678
  }
}
```

### Delete Video
```
DELETE http://localhost:5000/api/upload/video/:publicId
```

## Supported Formats

- ✅ MP4 (.mp4)
- ✅ QuickTime (.mov)
- ✅ AVI (.avi)
- ✅ WebM (.webm)
- ✅ MKV (.mkv)
- ✅ FLV (.flv)
- ✅ WMV (.wmv)

## Limits

- **Maximum file size:** 100MB
- **Allowed formats:** Video files only
- **Storage folder:** `nexskill-lms/lessons/videos`

## Testing the Upload

### Using cURL
```bash
curl -X POST http://localhost:5000/api/upload/video \
  -F "video=@/path/to/your/video.mp4"
```

### Using Postman
1. Method: `POST`
2. URL: `http://localhost:5000/api/upload/video`
3. Body → form-data:
   - Key: `video`, Type: File, Value: [select your video file]

### From Frontend
The `VideoBlockEditor` component handles uploads automatically:
1. Click "Upload Video" in lesson editor
2. Select video file
3. Watch progress bar
4. Video preview appears after upload
5. Click "Save & Close" to add to lesson

## Troubleshooting

### Server won't start
- Check if `.env` file exists with correct credentials
- Ensure port 5000 is not in use
- Run `npm install` again

### Upload fails
- Check file size (max 100MB)
- Verify file is a valid video format
- Check Cloudinary credentials
- Look at server console for error messages

### CORS errors
- Verify `FRONTEND_URL` in server `.env` matches frontend URL
- Default frontend URL: `http://localhost:5173`

### Video not showing
- Check if upload was successful (check server logs)
- Verify Cloudinary URL is accessible
- Check browser console for errors

## Production Deployment

### Backend (Server)
1. Deploy to Heroku, Railway, Render, or similar
2. Set environment variables in hosting platform
3. Update `FRONTEND_URL` to production frontend URL

### Frontend
1. Update `VITE_API_URL` to production backend URL
2. Build and deploy to Vercel, Netlify, or similar

### Environment Variables (Production)
```env
# Server
PORT=$PORT
FRONTEND_URL=https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
VITE_API_URL=https://your-backend.railway.app/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

## Security Best Practices

✅ **Do:**
- Store API keys in environment variables (never in code)
- Validate file types and sizes server-side
- Use CORS to restrict allowed origins
- Implement authentication for uploads (if needed)
- Use HTTPS in production

❌ **Don't:**
- Commit `.env` files to git
- Expose Cloudinary API secret to frontend
- Allow unlimited file sizes
- Skip file type validation

## Next Steps

1. ✅ Setup backend server
2. ✅ Configure Cloudinary
3. ✅ Test video upload
4. ⏭️ Add authentication (optional)
5. ⏭️ Implement video transcoding (optional)
6. ⏭️ Add video analytics (optional)

## Support

For issues:
1. Check server logs: `server console`
2. Check browser console: `F12 → Console`
3. Verify Cloudinary dashboard: [cloudinary.com/console](https://cloudinary.com/console)
