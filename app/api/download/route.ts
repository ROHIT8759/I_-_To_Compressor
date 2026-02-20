import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import cloudinary from '@/lib/cloudinary';
import { getSupabaseAdmin } from '@/lib/supabase';

export const maxDuration = 120;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fileIds } = body as { fileIds: string[] };

        if (!fileIds || fileIds.length === 0) {
            return NextResponse.json({ error: 'No file IDs provided.' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // ── Fetch records from Supabase ───────────────────────────────────────────
        const { data: records, error } = await supabase
            .from('file_uploads')
            .select('*')
            .in('id', fileIds);

        if (error || !records || records.length === 0) {
            return NextResponse.json({ error: 'File records not found.' }, { status: 404 });
        }

        // ── Build ZIP from compressed (or original) Cloudinary URLs ──────────────
        const zip = new JSZip();

        await Promise.all(
            records.map(async (record) => {
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
                    expires_at: Math.floor(Date.now() / 1000) + 600, // 10 min
                });

                const res = await fetch(signedUrl);
                if (!res.ok) throw new Error(`Failed to download ${record.file_name}`);
                const buffer = await res.arrayBuffer();

                const fileName = record.compressed_public_id
                    ? `compressed_${record.file_name}`
                    : record.file_name;

                zip.file(fileName, buffer);
            })
        );

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

        return new NextResponse(zipBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="compraser_files.zip"`,
                'Content-Length': String(zipBuffer.byteLength),
            },
        });
    } catch (err) {
        console.error('Download error:', err);
        return NextResponse.json({ error: 'Internal server error during download.' }, { status: 500 });
    }
}
