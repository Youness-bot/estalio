import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import RuleCard from './components/RuleCard';
import RuleFilters from './components/RuleFilters';
import CreateRuleModal from './components/CreateRuleModal';
import OccupancyWidget from './components/OccupancyWidget';
import RuleAnalytics from './components/RuleAnalytics';
import { pricingService } from '../../services/pricingService';

const PricingRules = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pricingRules, setPricingRules] = useState([]);
  const [occupancyData, setOccupancyData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    property: 'all',
    startDate: '',
    endDate: '',
    sort: 'name'
  });

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [rulesData, occupancyDataResponse, analyticsDataResponse] = await Promise.all([
        pricingService?.getAll(),
        pricingService?.getOccupancyData(),
        pricingService?.getAnalyticsData()
      ]);

      setPricingRules(rulesData);
      setOccupancyData(occupancyDataResponse);
      setAnalyticsData(analyticsDataResponse);
    } catch (err) {
      console.error('Error loading pricing data:', err);
      setError(err?.message || 'Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      property: 'all',
      startDate: '',
      endDate: '',
      sort: 'name'
    });
  };

  const handleToggleRule = async (ruleId) => {
    try {
      await pricingService?.toggleActive(ruleId);
      setPricingRules(prev => prev?.map(rule => 
        rule?.id === ruleId ? { ...rule, isActive: !rule?.isActive } : rule
      ));
    } catch (err) {
      console.error('Error toggling rule:', err);
      setError('Failed to update rule status');
    }
  };

  const handleEditRule = (rule) => {
    console.log('Edit rule:', rule);
    // Implementation for edit functionality would go here
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this pricing rule?')) {
      try {
        await pricingService?.delete(ruleId);
        setPricingRules(prev => prev?.filter(rule => rule?.id !== ruleId));
      } catch (err) {
        console.error('Error deleting rule:', err);
        setError('Failed to delete rule');
      }
    }
  };

  const handleCreateRule = async (newRule) => {
    try {
      await pricingService?.create(newRule);
      await loadPricingData(); // Reload all data
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating rule:', err);
      setError('Failed to create rule');
      throw err; // Re-throw so modal can handle it
    }
  };

  // Filter and sort rules
  const filteredRules = pricingRules?.filter(rule => {
    const matchesSearch = rule?.name?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
                         rule?.description?.toLowerCase()?.includes(filters?.search?.toLowerCase());
    const matchesType = filters?.type === 'all' || rule?.type === filters?.type;
    const matchesStatus = filters?.status === 'all' || 
                         (filters?.status === 'active' && rule?.isActive) ||
                         (filters?.status === 'inactive' && !rule?.isActive);
    const matchesProperty = filters?.property === 'all' || 
                           rule?.properties?.some(prop => prop?.toLowerCase()?.includes(filters?.property?.toLowerCase()));
    
    return matchesSearch && matchesType && matchesStatus && matchesProperty;
  })?.sort((a, b) => {
    switch (filters?.sort) {
      case 'name': return a?.name?.localeCompare(b?.name);
      case 'created': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'priority': return b?.priority - a?.priority;
      case 'impact': return (b?.revenueImpact?.revenueChange || 0) - (a?.revenueImpact?.revenueChange || 0);
      case 'status': return b?.isActive - a?.isActive;
      default: return 0;
    }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pricing rules...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="rounded-md bg-destructive/15 p-4">
              <p className="text-sm text-destructive">{error}</p>
              <button 
                onClick={loadPricingData}
                className="mt-2 text-sm text-primary hover:text-primary/80"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Pricing Rules</h1>
          <p className="text-muted-foreground">
            Configure dynamic pricing strategies and rules for optimal revenue
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            iconName="TrendingUp"
            iconPosition="left"
          >
            Analytics
          </Button>
          <Button
            variant="default"
            onClick={() => setIsCreateModalOpen(true)}
            iconName="Plus"
            iconPosition="left"
          >
            Create Rule
          </Button>
        </div>
      </div>
      {/* Filters */}
      <RuleFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />
      {/* Analytics and Occupancy Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {analyticsData && (
            <RuleAnalytics analyticsData={analyticsData} />
          )}
        </div>
        <div>
          {occupancyData && (
            <OccupancyWidget occupancyData={occupancyData} />
          )}
        </div>
      </div>
      {/* Pricing Rules Grid */}
      {filteredRules && filteredRules?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules?.map((rule) => (
            <RuleCard
              key={rule?.id}
              rule={rule}
              onEdit={handleEditRule}
              onDelete={handleDeleteRule}
              onToggle={handleToggleRule}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No pricing rules found</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create Your First Rule
          </Button>
        </div>
      )}
      {/* Create Rule Modal */}
      <CreateRuleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateRule}
      />
    </div>
  );
};

export default PricingRules;