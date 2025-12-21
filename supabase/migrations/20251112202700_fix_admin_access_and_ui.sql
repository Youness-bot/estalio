-- Location: supabase/migrations/20251112202700_fix_admin_access_and_ui.sql
-- Schema Analysis: Existing user_profiles table with user_role enum (admin, manager, user)
-- Integration Type: Modification - Adding admin user for access fix
-- Dependencies: user_profiles table, auth.users table, is_admin_from_auth function

-- Create admin user to fix access denied issue
DO $$
DECLARE
    admin_user_id UUID := gen_random_uuid();
BEGIN
    -- Create admin user in auth.users with complete structure
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES (
        admin_user_id, 
        '00000000-0000-0000-0000-000000000000', 
        'authenticated', 
        'authenticated',
        'admin@propertyflow.com', 
        crypt('admin123', gen_salt('bf', 10)), 
        now(), 
        now(), 
        now(),
        json_build_object('full_name', 'Administrator', 'role', 'admin')::jsonb,
        json_build_object('provider', 'email', 'providers', array['email'])::jsonb,
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    );

    -- Create user profile for admin (matches existing sample data pattern)
    INSERT INTO public.user_profiles (
        id, email, full_name, role, is_active, avatar_url, created_at, updated_at
    ) VALUES (
        admin_user_id,
        'admin@propertyflow.com',
        'Administrator',
        'admin'::public.user_role,
        true,
        '',
        now(),
        now()
    );

    -- Success notice
    RAISE NOTICE 'Admin user created successfully: admin@propertyflow.com / admin123';
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Admin user already exists, skipping creation';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating admin user: %', SQLERRM;
END $$;

-- Update existing manager and user passwords for consistency
DO $$
BEGIN
    -- Update manager password to be consistent
    UPDATE auth.users 
    SET encrypted_password = crypt('manager123', gen_salt('bf', 10))
    WHERE email = 'manager@propertyflow.com';

    -- Update user password to be consistent  
    UPDATE auth.users 
    SET encrypted_password = crypt('user123', gen_salt('bf', 10))
    WHERE email = 'user@propertyflow.com';

    RAISE NOTICE 'Updated existing user credentials for consistency';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating existing passwords: %', SQLERRM;
END $$;

-- Add a cleanup function for testing purposes
CREATE OR REPLACE FUNCTION public.cleanup_test_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function can be used to clean up test data if needed
    DELETE FROM public.user_profiles WHERE email LIKE '%@propertyflow.com';
    DELETE FROM auth.users WHERE email LIKE '%@propertyflow.com';
    RAISE NOTICE 'Test users cleaned up successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during cleanup: %', SQLERRM;
END $$;