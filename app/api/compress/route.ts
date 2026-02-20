/// <reference types="node" />
import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { getSupabaseAdmin } from '@/lib/supabase';
import sharp from 'sharp';

export const maxDuration = 120;
export const runtime = 'nodejs';

/**
 * Compresses image buffers with Sharp.
 * quality is 0-100 where lower = more compression.
 */
async function compressImage(buffer: Buffer, mimeType: string, quality: number): Promise<Buffer> {
  const sharpInstance = sharp(buffer);

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return sharpInstance.jpeg({ quality }).toBuffer();
  }
  if (mimeType === 'image/png') {
    return sharpInstance.png({ compressionLevel: Math.round((100 - quality) / 11.1) }).toBuffer();
  }
  if (mimeType === 'image/webp') {
    return sharpInstance.webp({ quality }).toBuffer();
  }
  if (mimeType === 'image/gif') {
    return sharpInstance.gif().toBuffer();
  }
  // For other image types, convert to WebP
  return sharpInstance.webp({ quality }).toBuffer();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dbFileId, compressionLevel, publicId, fileType } = body as {
      dbFileId: string;
      compressionLevel: number; // 10 – 90
      publicId: string;
      fileType: string;
    };

    if (!dbFileId || !compressionLevel || !publicId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (compressionLevel < 10 || compressionLevel > 90) {
      return NextResponse.json({ error: 'compressionLevel must be between 10 and 90.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // ── Fetch original file from Supabase to validate ─────────────────────────
    const { data: record, error: fetchError } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('id', dbFileId)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'File record not found.' }, { status: 404 });
    }

    // ── Quality mapping: compressionLevel 10 → keep ~90%, 90 → keep ~10% ─────
    // quality for image encoders: 100 means best quality, we invert
    const imageQuality = Math.max(5, 100 - compressionLevel);

    let compressedBuffer: Buffer;
    let compressedResourceType: 'image' | 'video' | 'raw' = 'raw';
    const isImage = fileType?.startsWith('image/');

    if (isImage) {
      // Download original from Cloudinary
      const downloadUrl = cloudinary.url(publicId, {
        resource_type: 'image',
        type: 'authenticated',
        sign_url: true,
      });
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Failed to download original image from Cloudinary');
      const originalBuffer = Buffer.from(await res.arrayBuffer());

      compressedBuffer = await compressImage(originalBuffer, fileType, imageQuality);
      compressedResourceType = 'image';
    } else {
      // For non-image files (PDF, DOCX, ZIP, etc.):
      // Download and re-upload – true re-encoding requires format-specific libs.
      // For demo: re-upload original (future: add pdf-lib/ffmpeg for PDFs/video).
      const downloadUrl = cloudinary.url(publicId, {
        resource_type: fileType.startsWith('video/') ? 'video' : 'raw',
        type: 'authenticated',
        sign_url: true,
      });
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Failed to download file from Cloudinary');
      compressedBuffer = Buffer.from(await res.arrayBuffer());
      compressedResourceType = fileType.startsWith('video/') ? 'video' : 'raw';
    }

    // ── Upload compressed file to Cloudinary ─────────────────────────────────
    const compressed = await uploadBufferToCloudinary(compressedBuffer, {
      folder: 'compraser/compressed',
      resourceType: compressedResourceType,
    });

    const compressedSize = compressedBuffer.byteLength;
    const savedPercent = Math.round(
      ((record.original_size - compressedSize) / record.original_size) * 100
    );

    // ── Update Supabase record ────────────────────────────────────────────────
    await supabase
      .from('file_uploads')
      .update({
        compressed_size: compressedSize,
        compressed_public_id: compressed.publicId,
        download_url: compressed.secureUrl,
      })
      .eq('id', dbFileId);

    return NextResponse.json({
      compressedUrl: compressed.secureUrl,
      compressedSize,
      savedPercent,
    });
  } catch (err) {
    console.error('Compression error:', err);
    return NextResponse.json({ error: 'Internal server error during compression.' }, { status: 500 });
  }
}
