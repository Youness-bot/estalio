import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { propertyService } from '../../../services/propertyService';

const TaskFilters = ({
  selectedProperty,
  onPropertyChange,
  selectedTaskType,
  onTaskTypeChange,
  dateRange,
  onDateRangeChange,
  onClearFilters
}) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const propertiesData = await propertyService?.getAll();
      setProperties(propertiesData || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const taskTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'checkin', label: 'Check-in' },
    { value: 'checkout', label: 'Check-out' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'other', label: 'Other' }
  ];

  const handleDateRangeChange = (field, value) => {
    onDateRangeChange({
      ...dateRange,
      [field]: value
    });
  };

  const hasActiveFilters = selectedProperty !== 'all' || selectedTaskType !== 'all' || 
    dateRange?.start !== new Date()?.toISOString()?.split('T')?.[0] ||
    dateRange?.end !== new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)?.toISOString()?.split('T')?.[0];

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Filter Tasks</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Property Filter */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Property
          </label>
          <Select
            value={selectedProperty}
            onValueChange={onPropertyChange}
            disabled={loading}
          >
            <option value="all">All Properties</option>
            {properties?.map(property => (
              <option key={property?.id} value={property?.id}>
                {property?.name} - {property?.propertyCode}
              </option>
            ))}
          </Select>
        </div>

        {/* Task Type Filter */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Task Type
          </label>
          <Select
            value={selectedTaskType}
            onValueChange={onTaskTypeChange}
          >
            {taskTypeOptions?.map(option => (
              <option key={option?.value} value={option?.value}>
                {option?.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Date Range Start */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Start Date
          </label>
          <Input
            type="date"
            value={dateRange?.start || ''}
            onChange={(e) => handleDateRangeChange('start', e?.target?.value)}
          />
        </div>

        {/* Date Range End */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            End Date
          </label>
          <Input
            type="date"
            value={dateRange?.end || ''}
            onChange={(e) => handleDateRangeChange('end', e?.target?.value)}
          />
        </div>
      </div>
      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            
            {selectedProperty !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                Property: {properties?.find(p => p?.id === selectedProperty)?.name || 'Selected'}
              </span>
            )}
            
            {selectedTaskType !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                Type: {taskTypeOptions?.find(t => t?.value === selectedTaskType)?.label}
              </span>
            )}
            
            {(dateRange?.start || dateRange?.end) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                Date: {dateRange?.start || 'Any'} to {dateRange?.end || 'Any'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;