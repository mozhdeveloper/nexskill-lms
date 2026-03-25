/**
 * Simple Cloudinary Video Upload Service
 * Uploads video directly to Cloudinary and returns the URL
 */

export interface CloudinaryUploadResponse {
    secure_url: string;
    public_id: string;
    resource_type: string;
    format: string;
    bytes: number;
    duration?: number;
    width?: number;
    height?: number;
    original_filename: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export class CloudinaryVideoUploadService {
    private static cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    private static uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    /**
     * Validate video file
     */
    static validateVideoFile(file: File): { valid: boolean; error?: string } {
        const maxSize = 100 * 1024 * 1024; // 100MB
        
        if (!file.type.startsWith('video/')) {
            return { valid: false, error: 'Please select a valid video file' };
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
     * Get video duration
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
     * Upload video to Cloudinary
     */
    static async uploadVideo(
        file: File,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<CloudinaryUploadResponse> {
        if (!this.cloudName) {
            throw new Error('Cloudinary cloud name not configured');
        }

        if (!this.uploadPreset) {
            throw new Error('Cloudinary upload preset not configured');
        }

        // Validate file
        const validation = this.validateVideoFile(file);
        if (!validation.valid) {
            throw new Error(validation.error || 'Invalid video file');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);
        formData.append('resource_type', 'video');
        formData.append('folder', 'nexskill-lms/lessons/videos');

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
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

            xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`);

            xhr.onload = () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response as CloudinaryUploadResponse);
                    } catch (error) {
                        reject(new Error('Failed to parse Cloudinary response'));
                    }
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        reject(new Error(errorResponse.error?.message || 'Upload failed'));
                    } catch {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                }
            };

            xhr.onerror = () => {
                reject(new Error('Network error during upload'));
            };

            xhr.send(formData);
        });
    }

    /**
     * Generate thumbnail URL
     */
    static generateThumbnailUrl(publicId: string, width = 400): string {
        if (!this.cloudName) return '';
        
        const cleanPublicId = publicId.replace(/\.(mp4|mov|avi|webm|mkv|flv|wmv)$/i, '');
        return `https://res.cloudinary.com/${this.cloudName}/video/upload/so_0/w_${width},c_fill,f_jpg,q_auto/${cleanPublicId}`;
    }
}
