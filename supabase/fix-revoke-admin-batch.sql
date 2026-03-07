CREATE OR REPLACE FUNCTION check_and_revoke_students()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_time TIMESTAMP WITH TIME ZONE := NOW();
    revoked_count INTEGER := 0;
    restored_count INTEGER := 0;
    revoked_emails TEXT[] := '{}';
    restored_emails TEXT[] := '{}';
BEGIN
    -- Identify students who SHOULD be revoked:
    WITH to_revoke AS (
        SELECT u.id
        FROM users u
        WHERE u.role != 'admin'  -- CRITICAL: EXCLUDE ADMINS HERE
          AND u.status = 'active'
          AND EXISTS (
             SELECT 1
             FROM phases p
             WHERE p.is_mandatory = true
               AND p.is_paused = false
               AND p.end_date < current_time
               AND NOT EXISTS (
                   SELECT 1 FROM submissions s 
                   WHERE s.phase_id = p.id AND s.student_id = u.id
               )
          )
    )
    UPDATE users u
    SET status = 'revoked', updated_at = NOW()
    FROM to_revoke
    WHERE u.id = to_revoke.id
    RETURNING u.email INTO revoked_emails;

    revoked_count := COALESCE(array_length(revoked_emails, 1), 0);
    
    -- Identify students who SHOULD be active:
    WITH to_restore AS (
        SELECT u.id
        FROM users u
        WHERE u.role != 'admin' -- EXCLUDE ADMINS
          AND u.status = 'revoked'
          AND NOT EXISTS (
             SELECT 1
             FROM phases p
             WHERE p.is_mandatory = true
               AND p.is_paused = false
               AND p.end_date < current_time
               AND NOT EXISTS (
                   SELECT 1 FROM submissions s 
                   WHERE s.phase_id = p.id AND s.student_id = u.id
               )
          )
    )
    UPDATE users u
    SET status = 'active', updated_at = NOW()
    FROM to_restore
    WHERE u.id = to_restore.id
    RETURNING u.email INTO restored_emails;

    restored_count := COALESCE(array_length(restored_emails, 1), 0);

    RETURN json_build_object(
        'timestamp', current_time,
        'revoked_count', revoked_count,
        'restored_count', restored_count,
        'revoked_emails', revoked_emails,
        'restored_emails', restored_emails
    );
END;
$$;
