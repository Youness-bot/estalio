import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { teamService } from '../../../services/teamService';

const AddTeamMemberModal = ({ isOpen, onClose, onSave, member }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    contractType: 'Full-time',
    salary: '',
    startDate: new Date()?.toISOString()?.split('T')?.[0],
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    employeeId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  // Load available departments and roles
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (member && isOpen) {
      setFormData({
        name: member?.name || '',
        email: member?.email || '',
        phone: member?.phone || '',
        role: member?.role || '',
        department: member?.department || '',
        contractType: member?.contractType || 'Full-time',
        salary: member?.salary?.replace(/[$,]/g, '') || '',
        startDate: member?.startDate || new Date()?.toISOString()?.split('T')?.[0],
        address: member?.address || '',
        emergencyContact: member?.emergencyContact || '',
        emergencyPhone: member?.emergencyPhone || '',
        employeeId: member?.employeeId || ''
      });
    } else if (isOpen) {
      // Reset form for new member
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        contractType: 'Full-time',
        salary: '',
        startDate: new Date()?.toISOString()?.split('T')?.[0],
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        employeeId: ''
      });
    }
  }, [member, isOpen]);

  const loadDropdownData = async () => {
    try {
      const [deptData, roleData] = await Promise.all([
        teamService?.getDepartments(),
        teamService?.getRoles()
      ]);
      setDepartments(deptData);
      setRoles(roleData);
    } catch (err) {
      console.error('Error loading dropdown data:', err);
      // Set default values as fallback
      setDepartments(['Operations', 'Housekeeping', 'Customer Service', 'Maintenance', 'Administration']);
      setRoles(['Manager', 'Cleaner', 'Receptionist', 'Maintenance', 'Administrator']);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    // Basic validation
    if (!formData?.name?.trim() || !formData?.email?.trim() || !formData?.role?.trim() || !formData?.department?.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare member data
      const memberData = {
        ...formData,
        status: 'Active'
      };

      // Call onSave (which will handle create/update through teamService)
      await onSave(memberData);
      
      // Close modal on success
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save team member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-gray-700">
          <h2 className="text-xl font-semibold text-foreground dark:text-white">
            {member ? 'Edit Team Member' : 'Add New Team Member'}
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            iconName="X" 
            onClick={onClose}
            disabled={loading} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center">
              <Icon name="AlertCircle" className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              name="name"
              value={formData?.name}
              onChange={handleInputChange}
              placeholder="Enter full name"
              required
            />

            <Input
              label="Employee ID"
              name="employeeId"
              value={formData?.employeeId}
              onChange={handleInputChange}
              placeholder="e.g., EMP-001"
            />

            <Input
              label="Email Address *"
              name="email"
              type="email"
              value={formData?.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
              required
            />

            <Input
              label="Phone Number"
              name="phone"
              value={formData?.phone}
              onChange={handleInputChange}
              placeholder="Enter phone number"
            />
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                Role / Position *
              </label>
              <select
                name="role"
                value={formData?.role}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 text-foreground dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a role</option>
                {roles?.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                Department *
              </label>
              <select
                name="department"
                value={formData?.department}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 text-foreground dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a department</option>
                {departments?.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Employment Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                Contract Type
              </label>
              <select
                name="contractType"
                value={formData?.contractType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 text-foreground dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <Input
              label={formData?.contractType === 'Part-time' ? 'Hourly Rate' : 'Annual Salary'}
              name="salary"
              type="number"
              value={formData?.salary}
              onChange={handleInputChange}
              placeholder={formData?.contractType === 'Part-time' ? '25' : '50000'}
            />

            <Input
              label="Start Date"
              name="startDate"
              type="date"
              value={formData?.startDate}
              onChange={handleInputChange}
            />
          </div>

          {/* Address */}
          <Input
            label="Address"
            name="address"
            value={formData?.address}
            onChange={handleInputChange}
            placeholder="Enter home address"
          />

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Emergency Contact"
              name="emergencyContact"
              value={formData?.emergencyContact}
              onChange={handleInputChange}
              placeholder="Contact name and relationship"
            />

            <Input
              label="Emergency Phone"
              name="emergencyPhone"
              value={formData?.emergencyPhone}
              onChange={handleInputChange}
              placeholder="Emergency contact phone"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border dark:border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              iconName={loading ? 'Loader2' : 'Check'}
              iconPosition="left"
            >
              {loading ? 'Saving...' : member ? 'Update Member' : 'Add Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamMemberModal;