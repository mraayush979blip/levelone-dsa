-- ==========================================
-- 4. Fast Points (1 min = 1 point)
-- ==========================================

CREATE OR REPLACE FUNCTION public.award_activity_point()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_award TIMESTAMPTZ;
    cooldown_interval INTERVAL := '50 seconds'; -- Allow every minute roughly
    _now TIMESTAMPTZ := NOW();
BEGIN
    SELECT last_point_award_at INTO last_award FROM users WHERE id = auth.uid();

    IF last_award IS NOT NULL AND _now < (last_award + cooldown_interval) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cooldown active');
    END IF;

    UPDATE users SET 
        points = COALESCE(points, 0) + 1,
        last_point_award_at = _now
    WHERE id = auth.uid();

    RETURN jsonb_build_object('success', true, 'points', 1);
END;
$$;
