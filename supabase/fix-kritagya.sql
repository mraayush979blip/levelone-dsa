-- ✅ FIX FOR KRITAGYA ACCOUNT
-- Run this in Supabase SQL Editor if data is not loading

-- 1. Identify current Auth ID for kritagya@gmail.com
-- This script will safely insert or update the record

DO $$
DECLARE
    auth_id UUID;
BEGIN
    SELECT id INTO auth_id FROM auth.users WHERE email = 'kritagya@gmail.com';
    
    IF auth_id IS NOT NULL THEN
        INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
        VALUES (
            auth_id,
            'kritagya@gmail.com',
            'Kritagya Student',
            'student',
            'active',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            status = 'active',
            role = 'student',
            updated_at = NOW();
            
        RAISE NOTICE '✅ Successfully synced kritagya@gmail.com (ID: %)', auth_id;
    ELSE
        RAISE NOTICE '❌ ERROR: Could not find kritagya@gmail.com in auth.users. Please sign up first!';
    END IF;
END $$;

-- Verify results
SELECT id, email, role, status FROM users WHERE email = 'kritagya@gmail.com';
