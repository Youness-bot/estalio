import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { propertyService } from '../../../services/propertyService';

const ReservationFilters = ({ onFiltersChange, filters }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const [propertyOptions, setPropertyOptions] = useState([
    { value: 'all', label: 'All Properties' }
  ]);

  const channelOptions = [
    { value: 'all', label: 'All Channels' },
    { value: 'direct', label: 'Direct' },
    { value: 'airbnb', label: 'Airbnb' },
    { value: 'booking', label: 'Booking.com' },
    { value: 'expedia', label: 'Expedia' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' }
  ];

  // ⭐ Load real properties from backend
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const props = await propertyService.getAll();

        const dynamicOptions =
          props?.map((p) => ({
            value: p?.propertyCode || p?.name || p?.id,
            label: p?.name || p?.propertyCode || 'Property'
          })) || [];

        setPropertyOptions([
          { value: 'all', label: 'All Properties' },
          ...dynamicOptions
        ]);
      } catch (err) {
        console.error('Error loading properties for filters:', err);
        // en cas d’erreur, on garde juste "All Properties"
      }
    };

    loadProperties();
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      channel: 'all',
      status: 'all',
      property: 'all',
      dateFrom: '',
      dateTo: ''
    };
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search and Quick Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="search"
              placeholder="Search by client name or booking reference..."
              value={filters?.search || ''}
              onChange={(e) => handleFilterChange('search', e?.target?.value)}
            />
          </div>

          <div className="flex gap-2">
            <Select
              options={channelOptions}
              value={filters?.channel || 'all'}
              onChange={(value) => handleFilterChange('channel', value)}
              placeholder="Channel"
              className="w-32"
            />

            <Select
              options={statusOptions}
              value={filters?.status || 'all'}
              onChange={(value) => handleFilterChange('status', value)}
              placeholder="Status"
              className="w-32"
            />
          </div>
        </div>

        {/* Filter Toggle and Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
            iconPosition="right"
          >
            More Filters
          </Button>

          <Button
            variant="ghost"
            onClick={clearFilters}
            iconName="X"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Property"
              options={propertyOptions}
              value={filters?.property || 'all'}
              onChange={(value) => handleFilterChange('property', value)}
            />

            <Input
              label="Check-in From"
              type="date"
              value={filters?.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
            />

            <Input
              label="Check-in To"
              type="date"
              value={filters?.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
            />

            {/* 🚫 Export Results — SUPPRIMÉ */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationFilters;
