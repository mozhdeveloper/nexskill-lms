export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    resource_type: "image" | "video" | "raw" | "auto";
    format: string;
    width?: number;
    height?: number;
    duration?: number;
    bytes: number;
    created_at: string;
    url: string;
    original_filename: string;
    thumbnail_url?: string;
}

export interface MediaMetadata {
    cloudinary_id: string;
    public_id: string;
    url: string;
    resource_type: "image" | "video";
    format: string;
    width?: number;
    height?: number;
    duration?: number; // Video duration in seconds
    thumbnail_url?: string;
    bytes?: number;
    original_filename?: string;
    // Video-specific fields
    bit_rate?: number;
    frame_rate?: number;
    codec?: string;
}

export interface CloudinaryUploadOptions {
    cloudName: string;
    uploadPreset: string;
    sources?: string[];
    multiple?: boolean;
    maxFiles?: number;
    resourceType?: "image" | "video" | "auto";
    maxFileSize?: number;
    maxImageWidth?: number;
    maxImageHeight?: number;
    maxVideoFileSize?: number;
    clientAllowedFormats?: string[];
    cropping?: boolean;
    croppingAspectRatio?: number;
    showSkipCropButton?: boolean;
    folder?: string;
    tags?: string[];
    context?: Record<string, string>;
}

export interface CloudinaryError {
    message: string;
    http_code?: number;
}

export interface CloudinaryUploadEvent {
    event:
        | "success"
        | "upload-added"
        | "queues-start"
        | "progress"
        | "upload-progress"
        | "abort"
        | "close";
    info?: CloudinaryUploadResult & { percent?: number };
}

export interface CloudinaryWidget {
    open: () => void;
    close: () => void;
    destroy: () => void;
    update: (options: Partial<CloudinaryUploadOptions>) => void;
}

declare global {
    interface Window {
        cloudinary?: {
            createUploadWidget: (
                options: CloudinaryUploadOptions,
                callback: (
                    error: CloudinaryError | null,
                    result: CloudinaryUploadEvent | null
                ) => void
            ) => CloudinaryWidget;
        };
    }
}

// Type guards for runtime validation
export function isMediaMetadata(obj: any): obj is MediaMetadata {
    return (
        obj &&
        typeof obj === "object" &&
        typeof obj.url === "string" &&
        typeof obj.public_id === "string" &&
        (obj.resource_type === "image" || obj.resource_type === "video") &&
        obj.url.length > 0 &&
        obj.public_id.length > 0 &&
        !obj.url.includes("undefined")
    );
}

export function isValidUrl(url?: string): boolean {
    return Boolean(
        url &&
            url !== "https://example.com/media-url" &&
            !url.includes("undefined") &&
            url.length > 0
    );
}

export function isCloudinaryUploadResult(
    obj: any
): obj is CloudinaryUploadResult {
    return (
        obj &&
        typeof obj === "object" &&
        typeof obj.public_id === "string" &&
        typeof obj.secure_url === "string" &&
        typeof obj.resource_type === "string" &&
        obj.public_id.length > 0 &&
        obj.secure_url.length > 0
    );
}
