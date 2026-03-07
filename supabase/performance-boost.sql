-- ⚡ LEVELONE PERFORMANCE BOOST — Extended Indexes
-- Run in Supabase SQL Editor (safe to re-run — all IF NOT EXISTS)
-- Covers: Notifications, Store, Gamification, Streaks, and missing compound indexes

-- ============================================
-- 1. NOTIFICATIONS (Real-time feed is a hot query)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON public.notifications(type);

-- ============================================
-- 2. STORE & INVENTORY (Store page + equip checks)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_store_items_type 
  ON public.store_items(type);

CREATE INDEX IF NOT EXISTS idx_store_items_cost 
  ON public.store_items(cost);

CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id 
  ON public.user_inventory(user_id);

CREATE INDEX IF NOT EXISTS idx_user_inventory_user_item 
  ON public.user_inventory(user_id, item_id);

CREATE INDEX IF NOT EXISTS idx_user_inventory_equipped 
  ON public.user_inventory(user_id, is_equipped) 
  WHERE is_equipped = true;

-- ============================================
-- 3. GAMIFICATION — Badges, Goals, Challenges
-- ============================================
CREATE INDEX IF NOT EXISTS idx_badges_category 
  ON public.badges(category);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id 
  ON public.user_badges(user_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at 
  ON public.user_badges(user_id, earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_personal_goals_user_status 
  ON public.personal_goals(user_id, status);

CREATE INDEX IF NOT EXISTS idx_challenges_challenger 
  ON public.challenges(challenger_id, status);

CREATE INDEX IF NOT EXISTS idx_challenges_opponent 
  ON public.challenges(opponent_id, status);

-- ============================================
-- 4. USERS — Streak & Leaderboard queries
-- ============================================
-- Leaderboard sorts by points DESC — this makes it instant
CREATE INDEX IF NOT EXISTS idx_users_points_desc 
  ON public.users(points DESC NULLS LAST) 
  WHERE role = 'student' AND status = 'active';

-- Streak leaderboard
CREATE INDEX IF NOT EXISTS idx_users_streak_desc 
  ON public.users(current_streak DESC NULLS LAST) 
  WHERE role = 'student' AND status = 'active';

-- Last activity for streak calculations
CREATE INDEX IF NOT EXISTS idx_users_last_activity_date 
  ON public.users(last_activity_date);

-- ============================================
-- 5. ACTIVITY LOGS — High-volume table
-- ============================================
-- Student activity feed (dashboard timeline)
CREATE INDEX IF NOT EXISTS idx_activity_logs_student_created 
  ON public.activity_logs(student_id, created_at DESC);

-- ============================================
-- 6. SUBMISSION HISTORY — Audit trail queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_submission_history_student_phase 
  ON public.submission_history(student_id, phase_id, created_at DESC);

-- ============================================
-- 7. CSV IMPORTS — Admin history view
-- ============================================
CREATE INDEX IF NOT EXISTS idx_csv_imports_created 
  ON public.csv_imports(created_at DESC);

-- ============================================
-- 🔄 Update Postgres Statistics
-- ============================================
-- This tells the query planner about the new indexes
ANALYZE public.notifications;
ANALYZE public.store_items;
ANALYZE public.user_inventory;
ANALYZE public.badges;
ANALYZE public.user_badges;
ANALYZE public.personal_goals;
ANALYZE public.challenges;
ANALYZE public.users;
ANALYZE public.activity_logs;
ANALYZE public.submission_history;
ANALYZE public.csv_imports;
