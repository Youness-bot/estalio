import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { teamService } from '../../../services/teamService';

const TeamStats = ({ members }) => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    departments: 0,
    departmentBreakdown: {},
    roleBreakdown: {},
    recentHires: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [members]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const statsData = await teamService?.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading team stats:', error);
      // Calculate stats from members prop as fallback
      if (members && members?.length > 0) {
        const fallbackStats = calculateFallbackStats(members);
        setStats(fallbackStats);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateFallbackStats = (membersList) => {
    const totalMembers = membersList?.length;
    const activeMembers = membersList?.filter(m => m?.status === 'Active')?.length;
    const inactiveMembers = totalMembers - activeMembers;
    
    const departmentCounts = membersList?.reduce((acc, member) => {
      acc[member.department] = (acc?.[member?.department] || 0) + 1;
      return acc;
    }, {});

    const roleCounts = membersList?.reduce((acc, member) => {
      acc[member.role] = (acc?.[member?.role] || 0) + 1;
      return acc;
    }, {});

    const recentHires = membersList?.filter(m => {
      const hireDate = new Date(m.startDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo?.setDate(thirtyDaysAgo?.getDate() - 30);
      return hireDate >= thirtyDaysAgo;
    })?.length;

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      departments: Object.keys(departmentCounts)?.length,
      departmentBreakdown: departmentCounts,
      roleBreakdown: roleCounts,
      recentHires
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)]?.map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border dark:border-gray-700">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border dark:border-gray-700">
        <div className="flex items-center">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            <Icon name="Users" className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Total Members</p>
            <p className="text-2xl font-bold text-foreground dark:text-white">{stats?.totalMembers}</p>
          </div>
        </div>
      </div>
      {/* Active Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border dark:border-gray-700">
        <div className="flex items-center">
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
            <Icon name="UserCheck" className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Active</p>
            <p className="text-2xl font-bold text-foreground dark:text-white">{stats?.activeMembers}</p>
          </div>
        </div>
      </div>
      {/* Departments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border dark:border-gray-700">
        <div className="flex items-center">
          <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
            <Icon name="Building" className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Departments</p>
            <p className="text-2xl font-bold text-foreground dark:text-white">{stats?.departments}</p>
          </div>
        </div>
      </div>
      {/* Recent Hires */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border dark:border-gray-700">
        <div className="flex items-center">
          <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
            <Icon name="UserPlus" className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground dark:text-gray-300">Recent Hires</p>
            <p className="text-2xl font-bold text-foreground dark:text-white">{stats?.recentHires}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStats;