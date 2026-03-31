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
        <div className="space-y-6">
            <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-dark-text-primary mb-3 flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Course Thumbnail
                </h4>
                <div className="border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-xl p-4 hover:border-[#304DB5] dark:hover:border-blue-500 transition-colors">
                    {thumbnailPreview ? (
                        <div className="relative">
                            <img
                                src={thumbnailPreview}
                                alt="Course thumbnail"
                                className="w-full h-40 object-cover rounded-lg"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    onClick={() => thumbnailInputRef.current?.click()}
                                    className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                                    title="Replace thumbnail"
                                    disabled={thumbnailUploading}
                                >
                                    <Upload className="w-4 h-4 text-slate-600 dark:text-dark-text-secondary" />
                                </button>
                                <button
                                    onClick={handleDeleteThumbnail}
                                    className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Delete thumbnail"
                                    disabled={thumbnailUploading}
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                            </div>
                            {thumbnailUploading && (
                                <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                    <p className="text-white text-sm">
                                        {thumbnailProgress?.percentage.toFixed(0)}% Uploading...
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => thumbnailInputRef.current?.click()}
                            className="w-full h-40 flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                            disabled={thumbnailUploading}
                        >
                            {thumbnailUploading ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-[#304DB5] animate-spin mb-2" />
                                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
                                        Uploading... {thumbnailProgress?.percentage.toFixed(0)}%
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">
                                        Click to upload thumbnail
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-gray-500">
                                        JPG, PNG, or WebP · Max 2MB · 16:9 recommended
                                    </p>
                                </>
                            )}
                        </button>
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
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{thumbnailError}</p>
                    )}
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-dark-text-primary mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Preview Video
                </h4>
                <div className="border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-xl p-4 hover:border-[#304DB5] dark:hover:border-blue-500 transition-colors">
                    {videoPreview ? (
                        <div className="relative">
                            <video
                                src={videoPreview}
                                controls
                                className="w-full rounded-lg"
                                poster={thumbnailUrl || undefined}
                            >
                                Your browser does not support the video tag.
                            </video>
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    onClick={() => videoInputRef.current?.click()}
                                    className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                                    title="Replace video"
                                    disabled={videoUploading}
                                >
                                    <Upload className="w-4 h-4 text-slate-600 dark:text-dark-text-secondary" />
                                </button>
                                <button
                                    onClick={handleDeleteVideo}
                                    className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Delete video"
                                    disabled={videoUploading}
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                            </div>
                            {videoUploading && (
                                <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                    <p className="text-white text-sm">
                                        {videoProgress?.percentage.toFixed(0)}% Uploading...
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full h-40 flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                            disabled={videoUploading}
                        >
                            {videoUploading ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-[#304DB5] animate-spin mb-2" />
                                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
                                        Uploading... {videoProgress?.percentage.toFixed(0)}%
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Play className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">
                                        Click to upload preview video
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-gray-500">
                                        MP4 · Max 100MB · Max 2 minutes
                                    </p>
                                </>
                            )}
                        </button>
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
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{videoError}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseMediaManager;