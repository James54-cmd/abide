-- Add verification fields to the profiles table
-- Run this in your Supabase SQL Editor

-- 1. Add verification_status column
alter table public.profiles 
add column if not exists verification_status text default 'pending';

-- 2. Add verification_token column
alter table public.profiles 
add column if not exists verification_token uuid;

-- 3. Add token lifecycle columns
alter table public.profiles
add column if not exists verification_token_expires_at timestamptz;

alter table public.profiles
add column if not exists verification_last_resent_at timestamptz;

-- 4. Allow "expired" status in addition to pending/verified.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_verification_status_check'
  ) then
    alter table public.profiles
    add constraint profiles_verification_status_check
    check (verification_status in ('pending', 'verified', 'expired'));
  end if;
end $$;

-- 5. (Optional but recommended) Mark existing users as verified
-- so they aren't forced to verify again if they were already confirmed
update public.profiles 
set verification_status = 'verified' 
where verification_status = 'pending';

-- 6. Ensure RLS policies don't block profile updates from the server
-- Note: Our API uses the service_role key so it bypasses RLS,
-- but for data integrity, we ensure profiles can be read by users.
