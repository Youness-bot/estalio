-- Fix admin user access and UI issues
-- Migration: 20250111222816_fix_admin_user_and_ui_issues.sql

-- Drop any existing problematic RLS policies first
DROP POLICY IF EXISTS "admin_full_access_user_profiles" ON public.user_profiles;

-- Create admin user function that uses auth.users metadata (avoid circular dependency)
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
         OR au.raw_app_meta_data->>'role' = 'admin'
         OR au.email = 'admin@propertyflow.com')
)
$$;

-- Create safe admin access policy using auth.users metadata
CREATE POLICY "admin_full_access_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Create admin user in auth.users with proper error handling
DO $$
DECLARE
    admin_user_id uuid;
    existing_admin_id uuid;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO existing_admin_id 
    FROM auth.users 
    WHERE email = 'admin@propertyflow.com';

    IF existing_admin_id IS NULL THEN
        -- Insert new admin user without ON CONFLICT (email doesn't have unique constraint)
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@propertyflow.com',
            crypt('Admin123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"], "role": "admin"}',
            '{"full_name": "Admin User", "role": "admin"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO admin_user_id;
        
        RAISE NOTICE 'New admin user created with ID: %', admin_user_id;
    ELSE
        -- Update existing admin user
        UPDATE auth.users 
        SET 
            encrypted_password = crypt('Admin123!', gen_salt('bf')),
            raw_app_meta_data = '{"provider": "email", "providers": ["email"], "role": "admin"}',
            raw_user_meta_data = '{"full_name": "Admin User", "role": "admin"}',
            updated_at = NOW()
        WHERE id = existing_admin_id;
        
        admin_user_id := existing_admin_id;
        RAISE NOTICE 'Existing admin user updated with ID: %', admin_user_id;
    END IF;

    -- Insert or update user profile for admin
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'admin@propertyflow.com',
        'Admin User',
        'admin',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        full_name = 'Admin User',
        is_active = true,
        updated_at = NOW();

    RAISE NOTICE 'Admin user profile created/updated successfully';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating admin user: %', SQLERRM;
END $$;

-- Grant execute permission on the admin check function
GRANT EXECUTE ON FUNCTION public.is_admin_from_auth() TO authenticated;

-- Final completion notice
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Admin user setup and RLS policies configured';
END $$;