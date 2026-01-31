-- Fix: Allow students to update their own cosmetic preferences (theme, banner, avatar)
-- This is necessary for the "Equip Gift" feature and the Store items to work properly.

-- 1. Ensure columns exist (just in case)
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_theme TEXT DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_banner TEXT DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_avatar TEXT DEFAULT '👤';

-- 2. Add safe UPDATE policy
DROP POLICY IF EXISTS "users_update_self" ON users;
CREATE POLICY "users_update_self" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM users WHERE id = auth.uid()) AND
    points = (SELECT points FROM users WHERE id = auth.uid()) AND
    status = (SELECT status FROM users WHERE id = auth.uid())
  );

-- 3. Success message
DO $$
BEGIN
  RAISE NOTICE 'RLS update policy for students has been added.';
END $$;
