-- ==========================================
-- FIX RLS POLICIES FOR TIMEVIEW SAVING
-- ==========================================

-- 1. Ensure RLS is active
ALTER TABLE public.student_phase_activity ENABLE ROW LEVEL SECURITY;

-- 2. Drop any potentially broken or restrictive policies
DROP POLICY IF EXISTS "Users can insert activity" ON public.student_phase_activity;
DROP POLICY IF EXISTS "Users can update own activity" ON public.student_phase_activity;
DROP POLICY IF EXISTS "Users can view own activity" ON public.student_phase_activity;

-- 3. Re-create the correct policies allowing students to save their own timer!
CREATE POLICY "Users can insert activity" 
ON public.student_phase_activity 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own activity" 
ON public.student_phase_activity 
FOR UPDATE 
USING (auth.uid() = student_id);

CREATE POLICY "Users can view own activity" 
ON public.student_phase_activity 
FOR SELECT 
USING (auth.uid() = student_id);
