import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({
    value,
    onChange,
    onUpload,
    placeholder = 'Click or drag to upload',
    className = '',
    aspectRatio = 'square', // 'square', 'landscape', 'portrait'
    maxSize = MAX_SIZE,
    disabled = false,
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(value || null);
    const inputRef = useRef(null);

    const aspectClasses = {
        square: 'aspect-square',
        landscape: 'aspect-video',
        portrait: 'aspect-[3/4]',
    };

    const handleFile = async (file) => {
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('Invalid file type. Please upload JPEG, PNG, or WebP.');
            return;
        }

        if (file.size > maxSize) {
            toast.error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target.result;
            setPreview(base64);

            if (onUpload) {
                setUploading(true);
                try {
                    const result = await onUpload(base64);
                    onChange?.(result.url || base64);
                    toast.success('Image uploaded successfully');
                } catch (error) {
                    toast.error('Upload failed. Please try again.');
                    setPreview(value || null);
                } finally {
                    setUploading(false);
                }
            } else {
                onChange?.(base64);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const handleClick = () => {
        if (!disabled && !uploading) {
            inputRef.current?.click();
        }
    };

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        setPreview(null);
        onChange?.(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`
                relative overflow-hidden rounded-lg border-2 border-dashed cursor-pointer transition-all
                ${aspectClasses[aspectRatio] || aspectClasses.square}
                ${isDragging ? 'border-white bg-white/10' : 'border-zinc-700 hover:border-zinc-600'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `}
        >
            <input
                ref={inputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled}
            />

            {preview ? (
                <>
                    <img
                        src={preview}
                        alt="Upload preview"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {!disabled && !uploading && (
                        <button
                            onClick={handleRemove}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white hover:bg-black transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400">
                    {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                        <>
                            <Upload className="w-8 h-8" />
                            <span className="text-sm text-center px-4">{placeholder}</span>
                            <span className="text-xs text-zinc-500">Max {maxSize / 1024 / 1024}MB</span>
                        </>
                    )}
                </div>
            )}

            {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
            )}
        </div>
    );
}

export function AvatarUploader({ value, onChange, onUpload, size = 'md', disabled = false }) {
    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
    };

    return (
        <ImageUploader
            value={value}
            onChange={onChange}
            onUpload={onUpload}
            className={`${sizeClasses[size]} rounded-full`}
            aspectRatio="square"
            placeholder="Add photo"
            disabled={disabled}
        />
    );
}
