import React, { useState } from 'react';

interface VideoMeta {
  filename: string;
  duration: string;
  resolution?: string;
}

interface VideoUploadPanelProps {
  currentVideo?: VideoMeta;
  onChange: (video: VideoMeta) => void;
}

const VideoUploadPanel: React.FC<VideoUploadPanelProps> = ({ currentVideo, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate video upload
      const videoMeta: VideoMeta = {
        filename: file.name,
        duration: '12:34', // Dummy duration
        resolution: '1920x1080',
      };
      onChange(videoMeta);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const videoMeta: VideoMeta = {
        filename: file.name,
        duration: '12:34',
        resolution: '1920x1080',
      };
      onChange(videoMeta);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary mb-4">Lesson video</h3>
      
      {!currentVideo ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
            isDragging
              ? 'border-[#5E7BFF] bg-blue-50'
              : 'border-slate-300 dark:border-gray-600 hover:border-slate-400'
          }`}
        >
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-center">
            <div className="text-4xl mb-4">🎬</div>
            <p className="text-lg font-semibold text-slate-900 dark:text-dark-text-primary mb-2">
              Drag & drop or click to upload
            </p>
            <p className="text-sm text-slate-600">
              Supports MP4, MOV, AVI (max 2GB)
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-6 border border-slate-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🎬</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-dark-text-primary mb-1">{currentVideo.filename}</p>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>Duration: {currentVideo.duration}</span>
                {currentVideo.resolution && <span>Resolution: {currentVideo.resolution}</span>}
              </div>
            </div>
            <button
              onClick={() => onChange({ filename: '', duration: '' })}
              className="text-slate-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] rounded-full" style={{ width: '100%' }} />
            </div>
            <p className="text-xs text-slate-600 dark:text-dark-text-secondary mt-2">Upload complete</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadPanel;
