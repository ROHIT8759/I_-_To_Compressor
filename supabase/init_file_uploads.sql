-- File upload metadata table used by upload/compress/download/cleanup APIs.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.file_uploads (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_type text not null,
  original_size bigint not null,
  compressed_size bigint,
  cloudinary_public_id text not null,
  compressed_public_id text,
  download_url text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_file_uploads_expires_at
  on public.file_uploads (expires_at);

create index if not exists idx_file_uploads_cloudinary_public_id
  on public.file_uploads (cloudinary_public_id);

create index if not exists idx_file_uploads_compressed_public_id
  on public.file_uploads (compressed_public_id);
