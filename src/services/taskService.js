import { supabase } from '../lib/supabase';

// Check if we're in preview mode (builtwithrocket domains)
const isPreviewMode = () => {
  return window.location?.hostname?.includes('builtwithrocket');
};

// Mock data for preview environments
const getMockTasks = () => [
  {
    id: "mock-1",
    title: "Deep Cleaning - Villa Marina",
    description: "Complete deep cleaning including all rooms, bathrooms, and kitchen. Replace linens and towels.",
    taskType: "cleaning",
    priority: "high",
    status: "pending",
    dueDate: new Date()?.toISOString(),
    estimatedDuration: 180,
    actualDuration: null,
    propertyId: "mock-prop-1",
    propertyName: "Villa Marina - VR001",
    assignedTo: "mock-user-1",
    assignedToName: "Maria Santos",
    createdBy: "mock-user-1",
    reservationId: null,
    completedAt: null,
    createdAt: new Date()?.toISOString(),
    updatedAt: new Date()?.toISOString()
  },
  {
    id: "mock-2", 
    title: "AC Maintenance Check",
    description: "Routine maintenance check for air conditioning units in all bedrooms.",
    taskType: "maintenance",
    priority: "medium",
    status: "in_progress",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)?.toISOString(),
    estimatedDuration: 120,
    actualDuration: null,
    propertyId: "mock-prop-2",
    propertyName: "Apartment Central - AP002",
    assignedTo: "mock-user-2",
    assignedToName: "Ahmed Hassan",
    createdBy: "mock-user-1",
    reservationId: null,
    completedAt: null,
    createdAt: new Date()?.toISOString(),
    updatedAt: new Date()?.toISOString()
  },
  {
    id: "mock-3",
    title: "Guest Check-in Preparation",
    description: "Prepare property for guest arrival, ensure all amenities are ready.",
    taskType: "checkin",
    priority: "high",
    status: "pending",
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000)?.toISOString(),
    estimatedDuration: 60,
    actualDuration: null,
    propertyId: "mock-prop-3",
    propertyName: "Studio Beach - ST003",
    assignedTo: "mock-user-3",
    assignedToName: "Sophie Martin",
    createdBy: "mock-user-1",
    reservationId: "mock-res-1",
    completedAt: null,
    createdAt: new Date()?.toISOString(),
    updatedAt: new Date()?.toISOString()
  }
];

