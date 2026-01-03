// File Upload Service
// Supports Cloudinary (production) with fallback to demo mode

export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

export interface UploadResult {
    url: string;
    publicId: string;
    format: string;
    width?: number;
    height?: number;
    size: number;
}

export interface UploadOptions {
    folder?: string;
    maxSize?: number;
    allowedTypes?: AllowedMimeType[];
    transformation?: {
        width?: number;
        height?: number;
        crop?: 'fill' | 'fit' | 'scale';
    };
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES: AllowedMimeType[] = ['image/jpeg', 'image/png', 'image/webp'];

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

export const validateFile = (
    file: { mimetype: string; size: number },
    options: UploadOptions = {}
): { valid: boolean; error?: string } => {
    const maxSize = options.maxSize || DEFAULT_MAX_SIZE;
    const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_TYPES;

    if (file.size > maxSize) {
        return { valid: false, error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` };
    }

    if (!allowedTypes.includes(file.mimetype as AllowedMimeType)) {
        return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
    }

    return { valid: true };
};

export const uploadImage = async (
    base64Data: string,
    options: UploadOptions = {}
): Promise<UploadResult> => {
    // Use Cloudinary if configured and installed
    if (isCloudinaryConfigured()) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const cloudinaryModule = require('cloudinary');
            const cloudinary = cloudinaryModule.v2;

            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });

            const uploadOptions: Record<string, unknown> = {
                folder: options.folder || 'people-uploads',
                resource_type: 'image',
            };

            if (options.transformation) {
                uploadOptions.transformation = [
                    {
                        width: options.transformation.width,
                        height: options.transformation.height,
                        crop: options.transformation.crop || 'fill',
                    },
                ];
            }

            const result = await cloudinary.uploader.upload(base64Data, uploadOptions);

            return {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                size: result.bytes,
            };
        } catch (error) {
            console.error('Cloudinary upload failed (is cloudinary installed?):', error);
            // Fall through to demo mode
        }
    }

    const id = `img_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const placeholderUrl = `https://via.placeholder.com/400x400.png?text=Demo`;

    return {
        url: placeholderUrl,
        publicId: id,
        format: 'png',
        width: 400,
        height: 400,
        size: base64Data.length,
    };
};

export const deleteImage = async (publicId: string): Promise<boolean> => {
    if (isCloudinaryConfigured()) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const cloudinaryModule = require('cloudinary');
            const cloudinary = cloudinaryModule.v2;
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });
            await cloudinary.uploader.destroy(publicId);
            return true;
        } catch (error) {
            console.error('Cloudinary delete failed:', error);
            return false;
        }
    }

    return true;
};

export const getOptimizedUrl = (
    url: string,
    options: { width?: number; height?: number; quality?: number } = {}
): string => {
    if (url.includes('cloudinary.com')) {
        const transformations = [];
        if (options.width) transformations.push(`w_${options.width}`);
        if (options.height) transformations.push(`h_${options.height}`);
        if (options.quality) transformations.push(`q_${options.quality}`);

        if (transformations.length > 0) {
            return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
        }
    }

    return url;
};
