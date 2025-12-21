-- Fixed Admin-Only Provisioning System Implementation
-- File: 20251112214800_complete_admin_provisioning_system.sql

-- Remove auth.users manipulation from database functions
-- All user creation must happen via Supabase Admin API with service_role

-- DROP problematic functions that try to access auth.users
DROP FUNCTION IF EXISTS admin_create_user_with_invite(TEXT, TEXT, user_role);
DROP FUNCTION IF EXISTS get_all_users_with_auth_status();

-- Enhanced is_admin function that checks JWT and profiles
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has admin role in JWT or profiles
    RETURN (
        (auth.jwt() ->> 'role' = 'admin') OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile info (accessible via RLS)
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    role user_role,
    is_active BOOLEAN,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- If no user_id provided, use current user
    IF user_id IS NULL THEN
        user_id := auth.uid();
    END IF;
    
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.full_name,
        up.role,
        up.is_active,
        up.avatar_url,
        up.created_at,
        up.updated_at
    FROM user_profiles up
    WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create comprehensive users view for admin access (read-only)
CREATE OR REPLACE VIEW users_with_auth_view AS
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.is_active,
    up.avatar_url,
    up.created_at,
    up.updated_at,
    au.email_confirmed_at,
    au.last_sign_in_at,
    (au.email_confirmed_at IS NULL) as is_pending_invite,
    (au.email_confirmed_at IS NOT NULL AND up.is_active = true) as is_fully_active
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id;

-- Grant read access to the view for authenticated users
GRANT SELECT ON users_with_auth_view TO authenticated;

-- Updated RLS policies for enhanced security
DROP POLICY IF EXISTS "admin_full_access_user_profiles" ON user_profiles;
CREATE POLICY "admin_full_access_user_profiles" 
ON user_profiles 
FOR ALL 
TO authenticated 
USING (
    is_admin() = true
) 
WITH CHECK (
    is_admin() = true
);

-- Policy for users to manage their own profile
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON user_profiles;
CREATE POLICY "users_manage_own_user_profiles" 
ON user_profiles 
FOR ALL 
TO authenticated 
USING (
    id = auth.uid() AND NOT is_admin()
) 
WITH CHECK (
    id = auth.uid() AND NOT is_admin()
);

-- Service role policy (for admin operations via API)
DROP POLICY IF EXISTS "service_role_admin_access" ON user_profiles;
CREATE POLICY "service_role_admin_access" 
ON user_profiles 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Function to document auth settings (informational only)
CREATE OR REPLACE FUNCTION get_auth_settings_info()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Required auth settings (configure in Supabase dashboard):
    1. Site URL: Update to production domain (not localhost)
    2. Redirect URLs: Add production/auth/callback
    3. Disable public signups in Auth settings
    4. Enable email confirmations
    5. Set up SMTP for email delivery
    
    User creation must be done via adminService.js using service_role key and Supabase Admin API.';
END;
$$ LANGUAGE plpgsql;

-- Helper function for profile management (service_role only)
CREATE OR REPLACE FUNCTION upsert_user_profile(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT,
    user_role user_role DEFAULT 'user'
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Only allow service_role to call this function
    IF current_setting('role') != 'service_role' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Access denied: service_role required'
        );
    END IF;

    -- Upsert the profile
    INSERT INTO user_profiles (
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        user_email,
        user_full_name,
        user_role,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    result := json_build_object(
        'success', true,
        'user_id', user_id,
        'email', user_email,
        'role', user_role,
        'message', 'Profile created/updated successfully'
    );
    
    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin profile manually (without touching auth.users)
-- This assumes the admin user will be created via Supabase Admin API
DO $$
DECLARE
    admin_email TEXT := 'admin@propertyflow.com';
BEGIN
    -- Create/update admin profile (user must exist in auth.users first via Admin API)
    INSERT INTO user_profiles (
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(), -- This will be replaced when real admin user is created
        admin_email,
        'Administrator',
        'admin',
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        is_active = true,
        updated_at = NOW();

    RAISE NOTICE 'Admin profile prepared. Create auth user via Admin API: %', admin_email;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_settings_info TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_profile TO service_role;

-- Add useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active ON user_profiles(role, is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed admin provisioning system - auth.users management moved to Admin API';
END $$;