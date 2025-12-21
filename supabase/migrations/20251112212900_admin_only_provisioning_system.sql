-- Location: supabase/migrations/20251112212900_admin_only_provisioning_system.sql
-- Schema Analysis: Existing user_profiles table, user_role enum, admin functions exist
-- Integration Type: Enhancement - Admin-only provisioning system
-- Dependencies: user_profiles, user_role, admin_create_user function

-- 1. Update admin_create_user function for proper invite/recovery flow
CREATE OR REPLACE FUNCTION public.admin_create_user(
    user_email text, 
    user_password text, 
    user_full_name text DEFAULT ''::text, 
    user_role user_role DEFAULT 'user'::user_role, 
    user_avatar_url text DEFAULT ''::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    new_user_id UUID;
    existing_user_id UUID;
    result JSON;
BEGIN
    -- Check if user already exists
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF existing_user_id IS NOT NULL THEN
        -- User exists, generate recovery link instead of failing
        RETURN json_build_object(
            'success', true,
            'user_id', existing_user_id,
            'email', user_email,
            'message', 'User already exists, recovery link should be sent',
            'action', 'recovery'
        );
    END IF;
    
    -- Generate UUID for new user
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users with complete fields (email_confirmed_at = NULL for invite flow)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES (
        new_user_id, 
        '00000000-0000-0000-0000-000000000000', 
        'authenticated', 
        'authenticated',
        user_email, 
        crypt(user_password, gen_salt('bf', 10)), 
        NULL, -- NULL for invite flow, user needs to confirm
        now(), 
        now(),
        json_build_object(
            'full_name', user_full_name,
            'role', user_role::TEXT,
            'avatar_url', user_avatar_url
        )::jsonb,
        json_build_object(
            'role', user_role::TEXT,
            'provider', 'email', 
            'providers', array['email']
        )::jsonb,
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    );
    
    -- The handle_new_user trigger will automatically create user_profiles entry
    
    -- Return success result with invite action
    result := json_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', user_email,
        'message', 'User created successfully, invite link should be sent',
        'action', 'invite'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition where user was created between check and insert
        SELECT id INTO existing_user_id 
        FROM auth.users 
        WHERE email = user_email;
        
        RETURN json_build_object(
            'success', true,
            'user_id', existing_user_id,
            'email', user_email,
            'message', 'User already exists, recovery link should be sent',
            'action', 'recovery'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$function$;

-- 2. Create enhanced admin service function for invite/recovery links
CREATE OR REPLACE FUNCTION public.admin_invite_user(
    user_email text,
    user_full_name text DEFAULT ''::text,
    user_role user_role DEFAULT 'user'::user_role,
    redirect_to text DEFAULT '/auth/callback'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    temp_password text;
    create_result json;
    existing_user_id UUID;
BEGIN
    -- Generate a temporary password for user creation
    temp_password := substring(md5(random()::text) from 1 for 12);
    
    -- Use admin_create_user to create or check existing user
    SELECT public.admin_create_user(
        user_email, 
        temp_password, 
        user_full_name, 
        user_role
    ) INTO create_result;
    
    -- Always return success - let the client handle invite/recovery link generation
    RETURN json_build_object(
        'success', true,
        'email', user_email,
        'message', 'User processed successfully',
        'should_send_invite', (create_result->>'action' = 'invite'),
        'should_send_recovery', (create_result->>'action' = 'recovery'),
        'redirect_to', redirect_to
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$function$;

-- 3. Create function to get all users with auth status (for admin user listing)
CREATE OR REPLACE FUNCTION public.get_all_users_with_auth_status()
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    is_active BOOLEAN,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    is_pending_invite BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
SELECT 
    COALESCE(up.id, au.id) as id,
    COALESCE(up.email, au.email) as email,
    COALESCE(up.full_name, au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    COALESCE(up.role::TEXT, au.raw_user_meta_data->>'role', au.raw_app_meta_data->>'role', 'user') as role,
    COALESCE(up.is_active, true) as is_active,
    COALESCE(up.avatar_url, au.raw_user_meta_data->>'avatar_url', '') as avatar_url,
    COALESCE(up.created_at, au.created_at) as created_at,
    COALESCE(up.updated_at, au.updated_at) as updated_at,
    au.email_confirmed_at,
    (au.email_confirmed_at IS NULL) as is_pending_invite
FROM auth.users au
FULL OUTER JOIN public.user_profiles up ON au.id = up.id
WHERE au.email IS NOT NULL
ORDER BY COALESCE(up.created_at, au.created_at) DESC;
$function$;

-- 4. Update is_admin_from_auth function to be more robust
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (
        au.raw_user_meta_data->>'role' = 'admin' 
        OR au.raw_app_meta_data->>'role' = 'admin'
        OR au.email = 'admin@propertyflow.com'
        OR EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = au.id AND up.role = 'admin'
        )
    )
)
$function$;

-- 5. Create a better RLS policy for user_profiles that handles admin access
DROP POLICY IF EXISTS "admin_full_access_user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- Admin access using auth.users metadata (safe pattern)
CREATE POLICY "admin_full_access_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Users can read/edit own profile
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 6. Ensure we have a real admin user with proper JWT metadata
DO $$
DECLARE
    admin_uuid UUID;
    existing_admin UUID;
BEGIN
    -- Check if admin already exists
    SELECT id INTO existing_admin 
    FROM auth.users 
    WHERE email = 'admin@propertyflow.com';
    
    IF existing_admin IS NULL THEN
        -- Create new admin
        admin_uuid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES (
            admin_uuid, 
            '00000000-0000-0000-0000-000000000000', 
            'authenticated', 
            'authenticated',
            'admin@propertyflow.com', 
            crypt('admin123', gen_salt('bf', 10)), 
            now(), -- Confirmed admin
            now(), 
            now(),
            json_build_object(
                'full_name', 'Administrator',
                'role', 'admin',
                'avatar_url', ''
            )::jsonb,
            json_build_object(
                'role', 'admin',
                'provider', 'email', 
                'providers', array['email']
            )::jsonb,
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );
        
        RAISE NOTICE 'Created admin user: admin@propertyflow.com / admin123';
    ELSE
        -- Update existing admin to ensure proper metadata
        UPDATE auth.users 
        SET 
            raw_user_meta_data = json_build_object(
                'full_name', 'Administrator',
                'role', 'admin',
                'avatar_url', ''
            )::jsonb,
            raw_app_meta_data = json_build_object(
                'role', 'admin',
                'provider', 'email', 
                'providers', array['email']
            )::jsonb,
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE id = existing_admin;
        
        RAISE NOTICE 'Updated existing admin user metadata';
    END IF;
    
    -- Ensure profile exists and is correctly set
    INSERT INTO public.user_profiles (id, email, full_name, role, is_active, avatar_url)
    VALUES (
        COALESCE(admin_uuid, existing_admin),
        'admin@propertyflow.com',
        'Administrator',
        'admin'::public.user_role,
        true,
        ''
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin'::public.user_role,
        full_name = 'Administrator',
        is_active = true,
        updated_at = now();
        
END $$;

-- 7. Create demo users as requested (persist in DB)
DO $$
DECLARE
    manager_uuid UUID;
    user_uuid UUID;
    existing_manager UUID;
    existing_user UUID;
BEGIN
    -- Check and create manager
    SELECT id INTO existing_manager 
    FROM auth.users 
    WHERE email = 'manager@propertyflow.com';
    
    IF existing_manager IS NULL THEN
        manager_uuid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES (
            manager_uuid, 
            '00000000-0000-0000-0000-000000000000', 
            'authenticated', 
            'authenticated',
            'manager@propertyflow.com', 
            crypt('manager123', gen_salt('bf', 10)), 
            now(),
            now(), 
            now(),
            json_build_object(
                'full_name', 'Manager User',
                'role', 'manager',
                'avatar_url', ''
            )::jsonb,
            json_build_object(
                'role', 'manager',
                'provider', 'email', 
                'providers', array['email']
            )::jsonb,
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );
        
        INSERT INTO public.user_profiles (id, email, full_name, role, is_active, avatar_url)
        VALUES (manager_uuid, 'manager@propertyflow.com', 'Manager User', 'manager'::public.user_role, true, '');
    END IF;
    
    -- Check and create regular user
    SELECT id INTO existing_user 
    FROM auth.users 
    WHERE email = 'user@propertyflow.com';
    
    IF existing_user IS NULL THEN
        user_uuid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES (
            user_uuid, 
            '00000000-0000-0000-0000-000000000000', 
            'authenticated', 
            'authenticated',
            'user@propertyflow.com', 
            crypt('user123', gen_salt('bf', 10)), 
            now(),
            now(), 
            now(),
            json_build_object(
                'full_name', 'Regular User',
                'role', 'user',
                'avatar_url', ''
            )::jsonb,
            json_build_object(
                'role', 'user',
                'provider', 'email', 
                'providers', array['email']
            )::jsonb,
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );
        
        INSERT INTO public.user_profiles (id, email, full_name, role, is_active, avatar_url)
        VALUES (user_uuid, 'user@propertyflow.com', 'Regular User', 'user'::public.user_role, true, '');
    END IF;
    
END $$;

-- 8. Create notification about auth settings
DO $$
BEGIN
    RAISE NOTICE '=== ADMIN-ONLY PROVISIONING SYSTEM IMPLEMENTED ===';
    RAISE NOTICE 'Next steps required in Supabase Dashboard:';
    RAISE NOTICE '1. Go to Authentication > Settings';
    RAISE NOTICE '2. DISABLE "Enable email confirmations"';
    RAISE NOTICE '3. Set Site URL to your production domain';
    RAISE NOTICE '4. Add your domain to "Redirect URLs"';
    RAISE NOTICE '5. Remove localhost URLs for production';
    RAISE NOTICE '=== DEMO CREDENTIALS ===';
    RAISE NOTICE 'Admin: admin@propertyflow.com / admin123';
    RAISE NOTICE 'Manager: manager@propertyflow.com / manager123';
    RAISE NOTICE 'User: user@propertyflow.com / user123';
END $$;