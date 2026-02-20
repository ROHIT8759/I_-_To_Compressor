/// <reference types="node" />
import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { getSupabaseAdmin } from '@/lib/supabase';
import { MAX_FILE_SIZE } from '@/lib/constants';
import sharp from 'sharp';

export const maxDuration = 120;
export const runtime = 'nodejs';

/**
 * Non-linear quality curve:
 * keeps quality higher in low-mid compression and drops faster near max compression.
 * Input compressionLevel: 10-90
 */
function mapCompressionLevelToImageQuality(compressionLevel: number) {
  const t = (compressionLevel - 10) / 80;
  const curved = Math.pow(Math.min(Math.max(t, 0), 1), 1.35);
  return Math.round(92 - 55 * curved); // ~92..37
}

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compresses images with format-aware settings that favor perceived quality.
 */
async function compressImage(buffer: Buffer, mimeType: string, quality: number): Promise<Buffer> {
  const base = sharp(buffer, { failOn: 'none' }).rotate();

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return base
      .jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
        chromaSubsampling: quality >= 78 ? '4:4:4' : '4:2:0',
      })
      .toBuffer();
  }

  if (mimeType === 'image/png') {
    return base
      .png({
        compressionLevel: 9,
        effort: 10,
        palette: true,
        quality,
      })
      .toBuffer();
  }

  if (mimeType === 'image/webp') {
    return base
      .webp({
        quality,
        effort: 6,
      })
      .toBuffer();
  }

  if (mimeType === 'image/gif') {
    return base.gif().toBuffer();
  }

  return base
    .webp({
      quality,
      effort: 6,
    })
    .toBuffer();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dbFileId, compressionLevel, publicId, fileType } = body as {
      dbFileId: string;
      compressionLevel: number;
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

    const { data: record, error: fetchError } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('id', dbFileId)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'File record not found.' }, { status: 404 });
    }
    if (record.original_size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `This file is too large to compress (${formatMb(record.original_size)}). Max supported size is ${formatMb(MAX_FILE_SIZE)}.`,
        },
        { status: 413 }
      );
    }

    const imageQuality = mapCompressionLevelToImageQuality(compressionLevel);

    let compressedBuffer: Buffer;
    let compressedResourceType: 'image' | 'video' | 'raw' = 'raw';
    const isImage = fileType?.startsWith('image/');

    if (isImage) {
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

    const compressed = await uploadBufferToCloudinary(compressedBuffer, {
      folder: 'compraser/compressed',
      resourceType: compressedResourceType,
    });

    const compressedSize = compressedBuffer.byteLength;
    const savedPercent = Math.round(((record.original_size - compressedSize) / record.original_size) * 100);

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
