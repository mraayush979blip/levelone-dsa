-- LEETCODE INTEGRATION MIGRATION
-- Run this in your Supabase SQL Editor

-- 1. Add 'leetcode' to submission_type enum
ALTER TYPE public.submission_type ADD VALUE IF NOT EXISTS 'leetcode';

-- 2. Add LeetCode columns to phases table
ALTER TABLE public.phases 
ADD COLUMN IF NOT EXISTS assignment_leetcode_url TEXT,
ADD COLUMN IF NOT EXISTS leetcode_problem_slug TEXT;

-- 3. Update phases allowed_submission_type check constraint
-- This allows 'leetcode' as a valid submission type for a phase.
ALTER TABLE public.phases DROP CONSTRAINT IF EXISTS phases_allowed_submission_type_check;
ALTER TABLE public.phases ADD CONSTRAINT phases_allowed_submission_type_check 
CHECK (allowed_submission_type IN ('github', 'file', 'both', 'leetcode'));

-- 4. Add leetcode_username to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS leetcode_username TEXT;
