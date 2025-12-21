-- Location: supabase/migrations/20251112202000_admin_user_creation_endpoint.sql
-- Schema Analysis: Existing user_profiles table with handle_new_user trigger
-- Integration Type: Enhancement - Add admin user creation capability
-- Dependencies: user_profiles table, handle_new_user trigger

-- Add service_role key environment variable (if not exists)
-- This will be used by the server endpoint for admin operations

-- Create admin function for user creation via service_role key
CREATE OR REPLACE FUNCTION public.admin_create_user(
    user_email TEXT,
    user_password TEXT,
    user_full_name TEXT DEFAULT '',
    user_role public.user_role DEFAULT 'user'::public.user_role,
    user_avatar_url TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Generate UUID for new user
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users with complete fields
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
        now(), 
        now(), 
        now(),
        json_build_object(
            'full_name', user_full_name,
            'role', user_role::TEXT,
            'avatar_url', user_avatar_url
        )::jsonb,
        json_build_object(
            'provider', 'email', 
            'providers', array['email']
        )::jsonb,
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    );
    
    -- The handle_new_user trigger will automatically create user_profiles entry
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', user_email,
        'message', 'User created successfully'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Email already exists'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.admin_create_user TO service_role;

-- Create RLS policy to allow service_role to manage auth operations
CREATE POLICY "service_role_admin_access" ON public.user_profiles
FOR ALL TO service_role USING (true) WITH CHECK (true);