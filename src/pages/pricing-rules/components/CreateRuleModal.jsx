import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { pricingService } from '../../../services/pricingService';

const CreateRuleModal = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableProperties, setAvailableProperties] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'seasonal',
    adjustmentType: 'percentage',
    adjustment: 0,
    startDate: '',
    endDate: '',
    propertyIds: [],
    conditions: {
      minStay: null,
      advanceBooking: null,
      occupancyThreshold: null,
      dayOfWeek: []
    },
    priority: 5,
    isActive: true
  });

  useEffect(() => {
    if (isOpen) {
      loadAvailableProperties();
      resetForm();
    }
  }, [isOpen]);

  const loadAvailableProperties = async () => {
    try {
      const properties = await pricingService?.getAvailableProperties();
      setAvailableProperties(properties);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'seasonal',
      adjustmentType: 'percentage',
      adjustment: 0,
      startDate: '',
      endDate: '',
      propertyIds: [],
      conditions: {
        minStay: null,
        advanceBooking: null,
        occupancyThreshold: null,
        dayOfWeek: []
      },
      priority: 5,
      isActive: true
    });
    setError('');
  };

  const handleInputChange = (field, value) => {
    if (field?.startsWith('conditions.')) {
      const conditionField = field?.split('.')?.[1];
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev?.conditions,
          [conditionField]: value === '' ? null : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePropertyToggle = (propertyId) => {
    setFormData(prev => ({
      ...prev,
      propertyIds: prev?.propertyIds?.includes(propertyId)
        ? prev?.propertyIds?.filter(id => id !== propertyId)
        : [...prev?.propertyIds, propertyId]
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev?.conditions,
        dayOfWeek: prev?.conditions?.dayOfWeek?.includes(day)
          ? prev?.conditions?.dayOfWeek?.filter(d => d !== day)
          : [...prev?.conditions?.dayOfWeek, day]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    // Validation
    if (!formData?.name?.trim()) {
      setError('Rule name is required');
      return;
    }
    
    if (formData?.propertyIds?.length === 0) {
      setError('Please select at least one property');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const ruleTypes = [
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'occupancy', label: 'Occupancy Based' },
    { value: 'advance', label: 'Advance Booking' },
    { value: 'lastminute', label: 'Last Minute' },
    { value: 'event', label: 'Event Based' },
    { value: 'length_of_stay', label: 'Length of Stay' }
  ];

  const adjustmentTypes = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount' }
  ];

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Create Pricing Rule</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Rule Name"
                value={formData?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                placeholder="e.g., Summer Peak Season"
                required
              />
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData?.description}
                  onChange={(e) => handleInputChange('description', e?.target?.value)}
                  placeholder="Describe when and how this rule applies"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Rule Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Rule Type"
                value={formData?.type}
                onValueChange={(value) => handleInputChange('type', value)}
                options={ruleTypes}
              />
              
              <Select
                label="Adjustment Type"
                value={formData?.adjustmentType}
                onValueChange={(value) => handleInputChange('adjustmentType', value)}
                options={adjustmentTypes}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={`Adjustment ${formData?.adjustmentType === 'percentage' ? '(%)' : '(Amount)'}`}
                type="number"
                value={formData?.adjustment}
                onChange={(e) => handleInputChange('adjustment', parseFloat(e?.target?.value) || 0)}
                placeholder="0"
                step="0.01"
                required
              />
              
              <Input
                label="Priority (1-10)"
                type="number"
                value={formData?.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e?.target?.value) || 5)}
                min="1"
                max="10"
              />
              
              <div className="flex items-center">
                <Checkbox
                  checked={formData?.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  label="Active Rule"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData?.startDate}
                onChange={(e) => handleInputChange('startDate', e?.target?.value)}
              />
              
              <Input
                label="End Date"
                type="date"
                value={formData?.endDate}
                onChange={(e) => handleInputChange('endDate', e?.target?.value)}
              />
            </div>

            {/* Conditions */}
            <div>
              <h3 className="text-lg font-medium mb-3">Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Min Stay (nights)"
                  type="number"
                  value={formData?.conditions?.minStay || ''}
                  onChange={(e) => handleInputChange('conditions.minStay', e?.target?.value ? parseInt(e?.target?.value) : null)}
                  placeholder="Any"
                  min="1"
                />
                
                <Input
                  label="Advance Booking (days)"
                  type="number"
                  value={formData?.conditions?.advanceBooking || ''}
                  onChange={(e) => handleInputChange('conditions.advanceBooking', e?.target?.value ? parseInt(e?.target?.value) : null)}
                  placeholder="Any"
                  min="0"
                />
                
                <Input
                  label="Occupancy Threshold (%)"
                  type="number"
                  value={formData?.conditions?.occupancyThreshold || ''}
                  onChange={(e) => handleInputChange('conditions.occupancyThreshold', e?.target?.value ? parseInt(e?.target?.value) : null)}
                  placeholder="Any"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Days of Week */}
            <div>
              <h3 className="text-lg font-medium mb-3">Days of Week (optional)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {daysOfWeek?.map((day) => (
                  <div key={day?.value} className="flex items-center">
                    <Checkbox
                      checked={formData?.conditions?.dayOfWeek?.includes(day?.value)}
                      onCheckedChange={() => handleDayToggle(day?.value)}
                      label={day?.label}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Properties */}
            <div>
              <h3 className="text-lg font-medium mb-3">Apply to Properties</h3>
              {availableProperties?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {availableProperties?.map((property) => (
                    <div key={property?.id} className="flex items-center">
                      <Checkbox
                        checked={formData?.propertyIds?.includes(property?.id)}
                        onCheckedChange={() => handlePropertyToggle(property?.id)}
                        label={`${property?.name} (${property?.code})`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No properties available. Please create properties first.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
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
                disabled={loading || availableProperties?.length === 0}
              >
                {loading ? 'Creating...' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRuleModal;