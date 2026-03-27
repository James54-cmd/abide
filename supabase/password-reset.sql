-- Run in Supabase SQL editor. Password reset tokens for Nodemailer flow (not Supabase Auth email).

alter table public.profiles
  add column if not exists password_reset_token text,
  add column if not exists password_reset_expires_at timestamptz,
  add column if not exists password_reset_last_sent_at timestamptz;

create index if not exists profiles_password_reset_token_idx
  on public.profiles (password_reset_token)
  where password_reset_token is not null;
