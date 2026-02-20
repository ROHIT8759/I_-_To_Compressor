export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB in bytes

export const FILE_EXPIRY_HOURS = 24;

/** Allowed MIME types – executable files are excluded */
export const ALLOWED_MIME_TYPES: string[] = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/tiff',
  'image/bmp',
  // Video
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
];

/** Blocked extensions (belt-and-suspenders over MIME type check) */
export const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.com', '.scr', '.vbs',
  '.js', '.ts', '.py', '.rb', '.php', '.pl', '.dmg', '.app', '.jar',
];

export const COMPRESSION_MIN = 10;
export const COMPRESSION_MAX = 90;
export const COMPRESSION_DEFAULT = 50;
