-- ==========================================
-- FIX RLS POLICIES FOR STORE AND BADGES
-- ==========================================

-- Enable RLS just in case it was off and causing weird behavior (though normally off means open, sometimes it's locked without policies)
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Drop any existing select policies that might be restrictive
DROP POLICY IF EXISTS "everyone_view_store_items" ON public.store_items;
DROP POLICY IF EXISTS "everyone_view_badges" ON public.badges;
DROP POLICY IF EXISTS "public_can_read_store" ON public.store_items;
DROP POLICY IF EXISTS "public_can_read_badges" ON public.badges;

-- Create guaranteed open read access policies for everyone
CREATE POLICY "everyone_view_store_items" ON public.store_items FOR SELECT USING (true);
CREATE POLICY "everyone_view_badges" ON public.badges FOR SELECT USING (true);

-- Also ensure user_inventory can be inserted/selected
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_view_own_inventory" ON public.user_inventory;
CREATE POLICY "users_view_own_inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);

-- Explicitly allow insert to user_inventory for purchases (if not already handled via SECURITY DEFINER functions)
DROP POLICY IF EXISTS "users_insert_own_inventory" ON public.user_inventory;
CREATE POLICY "users_insert_own_inventory" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
