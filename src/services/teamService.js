import { supabase } from '../lib/supabase';
import { authService } from './authService';

// Check if running in preview mode (builtwithrocket domains)
const isPreviewMode = () => {
  return typeof window !== 'undefined' && 
         (window.location?.hostname?.includes('builtwithrocket.com') || 
          window.location?.hostname === 'localhost');
};

// Convert snake_case database fields to camelCase
const convertToCamelCase = (teamMember) => {
  if (!teamMember) return null;
  
  return {
    id: teamMember?.id,
    name: teamMember?.user_profiles?.full_name || teamMember?.full_name || 'N/A',
    email: teamMember?.user_profiles?.email || teamMember?.email || 'N/A',
    phone: teamMember?.phone_number || teamMember?.phoneNumber || '',
    role: teamMember?.position || teamMember?.role || 'N/A',
    department: teamMember?.department || 'N/A',
    contractType: teamMember?.salary ? 'Full-time' : teamMember?.hourly_rate ? 'Part-time' : 'N/A',
    salary: teamMember?.salary ? `$${teamMember?.salary}/year` : teamMember?.hourly_rate ? `$${teamMember?.hourly_rate}/hour` : 'N/A',
    startDate: teamMember?.hire_date || teamMember?.hireDate || teamMember?.created_at?.split('T')?.[0] || 'N/A',
    status: teamMember?.is_active ? 'Active' : 'Inactive',
    avatar: teamMember?.user_profiles?.avatar_url || teamMember?.avatarUrl || '',
    avatarAlt: `Profile photo of ${teamMember?.user_profiles?.full_name || teamMember?.full_name || 'team member'}`,
    employeeId: teamMember?.employee_id || teamMember?.employeeId || '',
    managerId: teamMember?.manager_id || teamMember?.managerId || null,
    address: teamMember?.address || '',
    emergencyContact: teamMember?.emergency_contact || teamMember?.emergencyContact || '',
    emergencyPhone: teamMember?.emergency_phone || teamMember?.emergencyPhone || ''
  };
};

// Convert camelCase to snake_case for database operations
const convertToSnakeCase = (teamMember) => {
  return {
    position: teamMember?.role || teamMember?.position,
    department: teamMember?.department,
    salary: teamMember?.contractType === 'Full-time' ? parseFloat(teamMember?.salary?.replace(/[$,]/g, '')) || null : null,
    hourly_rate: teamMember?.contractType === 'Part-time' ? parseFloat(teamMember?.salary?.replace(/[$,]/g, '')) || null : null,
    hire_date: teamMember?.startDate,
    phone_number: teamMember?.phone || teamMember?.phoneNumber,
    is_active: teamMember?.status === 'Active',
    employee_id: teamMember?.employeeId,
    manager_id: teamMember?.managerId || null,
    address: teamMember?.address || '',
    emergency_contact: teamMember?.emergencyContact || '',
    emergency_phone: teamMember?.emergencyPhone || ''
  };
};

