-- Location: supabase/migrations/20251116214623_complete_pricing_rules_system.sql
-- Schema Analysis: Properties and user_profiles exist, need to add pricing rules functionality
-- Integration Type: NEW_MODULE - Creating new pricing rules tables
-- Dependencies: properties (via property_id), user_profiles (via user_id)

-- 1. Create pricing rule types
CREATE TYPE public.pricing_rule_type AS ENUM ('seasonal', 'occupancy', 'advance', 'lastminute', 'event', 'length_of_stay');
CREATE TYPE public.adjustment_type AS ENUM ('percentage', 'fixed');
CREATE TYPE public.day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- 2. Create pricing rules table
CREATE TABLE public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rule_type public.pricing_rule_type NOT NULL,
    adjustment_type public.adjustment_type NOT NULL,
    adjustment_value DECIMAL(10,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    min_stay INTEGER,
    advance_booking_days INTEGER,
    occupancy_threshold INTEGER,
    priority INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create junction table for pricing rules and properties (many-to-many)
CREATE TABLE public.pricing_rule_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricing_rule_id UUID REFERENCES public.pricing_rules(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pricing_rule_id, property_id)
);

-- 4. Create pricing rule day restrictions
CREATE TABLE public.pricing_rule_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricing_rule_id UUID REFERENCES public.pricing_rules(id) ON DELETE CASCADE,
    day_of_week public.day_of_week NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pricing_rule_id, day_of_week)
);

-- 5. Create rule impact analytics table
CREATE TABLE public.rule_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricing_rule_id UUID REFERENCES public.pricing_rules(id) ON DELETE CASCADE,
    date_applied DATE NOT NULL,
    bookings_affected INTEGER DEFAULT 0,
    revenue_change DECIMAL(10,2) DEFAULT 0,
    avg_rate_change DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pricing_rule_id, date_applied)
);

-- 6. Create occupancy snapshots table
CREATE TABLE public.occupancy_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    overall_occupancy DECIMAL(5,2) DEFAULT 0,
    property_occupancy JSONB,
    active_rules JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, snapshot_date)
);

-- 7. Essential Indexes
CREATE INDEX idx_pricing_rules_user_id ON public.pricing_rules(user_id);
CREATE INDEX idx_pricing_rules_type ON public.pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_active ON public.pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_dates ON public.pricing_rules(start_date, end_date);
CREATE INDEX idx_pricing_rule_properties_rule ON public.pricing_rule_properties(pricing_rule_id);
CREATE INDEX idx_pricing_rule_properties_property ON public.pricing_rule_properties(property_id);
CREATE INDEX idx_pricing_rule_days_rule ON public.pricing_rule_days(pricing_rule_id);
CREATE INDEX idx_rule_analytics_rule ON public.rule_analytics(pricing_rule_id);
CREATE INDEX idx_rule_analytics_date ON public.rule_analytics(date_applied);
CREATE INDEX idx_occupancy_snapshots_user ON public.occupancy_snapshots(user_id);
CREATE INDEX idx_occupancy_snapshots_date ON public.occupancy_snapshots(snapshot_date);

-- 8. Add triggers for updated_at
CREATE TRIGGER update_pricing_rules_updated_at
    BEFORE UPDATE ON public.pricing_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Enable RLS
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rule_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rule_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_snapshots ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies (Pattern 2: Simple User Ownership)
CREATE POLICY "users_manage_own_pricing_rules"
ON public.pricing_rules
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_pricing_rule_properties"
ON public.pricing_rule_properties
FOR ALL
TO authenticated
USING (pricing_rule_id IN (
    SELECT id FROM public.pricing_rules WHERE user_id = auth.uid()
))
WITH CHECK (pricing_rule_id IN (
    SELECT id FROM public.pricing_rules WHERE user_id = auth.uid()
));

CREATE POLICY "users_manage_own_pricing_rule_days"
ON public.pricing_rule_days
FOR ALL
TO authenticated
USING (pricing_rule_id IN (
    SELECT id FROM public.pricing_rules WHERE user_id = auth.uid()
))
WITH CHECK (pricing_rule_id IN (
    SELECT id FROM public.pricing_rules WHERE user_id = auth.uid()
));

CREATE POLICY "users_manage_own_rule_analytics"
ON public.rule_analytics
FOR ALL
TO authenticated
USING (pricing_rule_id IN (
    SELECT id FROM public.pricing_rules WHERE user_id = auth.uid()
))
WITH CHECK (pricing_rule_id IN (
    SELECT id FROM public.pricing_rules WHERE user_id = auth.uid()
));

