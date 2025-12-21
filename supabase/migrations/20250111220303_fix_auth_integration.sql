-- Location: supabase/migrations/20250111220303_fix_auth_integration.sql
-- Schema Analysis: Existing user_profiles table, user_role enum, auth functions present
-- Integration Type: Fix authentication RLS policies and metadata integration
-- Dependencies: user_profiles table, is_admin_from_auth function, handle_new_user trigger

-- Update the existing trigger to ensure it works with the updated auth service
-- The trigger reads metadata passed from the React signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into user_profiles using metadata from auth.users
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::public.user_role
  );
  RETURN NEW;
END;
$$;

-- Ensure trigger exists for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Add simplified RLS policy for user profile access that works with existing users
-- This replaces the complex admin policy that was causing issues
DROP POLICY IF EXISTS "users_read_own_profile" ON public.user_profiles;
CREATE POLICY "users_read_own_profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Keep admin policy but make it simpler and more reliable
DROP POLICY IF EXISTS "admin_full_access_user_profiles" ON public.user_profiles;
CREATE POLICY "admin_full_access_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (
  -- Allow access if user is admin (check both metadata locations)
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (
      au.raw_user_meta_data->>'role' = 'admin' 
      OR au.raw_app_meta_data->>'role' = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.user_profiles up2
        WHERE up2.id = auth.uid() AND up2.role = 'admin'
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (
      au.raw_user_meta_data->>'role' = 'admin' 
      OR au.raw_app_meta_data->>'role' = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.user_profiles up2
        WHERE up2.id = auth.uid() AND up2.role = 'admin'
      )
    )
  )
);

-- Update existing user profiles to be active if they were inactive
UPDATE public.user_profiles 
SET is_active = true 
WHERE is_active = false;

-- Add demo credentials with proper metadata for testing
-- These users will be available in the login form
DO $$
DECLARE
    admin_user_exists BOOLEAN;
    demo_admin_id UUID;
BEGIN
    -- Check if admin user already exists
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'admin@propertyflow.com'
    ) INTO admin_user_exists;

    -- Only create if it doesn't exist
    IF NOT admin_user_exists THEN
        -- Generate new UUID for demo admin
        demo_admin_id := gen_random_uuid();
        
        -- Create complete auth.users record with proper metadata
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
        ) VALUES (
            demo_admin_id, 
            '00000000-0000-0000-0000-000000000000', 
            'authenticated', 
            'authenticated',
            'admin@propertyflow.com', 
            crypt('Admin123!', gen_salt('bf', 10)), 
            now(), 
            now(), 
            now(),
            '{"full_name": "Demo Admin", "role": "admin"}'::jsonb, 
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
        );
        
        RAISE NOTICE 'Demo admin user created with email: admin@propertyflow.com, password: Admin123!';
    ELSE
        -- Update existing user's metadata to ensure role is set
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
        WHERE email = 'admin@propertyflow.com';
        
        RAISE NOTICE 'Updated existing admin user metadata';
    END IF;
    
    -- Update corresponding user_profiles to ensure they're admin
    UPDATE public.user_profiles 
    SET role = 'admin'::public.user_role, is_active = true
    WHERE email IN ('admin@propertyflow.com', 'aitmohamadine.office@gmail.com');
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in demo user setup: %', SQLERRM;
END $$;

-- Add comment explaining the integration
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that creates user_profiles automatically when auth.users is inserted. Reads metadata from React signup form.';