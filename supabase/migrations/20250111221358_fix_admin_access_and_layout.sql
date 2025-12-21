-- Location: supabase/migrations/20250111221358_fix_admin_access_and_layout.sql
-- Schema Analysis: Existing user_profiles table with user_role enum ['admin', 'manager', 'user']
-- Integration Type: Modificative - Adding admin user and updating auth metadata for role detection
-- Dependencies: Existing user_profiles table, is_admin_from_auth function

-- Add proper admin user with auth metadata for role detection
DO $$
DECLARE
    admin_user_id UUID := gen_random_uuid();
BEGIN
    -- Create admin user in auth.users with role in metadata
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES (
        admin_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'admin@propertyflow.com', crypt('admin123', gen_salt('bf', 10)), now(), 
        now(), now(),
        '{"full_name": "Admin User", "role": "admin"}'::jsonb, 
        '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    );

    -- Update existing user_profiles to set admin role
    INSERT INTO public.user_profiles (id, email, full_name, role, is_active, avatar_url, created_at, updated_at)
    VALUES (
        admin_user_id, 'admin@propertyflow.com', 'Admin User', 'admin'::user_role, 
        true, '', now(), now()
    ) ON CONFLICT (id) DO UPDATE SET 
        role = 'admin'::user_role,
        full_name = 'Admin User',
        updated_at = now();

    -- Update existing manager user to have proper auth metadata
    UPDATE auth.users 
    SET 
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb), 
            '{role}', 
            '"manager"'::jsonb
        ),
        raw_app_meta_data = jsonb_set(
            COALESCE(raw_app_meta_data, '{"provider": "email", "providers": ["email"]}'::jsonb), 
            '{role}', 
            '"manager"'::jsonb
        ),
        updated_at = now()
    WHERE email = 'manager@propertyflow.com';

    -- Update existing regular user to have proper auth metadata
    UPDATE auth.users 
    SET 
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb), 
            '{role}', 
            '"user"'::jsonb
        ),
        raw_app_meta_data = jsonb_set(
            COALESCE(raw_app_meta_data, '{"provider": "email", "providers": ["email"]}'::jsonb), 
            '{role}', 
            '"user"'::jsonb
        ),
        updated_at = now()
    WHERE email = 'user@propertyflow.com';

EXCEPTION
    WHEN unique_violation THEN
        -- Admin user already exists, just update metadata
        UPDATE auth.users 
        SET 
            raw_user_meta_data = jsonb_set(
                COALESCE(raw_user_meta_data, '{}'::jsonb), 
                '{role}', 
                '"admin"'::jsonb
            ),
            raw_app_meta_data = jsonb_set(
                COALESCE(raw_app_meta_data, '{"provider": "email", "providers": ["email"]}'::jsonb), 
                '{role}', 
                '"admin"'::jsonb
            ),
            updated_at = now()
        WHERE email = 'admin@propertyflow.com';

        -- Update user_profiles if needed
        INSERT INTO public.user_profiles (id, email, full_name, role, is_active, avatar_url, created_at, updated_at)
        SELECT au.id, au.email, 'Admin User', 'admin'::user_role, true, '', now(), now()
        FROM auth.users au 
        WHERE au.email = 'admin@propertyflow.com'
        ON CONFLICT (id) DO UPDATE SET 
            role = 'admin'::user_role,
            full_name = 'Admin User',
            updated_at = now();

    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating admin user: %', SQLERRM;
END $$;