export type CompressionState = 'idle' | 'uploading' | 'uploaded' | 'compressing' | 'done' | 'error';

export interface UploadedFile {
    id: string;           // Local client id for UI state
    dbFileId?: string;    // Supabase file_uploads.id
    file: File;           // Original browser File object
    name: string;
    size: number;         // original bytes
    type: string;
    cloudinaryPublicId: string;
    cloudinaryUrl: string;
    status: 'pending' | 'uploading' | 'uploaded' | 'compressing' | 'compressed' | 'error';
    progress: number;     // 0 – 100
    compressedSize?: number;
    compressedUrl?: string;
    error?: string;
}

export interface CompressionResult {
    fileId: string;
    compressedUrl: string;
    compressedSize: number;
    savedPercent: number;
}

export interface FileMetadata {
    id: string;
    user_id?: string;
    file_name: string;
    file_type: string;
    original_size: number;
    compressed_size?: number;
    cloudinary_public_id: string;
    compressed_public_id?: string;
    download_url?: string;
    expires_at: string;
    created_at: string;
}

export interface UploadApiResponse {
    fileId: string;
    publicId: string;
    originalSize: number;
    url: string;
    error?: string;
}

export interface CompressApiResponse {
    compressedUrl: string;
    compressedSize: number;
    savedPercent: number;
    error?: string;
}
