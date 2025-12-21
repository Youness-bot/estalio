import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { propertyService } from '../../../services/propertyService';

const AddItemModal = ({ isOpen, onClose, onAddItem }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 100,
    unitCost: 0,
    supplierName: '',
    supplierContact: '',
    location: '',
    propertyId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadProperties();
    }
  }, [isOpen]);

  const loadProperties = async () => {
    try {
      const data = await propertyService?.getAll();
      setProperties(data);
    } catch (err) {
      console.error('Error loading properties:', err);
    }
  };

  const categories = [
    'cleaning',
    'linens',
    'amenities',
    'maintenance',
    'kitchen',
    'bathroom',
    'electronics',
    'furniture',
    'safety',
    'other'
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!formData?.name || !formData?.category) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onAddItem(formData);
      // Reset form
      setFormData({
        name: '',
        sku: '',
        category: '',
        description: '',
        currentStock: 0,
        minStockLevel: 0,
        maxStockLevel: 100,
        unitCost: 0,
        supplierName: '',
        supplierContact: '',
        location: '',
        propertyId: ''
      });
    } catch (err) {
      setError(err?.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Add New Inventory Item</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-3 mb-6">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Item Name *
              </label>
              <Input
                value={formData?.name}
                onChange={(e) => handleInputChange('name', e?.target?.value)}
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                SKU/Code
              </label>
              <Input
                value={formData?.sku}
                onChange={(e) => handleInputChange('sku', e?.target?.value)}
                placeholder="Enter SKU or item code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category *
              </label>
              <Select
                value={formData?.category}
                onChange={(value) => handleInputChange('category', value)}
                options={categories?.map(cat => ({ 
                  value: cat, 
                  label: cat?.charAt(0)?.toUpperCase() + cat?.slice(1) 
                }))}
                placeholder="Select category"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Property
              </label>
              <Select
                value={formData?.propertyId}
                onChange={(value) => handleInputChange('propertyId', value)}
                options={properties?.map(property => ({ 
                  value: property?.id, 
                  label: property?.name 
                }))}
                placeholder="Select property (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Stock
              </label>
              <Input
                type="number"
                value={formData?.currentStock}
                onChange={(e) => handleInputChange('currentStock', parseInt(e?.target?.value) || 0)}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Unit Cost
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData?.unitCost}
                onChange={(e) => handleInputChange('unitCost', parseFloat(e?.target?.value) || 0)}
                placeholder="0.00"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Min Stock Level
              </label>
              <Input
                type="number"
                value={formData?.minStockLevel}
                onChange={(e) => handleInputChange('minStockLevel', parseInt(e?.target?.value) || 0)}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Stock Level
              </label>
              <Input
                type="number"
                value={formData?.maxStockLevel}
                onChange={(e) => handleInputChange('maxStockLevel', parseInt(e?.target?.value) || 100)}
                placeholder="100"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Supplier Name
              </label>
              <Input
                value={formData?.supplierName}
                onChange={(e) => handleInputChange('supplierName', e?.target?.value)}
                placeholder="Enter supplier name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              <Input
                value={formData?.location}
                onChange={(e) => handleInputChange('location', e?.target?.value)}
                placeholder="Storage location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData?.description}
              onChange={(e) => handleInputChange('description', e?.target?.value)}
              placeholder="Enter item description"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Supplier Contact
            </label>
            <Input
              value={formData?.supplierContact}
              onChange={(e) => handleInputChange('supplierContact', e?.target?.value)}
              placeholder="Phone, email, or other contact info"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
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
              iconName={loading ? "Loader2" : "Plus"}
              iconPosition="left"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;