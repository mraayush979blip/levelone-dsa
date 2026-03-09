-- LEETCODE INTEGRATION MIGRATION
-- Run this in your Supabase SQL Editor

-- 1. Add LeetCode columns to phases table
ALTER TABLE public.phases 
ADD COLUMN IF NOT EXISTS assignment_leetcode_url TEXT,
ADD COLUMN IF NOT EXISTS leetcode_problem_slug TEXT;

-- 2. Update phases allowed_submission_type check constraint
-- This allows 'leetcode' as a valid submission type for a phase.
ALTER TABLE public.phases DROP CONSTRAINT IF EXISTS phases_allowed_submission_type_check;
ALTER TABLE public.phases ADD CONSTRAINT phases_allowed_submission_type_check 
CHECK (allowed_submission_type IN ('github', 'file', 'both', 'leetcode'));

-- 3. Update submissions submission_type check constraint
-- This allows 'leetcode' as a valid submission type for a student's submission.
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_submission_type_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_submission_type_check 
CHECK (submission_type IN ('github', 'file', 'leetcode'));

-- 4. Add leetcode_username to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS leetcode_username TEXT;
