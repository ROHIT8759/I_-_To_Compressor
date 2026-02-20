import { ALLOWED_MIME_TYPES, BLOCKED_EXTENSIONS, MAX_FILE_SIZE } from './constants';

/**
 * Human-readable file size string.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Estimate compressed size before actual compression.
 * compressionLevel: 10–90 (percentage to compress down to relative to original).
 */
export function estimateCompressedSize(originalSize: number, compressionLevel: number): number {
  // compressionLevel 90 → keep 10%, compressionLevel 10 → keep 90%
  const retainRatio = 1 - compressionLevel / 100;
  return Math.round(originalSize * retainRatio);
}

/**
 * Returns percentage saved (0–100).
 */
export function savedPercent(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

/**
 * Validates a File object against allowed types and size.
 * Returns null if valid, or an error message string.
 */
export function validateFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return `File type ".${ext}" is not allowed for security reasons.`;
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `File type "${file.type || ext}" is not supported.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File exceeds the 100 MB limit (${formatBytes(file.size)}).`;
  }
  return null;
}

/**
 * Returns a file type icon label based on MIME.
 */
export function fileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip') || mimeType.includes('7z') || mimeType.includes('rar')) return '🗜️';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📋';
  return '📁';
}

/**
 * Extracts the lowercase file extension without the leading dot.
 * e.g. "photo.JPG" → "jpg"
 */
export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * Normalises a relative file path coming from webkitRelativePath.
 * Converts backslashes, collapses double slashes, trims leading slash.
 */
export function sanitizeFilePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\//, '');
}

/** Alias kept for backward compat with cn() usage in workspace */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

