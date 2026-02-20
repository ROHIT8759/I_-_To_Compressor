-- Combined Supabase schema for Compraser
-- Includes tracking tables + file_uploads table
-- Safe to run multiple times.

create extension if not exists pgcrypto;

-- =========================
-- Tracking: visitor_consents
-- =========================
create table if not exists public.visitor_consents (
  id bigint generated always as identity primary key,
  visitor_id text not null unique,
  analytics_consent boolean not null,
  source text not null default 'banner',
  path text,
  country text,
  timezone text,
  language text,
  session_id text,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.visitor_consents add column if not exists path text;
alter table public.visitor_consents add column if not exists timezone text;
alter table public.visitor_consents add column if not exists language text;
alter table public.visitor_consents add column if not exists session_id text;
alter table public.visitor_consents add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_visitor_consents_visitor_id
  on public.visitor_consents (visitor_id);

create index if not exists idx_visitor_consents_updated_at
  on public.visitor_consents (updated_at);

create index if not exists idx_visitor_consents_session_id
  on public.visitor_consents (session_id);

-- ======================
-- Tracking: visitor_events
-- ======================
create table if not exists public.visitor_events (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  event_name text not null,
  path text,
  referrer text,
  session_id text,
  url text,
  page_title text,
  country text,
  region text,
  city text,
  timezone text,
  language text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  device_type text not null default 'unknown',
  browser text not null default 'unknown',
  os text not null default 'unknown',
  viewport_width integer,
  viewport_height integer,
  screen_width integer,
  screen_height integer,
  device_pixel_ratio numeric(6, 3),
  do_not_track boolean,
  color_scheme text,
  platform text,
  hardware_concurrency integer,
  device_memory_gb numeric(6, 3),
  network_effective_type text,
  network_downlink_mbps numeric(8, 3),
  network_rtt_ms integer,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint visitor_events_device_type_check
    check (device_type in ('mobile', 'tablet', 'desktop', 'bot', 'unknown'))
);

alter table public.visitor_events add column if not exists session_id text;
alter table public.visitor_events add column if not exists url text;
alter table public.visitor_events add column if not exists page_title text;
alter table public.visitor_events add column if not exists utm_source text;
alter table public.visitor_events add column if not exists utm_medium text;
alter table public.visitor_events add column if not exists utm_campaign text;
alter table public.visitor_events add column if not exists utm_term text;
alter table public.visitor_events add column if not exists utm_content text;
alter table public.visitor_events add column if not exists viewport_width integer;
alter table public.visitor_events add column if not exists viewport_height integer;
alter table public.visitor_events add column if not exists screen_width integer;
alter table public.visitor_events add column if not exists screen_height integer;
alter table public.visitor_events add column if not exists device_pixel_ratio numeric(6, 3);
alter table public.visitor_events add column if not exists do_not_track boolean;
alter table public.visitor_events add column if not exists color_scheme text;
alter table public.visitor_events add column if not exists platform text;
alter table public.visitor_events add column if not exists hardware_concurrency integer;
alter table public.visitor_events add column if not exists device_memory_gb numeric(6, 3);
alter table public.visitor_events add column if not exists network_effective_type text;
alter table public.visitor_events add column if not exists network_downlink_mbps numeric(8, 3);
alter table public.visitor_events add column if not exists network_rtt_ms integer;

create index if not exists idx_visitor_events_visitor_id
  on public.visitor_events (visitor_id);

create index if not exists idx_visitor_events_event_name
  on public.visitor_events (event_name);

create index if not exists idx_visitor_events_created_at
  on public.visitor_events (created_at);

create index if not exists idx_visitor_events_path
  on public.visitor_events (path);

create index if not exists idx_visitor_events_session_id
  on public.visitor_events (session_id);

create index if not exists idx_visitor_events_utm_campaign
  on public.visitor_events (utm_campaign);

create index if not exists idx_visitor_events_metadata_gin
  on public.visitor_events using gin (metadata);

-- ======================
-- File metadata: file_uploads
-- ======================
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

alter table public.file_uploads add column if not exists compressed_size bigint;
alter table public.file_uploads add column if not exists compressed_public_id text;
alter table public.file_uploads add column if not exists download_url text;

create index if not exists idx_file_uploads_expires_at
  on public.file_uploads (expires_at);

create index if not exists idx_file_uploads_cloudinary_public_id
  on public.file_uploads (cloudinary_public_id);

create index if not exists idx_file_uploads_compressed_public_id
  on public.file_uploads (compressed_public_id);

-- ======================
-- Performance metrics: web_vitals_metrics
-- ======================
create table if not exists public.web_vitals_metrics (
  id bigint generated always as identity primary key,
  metric_id text,
  metric_name text not null,
  metric_value double precision not null,
  rating text,
  delta double precision,
  navigation_type text,
  page_path text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.web_vitals_metrics add column if not exists metric_id text;
alter table public.web_vitals_metrics add column if not exists rating text;
alter table public.web_vitals_metrics add column if not exists delta double precision;
alter table public.web_vitals_metrics add column if not exists navigation_type text;
alter table public.web_vitals_metrics add column if not exists page_path text;
alter table public.web_vitals_metrics add column if not exists referrer text;
alter table public.web_vitals_metrics add column if not exists user_agent text;

create index if not exists idx_web_vitals_metrics_created_at
  on public.web_vitals_metrics (created_at);

create index if not exists idx_web_vitals_metrics_metric_name
  on public.web_vitals_metrics (metric_name);

create index if not exists idx_web_vitals_metrics_page_path
  on public.web_vitals_metrics (page_path);
