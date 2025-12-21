-- Location: supabase/migrations/20251117181501_complete_audit_log_system.sql
-- Schema Analysis: Existing PropertyFlow schema with user_profiles, properties, reservations, tasks, expenses, etc.
-- Integration Type: Addition of audit logging system
-- Dependencies: user_profiles (existing), properties (existing), reservations (existing)

-- 1. Create audit log related enums
CREATE TYPE public.audit_action AS ENUM (
    'login', 'logout', 'create', 'update', 'delete', 'view', 'export', 
    'import', 'approve', 'reject', 'restore', 'archive', 'invite', 'suspend'
);

CREATE TYPE public.audit_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE public.audit_entity_type AS ENUM (
    'user', 'property', 'reservation', 'task', 'expense', 'team_member', 
    'pricing_rule', 'automation', 'settings', 'report', 'inventory_item'
);

-- 2. Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action public.audit_action NOT NULL,
    entity_type public.audit_entity_type,
    entity_id UUID,
    entity_name TEXT,
    details TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    severity public.audit_severity DEFAULT 'medium'::public.audit_severity,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX idx_audit_logs_success ON public.audit_logs(success);

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_user_action ON public.audit_logs(user_id, action, created_at DESC);
CREATE INDEX idx_audit_logs_entity_lookup ON public.audit_logs(entity_type, entity_id, created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies using Pattern 2 (Simple User Ownership) for regular access
-- Users can view their own audit logs
CREATE POLICY "users_view_own_audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 6. Create admin access using Pattern 6A (Auth metadata based)
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'admin' 
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- Admin can view all audit logs
CREATE POLICY "admin_view_all_audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin_from_auth());

-- Only system can insert audit logs (via service functions)
CREATE POLICY "system_insert_audit_logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin_from_auth());

-- 7. Create audit logging helper function
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action public.audit_action,
    p_entity_type public.audit_entity_type DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_entity_name TEXT DEFAULT NULL,
    p_details TEXT DEFAULT '',
    p_severity public.audit_severity DEFAULT 'medium',
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    log_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Insert audit log entry
    INSERT INTO public.audit_logs (
        user_id, action, entity_type, entity_id, entity_name, 
        details, metadata, severity, ip_address, user_agent, 
        session_id, success, created_at
    ) VALUES (
        current_user_id, p_action, p_entity_type, p_entity_id, p_entity_name,
        p_details, p_metadata, p_severity, p_ip_address, p_user_agent,
        p_session_id, p_success, CURRENT_TIMESTAMP
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$func$;

-- 8. Create function to get audit statistics
CREATE OR REPLACE FUNCTION public.get_audit_statistics(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_events BIGINT,
    login_events BIGINT,
    critical_events BIGINT,
    failed_events BIGINT,
    unique_users BIGINT,
    most_active_user TEXT,
    most_common_action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE al.action = 'login') as login_events,
        COUNT(*) FILTER (WHERE al.severity = 'critical') as critical_events,
        COUNT(*) FILTER (WHERE al.success = false) as failed_events,
        COUNT(DISTINCT al.user_id) as unique_users,
        (
            SELECT up.full_name
            FROM public.audit_logs al2
            JOIN public.user_profiles up ON al2.user_id = up.id
            WHERE al2.created_at::date BETWEEN p_start_date AND p_end_date
            GROUP BY up.full_name, al2.user_id
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_active_user,
        (
            SELECT al3.action::text
            FROM public.audit_logs al3
            WHERE al3.created_at::date BETWEEN p_start_date AND p_end_date
            GROUP BY al3.action
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_common_action
    FROM public.audit_logs al
    WHERE al.created_at::date BETWEEN p_start_date AND p_end_date
    AND (al.user_id = auth.uid() OR public.is_admin_from_auth());
END;
$func$;

-- 9. Create cleanup function for old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Only admins can cleanup audit logs
    IF NOT public.is_admin_from_auth() THEN
        RAISE EXCEPTION 'Only administrators can cleanup audit logs';
    END IF;
    
    DELETE FROM public.audit_logs
    WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup action
    PERFORM public.log_audit_event(
        'delete'::public.audit_action,
        'audit_log'::public.audit_entity_type,
        NULL,
        'Old audit logs',
        format('Cleaned up %s old audit log entries older than %s days', deleted_count, days_to_keep),
        'medium'::public.audit_severity
    );
    
    RETURN deleted_count;
END;
$func$;

-- 10. Create sample audit log data
DO $$
DECLARE
    admin_user_id UUID;
    regular_user_id UUID;
    sample_property_id UUID;
    sample_reservation_id UUID;
BEGIN
    -- Get existing user IDs from user_profiles
    SELECT id INTO admin_user_id FROM public.user_profiles WHERE role = 'admin' LIMIT 1;
    SELECT id INTO regular_user_id FROM public.user_profiles WHERE role = 'user' LIMIT 1;
    
    -- Get some existing entity IDs for realistic audit logs
    SELECT id INTO sample_property_id FROM public.properties LIMIT 1;
    SELECT id INTO sample_reservation_id FROM public.reservations LIMIT 1;
    
    -- Only create sample data if we have users
    IF admin_user_id IS NOT NULL AND regular_user_id IS NOT NULL THEN
        -- Sample audit logs for various activities
        INSERT INTO public.audit_logs (
            user_id, action, entity_type, entity_id, entity_name, 
            details, severity, ip_address, user_agent, session_id, success, created_at
        ) VALUES
            -- Login activities
            (admin_user_id, 'login', 'user', admin_user_id, 'Admin User', 
             'User successfully logged into the system', 'low', '192.168.1.100'::inet, 
             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc123def456', true, 
             CURRENT_TIMESTAMP - INTERVAL '2 hours'),
             
            (regular_user_id, 'login', 'user', regular_user_id, 'Property Manager', 
             'User successfully logged into the system', 'low', '192.168.1.105'::inet, 
             'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz789ghi012', true, 
             CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
             
            -- Property management activities
            (admin_user_id, 'create', 'property', sample_property_id, 'Villa Sunset', 
             'Created new property listing', 'medium', '192.168.1.100'::inet, 
             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc123def456', true, 
             CURRENT_TIMESTAMP - INTERVAL '1 hour'),
             
            -- Reservation activities
            (regular_user_id, 'create', 'reservation', sample_reservation_id, 'Booking #12345', 
             'New reservation confirmed for Villa Sunset', 'medium', '192.168.1.105'::inet, 
             'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'sess_xyz789ghi012', true, 
             CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
             
            -- Settings changes
            (admin_user_id, 'update', 'settings', NULL, 'Notification Settings', 
             'Updated email notification preferences', 'low', '192.168.1.100'::inet, 
             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc123def456', true, 
             CURRENT_TIMESTAMP - INTERVAL '20 minutes'),
             
            -- Export activity
            (admin_user_id, 'export', 'report', NULL, 'Revenue Report', 
             'Exported revenue report for November 2024', 'medium', '192.168.1.100'::inet, 
             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc123def456', true, 
             CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
             
            -- Failed login attempt (security event)
            (NULL, 'login', 'user', NULL, 'Unknown User', 
             'Failed login attempt with invalid credentials', 'high', '203.0.113.42'::inet, 
             'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', NULL, false, 
             CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
             
            -- Critical security event
            (admin_user_id, 'update', 'user', regular_user_id, 'Property Manager', 
             'Changed user role from user to manager', 'critical', '192.168.1.100'::inet, 
             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'sess_abc123def456', true, 
             CURRENT_TIMESTAMP - INTERVAL '15 minutes');
             
        RAISE NOTICE 'Sample audit log data created successfully';
    ELSE
        RAISE NOTICE 'No existing users found. Sample audit data not created.';
    END IF;
END $$;