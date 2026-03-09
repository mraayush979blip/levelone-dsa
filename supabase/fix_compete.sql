-- ==========================================
-- FIX COMMUNITY & LEADERBOARD LOGIC
-- ==========================================

-- 1. Get Leaderboard (Fixed missing users due to role check)
CREATE OR REPLACE FUNCTION public.get_leaderboard_v2()
RETURNS TABLE (
    user_id uuid,
    user_name text,
    user_avatar text,
    current_streak int,
    completed_phases int,
    activity_points int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.name as user_name,
        COALESCE(u.equipped_avatar, '👤') as user_avatar,
        COALESCE(u.current_streak, 0) as current_streak,
        (SELECT count(*)::int FROM public.submissions s WHERE s.student_id = u.id AND s.status = 'valid') as completed_phases,
        COALESCE(u.points, 0) as activity_points
    FROM public.users u
    -- Removed role='student' restriction in case users were created without it
    ORDER BY COALESCE(u.points, 0) DESC, COALESCE(u.current_streak, 0) DESC
    LIMIT 100; -- Limit to top 100 for performance
END;
$$;

-- 2. Rank Context (For 'Your Standing')
CREATE OR REPLACE FUNCTION public.get_student_rank_context(current_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rank_val int;
BEGIN
    -- This is a dummy implementation if the original was missing
    -- We'll handle it entirely frontend-side, so just return null to not crash
    RETURN NULL;
END;
$$;

-- 3. Streak Auto-updater
CREATE OR REPLACE FUNCTION public.update_student_streak(student_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_act date;
    curr_streak int;
    mx_streak int;
    today date := CURRENT_DATE;
BEGIN
    SELECT DATE(last_activity_date), COALESCE(current_streak, 0), COALESCE(max_streak, 0)
    INTO last_act, curr_streak, mx_streak
    FROM users WHERE id = student_uuid;

    IF last_act IS NULL THEN
        -- First time
        UPDATE users SET current_streak = 1, max_streak = GREATEST(1, mx_streak), last_activity_date = CURRENT_TIMESTAMP WHERE id = student_uuid;
    ELSIF last_act = today THEN
        -- Already updated today
        NULL;
    ELSIF last_act = today - interval '1 day' THEN
        -- Consecutive day
        UPDATE users SET current_streak = curr_streak + 1, max_streak = GREATEST(curr_streak + 1, mx_streak), last_activity_date = CURRENT_TIMESTAMP WHERE id = student_uuid;
    ELSE
        -- Streak broken
        UPDATE users SET current_streak = 1, last_activity_date = CURRENT_TIMESTAMP WHERE id = student_uuid;
    END IF;
END;
$$;
