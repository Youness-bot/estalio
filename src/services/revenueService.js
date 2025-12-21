import { supabase } from '../lib/supabase';

const revenueService = {
  // Enhanced authentication validation
  async validateAuth() {
    try {
      const { data: { session }, error } = await supabase?.auth?.getSession();
      if (error || !session?.user) {
        throw new Error('Authentication required');
      }
      return session?.user;
    } catch (error) {
      console.error('Auth validation failed:', error);
      throw new Error('Authentication session invalid');
    }
  },

  // Enhanced query execution with better error handling
  async executeQuery(queryBuilder, operation = 'query') {
    try {
      const { data, error } = await queryBuilder;
      
      if (error) {
        console.error(`${operation} error:`, error);
        
        // Handle specific Supabase errors
        if (error?.code === 'PGRST301') {
          throw new Error('Authentication required - please log in again');
        } else if (error?.code === 'PGRST116') {
          throw new Error('Data not found');
        } else if (error?.message?.includes('JWT')) {
          throw new Error('Session expired - please refresh the page');
        } else {
          throw new Error(error?.message || `Failed to execute ${operation}`);
        }
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error in ${operation}:`, error);
      throw error;
    }
  },

  // Get comprehensive revenue analytics for dashboard
  async getRevenueAnalytics(userId, dateRange = {}) {
    try {
      // Validate authentication first
      const user = await this.validateAuth();
      const effectiveUserId = userId || user?.id;
      
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }
      
      const { start, end } = dateRange;
      
      let query = supabase?.from('revenue_analytics')?.select(`
          *,
          properties (
            id,
            name,
            property_code,
            property_type,
            base_price
          )
        `)?.eq('user_id', effectiveUserId);

      if (start && end) {
        query = query?.gte('period_start', start)?.lte('period_end', end);
      }

      const data = await this.executeQuery(
        query?.order('period_start', { ascending: false }), 
        'revenue analytics'
      );

      return data?.map(item => ({
        id: item?.id,
        propertyId: item?.property_id,
        propertyName: item?.properties?.name || 'Unknown Property',
        propertyCode: item?.properties?.property_code || '',
        propertyType: item?.properties?.property_type || '',
        periodStart: item?.period_start,
        periodEnd: item?.period_end,
        totalRevenue: parseFloat(item?.total_revenue || 0),
        avgDailyRate: parseFloat(item?.avg_daily_rate || 0),
        occupancyRate: parseFloat(item?.occupancy_rate || 0),
        totalBookings: item?.total_bookings || 0,
        totalNights: item?.total_nights || 0,
        createdAt: item?.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  },

  // Get platform revenue breakdown from reservations
  async getPlatformRevenueData(userId, dateRange = {}) {
    try {
      // Validate authentication first
      const user = await this.validateAuth();
      const effectiveUserId = userId || user?.id;
      
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }
      
      const { start, end } = dateRange;
      
      let query = supabase?.from('reservations')?.select('booking_channel, gross_amount, net_amount, commission_rate')?.eq('user_id', effectiveUserId)?.in('status', ['confirmed', 'active', 'completed']);

      if (start && end) {
        query = query?.gte('check_in_date', start)?.lte('check_in_date', end);
      }

      const data = await this.executeQuery(query, 'platform revenue');

      // Group by booking channel and calculate totals
      const channelMap = {};
      let totalRevenue = 0;

      data?.forEach(reservation => {
        const channel = reservation?.booking_channel || 'direct';
        const revenue = parseFloat(reservation?.net_amount || 0);
        
        if (!channelMap?.[channel]) {
          channelMap[channel] = {
            platform: channel,
            revenue: 0,
            bookings: 0,
            color: this.getChannelColor(channel)
          };
        }
        
        channelMap[channel].revenue += revenue;
        channelMap[channel].bookings += 1;
        totalRevenue += revenue;
      });

      // Convert to array and calculate percentages
      const platformData = Object.values(channelMap)?.map(platform => ({
        ...platform,
        percentage: totalRevenue > 0 ? (platform?.revenue / totalRevenue) * 100 : 0
      }));

      return platformData?.sort((a, b) => b?.revenue - a?.revenue) || [];
    } catch (error) {
      console.error('Error fetching platform revenue data:', error);
      throw error;
    }
  },

  // Get services revenue breakdown
  async getServicesRevenueData(userId, dateRange = {}) {
    try {
      // Validate authentication first
      const user = await this.validateAuth();
      const effectiveUserId = userId || user?.id;
      
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }
      
      const { start, end } = dateRange;
      
      let query = supabase?.from('reservations')?.select('special_requests, gross_amount, net_amount')?.eq('user_id', effectiveUserId)?.in('status', ['confirmed', 'active', 'completed']);

      if (start && end) {
        query = query?.gte('check_in_date', start)?.lte('check_in_date', end);
      }

      const data = await this.executeQuery(query, 'services revenue');

      // Extract services from special requests (simplified approach)
      const serviceMap = {
        'Airport Transfer': { revenue: 0, bookings: 0, percentage: 0 },
        'Luggage Keeping': { revenue: 0, bookings: 0, percentage: 0 },
        'Late Checkout': { revenue: 0, bookings: 0, percentage: 0 },
        'Extra Cleaning': { revenue: 0, bookings: 0, percentage: 0 }
      };

      let totalServiceRevenue = 0;

      data?.forEach(reservation => {
        const requests = reservation?.special_requests || '';
        const baseRevenue = parseFloat(reservation?.net_amount || 0) * 0.1; // Assume 10% comes from services
        
        if (requests?.toLowerCase()?.includes('transfer') || requests?.toLowerCase()?.includes('airport')) {
          serviceMap['Airport Transfer'].revenue += baseRevenue * 0.4;
          serviceMap['Airport Transfer'].bookings += 1;
        }
        if (requests?.toLowerCase()?.includes('luggage') || requests?.toLowerCase()?.includes('storage')) {
          serviceMap['Luggage Keeping'].revenue += baseRevenue * 0.3;
          serviceMap['Luggage Keeping'].bookings += 1;
        }
        if (requests?.toLowerCase()?.includes('late') || requests?.toLowerCase()?.includes('checkout')) {
          serviceMap['Late Checkout'].revenue += baseRevenue * 0.2;
          serviceMap['Late Checkout'].bookings += 1;
        }
        if (requests?.toLowerCase()?.includes('cleaning') || requests?.toLowerCase()?.includes('extra')) {
          serviceMap['Extra Cleaning'].revenue += baseRevenue * 0.1;
          serviceMap['Extra Cleaning'].bookings += 1;
        }
      });

      // Calculate total and percentages
      totalServiceRevenue = Object.values(serviceMap)?.reduce((sum, service) => sum + service?.revenue, 0);
      
      return Object.entries(serviceMap)?.map(([serviceName, data]) => ({
        service: serviceName,
        revenue: Math.round(data?.revenue),
        bookings: data?.bookings,
        percentage: totalServiceRevenue > 0 ? (data?.revenue / totalServiceRevenue) * 100 : 0
      }))?.filter(service => service?.revenue > 0) || [];
    } catch (error) {
      console.error('Error fetching services revenue data:', error);
      throw error;
    }
  },

  // Get expenses by property for comparison
  async getExpensesByProperty(userId, dateRange = {}) {
    try {
      // Validate authentication first
      const user = await this.validateAuth();
      const effectiveUserId = userId || user?.id;
      
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }
      
      const { start, end } = dateRange;
      
      // First, get all properties for the user
      const properties = await this.executeQuery(
        supabase?.from('properties')?.select('id, name, property_type, base_price')?.eq('user_id', effectiveUserId)?.eq('is_active', true),
        'properties'
      );

      if (!properties || properties?.length === 0) {
        return []; // No properties found
      }

      // Get expenses for all properties
      let expensesQuery = supabase?.from('expenses')?.select('property_id, amount, expense_date')?.eq('user_id', effectiveUserId)?.in('property_id', properties?.map(p => p?.id));

      if (start && end) {
        expensesQuery = expensesQuery?.gte('expense_date', start)?.lte('expense_date', end);
      }

      const expenses = await this.executeQuery(expensesQuery, 'expenses');

      // Get revenue analytics for the same properties
      let revenueQuery = supabase?.from('revenue_analytics')?.select('property_id, total_revenue, period_start, period_end')?.eq('user_id', effectiveUserId)?.in('property_id', properties?.map(p => p?.id));

      if (start && end) {
        revenueQuery = revenueQuery?.gte('period_start', start)?.lte('period_end', end);
      }

      let revenueAnalytics = [];
      try {
        revenueAnalytics = await this.executeQuery(revenueQuery, 'revenue analytics');
      } catch (error) {
        console.warn('Revenue analytics not available, continuing with expenses only:', error);
        revenueAnalytics = [];
      }

      // Process the data
      return properties?.map(property => {
        // Calculate total expenses for this property
        const propertyExpenses = expenses?.filter(expense => expense?.property_id === property?.id) || [];
        const totalExpenses = propertyExpenses?.reduce((sum, expense) => 
          sum + parseFloat(expense?.amount || 0), 0
        );

        // Calculate total revenue for this property
        const propertyRevenue = revenueAnalytics?.filter(analytics => analytics?.property_id === property?.id) || [];
        let totalRevenue = propertyRevenue?.reduce((sum, analytics) => 
          sum + parseFloat(analytics?.total_revenue || 0), 0
        );

        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        return {
          id: property?.id,
          property: property?.name,
          type: property?.property_type,
          expenses: Math.round(totalExpenses),
          revenues: Math.round(totalRevenue),
          net: Math.round(netProfit),
          profitMargin: Math.round(profitMargin * 100) / 100
        };
      })?.sort((a, b) => b?.revenues - a?.revenues) || [];
    } catch (error) {
      console.error('Error fetching expenses by property:', error);
      throw error;
    }
  },

  // Get advanced analytics data
  async getAdvancedAnalytics(userId, dateRange = {}) {
    try {
      // Validate authentication first
      const user = await this.validateAuth();
      const effectiveUserId = userId || user?.id;
      
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }

      // Get occupancy vs revenue correlation
      const analytics = await this.executeQuery(
        supabase?.from('revenue_analytics')?.select('occupancy_rate, total_revenue, period_start, period_end, properties(name)')?.eq('user_id', effectiveUserId)?.order('period_start', { ascending: true }),
        'advanced analytics'
      );

      // Process data for different chart types
      const occupancyCorrelation = analytics?.map(item => ({
        occupancy: parseFloat(item?.occupancy_rate || 0),
        revenue: parseFloat(item?.total_revenue || 0)
      })) || [];

      // Group by month for seasonal patterns
      const monthlyData = {};
      analytics?.forEach(item => {
        const monthKey = new Date(item.period_start)?.toLocaleDateString('en-US', { 
          month: 'short' 
        });
        
        if (!monthlyData?.[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            revenue: 0,
            occupancy: 0,
            count: 0
          };
        }
        
        monthlyData[monthKey].revenue += parseFloat(item?.total_revenue || 0);
        monthlyData[monthKey].occupancy += parseFloat(item?.occupancy_rate || 0);
        monthlyData[monthKey].count += 1;
      });

      // Average occupancy per month and format
      const seasonalPatterns = Object.values(monthlyData)?.map(month => ({
        month: month?.month,
        revenue: Math.round(month?.revenue),
        occupancy: month?.count > 0 ? Math.round(month?.occupancy / month?.count) : 0
      })) || [];

      // Get channel effectiveness from reservations
      const reservations = await this.executeQuery(
        supabase?.from('reservations')?.select('booking_channel, net_amount, status')?.eq('user_id', effectiveUserId)?.in('status', ['confirmed', 'active', 'completed']),
        'channel effectiveness'
      );

      const channelData = {};
      reservations?.forEach(reservation => {
        const channel = reservation?.booking_channel || 'direct';
        
        if (!channelData?.[channel]) {
          channelData[channel] = {
            channel: channel?.charAt(0)?.toUpperCase() + channel?.slice(1),
            revenue: 0,
            bookings: 0,
            effectiveness: 0
          };
        }
        
        channelData[channel].revenue += parseFloat(reservation?.net_amount || 0);
        channelData[channel].bookings += 1;
      });

      // Calculate effectiveness score based on revenue per booking
      const channelEffectiveness = Object.values(channelData)?.map(channel => ({
        ...channel,
        revenue: Math.round(channel?.revenue),
        effectiveness: channel?.bookings > 0 ? 
          Math.round((channel?.revenue / channel?.bookings) / 10) : 0
      })) || [];

      return {
        occupancyCorrelation,
        seasonalPatterns,
        channelEffectiveness
      };
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      throw error;
    }
  },

  // Get monthly revenue comparison
  async getMonthlyComparison(userId, currentYear = new Date()?.getFullYear()) {
    try {
      // Validate authentication first
      const user = await this.validateAuth();
      const effectiveUserId = userId || user?.id;
      
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }

      const data = await this.executeQuery(
        supabase?.from('revenue_analytics')?.select('total_revenue, period_start, period_end')?.eq('user_id', effectiveUserId)?.gte('period_start', `${currentYear}-01-01`)?.lte('period_end', `${currentYear}-12-31`),
        'monthly comparison'
      );

      // Group by month
      const monthlyRevenue = new Array(12)?.fill(0)?.map((_, index) => ({
        month: new Date(currentYear, index)?.toLocaleDateString('en-US', { month: 'short' }),
        revenue: 0,
        occupancy: 0,
        bookings: 0
      }));

      data?.forEach(analytics => {
        const monthIndex = new Date(analytics.period_start)?.getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyRevenue[monthIndex].revenue += parseFloat(analytics?.total_revenue || 0);
        }
      });

      return monthlyRevenue;
    } catch (error) {
      console.error('Error fetching monthly comparison:', error);
      throw error;
    }
  },

  // Get top performing properties
  async getTopProperties(userId, limit = 5, dateRange = {}) {
    try {
      // Validate authentication first
      const user = await this.validateAuth();
      const effectiveUserId = userId || user?.id;
      
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }

      const { start, end } = dateRange;
      
      let query = supabase?.from('revenue_analytics')?.select(`
          property_id,
          total_revenue,
          occupancy_rate,
          total_bookings,
          properties (
            name,
            property_code,
            property_type
          )
        `)?.eq('user_id', effectiveUserId);

      if (start && end) {
        query = query?.gte('period_start', start)?.lte('period_end', end);
      }

      const data = await this.executeQuery(query, 'top properties');

      // Group by property and sum revenue
      const propertyMap = {};
      data?.forEach(analytics => {
        const propId = analytics?.property_id;
        if (!propertyMap?.[propId]) {
          propertyMap[propId] = {
            propertyId: propId,
            propertyName: analytics?.properties?.name || 'Unknown',
            propertyCode: analytics?.properties?.property_code || '',
            propertyType: analytics?.properties?.property_type || '',
            totalRevenue: 0,
            avgOccupancy: 0,
            totalBookings: 0,
            analyticsCount: 0
          };
        }
        
        propertyMap[propId].totalRevenue += parseFloat(analytics?.total_revenue || 0);
        propertyMap[propId].avgOccupancy += parseFloat(analytics?.occupancy_rate || 0);
        propertyMap[propId].totalBookings += analytics?.total_bookings || 0;
        propertyMap[propId].analyticsCount += 1;
      });

      // Calculate averages and sort by revenue
      return Object.values(propertyMap)?.map(property => ({
          ...property,
          totalRevenue: Math.round(property?.totalRevenue),
          avgOccupancy: property?.analyticsCount > 0 ? 
            Math.round(property?.avgOccupancy / property?.analyticsCount) : 0
        }))?.sort((a, b) => b?.totalRevenue - a?.totalRevenue)?.slice(0, limit);
    } catch (error) {
      console.error('Error fetching top properties:', error);
      throw error;
    }
  },

  // Generate comprehensive revenue report
  async generateRevenueReport(userId, dateRange) {
    try {
      // Validate authentication first
      const user = await this.validateAuth();
      const effectiveUserId = userId || user?.id;
      
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }
      
      const [
        revenueAnalytics,
        platformData,
        servicesData,
        expensesData,
        advancedAnalytics
      ] = await Promise.all([
        this.getRevenueAnalytics(effectiveUserId, dateRange),
        this.getPlatformRevenueData(effectiveUserId, dateRange),
        this.getServicesRevenueData(effectiveUserId, dateRange),
        this.getExpensesByProperty(effectiveUserId, dateRange),
        this.getAdvancedAnalytics(effectiveUserId, dateRange)
      ]);

      return {
        revenueAnalytics,
        platformData,
        servicesData,
        expensesData,
        advancedAnalytics,
        generatedAt: new Date()?.toISOString()
      };
    } catch (error) {
      console.error('Error generating revenue report:', error);
      throw error;
    }
  },

  // Helper method to get consistent channel colors
  getChannelColor(channel) {
    const colors = {
      'airbnb': '#FF5A5F',
      'booking': '#003580', 
      'expedia': '#FFC72C',
      'vrbo': '#0073E6',
      'direct': '#10B981',
      'default': '#8B5CF6'
    };
    return colors?.[channel?.toLowerCase()] || colors?.default;
  }
};

export default revenueService;