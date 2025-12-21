import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const PropertyFilters = ({ onFiltersChange, totalCount, filteredCount }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  const propertyTypes = [
    { value: '', label: 'All Types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'studio', label: 'Studio' },
    { value: 'house', label: 'House' },
    { value: 'penthouse', label: 'Penthouse' }
  ];

  const locations = [
    { value: '', label: 'All Locations' },
    { value: 'marrakech', label: 'Marrakech' },
    { value: 'casablanca', label: 'Casablanca' },
    { value: 'rabat', label: 'Rabat' },
    { value: 'fes', label: 'Fes' },
    { value: 'agadir', label: 'Agadir' }
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'Available', label: 'Available' },
    { value: 'Occupied', label: 'Occupied' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Cleaning', label: 'Cleaning' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'occupancy', label: 'Occupancy Rate' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'status', label: 'Status' },
    { value: 'location', label: 'Location' }
  ];

  const handleFilterChange = (filterType, value) => {
    const filters = {
      search: searchTerm,
      type: selectedType,
      location: selectedLocation,
      status: selectedStatus,
      sortBy: sortBy
    };

    switch (filterType) {
      case 'search':
        setSearchTerm(value);
        filters.search = value;
        break;
      case 'type':
        setSelectedType(value);
        filters.type = value;
        break;
      case 'location':
        setSelectedLocation(value);
        filters.location = value;
        break;
      case 'status':
        setSelectedStatus(value);
        filters.status = value;
        break;
      case 'sortBy':
        setSortBy(value);
        filters.sortBy = value;
        break;
    }

    onFiltersChange(filters);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedLocation('');
    setSelectedStatus('');
    setSortBy('name');
    onFiltersChange({
      search: '',
      type: '',
      location: '',
      status: '',
      sortBy: 'name'
    });
  };

  const hasActiveFilters = searchTerm || selectedType || selectedLocation || selectedStatus;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      {/* Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search properties by name, code, or location..."
            value={searchTerm}
            onChange={(e) => handleFilterChange('search', e?.target?.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            iconName={showFilters ? "ChevronUp" : "ChevronDown"}
            iconPosition="right"
          >
            Filters
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              iconName="X"
              size="sm"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
          <Select
            label="Property Type"
            options={propertyTypes}
            value={selectedType}
            onChange={(value) => handleFilterChange('type', value)}
          />
          
          <Select
            label="Location"
            options={locations}
            value={selectedLocation}
            onChange={(value) => handleFilterChange('location', value)}
          />
          
          <Select
            label="Status"
            options={statuses}
            value={selectedStatus}
            onChange={(value) => handleFilterChange('status', value)}
          />
          
          <Select
            label="Sort By"
            options={sortOptions}
            value={sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
          />
        </div>
      )}
      {/* Results Summary */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredCount} of {totalCount} properties
          </p>
          
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <Icon name="Filter" size={16} className="text-primary" />
              <span className="text-sm text-primary font-medium">Filters Active</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Icon name="Grid3X3" size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Grid View</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyFilters;