-- RPC Fix: Consolidating missing or broken functions
-- Run this in your Supabase SQL Editor

-- 1. check_and_revoke_self
CREATE OR REPLACE FUNCTION check_and_revoke_self()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_student_id UUID;
    current_status TEXT;
    is_missing_submission BOOLEAN;
BEGIN
    current_student_id := auth.uid();
    IF current_student_id IS NULL THEN RETURN false; END IF;

    -- Check for missing mandatory submissions (Deadline = Date + 23:59:59)
    SELECT EXISTS (
        SELECT 1 FROM phases p
        WHERE (p.end_date + INTERVAL '23 hours 59 minutes 59 seconds') < NOW() 
          AND p.is_active = true
          AND p.is_mandatory = true
          AND NOT EXISTS (
              SELECT 1 FROM submissions s
              WHERE s.student_id = current_student_id
                AND s.phase_id = p.id
                AND s.status = 'valid'
          )
    ) INTO is_missing_submission;

    SELECT status INTO current_status FROM users WHERE id = current_student_id;

    IF is_missing_submission THEN
        IF current_status = 'active' THEN
            UPDATE users SET status = 'revoked', updated_at = NOW() WHERE id = current_student_id;
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (current_student_id, NULL, 'SELF_AUTO_REVOKE', jsonb_build_object('reason', 'Missing mandatory submission detected locally'));
        END IF;
        RETURN true;
    ELSE
        IF current_status = 'revoked' THEN
            UPDATE users SET status = 'active', updated_at = NOW() WHERE id = current_student_id;
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (current_student_id, NULL, 'SELF_AUTO_RESTORE', jsonb_build_object('reason', 'Conditions met locally'));
        END IF;
        RETURN false;
    END IF;
END;
$$;

-- 2. equip_item
CREATE OR REPLACE FUNCTION equip_item(item_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_record RECORD;
    user_id_val UUID := auth.uid();
BEGIN
    -- 1. Check if item exists and user owns it
    SELECT si.type, si.asset_value INTO item_record 
    FROM store_items si
    JOIN user_inventory ui ON si.id = ui.item_id
    WHERE si.id = item_id_param AND ui.user_id = user_id_val;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Item not owned or not found');
    END IF;

    -- 2. Update user profile based on item type
    IF item_record.type = 'theme' THEN
        UPDATE users SET equipped_theme = item_record.asset_value WHERE id = user_id_val;
    ELSIF item_record.type = 'banner' THEN
        UPDATE users SET equipped_banner = item_record.asset_value WHERE id = user_id_val;
    ELSIF item_record.type = 'avatar' THEN
        UPDATE users SET equipped_avatar = item_record.asset_value WHERE id = user_id_val;
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Unknown item type: ' || item_record.type);
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Equipped successfully');
END;
$$;

-- 3. award_points
CREATE OR REPLACE FUNCTION award_points(target_user_id UUID, amount INTEGER, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users SET points = points + amount WHERE id = target_user_id;
END;
$$;

-- 4. purchase_item
CREATE OR REPLACE FUNCTION purchase_item(item_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_points INTEGER;
    item_cost INTEGER;
    item_req_badge UUID;
    item_req_streak INTEGER;
    user_streak INTEGER;
    has_badge BOOLEAN;
    already_owned BOOLEAN;
BEGIN
    -- Check ownership
    SELECT EXISTS(SELECT 1 FROM user_inventory WHERE user_id = auth.uid() AND item_id = item_id_param)
    INTO already_owned;
    
    IF already_owned THEN
        RETURN jsonb_build_object('success', false, 'message', 'Item already owned');
    END IF;

    -- Get user stats
    SELECT points, current_streak INTO user_points, user_streak FROM users WHERE id = auth.uid();
    
    -- Get item details
    SELECT cost, required_badge_id, required_streak 
    INTO item_cost, item_req_badge, item_req_streak 
    FROM store_items WHERE id = item_id_param;

    -- Check cost
    IF user_points < item_cost THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient points');
    END IF;

    -- Check streak requirement
    IF item_req_streak IS NOT NULL AND user_streak < item_req_streak THEN
        RETURN jsonb_build_object('success', false, 'message', 'Streak requirement not met (' || item_req_streak || ' day streak needed)');
    END IF;

    -- Check badge requirement
    IF item_req_badge IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM user_badges WHERE user_id = auth.uid() AND badge_id = item_req_badge)
        INTO has_badge;
        
        IF NOT has_badge THEN
             RETURN jsonb_build_object('success', false, 'message', 'Badge requirement not met');
        END IF;
    END IF;

    -- Execute Purchase
    UPDATE users SET points = points - item_cost WHERE id = auth.uid();
    
    INSERT INTO user_inventory (user_id, item_id) VALUES (auth.uid(), item_id_param);

    RETURN jsonb_build_object('success', true, 'message', 'Purchase successful', 'new_balance', user_points - item_cost);
END;
$$;
