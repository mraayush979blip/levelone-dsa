-- ==========================================
-- MASTER FIX FOR COMPETE PAGE (Leaderboards & Points)
-- ==========================================

-- 1. ADD MISSING COLUMN FOR POINTS TRACKING
-- (This is why your points weren't going up! The database couldn't track when you got your last point.)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_point_award_at TIMESTAMPTZ;

-- 2. FIX LEADERBOARD CRASH (PostgreSQL Type Mismatch fix)
-- (This is why the leaderboard was empty! Your names were saved as 'varchar' instead of 'text'.)
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
        u.name::text as user_name,  -- FIXED: Cast to text
        COALESCE(u.equipped_avatar, '👤')::text as user_avatar, -- FIXED: Cast to text
        COALESCE(u.current_streak, 0) as current_streak,
        (SELECT count(*)::int FROM public.submissions s WHERE s.student_id = u.id AND s.status = 'valid') as completed_phases,
        COALESCE(u.points, 0) as activity_points
    FROM public.users u
    ORDER BY COALESCE(u.points, 0) DESC, COALESCE(u.current_streak, 0) DESC
    LIMIT 100;
END;
$$;

-- 3. FIX POINTS AWARDING (1 minute = 1 point)
CREATE OR REPLACE FUNCTION public.award_activity_point()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_award TIMESTAMPTZ;
    cooldown_interval INTERVAL := '55 seconds'; -- Allows getting a point roughly every minute
    _now TIMESTAMPTZ := NOW();
BEGIN
    SELECT last_point_award_at INTO last_award FROM users WHERE id = auth.uid();

    -- Check if they already got a point less than 55 seconds ago
    IF last_award IS NOT NULL AND _now < (last_award + cooldown_interval) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cooldown active');
    END IF;

    -- Award the point and reset the clock!
    UPDATE users SET 
        points = COALESCE(points, 0) + 1,
        last_point_award_at = _now
    WHERE id = auth.uid();

    RETURN jsonb_build_object('success', true, 'points', 1, 'message', 'Point awarded!');
END;
$$;
