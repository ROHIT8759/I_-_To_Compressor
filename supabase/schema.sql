create table if not exists compressed_files (
  id uuid primary key default gen_random_uuid(),
  user_id text null,
  file_name text not null,
  original_size bigint not null,
  compressed_size bigint not null,
  source_public_id text not null,
  compressed_public_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_compressed_files_expires_at on compressed_files (expires_at);
