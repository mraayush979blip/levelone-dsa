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
    WHERE u.role = 'student'
    ORDER BY activity_points DESC, current_streak DESC;
END;
$$;
