import { useState, useCallback } from "react";
import { CloudinaryService } from "../services/cloudinary.service";
import type {
    MediaMetadata,
    CloudinaryWidget,
    CloudinaryError,
    CloudinaryUploadEvent,
} from "../types/media.types";
import {
    isCloudinaryUploadResult,
    isMediaMetadata,
} from "../types/media.types";

interface UseCloudinaryUploadReturn {
    uploadMedia: (
        resourceType: "image" | "video" | "auto"
    ) => Promise<MediaMetadata | null>;
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;
    clearError: () => void;
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleUploadCallback = useCallback(
        (
            uploadError: CloudinaryError | null,
            result: CloudinaryUploadEvent | null,
            cleanup: () => void,
            resolve: (value: MediaMetadata | null) => void
        ) => {
            if (uploadError) {
                console.error("Upload error:", uploadError);
                setError(
                    uploadError.message || "Upload failed. Please try again."
                );
                cleanup();
                resolve(null);
                return;
            }

            if (!result) {
                cleanup();
                resolve(null);
                return;
            }

            // Handle upload progress
            if (result.event === "upload-added") {
                setUploadProgress(10);
            } else if (result.event === "queues-start") {
                setUploadProgress(20);
            } else if (
                result.event === "progress" ||
                result.event === "upload-progress"
            ) {
                // Update progress based on upload percentage
                const progress = Math.min(
                    90,
                    20 + (result.info?.percent || 0) * 0.7
                );
                setUploadProgress(progress);
            } else if (result.event === "success") {
                setUploadProgress(100);

                try {
                    if (!result.info) {
                        throw new Error("Upload result missing info");
                    }

                    // Validate result structure using type guard
                    if (!isCloudinaryUploadResult(result.info)) {
                        throw new Error("Invalid upload result structure");
                    }

                    // Validate result has required fields
                    if (!result.info.secure_url || !result.info.public_id) {
                        throw new Error(
                            "Upload response missing required fields (secure_url or public_id)"
                        );
                    }

                    const metadata = CloudinaryService.convertToMediaMetadata(
                        result.info
                    );

                    // Validate generated metadata using type guard
                    if (!isMediaMetadata(metadata)) {
                        throw new Error(
                            "Invalid metadata generated from upload result"
                        );
                    }

                    cleanup();
                    resolve(metadata);
                } catch (conversionError) {
                    console.error(
                        "Error converting upload result:",
                        conversionError
                    );
                    setError("Failed to process upload result");
                    cleanup();
                    resolve(null);
                }
            } else if (result.event === "abort" || result.event === "close") {
                cleanup();
                resolve(null);
            }
        },
        []
    );

    const uploadMedia = useCallback(
        async (
            resourceType: "image" | "video" | "auto" = "auto"
        ): Promise<MediaMetadata | null> => {
            setIsUploading(true);
            setUploadProgress(0);
            setError(null);

            return new Promise((resolve) => {
                let widget: CloudinaryWidget | null = null;

                const cleanup = () => {
                    if (widget) {
                        widget.close();
                    }
                    setIsUploading(false);
                    setUploadProgress(0);
                };

                // Use video-specific widget for video uploads
                const widgetPromise =
                    resourceType === "video"
                        ? CloudinaryService.openUploadWidgetForVideo(
                              (
                                  uploadError: CloudinaryError | null,
                                  result: CloudinaryUploadEvent | null
                              ) => {
                                  handleUploadCallback(
                                      uploadError,
                                      result,
                                      cleanup,
                                      resolve
                                  );
                              }
                          )
                        : CloudinaryService.openUploadWidget(
                              {
                                  resourceType,
                                  maxFileSize:
                                      resourceType === "image"
                                          ? 10485760
                                          : 104857600, // 10MB for images, 100MB otherwise
                                  clientAllowedFormats:
                                      resourceType === "image"
                                          ? [
                                                "jpg",
                                                "jpeg",
                                                "png",
                                                "gif",
                                                "webp",
                                                "svg",
                                            ]
                                          : undefined,
                                  cropping: resourceType === "image",
                                  showSkipCropButton: true,
                                  multiple: false,
                                  maxFiles: 1,
                              },
                              (
                                  uploadError: CloudinaryError | null,
                                  result: CloudinaryUploadEvent | null
                              ) => {
                                  handleUploadCallback(
                                      uploadError,
                                      result,
                                      cleanup,
                                      resolve
                                  );
                              }
                          );

                widgetPromise.then((widgetInstance) => {
                    widget = widgetInstance;
                    if (widget) {
                        widget.open();
                    } else {
                        setError("Failed to initialize upload widget");
                        cleanup();
                        resolve(null);
                    }
                });
            });
        },
        [handleUploadCallback]
    );

    return {
        uploadMedia,
        isUploading,
        uploadProgress,
        error,
        clearError,
    };
}
