-- 🚨 RUN THIS IN SUPABASE SQL EDITOR IMMEDIATELY 🚨
-- This will forcefully UN-REVOKE all Admin accounts forever

-- 1. Forcefully set all existing admins to active
UPDATE public.users 
SET status = 'active', updated_at = NOW() 
WHERE role = 'admin';

-- 2. Verify it worked (This should list your admin email as 'active')
SELECT email, role, status FROM public.users WHERE role = 'admin';
