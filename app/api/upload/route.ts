import { NextRequest, NextResponse } from 'next/server';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { getSupabaseAdmin } from '@/lib/supabase';
import { ALLOWED_MIME_TYPES, BLOCKED_EXTENSIONS, MAX_FILE_SIZE, FILE_EXPIRY_HOURS } from '@/lib/constants';

export const maxDuration = 60; // Vercel function timeout in seconds
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ── Validation ────────────────────────────────────────────────────────────
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: `File type ".${ext}" is not allowed.` }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: `MIME type "${file.type}" is not supported.` }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds the 100 MB limit.' }, { status: 413 });
    }

    // ── Convert to Buffer ─────────────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Determine Cloudinary resource type ───────────────────────────────────
    let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
    if (file.type.startsWith('image/')) resourceType = 'image';
    else if (file.type.startsWith('video/')) resourceType = 'video';
    else resourceType = 'raw';

    // ── Upload to Cloudinary ──────────────────────────────────────────────────
    const uploaded = await uploadBufferToCloudinary(buffer, {
      folder: 'compraser/originals',
      resourceType,
    });

    // ── Store metadata in Supabase ────────────────────────────────────────────
    const supabase = getSupabaseAdmin();
    const expiresAt = new Date(Date.now() + FILE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    const { data, error: dbError } = await supabase
      .from('file_uploads')
      .insert({
        file_name: file.name,
        file_type: file.type,
        original_size: file.size,
        cloudinary_public_id: uploaded.publicId,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save file metadata.' }, { status: 500 });
    }

    return NextResponse.json({
      fileId: data.id,
      publicId: uploaded.publicId,
      originalSize: file.size,
      url: uploaded.secureUrl,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Internal server error during upload.' }, { status: 500 });
  }
}
