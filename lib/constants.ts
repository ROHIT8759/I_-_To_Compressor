export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB in bytes
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE; // alias used by validation & workspace

export const FILE_EXPIRY_HOURS = 24;

/** Allowed MIME types – executable files are excluded */
export const ALLOWED_MIME_TYPES = new Set<string>([
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
]);

/** Extensions that map to ALLOWED_MIME_TYPES */
export const ALLOWED_EXTENSIONS = new Set<string>([
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'tiff', 'tif', 'bmp',
  // Video
  'mp4', 'mpeg', 'mpg', 'mov', 'webm', 'avi',
  // Audio
  'mp3', 'wav', 'ogg', 'flac',
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv',
  // Archives
  'zip', 'tar', 'gz', '7z', 'rar',
]);

/** Blocked extensions (belt-and-suspenders over MIME type check) */
export const BLOCKED_EXTENSIONS = new Set<string>([
  'exe', 'bat', 'cmd', 'sh', 'ps1', 'msi', 'com', 'scr', 'vbs',
  'js', 'ts', 'py', 'rb', 'php', 'pl', 'dmg', 'app', 'jar',
]);

export const COMPRESSION_MIN = 10;
export const COMPRESSION_MAX = 90;
export const COMPRESSION_DEFAULT = 50;

// Aliases used by validation.ts and upload-workspace.tsx
export const MIN_COMPRESSION_PERCENTAGE = COMPRESSION_MIN;
export const MAX_COMPRESSION_PERCENTAGE = COMPRESSION_MAX;
export const DEFAULT_COMPRESSION_PERCENTAGE = COMPRESSION_DEFAULT;
