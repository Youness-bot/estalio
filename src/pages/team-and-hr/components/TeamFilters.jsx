import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';

import Icon from '../../../components/AppIcon';
import { teamService } from '../../../services/teamService';

const TeamFilters = ({
  searchTerm,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  onClearFilters
}) => {
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      setLoading(true);
      const [deptData, roleData] = await Promise.all([
        teamService?.getDepartments(),
        teamService?.getRoles()
      ]);
      setDepartments(deptData);
      setRoles(roleData);
    } catch (error) {
      console.error('Error loading filter options:', error);
      // Fallback options
      setDepartments(['Operations', 'Housekeeping', 'Customer Service', 'Maintenance', 'Administration']);
      setRoles(['Manager', 'Cleaner', 'Receptionist', 'Maintenance', 'Administrator']);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = ['Active', 'Inactive', 'On Leave'];

  const hasActiveFilters = searchTerm || selectedDepartment || selectedRole || selectedStatus;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-border dark:border-gray-700 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e?.target?.value)}
              className="w-full pl-10 pr-4 py-2 border border-border dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="min-w-[160px]">
            <select
              value={selectedDepartment}
              onChange={(e) => onDepartmentChange(e?.target?.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 text-foreground dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            >
              <option value="">All Departments</option>
              {departments?.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="min-w-[140px]">
            <select
              value={selectedRole}
              onChange={(e) => onRoleChange(e?.target?.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 text-foreground dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            >
              <option value="">All Roles</option>
              {roles?.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="min-w-[120px]">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e?.target?.value)}
              className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 text-foreground dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Status</option>
              {statusOptions?.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              iconName="X"
              iconPosition="left"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border dark:border-gray-700">
          <span className="text-sm text-muted-foreground dark:text-gray-400">Active filters:</span>
          
          {searchTerm && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm">
              Search: "{searchTerm}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-sm p-0.5"
              >
                <Icon name="X" className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {selectedDepartment && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm">
              Department: {selectedDepartment}
              <button
                onClick={() => onDepartmentChange('')}
                className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-sm p-0.5"
              >
                <Icon name="X" className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {selectedRole && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm">
              Role: {selectedRole}
              <button
                onClick={() => onRoleChange('')}
                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-sm p-0.5"
              >
                <Icon name="X" className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {selectedStatus && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-sm">
              Status: {selectedStatus}
              <button
                onClick={() => onStatusChange('')}
                className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-sm p-0.5"
              >
                <Icon name="X" className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamFilters;