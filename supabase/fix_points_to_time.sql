-- ==========================================
-- TIE POINTS MATHEMATICALLY TO EXACT TIME
-- ==========================================

-- This guarantees that 1 minute = exactly 1 point, no matter what.
-- Instead of arbitrarily awarded points, we mathematically divide your exact active seconds by 60.

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
        -- REAL TIME CONVERSION:
        (COALESCE((SELECT SUM(total_time_spent_seconds) FROM public.student_phase_activity spa WHERE spa.student_id = u.id), 0)::int / 60) as activity_points
    FROM public.users u
    WHERE u.role = 'student'
    -- Ordered exactly by your direct time equivalent points
    ORDER BY (COALESCE((SELECT SUM(total_time_spent_seconds) FROM public.student_phase_activity spa WHERE spa.student_id = u.id), 0)::int / 60) DESC, COALESCE(u.current_streak, 0) DESC
    LIMIT 100;
END;
$$;
