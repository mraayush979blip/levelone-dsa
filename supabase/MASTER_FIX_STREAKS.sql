-- ==========================================
-- AUTO ACHIEVEMENT EVALUATOR & STREAK FIX
-- ==========================================

-- 1. STREAK REPAIR AND EVALUATOR
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS max_streak int DEFAULT 0;

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
        UPDATE users SET current_streak = 1, max_streak = GREATEST(1, mx_streak), last_activity_at = CURRENT_TIMESTAMP WHERE id = student_uuid;
    ELSIF last_act = today THEN
        -- Do nothing if already logged
        NULL;
    ELSIF last_act = today - interval '1 day' THEN
        -- Add 1 day if checked-in yesterday
        UPDATE users SET current_streak = curr_streak + 1, max_streak = GREATEST(curr_streak + 1, mx_streak), last_activity_at = CURRENT_TIMESTAMP WHERE id = student_uuid;
    ELSE
        -- Reset streak if missed day
        UPDATE users SET current_streak = 1, last_activity_at = CURRENT_TIMESTAMP WHERE id = student_uuid;
    END IF;

    -- Directly invoke achievement evaluate after any streak update!
    PERFORM evaluate_achievements(student_uuid);
END;
$$;

-- 2. ACHIEVEMENT (BADGE) ASSIGNMENT LOGIC
CREATE OR REPLACE FUNCTION public.evaluate_achievements(student_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usr users%ROWTYPE;
    completed_qty INT;
BEGIN
    -- Get current stats
    SELECT * INTO current_usr FROM users WHERE id = student_uuid;
    SELECT count(*) INTO completed_qty FROM submissions WHERE student_id = student_uuid AND status = 'valid';

    -- Streak Badges
    IF COALESCE(current_usr.max_streak, current_usr.current_streak, 0) >= 3 THEN
        INSERT INTO user_badges (user_id, badge_id) 
        SELECT student_uuid, id FROM badges WHERE code = 'STREAK_3' 
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;

    IF COALESCE(current_usr.max_streak, current_usr.current_streak, 0) >= 7 THEN
        INSERT INTO user_badges (user_id, badge_id) 
        SELECT student_uuid, id FROM badges WHERE code = 'STREAK_7' 
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;

    IF COALESCE(current_usr.max_streak, current_usr.current_streak, 0) >= 30 THEN
        INSERT INTO user_badges (user_id, badge_id) 
        SELECT student_uuid, id FROM badges WHERE code = 'STREAK_30' 
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;

    -- Phase Completion Badges
    IF completed_qty >= 1 THEN
        INSERT INTO user_badges (user_id, badge_id) 
        SELECT student_uuid, id FROM badges WHERE code = 'FIRST_PHASE' 
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;

    IF completed_qty >= 5 THEN
        INSERT INTO user_badges (user_id, badge_id) 
        SELECT student_uuid, id FROM badges WHERE code = 'PHASE_5' 
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    IF completed_qty >= 10 THEN
        INSERT INTO user_badges (user_id, badge_id) 
        SELECT student_uuid, id FROM badges WHERE code = 'PHASE_10' 
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
END;
$$;

-- 3. ENSURE RLS FOR BADGES
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;

CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
