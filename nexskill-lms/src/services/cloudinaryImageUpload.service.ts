/**
 * Cloudinary Image Upload Service for Thumbnails
 */

export interface CloudinaryImageUploadResponse {
    secure_url: string;
    public_id: string;
    resource_type: string;
    format: string;
    bytes: number;
    width?: number;
    height?: number;
    original_filename: string;
    created_at?: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export class CloudinaryImageUploadService {
    private static cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    private static uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    /**
     * Validate image file
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
     * Upload image to Cloudinary
     */
    static async uploadImage(
        file: File,
        folder: string,
        onProgress?: (progress: UploadProgress) => void
    ): Promise<CloudinaryImageUploadResponse> {
        if (!this.cloudName) {
            throw new Error('Cloudinary cloud name not configured');
        }

        if (!this.uploadPreset) {
            throw new Error('Cloudinary upload preset not configured');
        }

        // Validate file
        const validation = this.validateImageFile(file);
        if (!validation.valid) {
            throw new Error(validation.error || 'Invalid image file');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);
        formData.append('resource_type', 'image');
        formData.append('folder', folder);

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

            xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`);

            xhr.onload = () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response as CloudinaryImageUploadResponse);
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
}