CREATE POLICY "users_manage_own_occupancy_snapshots"
ON public.occupancy_snapshots
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 11. Helper functions for analytics
CREATE OR REPLACE FUNCTION public.calculate_rule_effectiveness()
RETURNS TABLE(
    rule_id UUID,
    rule_name TEXT,
    total_bookings INTEGER,
    total_revenue DECIMAL(10,2),
    avg_impact DECIMAL(5,2)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT 
    pr.id,
    pr.name,
    COALESCE(SUM(ra.bookings_affected), 0)::INTEGER,
    COALESCE(SUM(ra.revenue_change), 0),
    COALESCE(AVG(ra.avg_rate_change), 0)
FROM public.pricing_rules pr
LEFT JOIN public.rule_analytics ra ON pr.id = ra.pricing_rule_id
WHERE pr.user_id = auth.uid()
GROUP BY pr.id, pr.name;
$$;

-- 12. Mock data using existing users and properties
DO $$
DECLARE
    existing_user_id UUID;
    existing_property1_id UUID;
    existing_property2_id UUID;
    rule1_id UUID := gen_random_uuid();
    rule2_id UUID := gen_random_uuid();
    rule3_id UUID := gen_random_uuid();
    property_data JSONB;
    rules_data JSONB;
BEGIN
    -- Get existing user and properties
    SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
    SELECT id INTO existing_property1_id FROM public.properties LIMIT 1;
    SELECT id INTO existing_property2_id FROM public.properties OFFSET 1 LIMIT 1;
    
    -- Only proceed if we have existing data
    IF existing_user_id IS NOT NULL AND existing_property1_id IS NOT NULL THEN
        -- Insert sample pricing rules
        INSERT INTO public.pricing_rules (id, user_id, name, description, rule_type, adjustment_type, adjustment_value, start_date, end_date, min_stay, priority, is_active) VALUES
            (rule1_id, existing_user_id, 'Summer Peak Season', 'Increase rates during high-demand summer months', 'seasonal'::public.pricing_rule_type, 'percentage'::public.adjustment_type, 25, '2024-06-15', '2024-08-31', 3, 8, true),
            (rule2_id, existing_user_id, 'High Occupancy Boost', 'Dynamic pricing when occupancy exceeds 80%', 'occupancy'::public.pricing_rule_type, 'percentage'::public.adjustment_type, 15, '2024-01-01', '2024-12-31', null, 6, true),
            (rule3_id, existing_user_id, 'Weekend Premium', 'Higher rates for Friday and Saturday nights', 'seasonal'::public.pricing_rule_type, 'percentage'::public.adjustment_type, 20, '2024-01-01', '2024-12-31', null, 7, true);
        
        -- Link rules to properties
        INSERT INTO public.pricing_rule_properties (pricing_rule_id, property_id) VALUES
            (rule1_id, existing_property1_id),
            (rule2_id, existing_property1_id),
            (rule3_id, existing_property1_id);
        
        -- Add weekend rule days
        INSERT INTO public.pricing_rule_days (pricing_rule_id, day_of_week) VALUES
            (rule3_id, 'friday'::public.day_of_week),
            (rule3_id, 'saturday'::public.day_of_week);
        
        -- Add sample analytics
        INSERT INTO public.rule_analytics (pricing_rule_id, date_applied, bookings_affected, revenue_change, avg_rate_change) VALUES
            (rule1_id, CURRENT_DATE - INTERVAL '30 days', 47, 12450.00, 22.5),
            (rule2_id, CURRENT_DATE - INTERVAL '15 days', 23, 5680.00, 13.2),
            (rule3_id, CURRENT_DATE - INTERVAL '7 days', 89, 8920.00, 18.7);
        
        -- Build JSON data properly using jsonb_build functions
        property_data := jsonb_build_object(
            'properties', jsonb_build_array(
                jsonb_build_object(
                    'id', existing_property1_id,
                    'name', 'Property 1',
                    'rate', 85
                )
            )
        );
        
        rules_data := jsonb_build_object(
            'active', jsonb_build_array(
                jsonb_build_object(
                    'rule', 'Summer Peak Season',
                    'adjustment', 25
                )
            )
        );
        
        -- Add occupancy snapshot with properly constructed JSON
        INSERT INTO public.occupancy_snapshots (user_id, snapshot_date, overall_occupancy, property_occupancy, active_rules) VALUES
            (existing_user_id, CURRENT_DATE, 73.5, property_data, rules_data);
    ELSE
        RAISE NOTICE 'No existing users or properties found. Please create users and properties first.';
    END IF;
END $$;