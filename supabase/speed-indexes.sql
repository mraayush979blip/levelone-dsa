-- 🚀 LEVELONE PERFORMANCE INDEXES
-- Run these in Supabase SQL Editor to significantly speed up your application.

-- 1. Index for User Lookups (Authentication & Profile)
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Index for Phase Filtering (Dashboard & Active Phases)
CREATE INDEX IF NOT EXISTS idx_phases_is_active ON public.phases(is_active);
CREATE INDEX IF NOT EXISTS idx_phases_status ON public.phases(status);

-- 3. Index for Submissions (Very critical for dashboard loading)
-- This allows instant lookup of a student's submissions for specific phases
CREATE INDEX IF NOT EXISTS idx_submissions_student_phase ON public.submissions(student_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(student_id, phase_id, assignment_index);

-- 4. Index for Activity Tracking (Real-time heartbeats)
CREATE INDEX IF NOT EXISTS idx_activity_student_phase ON public.student_phase_activity(student_id, phase_id);

-- 5. Index for History Auditing
CREATE INDEX IF NOT EXISTS idx_history_submission_id ON public.submission_history(submission_id);

-- 💡 Suggestion: Run "VACUUM ANALYZE;" after creating these to update Postgres stats.
ANALYZE users;
ANALYZE phases;
ANALYZE submissions;
ANALYZE student_phase_activity;
