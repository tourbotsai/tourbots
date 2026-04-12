-- 1_users_initial.sql
-- Bootstrap users table for Firebase + Supabase profile sync.
-- Run this first.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null unique,
  email text not null unique,
  first_name text,
  last_name text,
  profile_image_url text,
  role text not null default 'admin',
  venue_id uuid,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_firebase_uid on public.users(firebase_uid);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_venue_id on public.users(venue_id);