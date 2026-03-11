-- ==========================================
-- ADMIN RLS FIX - CONSOLIDATED
-- ==========================================

-- 1. Helper function with SECURITY DEFINER to bypass RLS for role checks
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Clean up recursive/broken policies on users table
DROP POLICY IF EXISTS "admins_see_all_users" ON public.users;
CREATE POLICY "admins_see_all_users" ON public.users
FOR ALL USING (
  public.check_is_admin()
);

-- 3. Fix Submissions - Ensure admins can see ALL students' submissions
DROP POLICY IF EXISTS "admins_see_all_submissions" ON public.submissions;
CREATE POLICY "admins_see_all_submissions" ON public.submissions
FOR SELECT USING (
  public.check_is_admin()
);

-- 4. Fix Activity - Ensure admins can see ALL students' watch time
DROP POLICY IF EXISTS "admins_see_all_activity" ON public.student_phase_activity;
CREATE POLICY "admins_see_all_activity" ON public.student_phase_activity
FOR SELECT USING (
  public.check_is_admin()
);

-- 5. Fix Activity Logs - Ensure admins can see history
DROP POLICY IF EXISTS "admins_see_all_logs" ON public.activity_logs;
CREATE POLICY "admins_see_all_logs" ON public.activity_logs
FOR SELECT USING (
  public.check_is_admin()
);

-- 6. Fix Submission History
DROP POLICY IF EXISTS "admins_see_all_history" ON public.submission_history;
CREATE POLICY "admins_see_all_history" ON public.submission_history
FOR SELECT USING (
  public.check_is_admin()
);

-- 7. Ensure RLS is active on all relevant tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_phase_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_history ENABLE ROW LEVEL SECURITY;

-- Success verification
DO $$ BEGIN
  RAISE NOTICE 'Admin RLS fix applied successfully. Admins can now view all student metrics.';
END $$;