// Mock data for preview mode
const getMockTeamMembers = () => [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@propertyflow.com",
    phone: "+1 (555) 123-4567",
    role: "Manager",
    department: "Operations",
    contractType: "Full-time",
    salary: "$65,000/year",
    startDate: "2023-01-15",
    status: "Active",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1cef3e415-1762274502183.png",
    avatarAlt: "Professional woman with shoulder-length brown hair in business attire smiling at camera",
    employeeId: "EMP-001",
    managerId: null,
    address: "123 Main St, City, State 12345",
    emergencyContact: "John Johnson (Spouse)",
    emergencyPhone: "+1 (555) 123-4568"
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    email: "michael.rodriguez@propertyflow.com",
    phone: "+1 (555) 234-5678",
    role: "Cleaner",
    department: "Housekeeping",
    contractType: "Full-time",
    salary: "$35,000/year",
    startDate: "2023-03-20",
    status: "Active",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_111874aba-1762274570522.png",
    avatarAlt: "Hispanic man with short black hair in casual work uniform smiling confidently",
    employeeId: "EMP-002",
    managerId: 1,
    address: "456 Oak Ave, City, State 12345",
    emergencyContact: "Maria Rodriguez (Wife)",
    emergencyPhone: "+1 (555) 234-5679"
  },
  {
    id: 3,
    name: "Emma Thompson",
    email: "emma.thompson@propertyflow.com",
    phone: "+1 (555) 345-6789",
    role: "Receptionist",
    department: "Customer Service",
    contractType: "Part-time",
    salary: "$28,000/year",
    startDate: "2023-06-10",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1684262855358-88f296a2cfc2",
    avatarAlt: "Young blonde woman in professional blazer with friendly smile at reception desk",
    employeeId: "EMP-003",
    managerId: 1,
    address: "789 Pine St, City, State 12345",
    emergencyContact: "Robert Thompson (Father)",
    emergencyPhone: "+1 (555) 345-6790"
  },
  {
    id: 4,
    name: "David Chen",
    email: "david.chen@propertyflow.com",
    phone: "+1 (555) 456-7890",
    role: "Maintenance",
    department: "Maintenance",
    contractType: "Full-time",
    salary: "$42,000/year",
    startDate: "2022-11-05",
    status: "Active",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_195e3c8e7-1762273899275.png",
    avatarAlt: "Asian man in work clothes with tool belt standing in maintenance workshop",
    employeeId: "EMP-004",
    managerId: 1,
    address: "321 Elm St, City, State 12345",
    emergencyContact: "Linda Chen (Wife)",
    emergencyPhone: "+1 (555) 456-7891"
  },
  {
    id: 5,
    name: "Lisa Anderson",
    email: "lisa.anderson@propertyflow.com",
    phone: "+1 (555) 567-8901",
    role: "Administrator",
    department: "Administration",
    contractType: "Full-time",
    salary: "$55,000/year",
    startDate: "2022-08-15",
    status: "On Leave",
    avatar: "https://images.unsplash.com/photo-1718109581971-16784ca9a38e",
    avatarAlt: "Professional woman with glasses and dark hair in business suit working at desk",
    employeeId: "EMP-005",
    managerId: 1,
    address: "654 Maple Ave, City, State 12345",
    emergencyContact: "Mark Anderson (Husband)",
    emergencyPhone: "+1 (555) 567-8902"
  },
  {
    id: 6,
    name: "James Wilson",
    email: "james.wilson@propertyflow.com",
    phone: "+1 (555) 678-9012",
    role: "Cleaner",
    department: "Housekeeping",
    contractType: "Part-time",
    salary: "$25,000/year",
    startDate: "2023-09-01",
    status: "Active",
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1b6ba50e3-1762273771688.png",
    avatarAlt: "African American man in cleaning uniform with professional demeanor",
    employeeId: "EMP-006",
    managerId: 2,
    address: "987 Birch Ln, City, State 12345",
    emergencyContact: "Angela Wilson (Sister)",
    emergencyPhone: "+1 (555) 678-9013"
  }
];

