-- URGENT FIX: Protect Admins from Revocation System

-- 1. Optimized self-check (Standardized deadline check + Admin Exemption)
CREATE OR REPLACE FUNCTION check_and_revoke_self()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_student_id UUID;
    current_status TEXT;
    current_role TEXT;
    is_missing_submission BOOLEAN;
BEGIN
    current_student_id := auth.uid();
    IF current_student_id IS NULL THEN RETURN false; END IF;

    -- Fetch user details
    SELECT status, role INTO current_status, current_role FROM users WHERE id = current_student_id;
    
    -- VERY IMPORTANT: Admins can NEVER be revoked. Escape immediately.
    IF current_role = 'admin' THEN
        IF current_status = 'revoked' THEN
            -- Fix their status instantly if they got caught in the crossfire
            UPDATE users SET status = 'active', updated_at = NOW() WHERE id = current_student_id;
        END IF;
        RETURN false;
    END IF;

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
