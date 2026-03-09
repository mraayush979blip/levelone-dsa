-- ==========================================
-- FORCE BADGES INTO THE SYSTEM 
-- ==========================================

INSERT INTO public.badges (code, name, description, icon_name, category, requirement_type, requirement_value) VALUES
('FIRST_PHASE', 'First Steps', 'Complete your first learning phase', 'Star', 'completion', 'phases_count', 1),
('STREAK_3', 'On Fire', 'Maintain a 3-day streak', 'Flame', 'streak', 'streak_days', 3),
('STREAK_7', 'Fireball', 'Maintain a 7-day streak', 'Flame', 'streak', 'streak_days', 7),
('STREAK_30', 'Inferno', 'Maintain a 30-day streak', 'Flame', 'streak', 'streak_days', 30),
('PHASE_5', 'Dedicated Scholar', 'Complete 5 learning phases', 'BookOpen', 'completion', 'phases_count', 5),
('PHASE_10', 'Master', 'Complete 10 learning phases', 'Award', 'completion', 'phases_count', 10)
ON CONFLICT (code) DO NOTHING;

-- Force achievement check for all current students
DO $$
DECLARE
    student record;
BEGIN
    FOR student IN SELECT id FROM public.users WHERE role = 'student'
    LOOP
        PERFORM public.evaluate_achievements(student.id);
    END LOOP;
END;
$$;
