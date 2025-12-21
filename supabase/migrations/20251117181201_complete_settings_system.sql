-- Location: supabase/migrations/20251117181201_complete_settings_system.sql
-- Schema Analysis: 20 existing tables (properties, user_profiles, etc.) - no settings tables
-- Integration Type: NEW_MODULE - Creating settings management system
-- Dependencies: user_profiles (existing)

-- 1. Create ENUM types for settings
CREATE TYPE public.setting_category AS ENUM (
    'api_keys', 'notifications', 'theme', 'localization', 
    'roles_access', 'backup_export', 'security', 'general'
);

CREATE TYPE public.setting_data_type AS ENUM (
    'text', 'password', 'boolean', 'json', 'number', 'url', 'email'
);

CREATE TYPE public.api_key_status AS ENUM (
    'connected', 'error', 'pending', 'syncing', 'disabled'
);

-- 2. Core settings table
CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    category public.setting_category NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    data_type public.setting_data_type DEFAULT 'text'::public.setting_data_type,
    is_encrypted BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, setting_key)
);

-- 3. API keys and integrations table
CREATE TABLE public.api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    additional_config JSONB DEFAULT '{}'::jsonb,
    status public.api_key_status DEFAULT 'pending'::public.api_key_status,
    last_tested_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service_name)
);

-- 4. Notification preferences table
CREATE TABLE public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    notification_frequency TEXT DEFAULT 'immediate',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 5. Theme and appearance settings
CREATE TABLE public.theme_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    theme_mode TEXT DEFAULT 'light',
    primary_color TEXT DEFAULT '#3b82f6',
    accent_color TEXT DEFAULT '#8b5cf6',
    font_size TEXT DEFAULT 'medium',
    sidebar_collapsed BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'en',
    currency TEXT DEFAULT 'USD',
    date_format TEXT DEFAULT 'MM/dd/yyyy',
    time_format TEXT DEFAULT '12h',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 6. Essential indexes
CREATE INDEX idx_app_settings_user_id ON public.app_settings(user_id);
CREATE INDEX idx_app_settings_category ON public.app_settings(category);
CREATE INDEX idx_api_integrations_user_id ON public.api_integrations(user_id);
CREATE INDEX idx_api_integrations_service ON public.api_integrations(service_name);
CREATE INDEX idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX idx_theme_settings_user_id ON public.theme_settings(user_id);

-- 7. Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Apply updated_at triggers
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_integrations_updated_at
    BEFORE UPDATE ON public.api_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_theme_settings_updated_at
    BEFORE UPDATE ON public.theme_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies - Pattern 2: Simple user ownership
CREATE POLICY "users_manage_own_app_settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_api_integrations"
ON public.api_integrations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_notification_settings"
ON public.notification_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_theme_settings"
ON public.theme_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 11. Mock data that references existing users
DO $$
DECLARE
    existing_user_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get existing user IDs from user_profiles
    SELECT id INTO existing_user_id FROM public.user_profiles WHERE email LIKE '%@%' LIMIT 1;
    SELECT id INTO admin_user_id FROM public.user_profiles WHERE role = 'admin' LIMIT 1;
    
    -- Use first available user ID
    IF existing_user_id IS NULL AND admin_user_id IS NOT NULL THEN
        existing_user_id := admin_user_id;
    END IF;
    
    -- Only create mock data if users exist
    IF existing_user_id IS NOT NULL THEN
        -- Sample API integrations
        INSERT INTO public.api_integrations (user_id, service_name, api_key, additional_config, status, last_tested_at)
        VALUES
            (existing_user_id, 'twilio', 'AC1234567890abcdef1234567890abcdef', 
             '{"phone_number": "+1234567890", "auth_token": "hidden"}'::jsonb, 
             'connected'::public.api_key_status, CURRENT_TIMESTAMP),
            (existing_user_id, 'resend', 're_1234567890abcdef1234567890abcdef', 
             '{"domain": "propertyflow.com"}'::jsonb, 
             'connected'::public.api_key_status, CURRENT_TIMESTAMP),
            (existing_user_id, 'google_sheets', 'client_id_1234567890', 
             '{"client_secret": "hidden", "refresh_token": "hidden"}'::jsonb, 
             'connected'::public.api_key_status, CURRENT_TIMESTAMP);

        -- Sample notification settings
        INSERT INTO public.notification_settings (user_id, email_notifications, sms_notifications, notification_frequency, timezone)
        VALUES
            (existing_user_id, true, false, 'immediate', 'America/New_York');

        -- Sample theme settings  
        INSERT INTO public.theme_settings (user_id, theme_mode, primary_color, language, currency)
        VALUES
            (existing_user_id, 'light', '#3b82f6', 'en', 'USD');

        -- Sample app settings
        INSERT INTO public.app_settings (user_id, category, setting_key, setting_value, data_type)
        VALUES
            (existing_user_id, 'security'::public.setting_category, 'two_factor_enabled', 'false', 'boolean'::public.setting_data_type),
            (existing_user_id, 'backup_export'::public.setting_category, 'auto_backup_enabled', 'true', 'boolean'::public.setting_data_type),
            (existing_user_id, 'general'::public.setting_category, 'default_property_type', 'apartment', 'text'::public.setting_data_type);
    ELSE
        RAISE NOTICE 'No existing users found. Settings mock data not created.';
    END IF;
END $$;