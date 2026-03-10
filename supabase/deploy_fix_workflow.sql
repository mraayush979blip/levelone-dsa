-- Fix 1: Ensure task verification and points are robustly handled
DROP FUNCTION IF EXISTS verify_and_award_task(UUID, UUID);

CREATE OR REPLACE FUNCTION verify_and_award_task(
    p_task_id UUID,
    p_phase_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_points INT;
    v_student_id UUID;
BEGIN
    v_student_id := auth.uid();
    
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get task points
    SELECT points INTO v_points FROM public.phase_tasks WHERE id = p_task_id;
    
    IF v_points IS NULL THEN
        RAISE EXCEPTION 'Task not found';
    END IF;

    -- Insert into task_submissions (this will throw if constraint unique is violated)
    INSERT INTO public.task_submissions (student_id, task_id, phase_id)
    VALUES (v_student_id, p_task_id, p_phase_id);

    -- Award points to user
    UPDATE public.users SET points = COALESCE(points, 0) + v_points WHERE id = v_student_id;
END;
$$;

-- Fix 2: Ensure Admins can manage phase_tasks (The issue might be INSERT RLS failing without WITH CHECK)
DROP POLICY IF EXISTS "Admins can manage phase tasks" ON public.phase_tasks;

CREATE POLICY "Admins can select phase tasks" 
    ON public.phase_tasks FOR SELECT 
    USING (true);

CREATE POLICY "Admins can insert phase tasks" 
    ON public.phase_tasks FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update phase tasks" 
    ON public.phase_tasks FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete phase tasks" 
    ON public.phase_tasks FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Fix 3: Ensure Storage Buckets have correct RLS (In case the error was for File/Image upload)
-- For assignment documents
CREATE POLICY "Public assignment-documents access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'assignment-documents');

CREATE POLICY "Admin assignment-documents upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'assignment-documents' 
    AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admin assignment-documents update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'assignment-documents' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'))
WITH CHECK (bucket_id = 'assignment-documents' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admin assignment-documents delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'assignment-documents' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- For student submissions
CREATE POLICY "Student submissions access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Student submissions upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Student submissions update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
