-- 🚨 FINAL KILLSHOT: FIX APK@GMAIL.COM 🚨
-- Run this in the Supabase SQL Editor immediately

-- 1. Force apk@gmail.com to be an Admin and Active
UPDATE public.users 
SET 
  role = 'admin', 
  status = 'active', 
  updated_at = NOW() 
WHERE email = 'apk@gmail.com';

-- 2. If for some reason they don't exist in public.users yet, this inserts them:
INSERT INTO public.users (id, email, name, role, status)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'Administrator'), 'admin', 'active'
FROM auth.users
WHERE email = 'apk@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = NOW();

-- 3. Verify it worked
SELECT email, role, status FROM public.users WHERE email = 'apk@gmail.com';
