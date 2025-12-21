import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { propertyService } from '../../../services/propertyService';

const ExpenseForm = ({ onSubmit, currentCurrency, isPreviewMode = false }) => {
  const [formData, setFormData] = useState({
    propertyId: '',
    title: '',
    description: '',
    category: '',
    amount: '',
    vendorName: '',
    expenseDate: new Date()?.toISOString()?.split('T')?.[0]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const categories = [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other' }
  ];

  const currencySymbols = {
    MAD: 'د.م.',
    EUR: '€',
    USD: '$'
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoadingProperties(true);
      
      if (isPreviewMode) {
        // Mock properties for preview mode
        const mockProperties = [
          { value: 'mock-1', label: 'Villa Marrakech' },
          { value: 'mock-2', label: 'Riad Fès' },
          { value: 'mock-3', label: 'Apartment Casablanca' },
          { value: 'mock-4', label: 'Hotel Agadir' },
          { value: 'mock-5', label: 'Resort Tangier' }
        ];
        setProperties(mockProperties);
      } else {
        const data = await propertyService?.getAll();
        const propertyOptions = data?.map(property => ({
          value: property?.id,
          label: property?.name
        })) || [];
        setProperties(propertyOptions);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.propertyId) {
      newErrors.propertyId = 'Property is required';
    }
    
    if (!formData?.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData?.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData?.amount || parseFloat(formData?.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!formData?.expenseDate) {
      newErrors.expenseDate = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const expenseData = {
        propertyId: formData?.propertyId,
        title: formData?.title,
        description: formData?.description,
        category: formData?.category,
        amount: parseFloat(formData?.amount),
        currency: currentCurrency,
        expenseDate: formData?.expenseDate,
        vendorName: formData?.vendorName,
        // For preview mode, add property name
        propertyName: isPreviewMode ? properties?.find(p => p?.value === formData?.propertyId)?.label : undefined
      };
      
      await onSubmit(expenseData);
      
      // Reset form
      setFormData({
        propertyId: '',
        title: '',
        description: '',
        category: '',
        amount: '',
        vendorName: '',
        expenseDate: new Date()?.toISOString()?.split('T')?.[0]
      });
      
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      propertyId: '',
      title: '',
      description: '',
      category: '',
      amount: '',
      vendorName: '',
      expenseDate: new Date()?.toISOString()?.split('T')?.[0]
    });
    setErrors({});
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Add New Expense</h3>
        <Icon name="Plus" size={20} className="text-primary" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date"
          type="date"
          value={formData?.expenseDate}
          onChange={(e) => handleInputChange('expenseDate', e?.target?.value)}
          error={errors?.expenseDate}
          required
        />

        <Select
          label="Property"
          options={properties}
          value={formData?.propertyId}
          onChange={(value) => handleInputChange('propertyId', value)}
          placeholder={loadingProperties ? "Loading properties..." : "Select property"}
          error={errors?.propertyId}
          required
          disabled={loadingProperties}
        />

        <Input
          label="Title"
          type="text"
          value={formData?.title}
          onChange={(e) => handleInputChange('title', e?.target?.value)}
          placeholder="Expense title"
          error={errors?.title}
          required
        />

        <Select
          label="Category"
          options={categories}
          value={formData?.category}
          onChange={(value) => handleInputChange('category', value)}
          placeholder="Select category"
          error={errors?.category}
          required
        />

        <Input
          label={`Amount (${currencySymbols?.[currentCurrency]})`}
          type="number"
          step="0.01"
          min="0"
          value={formData?.amount}
          onChange={(e) => handleInputChange('amount', e?.target?.value)}
          placeholder="0.00"
          error={errors?.amount}
          required
        />

        <Input
          label="Vendor Name"
          type="text"
          value={formData?.vendorName}
          onChange={(e) => handleInputChange('vendorName', e?.target?.value)}
          placeholder="Company or person name (optional)"
          description="Optional vendor or service provider name"
        />

        <Input
          label="Description"
          type="textarea"
          value={formData?.description}
          onChange={(e) => handleInputChange('description', e?.target?.value)}
          placeholder="Additional details (optional)"
          description="Optional description for this expense"
        />

        <div className="flex space-x-3 pt-4">
          <Button
            type="submit"
            variant="default"
            loading={isSubmitting}
            iconName="Plus"
            iconPosition="left"
            className="flex-1"
          >
            Add Expense
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            iconName="RotateCcw"
            iconPosition="left"
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;