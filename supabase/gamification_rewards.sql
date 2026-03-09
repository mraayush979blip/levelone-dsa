-- ==========================================
-- ADD NEW REWARDS AND ACHIEVEMENTS
-- ==========================================

-- More Achievements (Badges)
INSERT INTO public.badges (code, name, description, icon_name, category, requirement_type, requirement_value) VALUES
('STREAK_7', 'Fireball', 'Maintain a 7-day streak', 'Flame', 'streak', 'streak_days', 7),
('STREAK_30', 'Inferno', 'Maintain a 30-day streak', 'Flame', 'streak', 'streak_days', 30),
('PHASE_5', 'Dedicated Scholar', 'Complete 5 learning phases', 'BookOpen', 'completion', 'phases_count', 5),
('PHASE_10', 'Master', 'Complete 10 learning phases', 'Award', 'completion', 'phases_count', 10),
('SPEED_DEMON', 'Speed Demon', 'Complete a phase in record time', 'Zap', 'performance', 'manual', 1),
('PERFECT_SCORE', 'Flawless', 'Get a perfect score on an assignment', 'Star', 'performance', 'manual', 1)
ON CONFLICT (code) DO NOTHING;

-- More Store Items
INSERT INTO public.store_items (code, name, description, cost, type, asset_value, required_streak) VALUES 
('THEME_DARK', 'Midnight Void', 'A sleek, pure black dark mode theme.', 200, 'theme', 'theme-dark', 0),
('THEME_HACKER', 'Terminal Green', 'Retro terminal hacker aesthetic.', 800, 'theme', 'theme-hacker', 5),
('THEME_OCEAN', 'Deep Ocean', 'Calming deep sea blue aesthetic.', 500, 'theme', 'theme-ocean', 0),
('AVATAR_NINJA', 'Code Ninja', 'A fast and stealthy coder avatar.', 1000, 'avatar', '🥷', 0),
('AVATAR_WIZARD', 'Syntax Wizard', 'A magical master of code.', 1500, 'avatar', '🧙‍♂️', 0),
('AVATAR_ROBOT', 'Automaton', 'An unfeeling machine of logic.', 1000, 'avatar', '🤖', 0),
('BANNER_MATRIX', 'The Matrix', 'Raining green code background banner.', 1200, 'banner', 'matrix.gif', 0),
('BANNER_SPACE', 'Galaxy', 'Deep space starfield banner.', 1200, 'banner', 'space.gif', 0)
ON CONFLICT (code) DO NOTHING;
