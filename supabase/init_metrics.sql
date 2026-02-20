-- Web Vitals metrics table
-- Safe to run multiple times.

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