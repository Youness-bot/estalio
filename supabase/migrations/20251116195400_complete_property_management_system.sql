-- Location: supabase/migrations/20251116195400_complete_property_management_system.sql
-- Schema Analysis: Existing user_profiles table with user management functions
-- Integration Type: Extension - Adding complete property management system
-- Dependencies: user_profiles (existing table)

-- 1. ENUMS AND TYPES (Create all needed types first)
DO $$ BEGIN
    CREATE TYPE public.property_type AS ENUM ('apartment', 'villa', 'house', 'studio', 'penthouse', 'riad');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.property_status AS ENUM ('available', 'occupied', 'maintenance', 'cleaning', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.booking_channel AS ENUM ('direct', 'airbnb', 'booking', 'expedia', 'vrbo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.expense_category AS ENUM ('maintenance', 'cleaning', 'utilities', 'supplies', 'marketing', 'insurance', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.inventory_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'discontinued');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'partial', 'refunded', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CORE BUSINESS TABLES

-- Properties Table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    property_code TEXT UNIQUE NOT NULL,
    property_type public.property_type NOT NULL,
    status public.property_status DEFAULT 'available'::public.property_status,
    location TEXT NOT NULL,
    address TEXT,
    area_sqm INTEGER,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    max_guests INTEGER DEFAULT 1,
    base_price DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    amenities TEXT[],
    image_url TEXT,
    image_alt TEXT,
    is_published BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Property Images Table (for multiple images per property)
CREATE TABLE public.property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_alt TEXT,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Reservations Table
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_code TEXT UNIQUE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER NOT NULL,
    adults INTEGER DEFAULT 1,
    children INTEGER DEFAULT 0,
    total_guests INTEGER NOT NULL,
    booking_channel public.booking_channel DEFAULT 'direct'::public.booking_channel,
    status public.reservation_status DEFAULT 'pending'::public.reservation_status,
    gross_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 15.00,
    special_requests TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL,
    priority public.task_priority DEFAULT 'medium'::public.task_priority,
    status public.task_status DEFAULT 'pending'::public.task_status,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category public.expense_category NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    expense_date DATE NOT NULL,
    vendor_name TEXT,
    receipt_url TEXT,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Items Table
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    sku TEXT UNIQUE,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 100,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    supplier_name TEXT,
    supplier_contact TEXT,
    status public.inventory_status DEFAULT 'in_stock'::public.inventory_status,
    location TEXT,
    last_restock_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Movements Table (track stock changes)
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    reason TEXT,
    reference_id UUID, -- could link to task, expense, etc.
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Team Members Table (extends user management)
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    employee_id TEXT UNIQUE,
    position TEXT NOT NULL,
    department TEXT,
    hire_date DATE,
    salary DECIMAL(10,2),
    hourly_rate DECIMAL(8,2),
    phone_number TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Revenue Analytics Table (for dashboard metrics)
CREATE TABLE public.revenue_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    occupancy_rate DECIMAL(5,2) DEFAULT 0,
    avg_daily_rate DECIMAL(10,2) DEFAULT 0,
    total_nights INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_type ON public.properties(property_type);
CREATE INDEX idx_properties_published ON public.properties(is_published);

CREATE INDEX idx_reservations_property_id ON public.reservations(property_id);
CREATE INDEX idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX idx_reservations_dates ON public.reservations(check_in_date, check_out_date);
CREATE INDEX idx_reservations_status ON public.reservations(status);

CREATE INDEX idx_tasks_property_id ON public.tasks(property_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX idx_expenses_property_id ON public.expenses(property_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(category);

CREATE INDEX idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX idx_inventory_items_property_id ON public.inventory_items(property_id);
CREATE INDEX idx_inventory_items_status ON public.inventory_items(status);

CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_manager_id ON public.team_members(manager_id);

-- 4. UTILITY FUNCTIONS (Create BEFORE RLS policies)
CREATE OR REPLACE FUNCTION public.calculate_revenue_metrics(property_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE(
    total_revenue DECIMAL,
    occupancy_rate DECIMAL,
    total_nights INTEGER,
    total_bookings INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(r.net_amount), 0)::DECIMAL as total_revenue,
        CASE 
            WHEN (end_date - start_date) > 0 
            THEN (COALESCE(SUM(r.nights), 0)::DECIMAL / (end_date - start_date)) * 100
            ELSE 0::DECIMAL
        END as occupancy_rate,
        COALESCE(SUM(r.nights), 0)::INTEGER as total_nights,
        COUNT(r.id)::INTEGER as total_bookings
    FROM public.reservations r
    WHERE r.property_id = property_uuid
    AND r.check_in_date >= start_date
    AND r.check_out_date <= end_date
    AND r.status IN ('confirmed', 'completed');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_property_availability(property_uuid UUID, start_date DATE, end_date DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.property_id = property_uuid
        AND r.status IN ('confirmed', 'active')
        AND (
            (r.check_in_date <= start_date AND r.check_out_date > start_date) OR
            (r.check_in_date < end_date AND r.check_out_date >= end_date) OR
            (r.check_in_date >= start_date AND r.check_out_date <= end_date)
        )
    );
END;
$$;

-- 5. RLS POLICIES (Enable RLS first, then create policies)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;

-- Properties RLS Policies
CREATE POLICY "users_manage_own_properties"
ON public.properties
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Property Images RLS Policies  
CREATE POLICY "users_manage_own_property_images"
ON public.property_images
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id AND p.user_id = auth.uid()
    )
);

-- Reservations RLS Policies
CREATE POLICY "users_manage_own_reservations"
ON public.reservations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Tasks RLS Policies  
CREATE POLICY "users_manage_related_tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id AND p.user_id = auth.uid()
    )
);

-- Expenses RLS Policies
CREATE POLICY "users_manage_own_expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Inventory Items RLS Policies
CREATE POLICY "users_manage_own_inventory"
ON public.inventory_items
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Inventory Movements RLS Policies
CREATE POLICY "users_manage_own_inventory_movements"
ON public.inventory_movements
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Team Members RLS Policies
CREATE POLICY "users_manage_own_team"
ON public.team_members
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = user_id AND up.id = auth.uid()
    ) OR
    manager_id = auth.uid()
);

