import React, { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import type { MediaMetadata } from "../types/media.types";

interface MediaPreviewProps {
    url: string;
    resourceType: "image" | "video";
    alt?: string;
    caption?: string;
    metadata?: MediaMetadata;
    className?: string;
    lazy?: boolean;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
    url,
    resourceType,
    alt,
    caption,
    metadata,
    className = "",
    lazy = true,
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [videoError, setVideoError] = useState(false);

    if (!url || url === "https://example.com/media-url") {
        return null;
    }

    // Check if it's a YouTube video
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    let embedUrl = url;

    if (isYouTube && resourceType === "video") {
        if (url.includes("watch?v=")) {
            embedUrl = url.replace("watch?v=", "embed/");
        } else if (url.includes("youtu.be/")) {
            const videoId = url.split("youtu.be/")[1]?.split("?")[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
    }

    if (resourceType === "image") {
        return (
            <figure className={`my-6 ${className}`}>
                <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    {/* Loading Spinner */}
                    {!imageLoaded && !imageError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        </div>
                    )}

                    {/* Image */}
                    {!imageError ? (
                        <img
                            src={url}
                            alt={
                                alt ||
                                metadata?.original_filename ||
                                "Lesson image"
                            }
                            className={`w-full h-auto object-cover max-h-[600px] transition-opacity duration-300 ${
                                imageLoaded ? "opacity-100" : "opacity-0"
                            }`}
                            loading={lazy ? "lazy" : "eager"}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => {
                                setImageError(true);
                                setImageLoaded(true);
                            }}
                        />
                    ) : (
                        <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <div className="text-center">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Failed to load image
                                </p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                                    {url}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Metadata Overlay (optional) */}
                    {metadata && imageLoaded && !imageError && (
                        <div className="absolute bottom-0 right-0 px-2 py-1 bg-black/50 text-white text-xs rounded-tl-lg">
                            {metadata.width && metadata.height && (
                                <span>
                                    {metadata.width} × {metadata.height}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Caption */}
                {caption && (
                    <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                        {caption}
                    </figcaption>
                )}
            </figure>
        );
    }

    if (resourceType === "video") {
        return (
            <figure className={`my-6 ${className}`}>
                <div className="relative w-full rounded-xl overflow-hidden bg-black shadow-md aspect-video">
                    {isYouTube ? (
                        <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            title={alt || "Video player"}
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            loading={lazy ? "lazy" : "eager"}
                        />
                    ) : (
                        <>
                            {!videoError ? (
                                <video
                                    src={url}
                                    controls
                                    className="w-full h-full object-contain"
                                    preload={lazy ? "metadata" : "auto"}
                                    poster={metadata?.thumbnail_url}
                                    onError={() => setVideoError(true)}
                                >
                                    <track kind="captions" />
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                    <div className="text-center">
                                        <Play className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm">
                                            Failed to load video
                                        </p>
                                        <p className="text-gray-500 text-xs mt-1 px-4 break-all">
                                            {url}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Video Duration Overlay */}
                            {metadata?.duration && !videoError && (
                                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                                    {Math.floor(metadata.duration / 60)}:
                                    {String(
                                        Math.floor(metadata.duration % 60)
                                    ).padStart(2, "0")}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Caption */}
                {caption && (
                    <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                        {caption}
                    </figcaption>
                )}

                {/* Metadata Info */}
                {metadata && (
                    <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
                        {metadata.original_filename && (
                            <span className="mr-3">
                                {metadata.original_filename}
                            </span>
                        )}
                        {metadata.bytes && (
                            <span>
                                {(metadata.bytes / 1024 / 1024).toFixed(2)} MB
                            </span>
                        )}
                    </div>
                )}
            </figure>
        );
    }

    return null;
};

export default MediaPreview;
