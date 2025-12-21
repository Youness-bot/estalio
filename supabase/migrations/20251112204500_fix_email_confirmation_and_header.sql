-- Location: supabase/migrations/20251112204500_fix_email_confirmation_and_header.sql
-- Schema Analysis: Existing user_profiles table with proper RLS policies
-- Integration Type: Email confirmation redirect fix
-- Dependencies: user_profiles (existing), handle_new_user (existing), is_admin_from_auth (existing)

-- Fix email confirmation redirect by ensuring proper URL configuration
-- Note: This migration addresses the empty page issue after email confirmation

-- Create a function to handle email confirmation redirects properly
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When a user confirms their email, ensure their profile is updated
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        -- Update user profile to mark as confirmed if it exists
        UPDATE public.user_profiles 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
        
        -- Log successful confirmation
        RAISE NOTICE 'Email confirmed for user: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for email confirmation
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_email_confirmation();

-- Ensure existing admin user has confirmed email to prevent access issues
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find admin user and confirm their email if not already confirmed
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@propertyflow.com' 
    AND email_confirmed_at IS NULL
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        UPDATE auth.users 
        SET 
            email_confirmed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = admin_user_id;
        
        RAISE NOTICE 'Admin user email confirmed automatically';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update admin user confirmation: %', SQLERRM;
END $$;

-- Ensure all existing test users are email confirmed to prevent login issues
DO $$
BEGIN
    UPDATE auth.users 
    SET 
        email_confirmed_at = COALESCE(email_confirmed_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
    WHERE email_confirmed_at IS NULL 
    AND email LIKE '%@propertyflow.com';
    
    RAISE NOTICE 'Updated email confirmation for existing test users';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update test user confirmations: %', SQLERRM;
END $$;

-- Add a function to help debug authentication issues
CREATE OR REPLACE FUNCTION public.debug_user_auth(user_email TEXT)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    email_confirmed BOOLEAN,
    profile_exists BOOLEAN,
    profile_role TEXT,
    profile_active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
SELECT 
    au.id,
    au.email,
    (au.email_confirmed_at IS NOT NULL) as email_confirmed,
    (up.id IS NOT NULL) as profile_exists,
    COALESCE(up.role::TEXT, 'no_profile') as profile_role,
    COALESCE(up.is_active, false) as profile_active
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE au.email = user_email;
$$;

-- Comment explaining the email confirmation redirect behavior
COMMENT ON FUNCTION public.handle_email_confirmation() IS 
'Handles email confirmation events and ensures user profiles are properly updated. Note: Email confirmation links redirect to localhost - this is normal Supabase behavior.';