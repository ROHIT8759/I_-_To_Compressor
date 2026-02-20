import { z } from "zod";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  BLOCKED_EXTENSIONS,
  MAX_COMPRESSION_PERCENTAGE,
  MAX_FILE_SIZE_BYTES,
  MIN_COMPRESSION_PERCENTAGE,
} from "@/lib/constants";
import { getExtension } from "@/lib/utils";
import type { UploadedAsset } from "@/types/compression";

export const compressBodySchema = z.object({
  assets: z
    .array(
      z.object({
        publicId: z.string().min(1),
        secureUrl: z.string().url(),
        bytes: z.number().positive(),
        resourceType: z.enum(["image", "video", "raw"]),
        originalFilename: z.string().min(1),
        mimeType: z.string().min(1),
        extension: z.string().min(1),
        relativePath: z.string().min(1),
      }),
    )
    .min(1),
  compressionPercentage: z.number().min(MIN_COMPRESSION_PERCENTAGE).max(MAX_COMPRESSION_PERCENTAGE),
  userId: z.string().optional(),
});

export function validateIncomingFile(file: File) {
  const extension = getExtension(file.name);

  if (BLOCKED_EXTENSIONS.has(extension)) {
    return { valid: false, reason: "Executable files are not allowed." };
  }

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return { valid: false, reason: "Unsupported file extension." };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, reason: "Unsupported MIME type." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: "File exceeds 100 MB limit." };
  }

  return { valid: true, reason: null };
}

export function validateUploadedAsset(asset: UploadedAsset) {
  if (BLOCKED_EXTENSIONS.has(asset.extension)) return false;
  if (!ALLOWED_EXTENSIONS.has(asset.extension)) return false;
  if (!ALLOWED_MIME_TYPES.has(asset.mimeType)) return false;
  if (asset.bytes > MAX_FILE_SIZE_BYTES) return false;
  return true;
}
