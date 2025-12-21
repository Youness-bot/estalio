import { supabase } from '../lib/supabase';

export const dashboardService = {
  // Get comprehensive dashboard statistics
  async getDashboardStats() {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) {
        // If no user authenticated, return empty data structure
        return this.getEmptyDashboardData();
      }

      // Get current date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Parallel data fetching for better performance
      const [propertiesResult, reservationsResult, expensesResult, tasksResult] = await Promise.all([
        // Properties
        supabase?.from('properties')?.select('id, status, is_published')?.eq('user_id', user?.id),
        
        // Reservations
        supabase?.from('reservations')?.select('id, status, gross_amount, net_amount, check_in_date, nights')?.eq('user_id', user?.id),
        
        // Expenses
        supabase?.from('expenses')?.select('id, amount, expense_date, category')?.eq('user_id', user?.id),
        
        // Tasks
        supabase?.from('tasks')?.select('id, status, priority, due_date')?.or(`created_by.eq.${user?.id},assigned_to.eq.${user?.id}`)
      ]);

      if (propertiesResult?.error) throw propertiesResult?.error;
      if (reservationsResult?.error) throw reservationsResult?.error;
      if (expensesResult?.error) throw expensesResult?.error;
      if (tasksResult?.error) throw tasksResult?.error;

      const properties = propertiesResult?.data || [];
      const reservations = reservationsResult?.data || [];
      const expenses = expensesResult?.data || [];
      const tasks = tasksResult?.data || [];

      // Calculate KPIs
      const kpis = this.calculateKPIs(properties, reservations, expenses, tasks, startOfMonth, endOfMonth);
      
      // Calculate trends (compare with previous month)
      const trends = this.calculateTrends(reservations, expenses, startOfMonth);

      // Get revenue analytics
      const revenueAnalytics = this.calculateRevenueAnalytics(reservations);

      // Get task analytics
      const taskAnalytics = this.calculateTaskAnalytics(tasks);

      // Get expense analytics
      const expenseAnalytics = this.calculateExpenseAnalytics(expenses);

      return {
        kpis,
        trends,
        revenueAnalytics,
        taskAnalytics,
        expenseAnalytics,
        lastUpdated: new Date()?.toISOString()
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return empty data structure on error instead of mock data
      return this.getEmptyDashboardData();
    }
  },

  // Empty data structure for when user is not authenticated or errors occur
  getEmptyDashboardData() {
    return {
      kpis: {
        properties: {
          total: 0,
          published: 0,
          available: 0,
          occupied: 0,
          occupancyRate: 0
        },
        revenue: {
          total: 0,
          averageDailyRate: 0,
          netProfit: 0,
          totalNights: 0
        },
        reservations: {
          total: 0,
          confirmed: 0,
          active: 0,
          pending: 0,
          currentMonth: 0
        },
        tasks: {
          total: 0,
          pending: 0,
          completed: 0,
          overdue: 0,
          completionRate: 0
        },
        expenses: {
          total: 0,
          count: 0
        }
      },
      trends: {
        revenue: {
          change: 0,
          direction: 'stable'
        },
        reservations: {
          current: 0,
          previous: 0
        }
      },
      revenueAnalytics: {
        monthlyData: [],
        totalRevenue: 0,
        totalBookings: 0
      },
      taskAnalytics: {
        priorityBreakdown: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        },
        statusBreakdown: {
          pending: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0
        },
        upcomingTasks: 0,
        totalActive: 0
      },
      expenseAnalytics: {
        categoryBreakdown: {},
        monthlyExpenses: [],
        totalExpenses: 0
      },
      lastUpdated: new Date()?.toISOString()
    };
  },

  // Calculate main KPIs
  calculateKPIs(properties, reservations, expenses, tasks, startOfMonth, endOfMonth) {
    // Properties KPIs
    const totalProperties = properties?.length || 0;
    const publishedProperties = properties?.filter(p => p?.is_published)?.length || 0;
    const availableProperties = properties?.filter(p => p?.status === 'available')?.length || 0;
    const occupiedProperties = properties?.filter(p => p?.status === 'occupied')?.length || 0;

    // Occupancy rate calculation (simplified)
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

    // Revenue KPIs
    const currentMonthReservations = reservations?.filter(r => {
      const checkIn = new Date(r.check_in_date);
      return checkIn >= startOfMonth && checkIn <= endOfMonth;
    }) || [];

    const totalRevenue = currentMonthReservations?.reduce((sum, r) => sum + parseFloat(r?.net_amount || 0), 0);
    const totalNights = currentMonthReservations?.reduce((sum, r) => sum + (r?.nights || 0), 0);
    const averageDailyRate = totalNights > 0 ? totalRevenue / totalNights : 0;

    // Reservations KPIs
    const totalReservations = reservations?.length || 0;
    const confirmedReservations = reservations?.filter(r => r?.status === 'confirmed')?.length || 0;
    const activeReservations = reservations?.filter(r => r?.status === 'active')?.length || 0;
    const pendingReservations = reservations?.filter(r => r?.status === 'pending')?.length || 0;

    // Tasks KPIs
    const totalTasks = tasks?.length || 0;
    const pendingTasks = tasks?.filter(t => t?.status === 'pending')?.length || 0;
    const completedTasks = tasks?.filter(t => t?.status === 'completed')?.length || 0;
    const overdueTasks = tasks?.filter(t => {
      if (!t?.due_date || t?.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    })?.length || 0;

    // Expenses KPIs
    const currentMonthExpenses = expenses?.filter(e => {
      const expenseDate = new Date(e.expense_date);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    }) || [];
    const totalExpenses = currentMonthExpenses?.reduce((sum, e) => sum + parseFloat(e?.amount || 0), 0);

    // Net profit (revenue - expenses)
    const netProfit = totalRevenue - totalExpenses;

    return {
      properties: {
        total: totalProperties,
        published: publishedProperties,
        available: availableProperties,
        occupied: occupiedProperties,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      },
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        averageDailyRate: Math.round(averageDailyRate * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        totalNights: totalNights
      },
      reservations: {
        total: totalReservations,
        confirmed: confirmedReservations,
        active: activeReservations,
        pending: pendingReservations,
        currentMonth: currentMonthReservations?.length
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      expenses: {
        total: Math.round(totalExpenses * 100) / 100,
        count: currentMonthExpenses?.length
      }
    };
  },

  // Calculate trends (month-over-month)
  calculateTrends(reservations, expenses, startOfMonth) {
    const previousMonth = new Date(startOfMonth);
    previousMonth?.setMonth(previousMonth?.getMonth() - 1);
    const endOfPreviousMonth = new Date(startOfMonth.getTime() - 1);

    // Previous month reservations
    const previousMonthReservations = reservations?.filter(r => {
      const checkIn = new Date(r.check_in_date);
      return checkIn >= previousMonth && checkIn <= endOfPreviousMonth;
    }) || [];

    // Calculate changes
    const currentRevenue = reservations?.filter(r => {
      const checkIn = new Date(r.check_in_date);
      return checkIn >= startOfMonth;
    })?.reduce((sum, r) => sum + parseFloat(r?.net_amount || 0), 0) || 0;

    const previousRevenue = previousMonthReservations?.reduce((sum, r) => sum + parseFloat(r?.net_amount || 0), 0) || 0;

    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      revenue: {
        change: Math.round(revenueChange * 100) / 100,
        direction: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable'
      },
      reservations: {
        current: reservations?.filter(r => new Date(r.check_in_date) >= startOfMonth)?.length || 0,
        previous: previousMonthReservations?.length || 0
      }
    };
  },

  // Calculate revenue analytics for charts
  calculateRevenueAnalytics(reservations) {
    const monthlyData = [];
    const now = new Date();
    
    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthReservations = reservations?.filter(r => {
        const checkIn = new Date(r.check_in_date);
        return checkIn >= monthStart && checkIn <= monthEnd;
      }) || [];

      const monthRevenue = monthReservations?.reduce((sum, r) => sum + parseFloat(r?.net_amount || 0), 0);
      const monthBookings = monthReservations?.length;

      monthlyData?.push({
        month: date?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: Math.round(monthRevenue * 100) / 100,
        bookings: monthBookings,
        averageValue: monthBookings > 0 ? Math.round((monthRevenue / monthBookings) * 100) / 100 : 0
      });
    }

    return {
      monthlyData,
      totalRevenue: monthlyData?.reduce((sum, m) => sum + m?.revenue, 0),
      totalBookings: monthlyData?.reduce((sum, m) => sum + m?.bookings, 0)
    };
  },

  // Calculate task analytics
  calculateTaskAnalytics(tasks) {
    const priorityBreakdown = {
      low: tasks?.filter(t => t?.priority === 'low' && t?.status !== 'completed')?.length || 0,
      medium: tasks?.filter(t => t?.priority === 'medium' && t?.status !== 'completed')?.length || 0,
      high: tasks?.filter(t => t?.priority === 'high' && t?.status !== 'completed')?.length || 0,
      urgent: tasks?.filter(t => t?.priority === 'urgent' && t?.status !== 'completed')?.length || 0
    };

    const statusBreakdown = {
      pending: tasks?.filter(t => t?.status === 'pending')?.length || 0,
      inProgress: tasks?.filter(t => t?.status === 'in_progress')?.length || 0,
      completed: tasks?.filter(t => t?.status === 'completed')?.length || 0,
      cancelled: tasks?.filter(t => t?.status === 'cancelled')?.length || 0
    };

    // Upcoming tasks (next 7 days)
    const nextWeek = new Date();
    nextWeek?.setDate(nextWeek?.getDate() + 7);

    const upcomingTasks = tasks?.filter(t => {
      if (!t?.due_date || t?.status === 'completed') return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= new Date() && dueDate <= nextWeek;
    })?.length || 0;

    return {
      priorityBreakdown,
      statusBreakdown,
      upcomingTasks,
      totalActive: priorityBreakdown?.low + priorityBreakdown?.medium + priorityBreakdown?.high + priorityBreakdown?.urgent
    };
  },

  // Calculate expense analytics
  calculateExpenseAnalytics(expenses) {
    const categoryBreakdown = expenses?.reduce((acc, expense) => {
      const category = expense?.category;
      if (!acc?.[category]) {
        acc[category] = { count: 0, total: 0 };
      }
      acc[category].count += 1;
      acc[category].total += parseFloat(expense?.amount || 0);
      return acc;
    }, {}) || {};

    // Monthly expense trend (last 6 months)
    const monthlyExpenses = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthExpenseData = expenses?.filter(e => {
        const expenseDate = new Date(e.expense_date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      }) || [];

      const monthTotal = monthExpenseData?.reduce((sum, e) => sum + parseFloat(e?.amount || 0), 0);

      monthlyExpenses?.push({
        month: date?.toLocaleDateString('en-US', { month: 'short' }),
        total: Math.round(monthTotal * 100) / 100,
        count: monthExpenseData?.length
      });
    }

    return {
      categoryBreakdown,
      monthlyExpenses,
      totalExpenses: Object.values(categoryBreakdown)?.reduce((sum, cat) => sum + cat?.total, 0)
    };
  },

  // Get today's summary
  async getTodaysSummary() {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) {
        return {
          checkIns: [],
          checkOuts: [],
          tasks: [],
          date: new Date()?.toISOString()?.split('T')?.[0]
        };
      }

      const today = new Date()?.toISOString()?.split('T')?.[0];
      const tomorrow = new Date();
      tomorrow?.setDate(tomorrow?.getDate() + 1);
      const tomorrowStr = tomorrow?.toISOString()?.split('T')?.[0];

      // Parallel queries for today's data
      const [checkInsResult, checkOutsResult, tasksResult] = await Promise.all([
        // Today's check-ins
        supabase?.from('reservations')?.select(`
            id,
            guest_name,
            reservation_code,
            properties (name, property_code)
          `)?.eq('user_id', user?.id)?.eq('check_in_date', today)?.in('status', ['confirmed', 'active']),

        // Today's check-outs
        supabase?.from('reservations')?.select(`
            id,
            guest_name,
            reservation_code,
            properties (name, property_code)
          `)?.eq('user_id', user?.id)?.eq('check_out_date', today)?.in('status', ['confirmed', 'active']),

        // Today's tasks
        supabase?.from('tasks')?.select(`
            id,
            title,
            priority,
            status,
            properties (name, property_code)
          `)?.or(`created_by.eq.${user?.id},assigned_to.eq.${user?.id}`)?.gte('due_date', today)?.lt('due_date', tomorrowStr)?.neq('status', 'completed')
      ]);

      return {
        checkIns: checkInsResult?.data || [],
        checkOuts: checkOutsResult?.data || [],
        tasks: tasksResult?.data || [],
        date: today
      };
    } catch (error) {
      console.error('Error fetching today\'s summary:', error);
      return {
        checkIns: [],
        checkOuts: [],
        tasks: [],
        date: new Date()?.toISOString()?.split('T')?.[0]
      };
    }
  }
};