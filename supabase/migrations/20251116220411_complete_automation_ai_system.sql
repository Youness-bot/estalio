-- Schema Analysis: Existing PropertyFlow schema with user_profiles, properties, reservations
-- Integration Type: NEW_MODULE - Complete automation and AI system
-- Dependencies: user_profiles (existing), properties (existing), reservations (existing)

-- Create ENUMs for automation and AI system
CREATE TYPE public.template_type AS ENUM ('whatsapp', 'email', 'sms', 'push_notification');
CREATE TYPE public.template_category AS ENUM ('checkin', 'checkout', 'welcome', 'followup', 'recommendations', 'confirmations', 'reminders');
CREATE TYPE public.workflow_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE public.trigger_type AS ENUM ('booking_confirmed', 'checkin_time', 'checkout_time', 'guest_message', 'manual', 'scheduled');
CREATE TYPE public.ai_generation_status AS ENUM ('pending', 'generating', 'completed', 'failed');

-- Core automation tables
CREATE TABLE public.automation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_type public.template_type NOT NULL,
    category public.template_category NOT NULL,
    subject TEXT, -- For email templates
    content TEXT NOT NULL,
    variables JSONB DEFAULT '{}'::JSONB, -- Template variables like {{guestName}}
    is_public BOOLEAN DEFAULT false, -- Allow sharing between users
    usage_count INTEGER DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT, -- Original prompt used for AI generation
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.automation_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type public.trigger_type NOT NULL,
    trigger_conditions JSONB DEFAULT '{}'::JSONB, -- Conditions for when to trigger
    template_id UUID REFERENCES public.automation_templates(id) ON DELETE SET NULL,
    delay_minutes INTEGER DEFAULT 0, -- Delay before sending
    status public.workflow_status DEFAULT 'draft'::public.workflow_status,
    is_active BOOLEAN DEFAULT false,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.ai_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    template_type public.template_type NOT NULL,
    category public.template_category,
    generated_content TEXT,
    status public.ai_generation_status DEFAULT 'pending'::public.ai_generation_status,
    error_message TEXT,
    model_used TEXT DEFAULT 'gpt-5-mini',
    tokens_used INTEGER,
    generation_time_ms INTEGER,
    template_id UUID REFERENCES public.automation_templates(id) ON DELETE SET NULL, -- If saved as template
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.automation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.automation_templates(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES public.automation_workflows(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    delivery_status TEXT DEFAULT 'sent', -- sent, delivered, failed, bounced
    error_details JSONB,
    recipient_info JSONB -- Guest contact info, device info, etc
);

-- Essential indexes
CREATE INDEX idx_automation_templates_user_id ON public.automation_templates(user_id);
CREATE INDEX idx_automation_templates_category ON public.automation_templates(category);
CREATE INDEX idx_automation_templates_type ON public.automation_templates(template_type);
CREATE INDEX idx_automation_templates_public ON public.automation_templates(is_public) WHERE is_public = true;

CREATE INDEX idx_automation_workflows_user_id ON public.automation_workflows(user_id);
CREATE INDEX idx_automation_workflows_status ON public.automation_workflows(status);
CREATE INDEX idx_automation_workflows_trigger ON public.automation_workflows(trigger_type);
CREATE INDEX idx_automation_workflows_active ON public.automation_workflows(is_active) WHERE is_active = true;

CREATE INDEX idx_ai_generation_history_user_id ON public.ai_generation_history(user_id);
CREATE INDEX idx_ai_generation_history_status ON public.ai_generation_history(status);
CREATE INDEX idx_ai_generation_history_created ON public.ai_generation_history(created_at);

CREATE INDEX idx_automation_analytics_user_id ON public.automation_analytics(user_id);
CREATE INDEX idx_automation_analytics_template ON public.automation_analytics(template_id);
CREATE INDEX idx_automation_analytics_sent_date ON public.automation_analytics(sent_at);

-- Enable RLS
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies using Pattern 2 (Simple User Ownership)
CREATE POLICY "users_manage_own_automation_templates"
ON public.automation_templates
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow reading public templates
CREATE POLICY "users_can_read_public_templates"
ON public.automation_templates
FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "users_manage_own_automation_workflows"
ON public.automation_workflows
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_ai_generation_history"
ON public.ai_generation_history
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_automation_analytics"
ON public.automation_analytics
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Utility functions for automation
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER automation_templates_updated_at
    BEFORE UPDATE ON public.automation_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER automation_workflows_updated_at
    BEFORE UPDATE ON public.automation_workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get automation stats
CREATE OR REPLACE FUNCTION public.get_automation_stats(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(
    total_templates INTEGER,
    active_workflows INTEGER,
    total_sent INTEGER,
    delivery_rate NUMERIC,
    ai_generations INTEGER
) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
AS $$
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.automation_templates WHERE user_id = user_uuid),
        (SELECT COUNT(*)::INTEGER FROM public.automation_workflows WHERE user_id = user_uuid AND is_active = true),
        (SELECT COUNT(*)::INTEGER FROM public.automation_analytics WHERE user_id = user_uuid),
        (SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE delivery_status = 'delivered')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            END
         FROM public.automation_analytics WHERE user_id = user_uuid),
        (SELECT COUNT(*)::INTEGER FROM public.ai_generation_history WHERE user_id = user_uuid AND status = 'completed')
