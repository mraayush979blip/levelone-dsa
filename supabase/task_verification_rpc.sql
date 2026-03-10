-- Step 1: Drop if exists to ensure clean slate
DROP FUNCTION IF EXISTS verify_and_award_task(UUID, UUID);

-- Step 2: Create a secure RPC for verifying tasks and awarding points atomically
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
