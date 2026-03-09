-- ==========================================
-- FIX PHASES RLS ISSUE for LEETCODE
-- ==========================================
-- This script safely replaces the managing policy for the 'phases' table
-- to ensure Admins can insert/update/delete without RLS violations.

-- 1. Ensure RLS is enabled
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;

-- 2. Drop the existing admin managing policies to avoid conflicts
DROP POLICY IF EXISTS "admins_manage_phases" ON public.phases;
DROP POLICY IF EXISTS "Admins can manage phases" ON public.phases;

-- 3. Recreate the policy perfectly
-- We use a direct EXISTS query to ensure auth.uid() perfectly matches an admin row.
-- Including WITH CHECK guarantees INSERT and UPDATE operations will not fail.

CREATE POLICY "admins_manage_phases" 
ON public.phases 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Note: Also ensure the active phases can be seen by everyone
DROP POLICY IF EXISTS "everyone_see_active_phases" ON public.phases;
CREATE POLICY "everyone_see_active_phases" 
ON public.phases 
FOR SELECT 
USING (is_active = true);

-- IMPORTANT: Ensure your own account is marked as admin
-- Uncomment and run the below if you accidentally lost admin rights
-- UPDATE public.users SET role = 'admin' WHERE id = auth.uid();
