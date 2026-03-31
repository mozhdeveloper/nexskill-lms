import React, { useState, useRef, useEffect } from 'react';
import { Image, Video, Upload, Loader2, Play, Trash2 } from 'lucide-react';
import { SupabaseStorageUploadService } from '../../../services/supabaseStorageUpload.service';
import type { UploadProgress as SupabaseUploadProgress } from '../../../services/supabaseStorageUpload.service';
import { CloudinaryVideoUploadService } from '../../../services/cloudinaryVideoUpload.service';
import type { UploadProgress as CloudinaryUploadProgress } from '../../../services/cloudinaryVideoUpload.service';

interface CourseMediaManagerProps {
    courseId: string;
    thumbnailUrl?: string | null;
    thumbnailPublicId?: string | null;
    previewVideoUrl?: string | null;
    previewVideoPublicId?: string | null;
    onThumbnailUpload: (url: string, publicId: string) => Promise<void>;
    onVideoUpload: (url: string, publicId: string) => Promise<void>;
    onDeleteThumbnail: () => Promise<void>;
    onDeleteVideo: () => Promise<void>;
}

const CourseMediaManager: React.FC<CourseMediaManagerProps> = ({
    courseId,
    thumbnailUrl,
    thumbnailPublicId,
    previewVideoUrl,
    previewVideoPublicId,
    onThumbnailUpload,
    onVideoUpload,
    onDeleteThumbnail,
    onDeleteVideo,
}) => {
    const [thumbnailUploading, setThumbnailUploading] = useState(false);
    const [videoUploading, setVideoUploading] = useState(false);
    const [thumbnailProgress, setThumbnailProgress] = useState<SupabaseUploadProgress | null>(null);
    const [videoProgress, setVideoProgress] = useState<CloudinaryUploadProgress | null>(null);
    const [thumbnailError, setThumbnailError] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(thumbnailUrl || null);
    const [videoPreview, setVideoPreview] = useState<string | null>(previewVideoUrl || null);

    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const thumbnailObjectUrlRef = useRef<string | null>(null);
    const videoObjectUrlRef = useRef<string | null>(null);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (thumbnailObjectUrlRef.current) {
                URL.revokeObjectURL(thumbnailObjectUrlRef.current);
            }
            if (videoObjectUrlRef.current) {
                URL.revokeObjectURL(videoObjectUrlRef.current);
            }
        };
    }, []);

    const handleThumbnailSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setThumbnailError(null);

        // Validate image
        const validation = SupabaseStorageUploadService.validateImageFile(file);
        if (!validation.valid) {
            setThumbnailError(validation.error || 'Invalid image file');
            return;
        }

        // Revoke previous object URL to prevent memory leaks
        if (thumbnailObjectUrlRef.current) {
            URL.revokeObjectURL(thumbnailObjectUrlRef.current);
        }

        // Show local preview
        const localPreview = URL.createObjectURL(file);
        thumbnailObjectUrlRef.current = localPreview;
        setThumbnailPreview(localPreview);

        setThumbnailUploading(true);
        setThumbnailProgress(null);

        try {
            // Upload to Supabase Storage
            const response = await SupabaseStorageUploadService.uploadThumbnail(
                file,
                courseId,
                (progress) => setThumbnailProgress(progress)
            );

            // Save URL + storage path to database
            await onThumbnailUpload(response.url, response.path);

            // Update preview with Supabase public URL
            setThumbnailPreview(response.url);
            thumbnailObjectUrlRef.current = null;
        } catch (error: any) {
            console.error('Thumbnail upload error:', error);
            setThumbnailError(error.message || 'Failed to upload thumbnail');
            setThumbnailPreview(thumbnailUrl || null);
        } finally {
            setThumbnailUploading(false);
            setThumbnailProgress(null);
            if (thumbnailInputRef.current) {
                thumbnailInputRef.current.value = '';
            }
        }
    };

    const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setVideoError(null);

        // Validate video
        const validation = CloudinaryVideoUploadService.validateVideoFile(file);
        if (!validation.valid) {
            setVideoError(validation.error || 'Invalid video file');
            return;
        }

        // Check video duration (max 2 minutes)
        try {
            const duration = await CloudinaryVideoUploadService.getVideoDuration(file);
            if (duration > 120) {
                setVideoError('Video must be 2 minutes or less');
                return;
            }
        } catch (error) {
            setVideoError('Could not validate video duration');
            return;
        }

        // Revoke previous object URL to prevent memory leaks
        if (videoObjectUrlRef.current) {
            URL.revokeObjectURL(videoObjectUrlRef.current);
        }

        // Show local preview
        const localPreview = URL.createObjectURL(file);
        videoObjectUrlRef.current = localPreview;
        setVideoPreview(localPreview);

        setVideoUploading(true);
        setVideoProgress(null);

        try {
            // Upload to Cloudinary
            const response = await CloudinaryVideoUploadService.uploadVideo(
                file,
                (progress) => setVideoProgress(progress)
            );

            // Save URL + public_id to database
            await onVideoUpload(response.secure_url, response.public_id);

            // Update preview with Cloudinary URL
            setVideoPreview(response.secure_url);
            videoObjectUrlRef.current = null;
        } catch (error: any) {
            console.error('Video upload error:', error);
            setVideoError(error.message || 'Failed to upload preview video');
            setVideoPreview(previewVideoUrl || null);
        } finally {
            setVideoUploading(false);
            setVideoProgress(null);
            if (videoInputRef.current) {
                videoInputRef.current.value = '';
            }
        }
    };

    const handleDeleteThumbnail = async () => {
        if (!thumbnailUrl) return;
        
        if (window.confirm('Are you sure you want to delete the course thumbnail?')) {
            try {
                await onDeleteThumbnail();
                setThumbnailPreview(null);
                setThumbnailError(null);
            } catch (error) {
                console.error('Error deleting thumbnail:', error);
                setThumbnailError('Failed to delete thumbnail');
            }
        }
    };

    const handleDeleteVideo = async () => {
        if (!previewVideoUrl) return;
        
        if (window.confirm('Are you sure you want to delete the preview video? This action cannot be undone.')) {
            try {
                await onDeleteVideo();
                setVideoPreview(null);
                setVideoError(null);
            } catch (error) {
                console.error('Error deleting video:', error);
                setVideoError('Failed to delete video');
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Course Thumbnail */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-dark-text-secondary mb-1">
                    Course Thumbnail
                </label>
                {thumbnailPreview ? (
                    <div className="relative inline-block border border-slate-200 dark:border-gray-700 rounded-md overflow-hidden">
                        <div className="relative" style={{ maxWidth: '530px' }}>
                            <img
                                src={thumbnailPreview}
                                alt="Course thumbnail"
                                className="w-full h-auto object-cover"
                                style={{ aspectRatio: '16/9' }}
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                    onClick={() => thumbnailInputRef.current?.click()}
                                    className="p-1 bg-white dark:bg-gray-800 rounded shadow-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                                    title="Replace thumbnail"
                                    disabled={thumbnailUploading}
                                >
                                    <Upload className="w-3 h-3 text-slate-600 dark:text-dark-text-secondary" />
                                </button>
                                <button
                                    onClick={handleDeleteThumbnail}
                                    className="p-1 bg-white dark:bg-gray-800 rounded shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Delete thumbnail"
                                    disabled={thumbnailUploading}
                                >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                </button>
                            </div>
                            {thumbnailUploading && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                    <Loader2 className="w-4 h-4 text-white animate-spin mb-0.5" />
                                    <p className="text-white text-[10px]">
                                        {thumbnailProgress?.percentage.toFixed(0)}%
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-200 dark:border-gray-700 rounded-md overflow-hidden">
                        <div className="flex items-center gap-3 p-2">
                            <div className="flex-shrink-0 w-24 h-16 bg-slate-100 dark:bg-gray-800 rounded flex items-center justify-center">
                                <Image className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-600 dark:text-dark-text-secondary mb-1">
                                    Upload your course image here. It must meet our course image quality standards to be accepted.
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-gray-500 mb-2">
                                    Important guidelines: 750x422 pixels; jpg, jpeg, gif, or .png. no text on the image.
                                </p>
                                <button
                                    onClick={() => thumbnailInputRef.current?.click()}
                                    className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded text-xs text-slate-700 dark:text-dark-text-secondary hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                                    disabled={thumbnailUploading}
                                >
                                    {thumbnailUploading ? 'Uploading...' : 'Upload File'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                    disabled={thumbnailUploading}
                />
                {thumbnailError && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{thumbnailError}</p>
                )}
            </div>

            {/* Promotional Video */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-dark-text-secondary mb-1">
                    Promotional Video
                </label>
                {videoPreview ? (
                    <div className="relative inline-block border border-slate-200 dark:border-gray-700 rounded-md overflow-hidden">
                        <div className="relative" style={{ maxWidth: '530px' }}>
                            <video
                                src={videoPreview}
                                controls
                                className="w-full h-auto"
                                style={{ aspectRatio: '16/9' }}
                                poster={thumbnailUrl || undefined}
                            >
                                Your browser does not support the video tag.
                            </video>
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                    onClick={() => videoInputRef.current?.click()}
                                    className="p-1 bg-white dark:bg-gray-800 rounded shadow-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                                    title="Replace video"
                                    disabled={videoUploading}
                                >
                                    <Upload className="w-3 h-3 text-slate-600 dark:text-dark-text-secondary" />
                                </button>
                                <button
                                    onClick={handleDeleteVideo}
                                    className="p-1 bg-white dark:bg-gray-800 rounded shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Delete video"
                                    disabled={videoUploading}
                                >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                </button>
                            </div>
                            {videoUploading && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                    <Loader2 className="w-4 h-4 text-white animate-spin mb-0.5" />
                                    <p className="text-white text-[10px]">
                                        {videoProgress?.percentage.toFixed(0)}%
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border border-slate-200 dark:border-gray-700 rounded-md overflow-hidden">
                        <div className="p-3">
                            <p className="text-xs text-slate-600 dark:text-dark-text-secondary mb-2">
                                Your promo video is a quick and compelling way for students to preview what they'll learn in your course. Students considering your course are more likely to enroll if your promo video is well-made.
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-24 h-16 bg-slate-100 dark:bg-gray-800 rounded flex items-center justify-center">
                                    <Video className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="flex-1">
                                    <button
                                        onClick={() => videoInputRef.current?.click()}
                                        className="px-2 py-1 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded text-xs text-slate-700 dark:text-dark-text-secondary hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                                        disabled={videoUploading}
                                    >
                                        {videoUploading ? 'Uploading...' : 'Upload File'}
                                    </button>
                                    <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">
                                        MP4 · Max 100MB · Max 2 minutes
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={handleVideoSelect}
                    className="hidden"
                    disabled={videoUploading}
                />
                {videoError && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{videoError}</p>
                )}
            </div>
        </div>
    );
};

export default CourseMediaManager;