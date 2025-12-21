import { supabase } from '../lib/supabase';

export const pricingService = {
  // Get all pricing rules for current user
  async getAll() {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('pricing_rules')?.select(`
          *,
          pricing_rule_properties!inner(
            property_id,
            properties(name, property_code)
          ),
          pricing_rule_days(day_of_week),
          rule_analytics(
            bookings_affected,
            revenue_change,
            avg_rate_change
          )
        `)?.eq('user_id', user?.id)?.order('created_at', { ascending: false });

      if (error) throw error;

      // Convert snake_case to camelCase for React
      return data?.map(rule => ({
        id: rule?.id,
        name: rule?.name,
        description: rule?.description,
        type: rule?.rule_type,
        adjustmentType: rule?.adjustment_type,
        adjustment: parseFloat(rule?.adjustment_value),
        startDate: rule?.start_date,
        endDate: rule?.end_date,
        properties: rule?.pricing_rule_properties?.map(rp => rp?.properties?.name)?.filter(Boolean) || [],
        conditions: {
          minStay: rule?.min_stay,
          advanceBooking: rule?.advance_booking_days,
          occupancyThreshold: rule?.occupancy_threshold,
          dayOfWeek: rule?.pricing_rule_days?.map(d => d?.day_of_week) || []
        },
        priority: rule?.priority,
        isActive: rule?.is_active,
        createdAt: rule?.created_at,
        revenueImpact: {
          bookingsAffected: rule?.rule_analytics?.[0]?.bookings_affected || 0,
          revenueChange: parseFloat(rule?.rule_analytics?.[0]?.revenue_change || 0),
          avgRateChange: parseFloat(rule?.rule_analytics?.[0]?.avg_rate_change || 0)
        }
      })) || [];
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      throw error;
    }
  },

  // Create new pricing rule
  async create(ruleData) {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Convert camelCase to snake_case for database
      const { data: rule, error: ruleError } = await supabase?.from('pricing_rules')?.insert({
          user_id: user?.id,
          name: ruleData?.name,
          description: ruleData?.description,
          rule_type: ruleData?.type,
          adjustment_type: ruleData?.adjustmentType,
          adjustment_value: ruleData?.adjustment,
          start_date: ruleData?.startDate,
          end_date: ruleData?.endDate,
          min_stay: ruleData?.conditions?.minStay,
          advance_booking_days: ruleData?.conditions?.advanceBooking,
          occupancy_threshold: ruleData?.conditions?.occupancyThreshold,
          priority: ruleData?.priority || 5,
          is_active: ruleData?.isActive !== false
        })?.select()?.single();

      if (ruleError) throw ruleError;

      // Link properties if provided
      if (ruleData?.propertyIds && ruleData?.propertyIds?.length > 0) {
        const propertyLinks = ruleData?.propertyIds?.map(propertyId => ({
          pricing_rule_id: rule?.id,
          property_id: propertyId
        }));

        const { error: linkError } = await supabase?.from('pricing_rule_properties')?.insert(propertyLinks);

        if (linkError) throw linkError;
      }

      // Add day restrictions if provided
      if (ruleData?.conditions?.dayOfWeek && ruleData?.conditions?.dayOfWeek?.length > 0) {
        const dayRestrictions = ruleData?.conditions?.dayOfWeek?.map(day => ({
          pricing_rule_id: rule?.id,
          day_of_week: day
        }));

        const { error: dayError } = await supabase?.from('pricing_rule_days')?.insert(dayRestrictions);

        if (dayError) throw dayError;
      }

      return {
        id: rule?.id,
        name: rule?.name,
        type: rule?.rule_type,
        isActive: rule?.is_active
      };
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      throw error;
    }
  },

  // Update pricing rule
  async update(ruleId, ruleData) {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('pricing_rules')?.update({
          name: ruleData?.name,
          description: ruleData?.description,
          rule_type: ruleData?.type,
          adjustment_type: ruleData?.adjustmentType,
          adjustment_value: ruleData?.adjustment,
          start_date: ruleData?.startDate,
          end_date: ruleData?.endDate,
          min_stay: ruleData?.conditions?.minStay,
          advance_booking_days: ruleData?.conditions?.advanceBooking,
          occupancy_threshold: ruleData?.conditions?.occupancyThreshold,
          priority: ruleData?.priority,
          is_active: ruleData?.isActive
        })?.eq('id', ruleId)?.eq('user_id', user?.id)?.select()?.single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      throw error;
    }
  },

  // Toggle rule active status
  async toggleActive(ruleId) {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // First get current status
      const { data: currentRule, error: fetchError } = await supabase?.from('pricing_rules')?.select('is_active')?.eq('id', ruleId)?.eq('user_id', user?.id)?.single();

      if (fetchError) throw fetchError;

      // Toggle the status
      const { data, error } = await supabase?.from('pricing_rules')?.update({ is_active: !currentRule?.is_active })?.eq('id', ruleId)?.eq('user_id', user?.id)?.select()?.single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling rule status:', error);
      throw error;
    }
  },

  // Delete pricing rule
  async delete(ruleId) {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { error } = await supabase?.from('pricing_rules')?.delete()?.eq('id', ruleId)?.eq('user_id', user?.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      throw error;
    }
  },

  // Get occupancy data
  async getOccupancyData() {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get latest occupancy snapshot
      const { data: snapshot, error: snapshotError } = await supabase?.from('occupancy_snapshots')?.select('*')?.eq('user_id', user?.id)?.order('snapshot_date', { ascending: false })?.limit(1)?.single();

      if (snapshotError && snapshotError?.code !== 'PGRST116') {
        throw snapshotError;
      }

      // Get all properties for fallback
      const { data: properties, error: propError } = await supabase?.from('properties')?.select('id, name, status')?.eq('user_id', user?.id);

      if (propError) throw propError;

      // Calculate occupancy from properties if no snapshot
      let occupancyData = {
        overall: 0,
        nextUpdate: 'in 2 hours',
        properties: [],
        activePricingRules: []
      };

      if (snapshot) {
        occupancyData = {
          overall: parseFloat(snapshot?.overall_occupancy),
          nextUpdate: 'in 2 hours',
          properties: snapshot?.property_occupancy?.properties || [],
          activePricingRules: snapshot?.active_rules?.active || []
        };
      } else {
        // Fallback calculation
        const totalProperties = properties?.length || 0;
        const occupiedProperties = properties?.filter(p => p?.status === 'occupied')?.length || 0;
        
        occupancyData = {
          overall: totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0,
          nextUpdate: 'in 2 hours',
          properties: properties?.map(p => ({
            name: p?.name,
            rate: p?.status === 'occupied' ? 100 : (p?.status === 'available' ? 0 : 50)
          })) || [],
          activePricingRules: []
        };
      }

      return occupancyData;
    } catch (error) {
      console.error('Error fetching occupancy data:', error);
      throw error;
    }
  },

  // Get analytics data
  async getAnalyticsData() {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get rule analytics
      const { data: analytics, error: analyticsError } = await supabase?.from('rule_analytics')?.select(`
          *,
          pricing_rules(name)
        `)?.order('date_applied', { ascending: false });

      if (analyticsError && analyticsError?.code !== 'PGRST116') {
        throw analyticsError;
      }

      // Calculate aggregated metrics
      const totalRevenueImpact = analytics?.reduce((sum, a) => sum + parseFloat(a?.revenue_change || 0), 0) || 0;
      const totalBookingsAffected = analytics?.reduce((sum, a) => sum + (a?.bookings_affected || 0), 0) || 0;
      const avgRateIncrease = analytics?.length > 0 
        ? analytics?.reduce((sum, a) => sum + parseFloat(a?.avg_rate_change || 0), 0) / analytics?.length 
        : 0;

      // Get rule performance
      const rulePerformance = analytics?.reduce((acc, a) => {
        const ruleName = a?.pricing_rules?.name || 'Unknown Rule';
        if (!acc?.[ruleName]) {
          acc[ruleName] = { name: ruleName, impact: 0 };
        }
        acc[ruleName].impact += parseFloat(a?.revenue_change || 0);
        return acc;
      }, {});

      return {
        totalRevenueImpact: totalRevenueImpact,
        rulesTriggered: analytics?.length || 0,
        bookingsAffected: totalBookingsAffected,
        avgRateIncrease: parseFloat(avgRateIncrease?.toFixed(1)),
        dailyImpact: analytics?.slice(0, 7)?.map(a => ({
          date: new Date(a.date_applied)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          impact: parseFloat(a?.revenue_change || 0)
        })) || [],
        rulePerformance: Object.values(rulePerformance || {}),
        effectiveness: [
          { category: 'Seasonal Rules', percentage: 85 },
          { category: 'Occupancy Rules', percentage: 72 },
          { category: 'Advance Booking', percentage: 68 },
          { category: 'Last Minute', percentage: 45 }
        ],
        recommendations: [
          'Consider increasing weekend premium based on high demand',
          'Review advance booking discounts for better performance',
          'Monitor occupancy thresholds for optimization opportunities'
        ]
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  },

  // Get properties for rule creation
  async getAvailableProperties() {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('properties')?.select('id, name, property_code, location')?.eq('user_id', user?.id)?.eq('is_active', true)?.order('name');

      if (error) throw error;

      return data?.map(property => ({
        id: property?.id,
        name: property?.name,
        code: property?.property_code,
        location: property?.location
      })) || [];
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  }
};