$$;

-- Mock data for automation and AI system
DO $$
DECLARE
    existing_user_id UUID;
    existing_property_id UUID;
    template1_id UUID := gen_random_uuid();
    template2_id UUID := gen_random_uuid();
    template3_id UUID := gen_random_uuid();
    template4_id UUID := gen_random_uuid();
    workflow1_id UUID := gen_random_uuid();
    workflow2_id UUID := gen_random_uuid();
BEGIN
    -- Get existing user and property IDs
    SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
    SELECT id INTO existing_property_id FROM public.properties LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        -- Insert automation templates
        INSERT INTO public.automation_templates (id, user_id, name, description, template_type, category, subject, content, variables, is_ai_generated, ai_prompt)
        VALUES
            (template1_id, existing_user_id, 'Welcome Message', 'Automated greeting for new bookings', 'whatsapp'::public.template_type, 'welcome'::public.template_category, NULL,
             'Hello {{guestName}}! 🏖️' || chr(10) || chr(10) || 'Welcome to {{propertyName}}! We are excited to host you.' || chr(10) || chr(10) || 'Your booking details:' || chr(10) || '📅 Check-in: {{checkInDate}}' || chr(10) || '📅 Check-out: {{checkOutDate}}' || chr(10) || chr(10) || 'We will send check-in instructions 24 hours before your arrival.' || chr(10) || chr(10) || 'Best regards,' || chr(10) || 'PropertyFlow Team',
             '{"guestName": "Guest name", "propertyName": "Property name", "checkInDate": "Check-in date", "checkOutDate": "Check-out date"}'::JSONB, true, 'Create a friendly WhatsApp welcome message for new property bookings'),
            
            (template2_id, existing_user_id, 'Check-in Instructions', 'Detailed arrival information and property access', 'email'::public.template_type, 'checkin'::public.template_category, 'Your Check-in Instructions for {{propertyName}}',
             'Dear {{guestName}},' || chr(10) || chr(10) || 'We hope you are excited about your upcoming stay! Here are your check-in details:' || chr(10) || chr(10) || '🏠 Property: {{propertyName}}' || chr(10) || '📍 Address: {{propertyAddress}}' || chr(10) || '🔑 Access Code: {{accessCode}}' || chr(10) || '⏰ Check-in: After 3:00 PM' || chr(10) || '⏰ Check-out: Before 11:00 AM' || chr(10) || chr(10) || 'Important Notes:' || chr(10) || '• WiFi Password: {{wifiPassword}}' || chr(10) || '• Parking: {{parkingInstructions}}' || chr(10) || '• Emergency Contact: {{emergencyContact}}' || chr(10) || chr(10) || 'Local Recommendations:' || chr(10) || '🍽️ Restaurant: Ocean Breeze Café (2 blocks away)' || chr(10) || '🛒 Grocery: Fresh Market (5 min walk)' || chr(10) || '🏖️ Beach Access: Sunset Beach (3 min walk)' || chr(10) || chr(10) || 'If you have any questions, please do not hesitate to reach out!' || chr(10) || chr(10) || 'Warm regards,' || chr(10) || 'The PropertyFlow Team',
             '{"guestName": "Guest name", "propertyName": "Property name", "propertyAddress": "Property address", "accessCode": "Access code", "wifiPassword": "WiFi password", "parkingInstructions": "Parking info", "emergencyContact": "Emergency number"}'::JSONB, true, 'Generate comprehensive email check-in instructions with property details and local recommendations'),
             
            (template3_id, existing_user_id, 'Check-out Reminder', 'Friendly checkout process and feedback request', 'whatsapp'::public.template_type, 'checkout'::public.template_category, NULL,
             'Hi {{guestName}}! 👋' || chr(10) || chr(10) || 'We hope you enjoyed your stay at {{propertyName}}!' || chr(10) || chr(10) || 'Just a friendly reminder:' || chr(10) || '⏰ Check-out is at 11:00 AM today' || chr(10) || '🔑 Please leave the keys inside and lock the door' || chr(10) || '🧹 No need to clean - our team will handle it' || chr(10) || chr(10) || 'We would love your feedback! Please consider leaving us a review.' || chr(10) || chr(10) || 'Thank you for choosing us! 🌟' || chr(10) || chr(10) || 'Safe travels,' || chr(10) || 'PropertyFlow Team',
             '{"guestName": "Guest name", "propertyName": "Property name"}'::JSONB, true, 'Create a friendly checkout reminder with review request'),
             
            (template4_id, existing_user_id, 'Post-Stay Follow-up', 'Thank you message with review request and future offers', 'email'::public.template_type, 'followup'::public.template_category, 'Thank You for Staying with Us! 🌟',
             'Dear {{guestName}},' || chr(10) || chr(10) || 'Thank you for choosing {{propertyName}} for your recent stay. We hope you had a wonderful time!' || chr(10) || chr(10) || 'Your Experience Matters:' || chr(10) || 'We would be grateful if you could share your experience by leaving a review. Your feedback helps us improve and assists future guests.' || chr(10) || chr(10) || '📝 Leave a Review: {{reviewLink}}' || chr(10) || chr(10) || 'Special Offer for Your Next Stay:' || chr(10) || 'As a valued guest, enjoy 10% off your next booking with code: WELCOME10' || chr(10) || chr(10) || 'Stay Connected:' || chr(10) || '📧 Email: hello@propertyflow.com' || chr(10) || '📱 WhatsApp: +1 (555) 123-4567' || chr(10) || '🌐 Website: www.propertyflow.com' || chr(10) || chr(10) || 'We look forward to welcoming you back soon!' || chr(10) || chr(10) || 'Warm regards,' || chr(10) || 'The PropertyFlow Team',
             '{"guestName": "Guest name", "propertyName": "Property name", "reviewLink": "Review URL"}'::JSONB, true, 'Generate a post-stay follow-up email with review request and return offer');

        -- Insert automation workflows
        INSERT INTO public.automation_workflows (id, user_id, name, description, trigger_type, trigger_conditions, template_id, delay_minutes, status, is_active)
        VALUES
            (workflow1_id, existing_user_id, 'Welcome New Guests', 'Send welcome message when booking is confirmed', 'booking_confirmed'::public.trigger_type, '{"property_types": ["all"], "booking_source": ["all"]}'::JSONB, template1_id, 30, 'active'::public.workflow_status, true),
            (workflow2_id, existing_user_id, 'Check-in Instructions', 'Send check-in details 24 hours before arrival', 'checkin_time'::public.trigger_type, '{"hours_before": 24}'::JSONB, template2_id, 0, 'active'::public.workflow_status, true);

        -- Insert AI generation history
        INSERT INTO public.ai_generation_history (user_id, prompt, template_type, category, generated_content, status, model_used, tokens_used, generation_time_ms, template_id)
        VALUES
            (existing_user_id, 'Create a friendly WhatsApp welcome message for new property bookings', 'whatsapp'::public.template_type, 'welcome'::public.template_category, 'Generated welcome message content', 'completed'::public.ai_generation_status, 'gpt-5-mini', 150, 2500, template1_id),
            (existing_user_id, 'Generate comprehensive email check-in instructions with property details', 'email'::public.template_type, 'checkin'::public.template_category, 'Generated check-in instructions', 'completed'::public.ai_generation_status, 'gpt-5-mini', 300, 3200, template2_id),
            (existing_user_id, 'Create a checkout reminder with feedback request', 'whatsapp'::public.template_type, 'checkout'::public.template_category, 'Generated checkout reminder', 'completed'::public.ai_generation_status, 'gpt-5-mini', 180, 2800, template3_id);

        -- Insert sample analytics data
        INSERT INTO public.automation_analytics (user_id, template_id, workflow_id, property_id, sent_at, delivered_at, opened_at, delivery_status, recipient_info)
        VALUES
            (existing_user_id, template1_id, workflow1_id, existing_property_id, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '5 minutes', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '1 hour', 'delivered', '{"guest_phone": "+1234567890", "guest_name": "John Doe"}'::JSONB),
            (existing_user_id, template2_id, workflow2_id, existing_property_id, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '2 minutes', CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '30 minutes', 'delivered', '{"guest_email": "john@example.com", "guest_name": "John Doe"}'::JSONB),
            (existing_user_id, template1_id, workflow1_id, existing_property_id, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours' + INTERVAL '1 minute', NULL, 'delivered', '{"guest_phone": "+1987654321", "guest_name": "Jane Smith"}'::JSONB);
    ELSE
        RAISE NOTICE 'No existing users found. Please run auth migration first or create users manually.';
    END IF;
END $$;

-- Cleanup function for test data
CREATE OR REPLACE FUNCTION public.cleanup_automation_test_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete test automation data
    DELETE FROM public.automation_analytics WHERE recipient_info->>'guest_email' LIKE '%@example.com';
    DELETE FROM public.ai_generation_history WHERE prompt LIKE '%Create a%' OR prompt LIKE '%Generate%';
    DELETE FROM public.automation_workflows WHERE name LIKE '%New Guests%' OR name LIKE '%Check-in Instructions%';
    DELETE FROM public.automation_templates WHERE ai_prompt IS NOT NULL AND ai_prompt LIKE '%Create%';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Automation cleanup failed: %', SQLERRM;
END;
$$;