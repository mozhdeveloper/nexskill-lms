import React, { useState, useRef, useCallback } from 'react';
import { Upload, Video, X, AlertCircle, CheckCircle, Play } from 'lucide-react';

interface QuestionVideoSubmissionProps {
  question: {
    id: string;
    questionText: string;
    answerConfig?: {
      max_duration_minutes?: number;
      max_file_size_mb?: number;
      accepted_formats?: string[];
      instructions?: string;
    };
  };
  onVideoChange: (questionId: string, file: File | null) => void;
  existingVideo?: File | null;
}

const QuestionVideoSubmission: React.FC<QuestionVideoSubmissionProps> = ({
  question,
  onVideoChange,
  existingVideo = null,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(existingVideo);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const maxDurationMinutes = question.answerConfig?.max_duration_minutes || 5;
  const maxSizeMB = question.answerConfig?.max_file_size_mb || 100;
  const acceptedFormats = question.answerConfig?.accepted_formats || ['mp4', 'mov', 'avi', 'webm'];

  const validateVideo = async (file: File): Promise<string | null> => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Video is too large. Maximum size is ${maxSizeMB}MB.`;
    }

    // Check file type
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!acceptedFormats.includes(fileExt)) {
      return `Video format "${fileExt}" is not accepted. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    // Check video duration
    try {
      setIsValidating(true);
      const duration = await getVideoDuration(file);
      const maxDurationSeconds = maxDurationMinutes * 60;

      if (duration > maxDurationSeconds) {
        const maxMins = Math.floor(maxDurationSeconds / 60);
        const maxSecs = maxDurationSeconds % 60;
        return `Video is too long. Maximum duration is ${maxMins}:${maxSecs.toString().padStart(2, '0')} minutes.`;
      }

      setVideoDuration(duration);
    } catch (error) {
      return 'Failed to validate video. Please ensure the file is a valid video.';
    } finally {
      setIsValidating(false);
    }

    return null;
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError('');

    // Validate video
    const error = await validateVideo(file);
    if (error) {
      setUploadError(error);
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Clean up old preview URL
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(file);
    setVideoPreview(previewUrl);
    onVideoChange(question.id, file);
  }, [question.id, onVideoChange, maxSizeMB, acceptedFormats, maxDurationMinutes]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileSelect(e.target.files[0]);
      // Reset input so same file can be selected again if removed
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview('');
    setVideoDuration(0);
    setUploadError('');
    onVideoChange(question.id, null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {question.questionText}
        </h3>
        {question.answerConfig?.instructions && (
          <p className="text-sm text-slate-600 mt-2">{question.answerConfig.instructions}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-600">
          <span>🎬 Accepted: {acceptedFormats.map(f => f.toUpperCase()).join(', ')}</span>
          <span>📏 Max size: {maxSizeMB}MB</span>
          <span>⏱️ Max duration: {maxDurationMinutes}:00 min</span>
        </div>
      </div>

      {/* Upload Area or Video Preview */}
      {!videoFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInput}
            accept={acceptedFormats.map(f => `video/${f === 'mov' ? 'quicktime' : f}`).join(',')}
            className="hidden"
          />
          <Video className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-700 font-medium mb-1">Click to upload video or drag and drop</p>
          <p className="text-sm text-slate-500">MP4, MOV, AVI, or WebM</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoPreview}
              controls
              className="w-full max-h-96"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setVideoDuration(videoRef.current.duration);
                }
              }}
            />
            <button
              onClick={handleRemoveVideo}
              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
              title="Remove video"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Video Info */}
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-green-900">{videoFile.name}</p>
                <p className="text-sm text-green-700">
                  {formatFileSize(videoFile.size)} • Duration: {formatDuration(videoDuration)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Validation Loading */}
      {isValidating && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-blue-700">Validating video...</p>
        </div>
      )}
    </div>
  );
};

export default QuestionVideoSubmission;
