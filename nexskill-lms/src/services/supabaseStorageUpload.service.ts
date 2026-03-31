/**
 * Supabase Storage Upload Service
 * Handles course thumbnail and preview video uploads to Supabase Storage buckets.
 *
 * Buckets required (both set to Public in Supabase Dashboard):
 *   - course-thumbnails  → for course thumbnail images
 *   - course-previews    → for course preview videos
 */

import { supabase } from '../lib/supabaseClient';

export const THUMBNAIL_BUCKET = 'course-thumbnails';
export const VIDEO_BUCKET = 'course-previews';

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface StorageUploadResponse {
    url: string;  // Public URL of the uploaded file
    path: string; // Storage path used as the "public_id" for later deletion
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

export class SupabaseStorageUploadService {

    /**
     * Validate an image file (JPG, PNG, WebP · max 2MB)
     */
    static validateImageFile(file: File): { valid: boolean; error?: string } {
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Please select a valid image file (JPG, PNG, or WebP)' };
        }
        if (file.size > maxSize) {
            return { valid: false, error: 'Image file is too large. Maximum size is 2MB' };
        }
        if (file.size === 0) {
            return { valid: false, error: 'Image file is empty' };
        }
        return { valid: true };
    }

    /**
     * Validate a video file (MP4, MOV, WebM · max 100MB)
     */
    static validateVideoFile(file: File): { valid: boolean; error?: string } {
        const maxSize = 100 * 1024 * 1024; // 100MB
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

        if (!allowedTypes.includes(file.type) && !file.type.startsWith('video/')) {
            return { valid: false, error: 'Please select a valid video file (MP4, MOV, or WebM)' };
        }
        if (file.size > maxSize) {
            return { valid: false, error: 'Video file is too large. Maximum size is 100MB' };
        }
        if (file.size === 0) {
            return { valid: false, error: 'Video file is empty' };
        }
        return { valid: true };
    }

    /**
     * Get the duration of a video file in seconds
     */
    static getVideoDuration(file: File): Promise<number> {
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
    }

    /**
     * Upload a course thumbnail image to Supabase Storage.
     * Overwrites any existing thumbnail for the same course.
     *
     * @param file     - The image file to upload
     * @param courseId - The course ID (used to build the storage path)
     * @param onProgress - Optional progress callback
     */
    static async uploadThumbnail(
        file: File,
        courseId: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<StorageUploadResponse> {
        const validation = this.validateImageFile(file);
        if (!validation.valid) {
            throw new Error(validation.error || 'Invalid image file');
        }

        // Build a clean file extension
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `courses/${courseId}/thumbnail.${ext}`;

        return this._uploadToStorage(THUMBNAIL_BUCKET, path, file, onProgress);
    }

    /**
     * Upload a course preview video to Supabase Storage.
     * Overwrites any existing preview video for the same course.
     *
     * @param file     - The video file to upload
     * @param courseId - The course ID (used to build the storage path)
     * @param onProgress - Optional progress callback
     */
    static async uploadPreviewVideo(
        file: File,
        courseId: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<StorageUploadResponse> {
        const validation = this.validateVideoFile(file);
        if (!validation.valid) {
            throw new Error(validation.error || 'Invalid video file');
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
        const path = `courses/${courseId}/preview.${ext}`;

        return this._uploadToStorage(VIDEO_BUCKET, path, file, onProgress);
    }

    /**
     * Delete a file from Supabase Storage.
     *
     * @param bucket - Bucket name ('course-thumbnails' or 'course-previews')
     * @param path   - The storage path (previously returned as `path` from upload)
     */
    static async deleteFile(bucket: string, path: string): Promise<void> {
        if (!path) return;

        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) {
            // Log but don't throw — DB cleanup should still proceed
            console.error(`[SupabaseStorage] Failed to delete ${bucket}/${path}:`, error.message);
        }
    }

    /**
     * Get the public URL of a stored file without fetching the file itself.
     */
    static getPublicUrl(bucket: string, path: string): string {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    /**
     * Core upload handler — uses XHR so we can report progress,
     * since the Supabase JS SDK doesn't expose upload progress natively.
     */
    private static async _uploadToStorage(
        bucket: string,
        path: string,
        file: File,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<StorageUploadResponse> {
        // Build the upload URL for the Supabase storage REST API
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const anonKey = (
            import.meta.env.VITE_SUPABASE_ANON_KEY ||
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
        ) as string;

        if (!supabaseUrl || !anonKey) {
            throw new Error('Supabase URL or key not configured');
        }

        // Use upsert so re-uploading overwrites existing file
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            if (onProgress && xhr.upload) {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        onProgress({
                            loaded: event.loaded,
                            total: event.total,
                            percentage: (event.loaded / event.total) * 100,
                        });
                    }
                });
            }

            xhr.open('POST', uploadUrl);
            xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`);
            xhr.setRequestHeader('Content-Type', file.type);
            // x-upsert: true → replaces the file if it already exists
            xhr.setRequestHeader('x-upsert', 'true');

            xhr.onload = () => {
                if (xhr.status === 200) {
                    // Build the public URL
                    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
                    resolve({ url: publicUrl, path });
                } else {
                    try {
                        const err = JSON.parse(xhr.responseText);
                        reject(new Error(err.message || err.error || 'Upload failed'));
                    } catch {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                }
            };

            xhr.onerror = () => {
                reject(new Error('Network error during upload'));
            };

            xhr.send(file);
        });
    }
}
