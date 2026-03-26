import React, { useState, useRef, useCallback } from "react";
import { Video, Link, Upload, Trash2, ExternalLink, Check, AlertCircle } from "lucide-react";
import { CloudinaryVideoUploadService } from "../../../services/cloudinaryVideoUpload.service";
import { supabase } from "../../../lib/supabaseClient";
import type { LessonContentBlock } from "../../../types/lesson";

interface VideoBlockEditorProps {
    block: LessonContentBlock;
    onChange: (block: LessonContentBlock) => void;
    lessonId?: string;
}

type VideoSourceType = "link" | "upload";

const VideoBlockEditor: React.FC<VideoBlockEditorProps> = ({
    block,
    onChange,
    lessonId,
}) => {
    const [sourceType, setSourceType] = useState<VideoSourceType>(
        block.attributes?.is_external || block.attributes?.external_url ? "link" : "upload"
    );
    const [videoUrl, setVideoUrl] = useState<string>(
        block.attributes?.external_url || block.attributes?.source_url || block.content || ""
    );
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadedVideoPreview, setUploadedVideoPreview] = useState<string | null>(null);
    const [uploadedMetadata, setUploadedMetadata] = useState<any>(null);
    const [isFetchingDuration, setIsFetchingDuration] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load existing video metadata from block
    React.useEffect(() => {
        if (block.attributes?.media_metadata) {
            setUploadedMetadata(block.attributes.media_metadata);
            setUploadedVideoPreview(block.content || null);
        }
    }, [block.attributes?.media_metadata, block.content]);

    // Fetch YouTube video duration using YouTube Data API v3
    const fetchYouTubeDuration = useCallback(async (url: string): Promise<number | null> => {
        const videoId = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
        if (!videoId) {
            console.log('[VideoBlockEditor] No valid YouTube video ID found in URL:', url);
            return null;
        }

        try {
            setIsFetchingDuration(true);
            
            // Get API key from environment variable
            const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
            
            console.log('[VideoBlockEditor] Fetching duration for video ID:', videoId);
            console.log('[VideoBlockEditor] API key present:', !!apiKey);
            
            if (!apiKey) {
                console.warn('[VideoBlockEditor] YouTube API key not configured. Add VITE_YOUTUBE_API_KEY to .env.local');
                return null;
            }

            // Fetch video details from YouTube Data API v3
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`
            );
            
            console.log('[VideoBlockEditor] API response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[VideoBlockEditor] YouTube API error:', errorData);
                return null;
            }
            
            const data = await response.json();
            console.log('[VideoBlockEditor] YouTube API response:', data);
            
            if (!data.items || data.items.length === 0) {
                console.log('[VideoBlockEditor] Video not found or private');
                return null;
            }

            // Parse ISO 8601 duration (e.g., "PT2M45S" = 2 minutes 45 seconds)
            const isoDuration = data.items[0].contentDetails.duration;
            const duration = parseISODuration(isoDuration);
            
            console.log('[VideoBlockEditor] Parsed duration:', duration, 'seconds from ISO:', isoDuration);
            return duration;
        } catch (err) {
            console.error('[VideoBlockEditor] Error fetching YouTube duration:', err);
            return null;
        } finally {
            setIsFetchingDuration(false);
        }
    }, []);

    // Parse ISO 8601 duration format (PT1H2M10S = 1 hour 2 minutes 10 seconds)
    const parseISODuration = (isoDuration: string): number => {
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;

        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2] || '0', 10);
        const seconds = parseInt(match[3] || '0', 10);

        return (hours * 3600) + (minutes * 60) + seconds;
    };

    const handleSourceTypeChange = (type: VideoSourceType) => {
        setSourceType(type);
        setUploadError(null);
        if (type === "link") {
            onChange({
                ...block,
                content: block.attributes?.external_url || block.attributes?.source_url || "",
                attributes: {
                    ...block.attributes,
                    media_metadata: undefined,
                    is_external: true,
                    external_url: block.attributes?.external_url || block.attributes?.source_url || "",
                    source_url: undefined,
                },
            });
        } else {
            onChange({
                ...block,
                content: block.attributes?.media_metadata?.secure_url || block.content || "",
                attributes: {
                    ...block.attributes,
                    is_external: false,
                    external_url: undefined,
                },
            });
        }
    };

    const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        console.log('[VideoBlockEditor] handleUrlChange called with URL:', newUrl);
        setVideoUrl(newUrl);
        
        // Start with basic update (without duration)
        const baseUpdate = {
            ...block,
            content: newUrl,
            attributes: {
                ...block.attributes,
                is_external: true,
                external_url: newUrl,
                source_url: undefined,
                media_metadata: undefined,
            },
        };
        
        // Fetch duration if it's a YouTube URL
        if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be')) {
            const duration = await fetchYouTubeDuration(newUrl);
            
            if (duration) {
                // Update with duration once fetched
                onChange({
                    ...baseUpdate,
                    attributes: {
                        ...baseUpdate.attributes,
                        media_metadata: {
                            duration,
                            thumbnail_url: `https://img.youtube.com/vi/${newUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1]}/maxresdefault.jpg`,
                        },
                    },
                });
                return;
            }
        }
        
        // No duration found, save without it
        onChange(baseUpdate);
    };

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file
        const validation = CloudinaryVideoUploadService.validateVideoFile(file);
        if (!validation.valid) {
            setUploadError(validation.error || "Invalid video file");
            return;
        }

        setUploadError(null);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Get video duration
            const duration = await CloudinaryVideoUploadService.getVideoDuration(file);

            // Upload to Cloudinary
            const response = await CloudinaryVideoUploadService.uploadVideo(file, (progress) => {
                setUploadProgress(progress.percentage);
            });

            setUploadProgress(100);
            setUploadedVideoPreview(response.secure_url);
            
            const metadata = {
                cloudinary_id: response.public_id,
                public_id: response.public_id,
                secure_url: response.secure_url,
                source_url: response.secure_url,
                resource_type: "video",
                format: response.format,
                bytes: response.bytes,
                original_filename: response.original_filename || file.name,
                width: response.width,
                height: response.height,
                duration: response.duration || duration,
                thumbnail_url: CloudinaryVideoUploadService.generateThumbnailUrl(response.public_id),
            };
            
            setUploadedMetadata(metadata);

            // Update block with uploaded video
            const updatedBlock = {
                ...block,
                content: response.secure_url,
                attributes: {
                    ...block.attributes,
                    is_external: false,
                    external_url: undefined,
                    source_url: response.secure_url,
                    media_metadata: metadata,
                },
            };
            onChange(updatedBlock);

            // Save to Supabase if lessonId is provided
            if (lessonId) {
                try {
                    const { error } = await supabase
                        .from('lessons')
                        .update({
                            content_blocks: [updatedBlock],
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', lessonId);

                    if (error) {
                        console.error('Error saving to Supabase:', error);
                    }
                } catch (dbError) {
                    console.error('Database error:', dbError);
                }
            }

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("Video upload error:", error);
            setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
            setUploadProgress(0);
        } finally {
            setIsUploading(false);
        }
    }, [block, onChange, lessonId]);

    const handleRemoveVideo = () => {
        onChange({
            ...block,
            content: "",
            attributes: {
                ...block.attributes,
                is_external: undefined,
                external_url: undefined,
                source_url: undefined,
                media_metadata: undefined,
                caption: undefined,
            },
        });
        setVideoUrl("");
        setUploadedVideoPreview(null);
        setUploadedMetadata(null);
        setUploadError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleReupload = () => {
        setUploadedVideoPreview(null);
        setUploadedMetadata(null);
        setUploadError(null);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const isYouTubeUrl = (url: string): boolean => {
        return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)/.test(url);
    };

    const isVimeoUrl = (url: string): boolean => {
        return /vimeo\.com\/(?:channels\/(?:\w+\/)?|[\w]+\/|groups\/[\w]+\/videos\/|album\/\d+\/video\/|video\/|)(\d+)(?:[?=&].*)?/.test(url);
    };

    const getVideoPreview = () => {
        if (block.attributes?.is_external && block.content) {
            if (isYouTubeUrl(block.content)) {
                const videoId = block.content.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
                if (videoId) {
                    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                }
            }
            if (isVimeoUrl(block.content)) {
                const videoId = block.content.match(/vimeo\.com\/(?:.*\/)?(\d+)/)?.[1];
                if (videoId) {
                    return `https://vumbnail.com/${videoId}.jpg`;
                }
            }
        }

        if (block.attributes?.media_metadata?.thumbnail_url) {
            return block.attributes.media_metadata.thumbnail_url;
        }

        return null;
    };

    const hasVideo = !!block.content;
    const videoPreviewUrl = getVideoPreview();

    return (
        <div className="space-y-4">
            {/* Source Type Toggle */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg w-fit">
                <button
                    type="button"
                    onClick={() => handleSourceTypeChange("link")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        sourceType === "link"
                            ? "bg-white dark:bg-slate-700 text-[#304DB5] shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                >
                    <Link className="w-4 h-4" />
                    Video Link
                </button>
                <button
                    type="button"
                    onClick={() => handleSourceTypeChange("upload")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        sourceType === "upload"
                            ? "bg-white dark:bg-slate-700 text-[#304DB5] shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                >
                    <Upload className="w-4 h-4" />
                    Upload Video
                </button>
            </div>

            {/* Error Display */}
            {uploadError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
                        <button
                            type="button"
                            onClick={() => setUploadError(null)}
                            className="text-xs text-red-500 hover:text-red-700 mt-1"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {!hasVideo ? (
                sourceType === "link" ? (
                    <div className="space-y-3">
                        <div className="relative">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={videoUrl}
                                onChange={handleUrlChange}
                                placeholder="Paste YouTube, Vimeo, or external video URL..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-[#304DB5] focus:border-transparent transition-all"
                            />
                        </div>
                        {videoUrl && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <ExternalLink className="w-3 h-3" />
                                <span>
                                    {isYouTubeUrl(videoUrl)
                                        ? "YouTube video detected"
                                        : isVimeoUrl(videoUrl)
                                        ? "Vimeo video detected"
                                        : "External video URL"}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* File Upload Area */}
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 transition-all hover:border-[#304DB5] dark:hover:border-[#5E7BFF] hover:bg-gray-50 dark:hover:bg-slate-800">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                                className="hidden"
                            />

                            <div className="flex flex-col items-center justify-center gap-3">
                                {isUploading ? (
                                    <>
                                        <div className="w-12 h-12 border-4 border-[#304DB5] border-t-transparent rounded-full animate-spin" />
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Uploading video...
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {Math.round(uploadProgress)}% complete
                                            </p>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-[#304DB5]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Click to upload video from your computer
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                MP4, MOV, AVI, WebM (max 100MB)
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="mt-2 px-6 py-2 bg-[#304DB5] hover:bg-[#2540a3] text-white rounded-lg font-medium transition-colors"
                                        >
                                            Choose Video File
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Upload Info */}
                        {!isUploading && (
                            <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p>Video will be uploaded to Cloudinary and URL saved to database</p>
                                    <p className="mt-1">Supported formats: MP4, MOV, AVI, WebM, MKV, FLV, WMV</p>
                                </div>
                            </div>
                        )}
                    </div>
                )
            ) : (
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="aspect-video bg-gray-100 dark:bg-slate-900 relative">
                        {videoPreviewUrl ? (
                            <img
                                src={videoPreviewUrl}
                                alt="Video thumbnail"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/640x360?text=Video+Preview";
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-12 h-12 text-gray-400" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Video className="w-16 h-16 text-white" />
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {uploadedMetadata?.original_filename ||
                                    block.attributes?.external_url ||
                                    block.attributes?.source_url ||
                                    "Video"}
                            </p>
                            {uploadedMetadata && (
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {uploadedMetadata.duration
                                            ? `${Math.floor(uploadedMetadata.duration / 60)}:${String(
                                                  Math.floor(uploadedMetadata.duration % 60)
                                              ).padStart(2, "0")}`
                                            : "Video uploaded"}
                                    </p>
                                    {uploadedMetadata.bytes && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {(uploadedMetadata.bytes / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    )}
                                </div>
                            )}
                            {block.attributes?.is_external && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    External video
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {sourceType === "upload" && uploadedVideoPreview && (
                                <button
                                    type="button"
                                    onClick={handleReupload}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Upload different video"
                                >
                                    <Upload className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleRemoveVideo}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Remove video"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoBlockEditor;
