import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const RuleFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const ruleTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'occupancy', label: 'Occupancy-based' },
    { value: 'advance', label: 'Advance Booking' },
    { value: 'lastminute', label: 'Last Minute' },
    { value: 'minimum-stay', label: 'Minimum Stay' },
    { value: 'competitive', label: 'Competitive' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'expired', label: 'Expired' }
  ];

  const propertyOptions = [
    { value: 'all', label: 'All Properties' },
    { value: 'villa-sunset', label: 'Villa Sunset' },
    { value: 'ocean-view', label: 'Ocean View Apartment' },
    { value: 'mountain-retreat', label: 'Mountain Retreat' },
    { value: 'city-loft', label: 'City Center Loft' },
    { value: 'beach-house', label: 'Beach House Deluxe' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created', label: 'Date Created' },
    { value: 'priority', label: 'Priority' },
    { value: 'impact', label: 'Revenue Impact' },
    { value: 'status', label: 'Status' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <Input
            type="search"
            placeholder="Search rules..."
            value={filters?.search}
            onChange={(e) => onFilterChange('search', e?.target?.value)}
          />
        </div>

        {/* Rule Type */}
        <Select
          options={ruleTypeOptions}
          value={filters?.type}
          onChange={(value) => onFilterChange('type', value)}
          placeholder="Rule Type"
        />

        {/* Status */}
        <Select
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
          placeholder="Status"
        />

        {/* Property */}
        <Select
          options={propertyOptions}
          value={filters?.property}
          onChange={(value) => onFilterChange('property', value)}
          placeholder="Property"
        />

        {/* Sort */}
        <Select
          options={sortOptions}
          value={filters?.sort}
          onChange={(value) => onFilterChange('sort', value)}
          placeholder="Sort by"
        />
      </div>
      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Input
          type="date"
          label="Valid From"
          value={filters?.startDate}
          onChange={(e) => onFilterChange('startDate', e?.target?.value)}
        />
        <Input
          type="date"
          label="Valid Until"
          value={filters?.endDate}
          onChange={(e) => onFilterChange('endDate', e?.target?.value)}
        />
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={onClearFilters}
            iconName="X"
            iconPosition="left"
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </div>
      {/* Active Filters Display */}
      {(filters?.search || filters?.type !== 'all' || filters?.status !== 'all' || filters?.property !== 'all') && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters?.search && (
            <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs">
              Search: "{filters?.search}"
            </span>
          )}
          {filters?.type !== 'all' && (
            <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs">
              Type: {ruleTypeOptions?.find(opt => opt?.value === filters?.type)?.label}
            </span>
          )}
          {filters?.status !== 'all' && (
            <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs">
              Status: {statusOptions?.find(opt => opt?.value === filters?.status)?.label}
            </span>
          )}
          {filters?.property !== 'all' && (
            <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs">
              Property: {propertyOptions?.find(opt => opt?.value === filters?.property)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RuleFilters;