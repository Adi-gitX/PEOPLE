// File Upload Service
// This service handles file uploads to cloud storage
// In production, integrate with Cloudinary, AWS S3, or Firebase Storage

import { env } from '../config/index.js';

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
    // Production: Use Cloudinary
    // const cloudinary = require('cloudinary').v2;
    // cloudinary.config({
    //     cloud_name: env.CLOUDINARY_CLOUD_NAME,
    //     api_key: env.CLOUDINARY_API_KEY,
    //     api_secret: env.CLOUDINARY_API_SECRET,
    // });
    // 
    // const result = await cloudinary.uploader.upload(base64Data, {
    //     folder: options.folder || 'people-uploads',
    //     transformation: options.transformation,
    //     resource_type: 'image',
    // });
    // 
    // return {
    //     url: result.secure_url,
    //     publicId: result.public_id,
    //     format: result.format,
    //     width: result.width,
    //     height: result.height,
    //     size: result.bytes,
    // };

    // Demo: Generate placeholder URL
    const id = `img_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const placeholderUrl = `https://via.placeholder.com/400x400.png?text=${id}`;

    console.log('📷 Image upload (demo mode):', {
        folder: options.folder,
        transformation: options.transformation,
    });

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
    // Production: Use Cloudinary
    // const cloudinary = require('cloudinary').v2;
    // await cloudinary.uploader.destroy(publicId);

    console.log('🗑️ Image deleted (demo mode):', publicId);
    return true;
};

export const getOptimizedUrl = (
    url: string,
    options: { width?: number; height?: number; quality?: number } = {}
): string => {
    // Production: Transform Cloudinary URL
    // If using Cloudinary, replace URL with transformed version

    // Demo: Return original URL
    return url;
};
