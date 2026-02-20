import { NextResponse } from 'next/server';
import { deleteCloudinaryAsset } from '@/lib/cloudinary';
import { getSupabaseAdmin } from '@/lib/supabase';

export const maxDuration = 60;
export const runtime = 'nodejs';

/**
 * GET /api/cleanup
 * Deletes expired files from Cloudinary and removes rows from Supabase.
 * Should be called periodically (e.g., Vercel cron: every hour).
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // ── Find expired records ──────────────────────────────────────────────────
    const { data: expired, error } = await supabase
      .from('file_uploads')
      .select('id, cloudinary_public_id, compressed_public_id, file_type')
      .lt('expires_at', new Date().toISOString());

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch expired records.' }, { status: 500 });
    }

    if (!expired || expired.length === 0) {
      return NextResponse.json({ message: 'No expired files found.' });
    }

    // ── Delete from Cloudinary ────────────────────────────────────────────────
    const deletionResults = await Promise.allSettled(
      expired.flatMap((record) => {
        const resourceType = record.file_type?.startsWith('image/')
          ? 'image'
          : record.file_type?.startsWith('video/')
            ? 'video'
            : 'raw';

        const ops = [deleteCloudinaryAsset(record.cloudinary_public_id, resourceType)];
        if (record.compressed_public_id) {
          ops.push(deleteCloudinaryAsset(record.compressed_public_id, resourceType));
        }
        return ops;
      })
    );

    const failedDeletions = deletionResults.filter((r) => r.status === 'rejected');
    if (failedDeletions.length > 0) {
      console.warn(`${failedDeletions.length} Cloudinary deletions failed`);
    }

    // ── Delete Supabase rows ──────────────────────────────────────────────────
    const ids = expired.map((r) => r.id);
    const { error: deleteError } = await supabase.from('file_uploads').delete().in('id', ids);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Cloudinary cleanup done but Supabase delete failed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Cleaned up ${ids.length} expired file(s).`,
      deleted: ids,
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    return NextResponse.json({ error: 'Internal server error during cleanup.' }, { status: 500 });
  }
}
