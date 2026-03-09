-- ==========================================
-- ADD LEETCODE USERNAME COLUMN & UPDATE POLICY
-- ==========================================

-- 1. Ensure the 'leetcode_username' column exists on the users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS leetcode_username VARCHAR(255);

-- 2. Make sure Row Level Security is enabled on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing update policies that might conflict
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;

-- 4. Create an UPDATE policy allowing students to modify their own profile data (like their username)
CREATE POLICY "Users can update their own profile"
ON public.users 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);
