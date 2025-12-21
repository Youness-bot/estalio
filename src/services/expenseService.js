import { supabase } from '../lib/supabase';

export const expenseService = {
  // Get all expenses for the current user
  async getAll() {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('expenses')?.select(`
          *,
          properties (
            id,
            name,
            property_code
          )
        `)?.eq('user_id', user?.id)?.order('expense_date', { ascending: false });

      if (error) throw error;

      // Convert snake_case to camelCase
      return data?.map(expense => ({
        id: expense?.id,
        propertyId: expense?.property_id,
        propertyName: expense?.properties?.name,
        propertyCode: expense?.properties?.property_code,
        userId: expense?.user_id,
        title: expense?.title,
        description: expense?.description,
        category: expense?.category,
        amount: parseFloat(expense?.amount),
        currency: expense?.currency,
        expenseDate: expense?.expense_date,
        vendorName: expense?.vendor_name,
        receiptUrl: expense?.receipt_url,
        isRecurring: expense?.is_recurring,
        createdAt: expense?.created_at,
        updatedAt: expense?.updated_at
      }));
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  // Get single expense by ID
  async getById(expenseId) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('expenses')?.select(`
          *,
          properties (
            id,
            name,
            property_code,
            location
          )
        `)?.eq('id', expenseId)?.eq('user_id', user?.id)?.single();

      if (error) throw error;

      return {
        id: data?.id,
        propertyId: data?.property_id,
        propertyName: data?.properties?.name,
        propertyCode: data?.properties?.property_code,
        propertyLocation: data?.properties?.location,
        userId: data?.user_id,
        title: data?.title,
        description: data?.description,
        category: data?.category,
        amount: parseFloat(data?.amount),
        currency: data?.currency,
        expenseDate: data?.expense_date,
        vendorName: data?.vendor_name,
        receiptUrl: data?.receipt_url,
        isRecurring: data?.is_recurring,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error;
    }
  },

  // Create new expense
  async create(expenseData) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      // Convert camelCase to snake_case for database
      const { data, error } = await supabase?.from('expenses')?.insert({
          property_id: expenseData?.propertyId || null,
          user_id: user?.id,
          title: expenseData?.title,
          description: expenseData?.description || null,
          category: expenseData?.category,
          amount: parseFloat(expenseData?.amount),
          currency: expenseData?.currency || 'USD',
          expense_date: expenseData?.expenseDate || new Date()?.toISOString()?.split('T')?.[0],
          vendor_name: expenseData?.vendorName || null,
          receipt_url: expenseData?.receiptUrl || null,
          is_recurring: expenseData?.isRecurring || false
        })?.select()?.single();

      if (error) throw error;

      return {
        id: data?.id,
        propertyId: data?.property_id,
        userId: data?.user_id,
        title: data?.title,
        description: data?.description,
        category: data?.category,
        amount: parseFloat(data?.amount),
        currency: data?.currency,
        expenseDate: data?.expense_date,
        vendorName: data?.vendor_name,
        receiptUrl: data?.receipt_url,
        isRecurring: data?.is_recurring,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  // Update expense
  async update(expenseId, updates) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      // Convert camelCase to snake_case for database
      const updateData = {};
      if (updates?.propertyId !== undefined) updateData.property_id = updates?.propertyId;
      if (updates?.title !== undefined) updateData.title = updates?.title;
      if (updates?.description !== undefined) updateData.description = updates?.description;
      if (updates?.category !== undefined) updateData.category = updates?.category;
      if (updates?.amount !== undefined) updateData.amount = parseFloat(updates?.amount);
      if (updates?.currency !== undefined) updateData.currency = updates?.currency;
      if (updates?.expenseDate !== undefined) updateData.expense_date = updates?.expenseDate;
      if (updates?.vendorName !== undefined) updateData.vendor_name = updates?.vendorName;
      if (updates?.receiptUrl !== undefined) updateData.receipt_url = updates?.receiptUrl;
      if (updates?.isRecurring !== undefined) updateData.is_recurring = updates?.isRecurring;

      const { data, error } = await supabase?.from('expenses')?.update(updateData)?.eq('id', expenseId)?.eq('user_id', user?.id)?.select()?.single();

      if (error) throw error;

      return {
        id: data?.id,
        propertyId: data?.property_id,
        userId: data?.user_id,
        title: data?.title,
        description: data?.description,
        category: data?.category,
        amount: parseFloat(data?.amount),
        currency: data?.currency,
        expenseDate: data?.expense_date,
        vendorName: data?.vendor_name,
        receiptUrl: data?.receipt_url,
        isRecurring: data?.is_recurring,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  // Delete expense
  async delete(expenseId) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase?.from('expenses')?.delete()?.eq('id', expenseId)?.eq('user_id', user?.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // Get expense statistics
  async getStatistics(timeframe = 'month') {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate date range based on timeframe
      let startDate, endDate;
      const now = new Date();
      
      if (timeframe === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (timeframe === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
      } else {
        // Default to current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const { data, error } = await supabase?.from('expenses')?.select('id, amount, category, expense_date, is_recurring')?.eq('user_id', user?.id)?.gte('expense_date', startDate?.toISOString()?.split('T')?.[0])?.lte('expense_date', endDate?.toISOString()?.split('T')?.[0]);

      if (error) throw error;

      const total = data?.length;
      const totalAmount = data?.reduce((sum, expense) => sum + parseFloat(expense?.amount), 0);
      const recurring = data?.filter(e => e?.is_recurring)?.length;

      // Category breakdown
      const categoryBreakdown = data?.reduce((acc, expense) => {
        const category = expense?.category;
        if (!acc?.[category]) {
          acc[category] = { count: 0, total: 0 };
        }
        acc[category].count += 1;
        acc[category].total += parseFloat(expense?.amount);
        return acc;
      }, {});

      // Monthly trend (for year timeframe)
      const monthlyTrend = [];
      if (timeframe === 'year') {
        for (let month = 0; month < 12; month++) {
          const monthExpenses = data?.filter(expense => {
            const expenseMonth = new Date(expense.expense_date)?.getMonth();
            return expenseMonth === month;
          });
          const monthTotal = monthExpenses?.reduce((sum, expense) => sum + parseFloat(expense?.amount), 0);
          monthlyTrend?.push({
            month: month,
            monthName: new Date(now.getFullYear(), month, 1)?.toLocaleDateString('en-US', { month: 'long' }),
            total: monthTotal,
            count: monthExpenses?.length
          });
        }
      }

      return {
        total,
        totalAmount,
        recurring,
        categoryBreakdown,
        monthlyTrend: timeframe === 'year' ? monthlyTrend : null,
        averageExpense: total > 0 ? totalAmount / total : 0,
        timeframe,
        startDate: startDate?.toISOString()?.split('T')?.[0],
        endDate: endDate?.toISOString()?.split('T')?.[0]
      };
    } catch (error) {
      console.error('Error fetching expense statistics:', error);
      throw error;
    }
  },

  // Get expenses by property
  async getByProperty(propertyId, timeframe = 'month') {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('expenses')?.select('*')?.eq('user_id', user?.id)?.eq('property_id', propertyId)?.order('expense_date', { ascending: false });

      if (error) throw error;

      return data?.map(expense => ({
        id: expense?.id,
        propertyId: expense?.property_id,
        userId: expense?.user_id,
        title: expense?.title,
        description: expense?.description,
        category: expense?.category,
        amount: parseFloat(expense?.amount),
        currency: expense?.currency,
        expenseDate: expense?.expense_date,
        vendorName: expense?.vendor_name,
        receiptUrl: expense?.receipt_url,
        isRecurring: expense?.is_recurring,
        createdAt: expense?.created_at,
        updatedAt: expense?.updated_at
      }));
    } catch (error) {
      console.error('Error fetching property expenses:', error);
      throw error;
    }
  },

  // Get expenses by category
  async getByCategory(category, limit = null) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase?.from('expenses')?.select(`
          *,
          properties (
            id,
            name,
            property_code
          )
        `)?.eq('user_id', user?.id)?.eq('category', category)?.order('expense_date', { ascending: false });

      if (limit) {
        query = query?.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(expense => ({
        id: expense?.id,
        propertyId: expense?.property_id,
        propertyName: expense?.properties?.name,
        propertyCode: expense?.properties?.property_code,
        userId: expense?.user_id,
        title: expense?.title,
        description: expense?.description,
        category: expense?.category,
        amount: parseFloat(expense?.amount),
        currency: expense?.currency,
        expenseDate: expense?.expense_date,
        vendorName: expense?.vendor_name,
        receiptUrl: expense?.receipt_url,
        isRecurring: expense?.is_recurring,
        createdAt: expense?.created_at,
        updatedAt: expense?.updated_at
      }));
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      throw error;
    }
  },

  // Get recent expenses
  async getRecent(limit = 10) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('expenses')?.select(`
          *,
          properties (
            id,
            name,
            property_code
          )
        `)?.eq('user_id', user?.id)?.order('created_at', { ascending: false })?.limit(limit);

      if (error) throw error;

      return data?.map(expense => ({
        id: expense?.id,
        propertyId: expense?.property_id,
        propertyName: expense?.properties?.name,
        propertyCode: expense?.properties?.property_code,
        userId: expense?.user_id,
        title: expense?.title,
        description: expense?.description,
        category: expense?.category,
        amount: parseFloat(expense?.amount),
        currency: expense?.currency,
        expenseDate: expense?.expense_date,
        vendorName: expense?.vendor_name,
        receiptUrl: expense?.receipt_url,
        isRecurring: expense?.is_recurring,
        createdAt: expense?.created_at,
        updatedAt: expense?.updated_at
      }));
    } catch (error) {
      console.error('Error fetching recent expenses:', error);
      throw error;
    }
  }
};