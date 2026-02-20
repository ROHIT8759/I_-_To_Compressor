import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { getSupabaseAdmin } from '@/lib/supabase';

export const maxDuration = 120;
export const runtime = 'nodejs';

type FileRecord = {
  id: string;
  file_name: string;
  file_type: string;
  cloudinary_public_id: string;
  compressed_public_id: string | null;
};

async function getDownloadPayload(fileId: string): Promise<{
  fileName: string;
  fileType: string;
  signedUrl: string;
} | null> {
  const supabase = getSupabaseAdmin();
  const { data: record, error } = await supabase
    .from('file_uploads')
    .select('id, file_name, file_type, cloudinary_public_id, compressed_public_id')
    .eq('id', fileId)
    .maybeSingle<FileRecord>();

  if (error || !record) return null;

  const publicId = record.compressed_public_id ?? record.cloudinary_public_id;
  const resourceType = record.file_type?.startsWith('image/')
    ? 'image'
    : record.file_type?.startsWith('video/')
      ? 'video'
      : 'raw';

  const signedUrl = cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 600,
  });

  return {
    fileName: record.file_name,
    fileType: record.file_type,
    signedUrl,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileIds } = body as { fileIds: string[] };

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json({ error: 'No file IDs provided.' }, { status: 400 });
    }

    const files = fileIds.map((id) => ({
      id,
      url: `/api/download?fileId=${encodeURIComponent(id)}`,
    }));

    return NextResponse.json({ files });
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json({ error: 'Internal server error during download.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const fileId = req.nextUrl.searchParams.get('fileId');
    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required.' }, { status: 400 });
    }

    const payload = await getDownloadPayload(fileId);
    if (!payload) {
      return NextResponse.json({ error: 'File record not found.' }, { status: 404 });
    }

    const upstream = await fetch(payload.signedUrl);
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Failed to fetch file content.' }, { status: 502 });
    }

    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': payload.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${payload.fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Download stream error:', err);
    return NextResponse.json({ error: 'Internal server error during download.' }, { status: 500 });
  }
}
