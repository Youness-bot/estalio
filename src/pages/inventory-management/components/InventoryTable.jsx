import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const InventoryTable = ({ items, onToggleStatus, onEditItem, onDeleteItem, onCreateTask }) => {
  const [sortField, setSortField] = useState('article');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const propertyOptions = [
    { value: 'all', label: 'All Properties' },
    { value: 'villa-marrakech', label: 'Villa Marrakech' },
    { value: 'riad-fes', label: 'Riad Fes' },
    { value: 'apartment-casablanca', label: 'Apartment Casablanca' },
    { value: 'hotel-agadir', label: 'Hotel Agadir' }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'durable', label: 'Durable' },
    { value: 'consumable', label: 'Consumable' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'ok', label: 'OK' },
    { value: 'low-stock', label: 'Low Stock' },
    { value: 'depleted', label: 'Depleted' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'pre-alert', label: 'Pre-Alert' }
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredItems = items?.filter(item => {
    if (filterProperty !== 'all' && item?.property !== filterProperty) return false;
    if (filterType !== 'all' && item?.type !== filterType) return false;
    if (filterStatus !== 'all' && item?.status !== filterStatus) return false;
    return true;
  });

  const sortedItems = [...filteredItems]?.sort((a, b) => {
    let aValue = a?.[sortField];
    let bValue = b?.[sortField];
    
    if (typeof aValue === 'string') {
      aValue = aValue?.toLowerCase();
      bValue = bValue?.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusBadge = (status, type, quantity, threshold, depletionDate) => {
    let statusText = status;
    let statusColor = 'bg-muted text-muted-foreground';

    if (type === 'consumable') {
      if (quantity <= 0) {
        statusText = 'Depleted';
        statusColor = 'bg-error text-error-foreground';
      } else if (quantity <= threshold) {
        statusText = 'Low Stock';
        statusColor = 'bg-warning text-warning-foreground';
      } else if (depletionDate) {
        const daysUntilDepletion = Math.ceil((new Date(depletionDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilDepletion <= 7) {
          statusText = 'Pre-Alert';
          statusColor = 'bg-warning text-warning-foreground';
        } else {
          statusText = 'OK';
          statusColor = 'bg-success text-success-foreground';
        }
      } else {
        statusText = 'OK';
        statusColor = 'bg-success text-success-foreground';
      }
    } else {
      if (status === 'ok') {
        statusText = 'OK';
        statusColor = 'bg-success text-success-foreground';
      } else if (status === 'damaged') {
        statusText = 'Damaged';
        statusColor = 'bg-error text-error-foreground';
      }
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
        {statusText}
      </span>
    );
  };

  const handleToggleStatus = (item) => {
    if (item?.type === 'durable') {
      const newStatus = item?.status === 'ok' ? 'damaged' : 'ok';
      onToggleStatus(item?.id, newStatus);
      
      if (newStatus === 'damaged') {
        onCreateTask({
          type: 'replacement',
          title: `Replace damaged ${item?.article}`,
          property: item?.property,
          priority: 'high',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)?.toISOString()?.split('T')?.[0]
        });
      }
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <Icon name="ArrowUpDown" size={14} className="opacity-50" />;
    }
    return (
      <Icon 
        name={sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown'} 
        size={14} 
        className="text-primary" 
      />
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Filter by Property"
            options={propertyOptions}
            value={filterProperty}
            onChange={setFilterProperty}
          />
          <Select
            label="Filter by Type"
            options={typeOptions}
            value={filterType}
            onChange={setFilterType}
          />
          <Select
            label="Filter by Status"
            options={statusOptions}
            value={filterStatus}
            onChange={setFilterStatus}
          />
        </div>
      </div>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-foreground">
                <button
                  onClick={() => handleSort('article')}
                  className="flex items-center space-x-2 hover:text-primary transition-smooth"
                >
                  <span>Article</span>
                  <SortIcon field="article" />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-foreground">
                <button
                  onClick={() => handleSort('property')}
                  className="flex items-center space-x-2 hover:text-primary transition-smooth"
                >
                  <span>Property</span>
                  <SortIcon field="property" />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-foreground">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center space-x-2 hover:text-primary transition-smooth"
                >
                  <span>Type</span>
                  <SortIcon field="type" />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-foreground">
                <button
                  onClick={() => handleSort('quantity')}
                  className="flex items-center space-x-2 hover:text-primary transition-smooth"
                >
                  <span>Quantity</span>
                  <SortIcon field="quantity" />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-foreground">Threshold</th>
              <th className="text-left p-4 font-medium text-foreground">Status</th>
              <th className="text-left p-4 font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems?.map((item) => (
              <tr key={item?.id} className="border-b border-border hover:bg-muted/30 transition-smooth">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <Icon name={item?.type === 'consumable' ? 'Package' : 'Wrench'} size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item?.article}</p>
                      <p className="text-sm text-muted-foreground">{item?.category}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm text-foreground">{item?.propertyName}</span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item?.type === 'consumable' ?'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {item?.type === 'consumable' ? 'Consumable' : 'Durable'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-sm text-foreground">{item?.quantity}</span>
                  {item?.unit && <span className="text-xs text-muted-foreground ml-1">{item?.unit}</span>}
                </td>
                <td className="p-4">
                  <span className="text-sm text-foreground">{item?.threshold || '-'}</span>
                </td>
                <td className="p-4">
                  {getStatusBadge(item?.status, item?.type, item?.quantity, item?.threshold, item?.depletionDate)}
                  {item?.depletionDate && item?.type === 'consumable' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Depletion: {new Date(item.depletionDate)?.toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    {item?.type === 'durable' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(item)}
                        iconName={item?.status === 'ok' ? 'AlertTriangle' : 'CheckCircle'}
                        className={item?.status === 'damaged' ? 'text-success hover:text-success' : 'text-warning hover:text-warning'}
                      >
                        {item?.status === 'ok' ? 'Mark Damaged' : 'Mark OK'}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditItem(item)}
                      iconName="Edit"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteItem(item?.id)}
                      iconName="Trash2"
                      className="text-error hover:text-error"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="lg:hidden">
        {sortedItems?.map((item) => (
          <div key={item?.id} className="p-4 border-b border-border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Icon name={item?.type === 'consumable' ? 'Package' : 'Wrench'} size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item?.article}</p>
                  <p className="text-sm text-muted-foreground">{item?.category}</p>
                </div>
              </div>
              {getStatusBadge(item?.status, item?.type, item?.quantity, item?.threshold, item?.depletionDate)}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-muted-foreground">Property:</span>
                <span className="ml-1 text-foreground">{item?.propertyName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-1 text-foreground">{item?.type === 'consumable' ? 'Consumable' : 'Durable'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Quantity:</span>
                <span className="ml-1 text-foreground">{item?.quantity}{item?.unit && ` ${item?.unit}`}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Threshold:</span>
                <span className="ml-1 text-foreground">{item?.threshold || '-'}</span>
              </div>
            </div>

            {item?.depletionDate && item?.type === 'consumable' && (
              <div className="text-xs text-muted-foreground mb-3">
                Depletion Date: {new Date(item.depletionDate)?.toLocaleDateString()}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {item?.type === 'durable' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(item)}
                  iconName={item?.status === 'ok' ? 'AlertTriangle' : 'CheckCircle'}
                  className={item?.status === 'damaged' ? 'text-success border-success' : 'text-warning border-warning'}
                >
                  {item?.status === 'ok' ? 'Mark Damaged' : 'Mark OK'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditItem(item)}
                iconName="Edit"
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteItem(item?.id)}
                iconName="Trash2"
                className="text-error border-error"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      {sortedItems?.length === 0 && (
        <div className="p-8 text-center">
          <Icon name="Package" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No items found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or add new inventory items.</p>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;