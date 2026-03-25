# NexSkill LMS Backend Server

Backend server for handling video uploads to Cloudinary using Multer.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Cloudinary credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Get Cloudinary Credentials

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy your Cloud Name, API Key, and API Secret

### 4. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Upload Video

**POST** `/api/upload/video`

Upload a video file to Cloudinary.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `video` (video file)

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "public_id": "nexskill-lms/lessons/videos/...",
    "resource_type": "video",
    "format": "mp4",
    "bytes": 12345678,
    "duration": 120.5,
    "width": 1920,
    "height": 1080,
    "original_filename": "my-video.mp4",
    "thumbnail_url": "https://res.cloudinary.com/.../so_0/w_400,..."
  }
}
```

### Delete Video

**DELETE** `/api/upload/video/:publicId`

Delete a video from Cloudinary.

**Response:**
```json
{
  "success": true,
  "message": "Video deleted successfully",
  "result": { ... }
}
```

### Health Check

**GET** `/api/upload/health`

Check if upload service is running.

**GET** `/api/health`

Check if server is running.

## Supported Video Formats

- MP4 (.mp4)
- QuickTime (.mov)
- AVI (.avi)
- WebM (.webm)
- MKV (.mkv)
- FLV (.flv)
- WMV (.wmv)

## File Size Limit

Maximum file size: **100MB**

## Frontend Integration

The frontend uses the `CloudinaryVideoUploadService` to upload videos:

```typescript
import { CloudinaryVideoUploadService } from './services/cloudinaryVideoUpload.service';

// Upload video
const response = await CloudinaryVideoUploadService.uploadVideo(videoFile, (progress) => {
  console.log(`Upload progress: ${progress.percentage}%`);
});

console.log('Video URL:', response.url);
console.log('Thumbnail:', response.thumbnail_url);
```

## Project Structure

```
server/
├── config/
│   └── cloudinary.js       # Cloudinary and Multer configuration
├── routes/
│   └── upload.js           # Upload API routes
├── .env.example            # Environment variables template
├── .env                    # Environment variables (create this)
├── package.json
├── server.js               # Main server file
└── README.md
```

## Security Notes

- API keys are stored server-side (not exposed to frontend)
- CORS is configured to only allow requests from specified frontend URL
- File type validation prevents non-video uploads
- File size limits prevent abuse

## Troubleshooting

### "Cloudinary credentials not configured"
- Check that `.env` file exists with correct credentials
- Restart the server after changing `.env`

### "File size too large"
- Maximum file size is 100MB
- Compress video or use a smaller file

### "Only video files are allowed"
- Ensure the file is a valid video format
- Check file extension and MIME type

### CORS errors
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Default is `http://localhost:5173` for Vite dev server
