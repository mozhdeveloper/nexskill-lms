import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from './routes/upload.js';
import googleMeetRoutes from './routes/googleMeet.js';
import emailRoutes from './routes/email.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/google', googleMeetRoutes);
app.use('/api/email', emailRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NexSkill LMS Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Multer error handling (check for code or name since multer might not be imported in this scope)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size too large. Maximum size is 100MB'
    });
  }
  
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   NexSkill LMS Server                                     ║
║   Running on port ${PORT}                                   ║
║                                                           ║
║   API Endpoints:                                          ║
║   POST /api/upload/video     - Upload video               ║
║   DELETE /api/upload/video/:id - Delete video             ║
║   GET  /api/upload/health    - Health check               ║
║   GET  /api/health           - Server health              ║
║                                                           ║
║   Cloudinary Configured: ${!!process.env.CLOUDINARY_CLOUD_NAME}                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
