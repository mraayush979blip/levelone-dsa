-- Refactored Revocation Logic: Optimized for CPU and end-of-day inclusive deadlines

-- 1. Optimized global revocation check (Set-based, no loops)
CREATE OR REPLACE FUNCTION check_and_revoke_students()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    revoked_count INTEGER := 0;
    restored_count INTEGER := 0;
    revoked_emails TEXT[] := '{}';
    restored_emails TEXT[] := '{}';
BEGIN
    -- Identify students who SHOULD be revoked:
    -- Active students missing a valid submission for a mandatory phase that ended BEFORE today's start
    -- (We treat end_date as the end of THAT day for inclusivity)
    
    -- STEP 1: Perform Bulk Revocation
    WITH to_revoke AS (
        SELECT u.id, u.email
        FROM users u
        WHERE u.role = 'student' 
          AND u.status = 'active'
          AND EXISTS (
              SELECT 1 FROM phases p
              WHERE (p.end_date + INTERVAL '23 hours 59 minutes 59 seconds') < NOW() 
                AND p.is_active = true
                AND p.is_mandatory = true
                AND NOT EXISTS (
                    SELECT 1 FROM submissions s
                    WHERE s.student_id = u.id
                      AND s.phase_id = p.id
                      AND s.status = 'valid'
                )
          )
    )
    UPDATE users u
    SET status = 'revoked', updated_at = NOW()
    FROM to_revoke
    WHERE u.id = to_revoke.id
    RETURNING u.email INTO revoked_emails;
    
    revoked_count := COALESCE(array_length(revoked_emails, 1), 0);

    -- STEP 2: Log Revocations (Selective Insert)
    IF revoked_count > 0 THEN
        INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
        SELECT u.id, NULL, 'SYSTEM_AUTO_REVOKE', jsonb_build_object('reason', 'Missing submission for mandatory ended phase (Optimized Batch)')
        FROM users u WHERE u.email = ANY(revoked_emails);
    END IF;

    -- STEP 3: Perform Bulk Restoration (Students who now meet all conditions)
    WITH to_restore AS (
        SELECT u.id, u.email
        FROM users u
        WHERE u.role = 'student' 
          AND u.status = 'revoked'
          AND NOT EXISTS (
              SELECT 1 FROM phases p
              WHERE (p.end_date + INTERVAL '23 hours 59 minutes 59 seconds') < NOW() 
                AND p.is_active = true
                AND p.is_mandatory = true
                AND NOT EXISTS (
                    SELECT 1 FROM submissions s
                    WHERE s.student_id = u.id
                      AND s.phase_id = p.id
                      AND s.status = 'valid'
                )
          )
    )
    UPDATE users u
    SET status = 'active', updated_at = NOW()
    FROM to_restore
    WHERE u.id = to_restore.id
    RETURNING u.email INTO restored_emails;

    restored_count := COALESCE(array_length(restored_emails, 1), 0);

    -- STEP 4: Log Restorations
    IF restored_count > 0 THEN
        INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
        SELECT u.id, NULL, 'SYSTEM_AUTO_RESTORE', jsonb_build_object('reason', 'All mandatory ended phases completed (Optimized Batch)')
        FROM users u WHERE u.email = ANY(restored_emails);
    END IF;

    RETURN jsonb_build_object(
        'revoked_count', revoked_count,
        'restored_count', restored_count,
        'revoked_emails', revoked_emails,
        'restored_emails', restored_emails
    );
END;
$$;

-- 2. Optimized self-check (Standardized deadline check)
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
