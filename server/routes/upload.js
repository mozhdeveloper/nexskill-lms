import express from 'express';
import { upload, cloudinary } from '../config/cloudinary.js';

const router = express.Router();

/**
 * POST /api/upload/video
 * Upload video to Cloudinary
 * 
 * Request:
 * - multipart/form-data
 * - field: "video" (video file)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     url: string,
 *     public_id: string,
 *     resource_type: string,
 *     format: string,
 *     bytes: number,
 *     duration: number,
 *     width: number,
 *     height: number,
 *     original_filename: string
 *   }
 * }
 */
router.post('/video', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file uploaded'
      });
    }

    // Get video details from Cloudinary response
    const videoData = {
      url: req.file.secure_url,
      public_id: req.file.public_id,
      resource_type: req.file.resource_type,
      format: req.file.format,
      bytes: req.file.bytes,
      duration: req.file.duration || 0,
      width: req.file.width || 0,
      height: req.file.height || 0,
      original_filename: req.file.originalname,
      thumbnail_url: cloudinary.url(req.file.public_id, {
        transformation: [
          { width: 400, crop: 'fill' },
          { fetch_format: 'jpg', quality: 'auto' }
        ],
        resource_type: 'video',
        start_offset: 0
      })
    };

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: videoData
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload video'
    });
  }
});

/**
 * DELETE /api/upload/video/:publicId
 * Delete video from Cloudinary
 */
router.delete('/video/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Public ID is required'
      });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    });

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
      result
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete video'
    });
  }
});

/**
 * GET /api/upload/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Upload service is running',
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME
  });
});

export default router;
