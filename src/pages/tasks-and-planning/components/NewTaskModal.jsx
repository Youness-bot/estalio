import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { propertyService } from '../../../services/propertyService';

const NewTaskModal = ({ isOpen, onClose, onSave, prefilledData = {} }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'cleaning',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    dueTime: '',
    estimatedDuration: '',
    propertyId: '',
    assignedTo: '',
    reservationId: '',
    notes: ''
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: prefilledData?.title || '',
        description: prefilledData?.description || '',
        taskType: prefilledData?.taskType || 'cleaning',
        priority: prefilledData?.priority || 'medium',
        status: prefilledData?.status || 'pending',
        dueDate: prefilledData?.dueDate ? new Date(prefilledData.dueDate)?.toISOString()?.split('T')?.[0] : '',
        dueTime: prefilledData?.dueDate ? new Date(prefilledData.dueDate)?.toTimeString()?.slice(0, 5) : '',
        estimatedDuration: prefilledData?.estimatedDuration || '',
        propertyId: prefilledData?.propertyId || '',
        assignedTo: prefilledData?.assignedTo || '',
        reservationId: prefilledData?.reservationId || '',
        notes: prefilledData?.notes || ''
      });
      loadProperties();
      setError('');
    }
  }, [isOpen, prefilledData]);

  const loadProperties = async () => {
    try {
      const propertiesData = await propertyService?.getAll();
      setProperties(propertiesData || []);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!formData?.title?.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Combine date and time for due date
      let dueDate = null;
      if (formData?.dueDate) {
        if (formData?.dueTime) {
          dueDate = `${formData?.dueDate}T${formData?.dueTime}:00.000Z`;
        } else {
          dueDate = `${formData?.dueDate}T00:00:00.000Z`;
        }
      }

      const taskData = {
        title: formData?.title?.trim(),
        description: formData?.description?.trim() || null,
        taskType: formData?.taskType,
        priority: formData?.priority,
        status: formData?.status,
        dueDate: dueDate,
        estimatedDuration: formData?.estimatedDuration ? parseInt(formData?.estimatedDuration) : null,
        propertyId: formData?.propertyId || null,
        assignedTo: formData?.assignedTo || null,
        reservationId: formData?.reservationId || null
      };

      await onSave(taskData);
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
      setError(`Failed to save task: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const taskTypeOptions = [
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'checkin', label: 'Check-in' },
    { value: 'checkout', label: 'Check-out' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'other', label: 'Other' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="Plus" size={16} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">New Task</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
          >
            <Icon name="X" size={16} />
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertTriangle" size={16} className="text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Task Title *
            </label>
            <Input
              type="text"
              value={formData?.title}
              onChange={(e) => handleInputChange('title', e?.target?.value)}
              placeholder="Enter task title"
              disabled={loading}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData?.description}
              onChange={(e) => handleInputChange('description', e?.target?.value)}
              placeholder="Enter task description"
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Task Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Task Type
              </label>
              <Select
                value={formData?.taskType}
                onValueChange={(value) => handleInputChange('taskType', value)}
                disabled={loading}
              >
                {taskTypeOptions?.map(option => (
                  <option key={option?.value} value={option?.value}>
                    {option?.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <Select
                value={formData?.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
                disabled={loading}
              >
                {priorityOptions?.map(option => (
                  <option key={option?.value} value={option?.value}>
                    {option?.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Due Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Due Date
              </label>
              <Input
                type="date"
                value={formData?.dueDate}
                onChange={(e) => handleInputChange('dueDate', e?.target?.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Due Time
              </label>
              <Input
                type="time"
                value={formData?.dueTime}
                onChange={(e) => handleInputChange('dueTime', e?.target?.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Property */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Property
            </label>
            <Select
              value={formData?.propertyId}
              onValueChange={(value) => handleInputChange('propertyId', value)}
              disabled={loading}
            >
              <option value="">Select Property</option>
              {properties?.map(property => (
                <option key={property?.id} value={property?.id}>
                  {property?.name} - {property?.propertyCode}
                </option>
              ))}
            </Select>
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estimated Duration (minutes)
            </label>
            <Input
              type="number"
              value={formData?.estimatedDuration}
              onChange={(e) => handleInputChange('estimatedDuration', e?.target?.value)}
              placeholder="e.g. 120 for 2 hours"
              disabled={loading}
              min="1"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status
            </label>
            <Select
              value={formData?.status}
              onValueChange={(value) => handleInputChange('status', value)}
              disabled={loading}
            >
              {statusOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData?.title?.trim()}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;