const taskService = {
  async getAll(filters = {}) {
    try {
      // Return mock data in preview mode
      if (isPreviewMode()) {
        console.log('Running in preview mode, using mock task data');
        return getMockTasks();
      }

      // Get current user for RLS
      const { data: { user }, error: authError } = await supabase?.auth?.getUser();
      if (authError || !user) {
        console.warn('No authenticated user found');
        return [];
      }

      // Build query with joins to get property and user names
      let query = supabase?.from('tasks')?.select(`
          *,
          properties!tasks_property_id_fkey(name, property_code),
          assigned_user:user_profiles!tasks_assigned_to_fkey(full_name),
          created_user:user_profiles!tasks_created_by_fkey(full_name)
        `);

      // Apply filters
      if (filters?.propertyId && filters?.propertyId !== 'all') {
        query = query?.eq('property_id', filters?.propertyId);
      }
      
      if (filters?.taskType && filters?.taskType !== 'all') {
        query = query?.eq('task_type', filters?.taskType);
      }

      if (filters?.status && filters?.status !== 'all') {
        query = query?.eq('status', filters?.status);
      }

      if (filters?.dateRange?.start && filters?.dateRange?.end) {
        query = query?.gte('due_date', filters?.dateRange?.start)?.lte('due_date', filters?.dateRange?.end);
      }

      // Order by due date
      query = query?.order('due_date', { ascending: true });

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      // Convert to camelCase and format data
      return (data || [])?.map(task => ({
        id: task?.id,
        title: task?.title,
        description: task?.description,
        taskType: task?.task_type,
        priority: task?.priority,
        status: task?.status,
        dueDate: task?.due_date,
        estimatedDuration: task?.estimated_duration,
        actualDuration: task?.actual_duration,
        propertyId: task?.property_id,
        propertyName: task?.properties ? `${task?.properties?.name} - ${task?.properties?.property_code}` : 'Unknown Property',
        assignedTo: task?.assigned_to,
        assignedToName: task?.assigned_user?.full_name || 'Unassigned',
        createdBy: task?.created_by,
        reservationId: task?.reservation_id,
        completedAt: task?.completed_at,
        createdAt: task?.created_at,
        updatedAt: task?.updated_at
      }));
    } catch (error) {
      console.error('Error in taskService.getAll:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      if (isPreviewMode()) {
        return getMockTasks()?.find(task => task?.id === id) || null;
      }

      const { data: { user }, error: authError } = await supabase?.auth?.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase?.from('tasks')?.select(`
          *,
          properties!tasks_property_id_fkey(name, property_code),
          assigned_user:user_profiles!tasks_assigned_to_fkey(full_name),
          created_user:user_profiles!tasks_created_by_fkey(full_name)
        `)?.eq('id', id)?.single();

      if (error) {
        console.error('Error fetching task:', error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data?.id,
        title: data?.title,
        description: data?.description,
        taskType: data?.task_type,
        priority: data?.priority,
        status: data?.status,
        dueDate: data?.due_date,
        estimatedDuration: data?.estimated_duration,
        actualDuration: data?.actual_duration,
        propertyId: data?.property_id,
        propertyName: data?.properties ? `${data?.properties?.name} - ${data?.properties?.property_code}` : 'Unknown Property',
        assignedTo: data?.assigned_to,
        assignedToName: data?.assigned_user?.full_name || 'Unassigned',
        createdBy: data?.created_by,
        reservationId: data?.reservation_id,
        completedAt: data?.completed_at,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error in taskService.getById:', error);
      throw error;
    }
  },

  async create(taskData) {
    try {
      if (isPreviewMode()) {
        console.log('Preview mode: Cannot create real tasks');
        return { id: 'mock-new-' + Date.now(), ...taskData };
      }

      const { data: { user }, error: authError } = await supabase?.auth?.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const insertData = {
        title: taskData?.title,
        description: taskData?.description || null,
        task_type: taskData?.taskType,
        priority: taskData?.priority || 'medium',
        status: taskData?.status || 'pending',
        due_date: taskData?.dueDate || null,
        estimated_duration: taskData?.estimatedDuration || null,
        property_id: taskData?.propertyId || null,
        assigned_to: taskData?.assignedTo || null,
        reservation_id: taskData?.reservationId || null,
        created_by: user?.id
      };

      const { data, error } = await supabase?.from('tasks')?.insert(insertData)?.select(`
          *,
          properties!tasks_property_id_fkey(name, property_code),
          assigned_user:user_profiles!tasks_assigned_to_fkey(full_name),
          created_user:user_profiles!tasks_created_by_fkey(full_name)
        `)?.single();

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }

      return {
        id: data?.id,
        title: data?.title,
        description: data?.description,
        taskType: data?.task_type,
        priority: data?.priority,
        status: data?.status,
        dueDate: data?.due_date,
        estimatedDuration: data?.estimated_duration,
        actualDuration: data?.actual_duration,
        propertyId: data?.property_id,
        propertyName: data?.properties ? `${data?.properties?.name} - ${data?.properties?.property_code}` : 'Unknown Property',
        assignedTo: data?.assigned_to,
        assignedToName: data?.assigned_user?.full_name || 'Unassigned',
        createdBy: data?.created_by,
        reservationId: data?.reservation_id,
        completedAt: data?.completed_at,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error in taskService.create:', error);
      throw error;
    }
  },

  async update(id, taskData) {
    try {
      if (isPreviewMode()) {
        console.log('Preview mode: Cannot update real tasks');
        return { id, ...taskData };
      }

      const { data: { user }, error: authError } = await supabase?.auth?.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const updateData = {};
      
      if (taskData?.title !== undefined) updateData.title = taskData?.title;
      if (taskData?.description !== undefined) updateData.description = taskData?.description;
      if (taskData?.taskType !== undefined) updateData.task_type = taskData?.taskType;
      if (taskData?.priority !== undefined) updateData.priority = taskData?.priority;
      if (taskData?.status !== undefined) updateData.status = taskData?.status;
      if (taskData?.dueDate !== undefined) updateData.due_date = taskData?.dueDate;
      if (taskData?.estimatedDuration !== undefined) updateData.estimated_duration = taskData?.estimatedDuration;
      if (taskData?.actualDuration !== undefined) updateData.actual_duration = taskData?.actualDuration;
      if (taskData?.propertyId !== undefined) updateData.property_id = taskData?.propertyId;
      if (taskData?.assignedTo !== undefined) updateData.assigned_to = taskData?.assignedTo;
      if (taskData?.reservationId !== undefined) updateData.reservation_id = taskData?.reservationId;

      // Set completion time if status is being changed to completed
      if (taskData?.status === 'completed' && !updateData?.completed_at) {
        updateData.completed_at = new Date()?.toISOString();
      }

      const { data, error } = await supabase?.from('tasks')?.update(updateData)?.eq('id', id)?.select(`
          *,
          properties!tasks_property_id_fkey(name, property_code),
          assigned_user:user_profiles!tasks_assigned_to_fkey(full_name),
          created_user:user_profiles!tasks_created_by_fkey(full_name)
        `)?.single();

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }

      return {
        id: data?.id,
        title: data?.title,
        description: data?.description,
        taskType: data?.task_type,
        priority: data?.priority,
        status: data?.status,
        dueDate: data?.due_date,
        estimatedDuration: data?.estimated_duration,
        actualDuration: data?.actual_duration,
        propertyId: data?.property_id,
        propertyName: data?.properties ? `${data?.properties?.name} - ${data?.properties?.property_code}` : 'Unknown Property',
        assignedTo: data?.assigned_to,
        assignedToName: data?.assigned_user?.full_name || 'Unassigned',
        createdBy: data?.created_by,
        reservationId: data?.reservation_id,
        completedAt: data?.completed_at,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error in taskService.update:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      if (isPreviewMode()) {
        console.log('Preview mode: Cannot delete real tasks');
        return;
      }

      const { data: { user }, error: authError } = await supabase?.auth?.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase?.from('tasks')?.delete()?.eq('id', id);

      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in taskService.delete:', error);
      throw error;
    }
  },

  async getStatistics() {
    try {
      if (isPreviewMode()) {
        const mockTasks = getMockTasks();
        return {
          totalTasks: mockTasks?.length,
          completedTasks: mockTasks?.filter(t => t?.status === 'completed')?.length,
          inProgressTasks: mockTasks?.filter(t => t?.status === 'in_progress')?.length,
          overdueTasks: mockTasks?.filter(t => t?.status === 'overdue' || (new Date(t.dueDate) < new Date() && t?.status !== 'completed'))?.length,
          pendingTasks: mockTasks?.filter(t => t?.status === 'pending')?.length
        };
      }

      const { data: { user }, error: authError } = await supabase?.auth?.getUser();
      if (authError || !user) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          pendingTasks: 0
        };
      }

      const { data, error } = await supabase?.from('tasks')?.select('status, due_date');

      if (error) {
        console.error('Error fetching task statistics:', error);
        throw error;
      }

      const now = new Date();
      const stats = {
        totalTasks: data?.length || 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        pendingTasks: 0
      };

      data?.forEach(task => {
        switch (task?.status) {
          case 'completed':
            stats.completedTasks++;
            break;
          case 'in_progress':
            stats.inProgressTasks++;
            break;
          case 'pending':
            stats.pendingTasks++;
            break;
        }

        // Check for overdue tasks (not completed and past due date)
        if (task?.status !== 'completed' && task?.due_date && new Date(task.due_date) < now) {
          stats.overdueTasks++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in taskService.getStatistics:', error);
      throw error;
    }
  }
};

export default taskService;