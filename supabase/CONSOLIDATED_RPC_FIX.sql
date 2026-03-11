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
