-- ==========================================
-- ADD BADGES TO LEADERBOARD OUTPUT
-- ==========================================

DROP FUNCTION IF EXISTS public.get_leaderboard_v2();

CREATE OR REPLACE FUNCTION public.get_leaderboard_v2()
RETURNS TABLE (
    user_id uuid,
    user_name text,
    user_avatar text,
    current_streak int,
    completed_phases int,
    activity_points int,
    earned_badges text[]
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
        (COALESCE((SELECT SUM(total_time_spent_seconds) FROM public.student_phase_activity spa WHERE spa.student_id = u.id), 0)::int / 60) as activity_points,
        (SELECT array_agg(b.icon_name::text) FROM public.user_badges ub JOIN public.badges b ON ub.badge_id = b.id WHERE ub.user_id = u.id) as earned_badges
    FROM public.users u
    WHERE u.role = 'student'
    -- Ordered exactly by Level (Completed Phases) First, then Time (Activity points) Second
    ORDER BY 
        (SELECT count(*)::int FROM public.submissions s WHERE s.student_id = u.id AND s.status = 'valid') DESC,
        (COALESCE((SELECT SUM(total_time_spent_seconds) FROM public.student_phase_activity spa WHERE spa.student_id = u.id), 0)::int / 60) DESC, 
        COALESCE(u.current_streak, 0) DESC
    LIMIT 100;
END;
$$;
