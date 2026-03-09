-- ==========================================
-- FINAL COMPETE & STREAK FIX
-- ==========================================

-- 1. Remove Admins from Leaderboard
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
        u.name::text as user_name,
        COALESCE(u.equipped_avatar, '👤')::text as user_avatar,
        COALESCE(u.current_streak, 0) as current_streak,
        (SELECT count(*)::int FROM public.submissions s WHERE s.student_id = u.id AND s.status = 'valid') as completed_phases,
        COALESCE(u.points, 0) as activity_points
    FROM public.users u
    WHERE u.role = 'student' -- RE-ADDED: Excludes Admin from leaderboard
    ORDER BY COALESCE(u.points, 0) DESC, COALESCE(u.current_streak, 0) DESC
    LIMIT 100;
END;
$$;

-- 2. Fix Streak Logic column name mismatch
-- (It was failing silently because it looked for last_activity_date instead of last_activity_at)
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
    SELECT DATE(last_activity_at), COALESCE(current_streak, 0), COALESCE(max_streak, 0)
    INTO last_act, curr_streak, mx_streak
    FROM users WHERE id = student_uuid;

    IF last_act IS NULL THEN
        -- First time
        UPDATE users SET current_streak = 1, max_streak = GREATEST(1, mx_streak), last_activity_at = CURRENT_TIMESTAMP WHERE id = student_uuid;
    ELSIF last_act = today THEN
        -- Already updated today
        NULL;
    ELSIF last_act = today - interval '1 day' THEN
        -- Consecutive day
        UPDATE users SET current_streak = curr_streak + 1, max_streak = GREATEST(curr_streak + 1, mx_streak), last_activity_at = CURRENT_TIMESTAMP WHERE id = student_uuid;
    ELSE
        -- Streak broken
        UPDATE users SET current_streak = 1, last_activity_at = CURRENT_TIMESTAMP WHERE id = student_uuid;
    END IF;
END;
$$;