export const teamService = {
  // Get all team members
  async getAll() {
    try {
      // Return mock data in preview mode
      if (isPreviewMode()) {
        return getMockTeamMembers();
      }

      const { data, error } = await supabase?.from('team_members')?.select(`
          *,
          user_profiles!user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)?.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(convertToCamelCase) || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Return mock data as fallback
      return getMockTeamMembers();
    }
  },

  // Get team member by ID
  async getById(id) {
    try {
      if (isPreviewMode()) {
        const mockData = getMockTeamMembers();
        return mockData?.find(member => member?.id == id) || null;
      }

      const { data, error } = await supabase?.from('team_members')?.select(`
          *,
          user_profiles!user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)?.eq('id', id)?.single();

      if (error) throw error;

      return convertToCamelCase(data);
    } catch (error) {
      console.error('Error fetching team member:', error);
      return null;
    }
  },

  // Create new team member
  async create(memberData) {
    try {
      if (isPreviewMode()) {
        const mockData = getMockTeamMembers();
        const newMember = {
          ...memberData,
          id: Math.max(...mockData?.map(m => m?.id)) + 1,
          status: 'Active',
          startDate: new Date()?.toISOString()?.split('T')?.[0]
        };
        return newMember;
      }

      // Get current user for manager_id if not provided
      const user = await authService?.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const teamMemberData = {
        ...convertToSnakeCase(memberData),
        user_id: memberData?.userId || null,
        manager_id: memberData?.managerId || user?.id
      };

      const { data, error } = await supabase?.from('team_members')?.insert(teamMemberData)?.select(`
          *,
          user_profiles!user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)?.single();

      if (error) throw error;

      return convertToCamelCase(data);
    } catch (error) {
      console.error('Error creating team member:', error);
      throw error;
    }
  },

  // Update team member
  async update(id, memberData) {
    try {
      if (isPreviewMode()) {
        return { ...memberData, id };
      }

      const teamMemberData = convertToSnakeCase(memberData);

      const { data, error } = await supabase?.from('team_members')?.update(teamMemberData)?.eq('id', id)?.select(`
          *,
          user_profiles!user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)?.single();

      if (error) throw error;

      return convertToCamelCase(data);
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  },

  // Delete team member
  async delete(id) {
    try {
      if (isPreviewMode()) {
        return true;
      }

      const { error } = await supabase?.from('team_members')?.delete()?.eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }
  },

  // Get team statistics
  async getStats() {
    try {
      const members = await this.getAll();
      
      const totalMembers = members?.length;
      const activeMembers = members?.filter(m => m?.status === 'Active')?.length;
      const inactiveMembers = totalMembers - activeMembers;
      
      // Department breakdown
      const departmentCounts = members?.reduce((acc, member) => {
        acc[member.department] = (acc?.[member?.department] || 0) + 1;
        return acc;
      }, {});

      // Role breakdown
      const roleCounts = members?.reduce((acc, member) => {
        acc[member.role] = (acc?.[member?.role] || 0) + 1;
        return acc;
      }, {});

      return {
        totalMembers,
        activeMembers,
        inactiveMembers,
        departments: Object.keys(departmentCounts)?.length,
        departmentBreakdown: departmentCounts,
        roleBreakdown: roleCounts,
        recentHires: members?.filter(m => {
          const hireDate = new Date(m.startDate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo?.setDate(thirtyDaysAgo?.getDate() - 30);
          return hireDate >= thirtyDaysAgo;
        })?.length
      };
    } catch (error) {
      console.error('Error getting team stats:', error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        departments: 0,
        departmentBreakdown: {},
        roleBreakdown: {},
        recentHires: 0
      };
    }
  },

  // Search team members
  async search(searchTerm, filters = {}) {
    try {
      const allMembers = await this.getAll();
      
      let filteredMembers = allMembers?.filter(member => {
        const matchesSearch = !searchTerm || 
          member?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
          member?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
          member?.role?.toLowerCase()?.includes(searchTerm?.toLowerCase());
        
        const matchesDepartment = !filters?.department || member?.department === filters?.department;
        const matchesRole = !filters?.role || member?.role === filters?.role;
        const matchesStatus = !filters?.status || member?.status === filters?.status;

        return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
      });

      return filteredMembers;
    } catch (error) {
      console.error('Error searching team members:', error);
      return [];
    }
  },

  // Get unique departments
  async getDepartments() {
    try {
      const members = await this.getAll();
      const departments = [...new Set(members.map(m => m.department))]?.filter(Boolean);
      return departments?.sort();
    } catch (error) {
      console.error('Error getting departments:', error);
      return [];
    }
  },

  // Get unique roles
  async getRoles() {
    try {
      const members = await this.getAll();
      const roles = [...new Set(members.map(m => m.role))]?.filter(Boolean);
      return roles?.sort();
    } catch (error) {
      console.error('Error getting roles:', error);
      return [];
    }
  }
};