-- Revenue Analytics RLS Policies
CREATE POLICY "users_view_own_revenue_analytics"
ON public.revenue_analytics
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. MOCK DATA FOR PROPERTY MANAGEMENT SYSTEM
DO $$
DECLARE
    existing_user_id UUID;
    manager_user_id UUID;
    property1_id UUID := gen_random_uuid();
    property2_id UUID := gen_random_uuid();
    property3_id UUID := gen_random_uuid();
    property4_id UUID := gen_random_uuid();
    property5_id UUID := gen_random_uuid();
    property6_id UUID := gen_random_uuid();
    reservation1_id UUID := gen_random_uuid();
    reservation2_id UUID := gen_random_uuid();
    reservation3_id UUID := gen_random_uuid();
    reservation4_id UUID := gen_random_uuid();
    reservation5_id UUID := gen_random_uuid();
BEGIN
    -- Get existing user IDs from user_profiles
    SELECT id INTO existing_user_id FROM public.user_profiles WHERE role = 'admin' LIMIT 1;
    SELECT id INTO manager_user_id FROM public.user_profiles WHERE role = 'manager' LIMIT 1;
    
    -- If no users exist, create notice
    IF existing_user_id IS NULL THEN
        RAISE NOTICE 'No existing users found. Please create users first or run auth migration.';
        RETURN;
    END IF;
    
    -- Insert Properties
    INSERT INTO public.properties (id, user_id, name, property_code, property_type, status, location, address, area_sqm, bedrooms, bathrooms, max_guests, base_price, description, amenities, image_url, image_alt, is_published) VALUES
        (property1_id, existing_user_id, 'Luxury Downtown Apartment', 'APM001', 'apartment', 'available', 'Marrakech', '123 Avenue Mohammed V, Marrakech', 120, 2, 2, 4, 180.00, 'Modern luxury apartment in the heart of Marrakech with stunning city views', ARRAY['wifi', 'air_conditioning', 'kitchen', 'parking', 'balcony'], 'https://images.unsplash.com/photo-1633579435183-478eecbee160', 'Modern luxury apartment exterior with glass balconies and contemporary architecture in downtown Marrakech', true),
        (property2_id, existing_user_id, 'Seaside Villa Paradise', 'VLA002', 'villa', 'occupied', 'Agadir', '456 Corniche Agadir, Agadir', 250, 4, 3, 8, 290.00, 'Stunning seaside villa with private beach access and panoramic ocean views', ARRAY['wifi', 'air_conditioning', 'kitchen', 'pool', 'beach_access', 'garden'], 'https://images.unsplash.com/photo-1662740104417-446738851c1c', 'Elegant seaside villa with white walls, blue shutters, and ocean view terrace in Agadir', true),
        (property3_id, existing_user_id, 'Cozy Studio Central', 'STU003', 'studio', 'cleaning', 'Casablanca', '789 Boulevard Hassan II, Casablanca', 45, 1, 1, 2, 80.00, 'Compact and modern studio apartment in central Casablanca, perfect for business travelers', ARRAY['wifi', 'air_conditioning', 'kitchenette', 'workspace'], 'https://images.unsplash.com/photo-1722604676716-5c0135828a5d', 'Compact modern studio apartment with open floor plan and large windows in central Casablanca', true),
        (property4_id, existing_user_id, 'Traditional Riad House', 'HOU004', 'riad', 'maintenance', 'Fes', '321 Medina Quarter, Fes', 180, 3, 2, 6, 150.00, 'Authentic Moroccan riad with traditional architecture and modern amenities in historic Fes', ARRAY['wifi', 'air_conditioning', 'traditional_decor', 'courtyard', 'rooftop'], 'https://images.unsplash.com/photo-1730058644367-75f1fe90a17c', 'Traditional Moroccan riad house with ornate tilework, arched doorways, and central courtyard in Fes', false),
        (property5_id, existing_user_id, 'Modern Penthouse Suite', 'PEN005', 'penthouse', 'available', 'Rabat', '654 Quartier Hassan, Rabat', 200, 3, 2, 6, 250.00, 'Luxurious penthouse suite with panoramic city views and premium amenities in Rabat', ARRAY['wifi', 'air_conditioning', 'kitchen', 'balcony', 'city_view', 'elevator'], 'https://images.unsplash.com/photo-1616523816854-914829241e25', 'Luxurious penthouse suite with floor-to-ceiling windows and panoramic city views in Rabat', true),
        (property6_id, existing_user_id, 'Charming Garden Apartment', 'APG006', 'apartment', 'available', 'Marrakech', '987 Gueliz District, Marrakech', 95, 2, 1, 3, 120.00, 'Charming apartment with private garden access in the trendy Gueliz district of Marrakech', ARRAY['wifi', 'air_conditioning', 'kitchen', 'garden', 'parking'], 'https://images.unsplash.com/photo-1703303055466-d8b4da3a6ce9', 'Charming apartment with private garden terrace, outdoor seating, and lush greenery in Marrakech', true);
    
    -- Insert Reservations
    INSERT INTO public.reservations (id, reservation_code, property_id, user_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, nights, adults, children, total_guests, booking_channel, status, gross_amount, net_amount, commission_rate, special_requests) VALUES
        (reservation1_id, 'RSV001', property1_id, existing_user_id, 'Sarah Johnson', 'sarah.johnson@email.com', '+1 555 0123', '2024-11-20', '2024-11-25', 5, 2, 1, 3, 'airbnb', 'confirmed', 900.00, 765.00, 15.00, 'Late check-in requested'),
        (reservation2_id, 'RSV002', property2_id, existing_user_id, 'Mohammed Al-Rashid', 'm.alrashid@email.com', '+971 50 123 4567', '2024-11-18', '2024-11-25', 7, 4, 2, 6, 'direct', 'confirmed', 2030.00, 2030.00, 0.00, 'Airport transfer needed'),
        (reservation3_id, 'RSV003', property3_id, existing_user_id, 'Emma Thompson', 'emma.thompson@email.com', '+44 20 7946 0958', '2024-11-22', '2024-11-28', 6, 2, 0, 2, 'booking', 'pending', 480.00, 408.00, 15.00, 'Vegetarian welcome basket'),
        (reservation4_id, 'RSV004', property5_id, existing_user_id, 'Jean-Pierre Dubois', 'jp.dubois@email.com', '+33 1 42 86 83 26', '2024-11-12', '2024-11-16', 4, 3, 1, 4, 'expedia', 'completed', 1000.00, 850.00, 15.00, 'Baby crib required'),
        (reservation5_id, 'RSV005', property6_id, existing_user_id, 'Lisa Chen', 'lisa.chen@email.com', '+86 138 0013 8000', '2024-11-25', '2024-12-02', 7, 2, 0, 2, 'airbnb', 'confirmed', 840.00, 714.00, 15.00, 'Anniversary celebration setup');
    
    -- Insert Tasks
    INSERT INTO public.tasks (property_id, reservation_id, assigned_to, created_by, title, description, task_type, priority, status, due_date) VALUES
        (property1_id, reservation1_id, manager_user_id, existing_user_id, 'Pre-arrival Cleaning', 'Deep clean apartment before Sarah Johnson arrival', 'cleaning', 'high', 'pending', '2024-11-19 14:00:00+00'),
        (property2_id, NULL, manager_user_id, existing_user_id, 'Pool Maintenance', 'Weekly pool cleaning and chemical balancing', 'maintenance', 'medium', 'in_progress', '2024-11-18 10:00:00+00'),
        (property3_id, reservation3_id, manager_user_id, existing_user_id, 'Key Handover', 'Arrange key collection for Emma Thompson', 'coordination', 'high', 'pending', '2024-11-22 15:00:00+00'),
        (property4_id, NULL, existing_user_id, existing_user_id, 'Plumbing Repair', 'Fix bathroom sink leak in guest bathroom', 'maintenance', 'urgent', 'pending', '2024-11-17 09:00:00+00'),
        (property5_id, reservation4_id, manager_user_id, existing_user_id, 'Welcome Setup', 'Prepare welcome amenities and baby crib setup', 'preparation', 'medium', 'completed', '2024-11-12 12:00:00+00'),
        (property6_id, reservation5_id, manager_user_id, existing_user_id, 'Anniversary Decoration', 'Set up romantic decoration for anniversary celebration', 'preparation', 'medium', 'pending', '2024-11-25 16:00:00+00');
    
    -- Insert Expenses
    INSERT INTO public.expenses (property_id, user_id, title, description, category, amount, currency, expense_date, vendor_name) VALUES
        (property1_id, existing_user_id, 'Professional Cleaning Service', 'Deep cleaning after guest checkout', 'cleaning', 85.00, 'USD', '2024-11-10', 'CleanPro Marrakech'),
        (property2_id, existing_user_id, 'Pool Chemical Supplies', 'Chlorine and pH balancing chemicals for pool maintenance', 'maintenance', 120.00, 'USD', '2024-11-08', 'Pool Care Solutions'),
        (property3_id, existing_user_id, 'WiFi Upgrade', 'High-speed internet installation for business guests', 'utilities', 75.00, 'USD', '2024-11-05', 'Maroc Telecom'),
        (property4_id, existing_user_id, 'Plumbing Repair', 'Emergency plumbing service for bathroom sink repair', 'maintenance', 150.00, 'USD', '2024-11-12', 'Fes Plumbing Services'),
        (property5_id, existing_user_id, 'Welcome Basket Supplies', 'Premium welcome basket for VIP guests', 'supplies', 45.00, 'USD', '2024-11-11', 'Local Market Rabat'),
        (property6_id, existing_user_id, 'Garden Maintenance', 'Monthly garden landscaping and plant care', 'maintenance', 95.00, 'USD', '2024-11-09', 'Green Gardens Marrakech');
    
    -- Insert Inventory Items
    INSERT INTO public.inventory_items (user_id, property_id, name, description, category, sku, current_stock, min_stock_level, unit_cost, supplier_name, status) VALUES
        (existing_user_id, NULL, 'Bed Linens - Queen Size', 'High-quality cotton bed linens for queen beds', 'linens', 'LIN-QN-001', 25, 5, 35.00, 'Textile Solutions Morocco', 'in_stock'),
        (existing_user_id, NULL, 'Bathroom Towels - Premium', 'Luxury bath towels for guest bathrooms', 'linens', 'TOW-PR-001', 40, 10, 18.00, 'Textile Solutions Morocco', 'in_stock'),
        (existing_user_id, NULL, 'Cleaning Supplies Kit', 'All-purpose cleaning supplies for housekeeping', 'cleaning', 'CLN-KT-001', 12, 3, 25.00, 'CleanPro Supplies', 'in_stock'),
        (existing_user_id, NULL, 'Welcome Basket Items', 'Local snacks and amenities for guest welcome baskets', 'amenities', 'WEL-BK-001', 8, 2, 22.00, 'Local Artisan Collective', 'low_stock'),
        (existing_user_id, NULL, 'Pool Cleaning Equipment', 'Pool skimmer, vacuum, and maintenance tools', 'maintenance', 'POL-EQ-001', 3, 1, 85.00, 'Pool Care Solutions', 'in_stock'),
        (existing_user_id, NULL, 'Kitchen Utensils Set', 'Complete kitchen utensils and cookware for apartments', 'kitchen', 'KIT-UT-001', 15, 3, 45.00, 'Kitchen Pro Morocco', 'in_stock');
    
    -- Insert Team Members (if manager user exists)
    IF manager_user_id IS NOT NULL THEN
        INSERT INTO public.team_members (user_id, manager_id, employee_id, position, department, hire_date, hourly_rate, phone_number) VALUES
            (manager_user_id, existing_user_id, 'EMP-001', 'Property Manager', 'Operations', '2024-01-15', 25.00, '+212 661 123 456');
    END IF;
    
    -- Insert Revenue Analytics
    INSERT INTO public.revenue_analytics (property_id, user_id, period_start, period_end, total_revenue, occupancy_rate, avg_daily_rate, total_nights, total_bookings) VALUES
        (property1_id, existing_user_id, '2024-10-01', '2024-10-31', 3240.00, 85.50, 180.00, 18, 4),
        (property2_id, existing_user_id, '2024-10-01', '2024-10-31', 5220.00, 92.00, 290.00, 18, 3),
        (property3_id, existing_user_id, '2024-10-01', '2024-10-31', 1680.00, 70.00, 80.00, 21, 8),
        (property5_id, existing_user_id, '2024-10-01', '2024-10-31', 2750.00, 88.00, 250.00, 11, 2),
        (property6_id, existing_user_id, '2024-10-01', '2024-10-31', 2160.00, 75.00, 120.00, 18, 6);

END $$;