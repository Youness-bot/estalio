-- Location: supabase/migrations/20251116192300_fix_user_management_functions.sql
-- Schema Analysis: Existing user_profiles table and auth.users with user_role enum
-- Integration Type: Addition - Add missing functions for user management
-- Dependencies: user_profiles table, auth.users table, user_role enum

-- Create the missing function that the admin service is trying to call
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        up.id,
        up.email,
        up.full_name,
        up.role::TEXT,
        up.is_active,
        up.avatar_url,
        up.created_at,
        up.updated_at,
        au.email_confirmed_at,
        (au.email_confirmed_at IS NULL)::BOOLEAN as is_pending_invite
    FROM public.user_profiles up
    LEFT JOIN auth.users au ON up.id = au.id
    ORDER BY up.created_at DESC;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_all_users_with_auth_status: %', SQLERRM;
        RETURN;
END;
$function$;

-- Create enhanced admin function that returns proper response format
CREATE OR REPLACE FUNCTION public.admin_create_user_with_invite(
    user_email TEXT,
    user_full_name TEXT,
    user_role user_role DEFAULT 'user'::user_role
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    existing_user_id UUID;
    temp_password TEXT;
BEGIN
    -- Check if user already exists
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF existing_user_id IS NOT NULL THEN
        -- User exists, suggest recovery
        RETURN json_build_object(
            'success', true,
            'user_id', existing_user_id,
            'email', user_email,
            'message', 'User already exists, recovery link should be sent',
            'should_send_invite', false,
            'should_send_recovery', true
        );
    END IF;
    
    -- Generate temporary password for new user
    temp_password := substring(md5(random()::text) from 1 for 12);
    
    -- Use existing admin_create_user function
    DECLARE
        create_result JSON;
    BEGIN
        SELECT public.admin_create_user(
            user_email, 
            temp_password, 
            user_full_name, 
            user_role
        ) INTO create_result;
        
        -- Return formatted response for invite
        RETURN json_build_object(
            'success', true,
            'email', user_email,
            'message', 'User created successfully, invite link should be sent',
            'should_send_invite', true,
            'should_send_recovery', false
        );
    END;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$function$;

-- Grant execute permissions to authenticated users (admin functions)
GRANT EXECUTE ON FUNCTION public.get_all_users_with_auth_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user_with_invite(TEXT, TEXT, user_role) TO authenticated;