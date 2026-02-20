-- ================================================================
-- Compraser – Supabase Schema
-- Run this in your Supabase SQL editor.
-- ================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── file_uploads table ───────────────────────────────────────────────────────
create table if not exists file_uploads (
  id                   uuid primary key default gen_random_uuid(),
  user_id              text,                        -- optional: for future auth
  file_name            text          not null,
  file_type            text          not null,
  original_size        bigint        not null,
  compressed_size      bigint,
  cloudinary_public_id text          not null,
  compressed_public_id text,
  download_url         text,
  expires_at           timestamptz   not null,
  created_at           timestamptz   default now()
);

-- Index for cleanup cron (find expired rows fast)
create index if not exists idx_file_uploads_expires_at
  on file_uploads (expires_at);

-- ── Row-Level Security (enable when adding auth) ─────────────────────────────
-- alter table file_uploads enable row level security;
-- 
-- Policy: Anyone can insert (uploads are anonymous for now)
-- create policy "Anyone can insert"
--   on file_uploads for insert
--   with check (true);
--
-- Policy: Only the uploader (by user_id) can read/delete
-- create policy "Users can read own files"
--   on file_uploads for select
--   using (user_id = auth.uid()::text);
--
-- create policy "Users can delete own files"
--   on file_uploads for delete
--   using (user_id = auth.uid()::text);

-- ── Cleanup function (optional) ──────────────────────────────────────────────
-- You can also run cleanup from a Supabase scheduled function:
-- create or replace function cleanup_expired_uploads()
-- returns void language plpgsql as $$
-- begin
--   delete from file_uploads
--   where expires_at < now();
-- end;
-- $$;
