-- Run in Supabase SQL editor. Email change OTP support.

alter table public.profiles
  add column if not exists email_change_pending text,
  add column if not exists email_change_otp text,
  add column if not exists email_change_otp_expires_at timestamptz,
  add column if not exists email_change_otp_last_sent_at timestamptz;
