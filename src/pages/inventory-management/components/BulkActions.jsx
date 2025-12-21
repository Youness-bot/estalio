import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActions = ({ selectedItems, onBulkUpdate, onBulkDelete, onGenerateReport, onClearSelection }) => {
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  const bulkActionOptions = [
    { value: 'update-property', label: 'Update Property' },
    { value: 'update-category', label: 'Update Category' },
    { value: 'update-supplier', label: 'Update Supplier' },
    { value: 'mark-damaged', label: 'Mark as Damaged' },
    { value: 'mark-ok', label: 'Mark as OK' },
    { value: 'delete', label: 'Delete Items' }
  ];

  const reportOptions = [
    { value: 'inventory-summary', label: 'Inventory Summary' },
    { value: 'low-stock-report', label: 'Low Stock Report' },
    { value: 'damaged-items', label: 'Damaged Items Report' },
    { value: 'consumption-forecast', label: 'Consumption Forecast' },
    { value: 'value-report', label: 'Inventory Value Report' }
  ];

  const handleBulkAction = () => {
    if (!bulkAction || selectedItems?.length === 0) return;

    switch (bulkAction) {
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedItems?.length} items?`)) {
          onBulkDelete(selectedItems);
        }
        break;
      case 'mark-damaged':
        onBulkUpdate(selectedItems, { status: 'damaged' });
        break;
      case 'mark-ok':
        onBulkUpdate(selectedItems, { status: 'ok' });
        break;
      default:
        // For other actions, you might want to show a modal for additional input
        console.log(`Bulk action: ${bulkAction} for ${selectedItems?.length} items`);
    }

    setBulkAction('');
    setShowBulkMenu(false);
  };

  const handleGenerateReport = (reportType) => {
    onGenerateReport(reportType);
  };

  if (selectedItems?.length === 0) {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">Inventory Management</h2>
          <span className="text-sm text-muted-foreground">
            Manage your property assets and supplies
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowBulkMenu(!showBulkMenu)}
              iconName="FileText"
            >
              Reports
            </Button>
            
            {showBulkMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-modal z-50">
                <div className="py-1">
                  {reportOptions?.map((option) => (
                    <button
                      key={option?.value}
                      onClick={() => {
                        handleGenerateReport(option?.value);
                        setShowBulkMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-smooth"
                    >
                      {option?.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={20} className="text-primary" />
            <span className="font-medium text-foreground">
              {selectedItems?.length} item{selectedItems?.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              options={bulkActionOptions}
              value={bulkAction}
              onChange={setBulkAction}
              placeholder="Choose action"
              className="w-40"
            />
            
            <Button
              variant="default"
              size="sm"
              onClick={handleBulkAction}
              disabled={!bulkAction}
              iconName="Play"
            >
              Apply
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateReport('selected-items')}
            iconName="FileText"
          >
            Export Selected
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            iconName="X"
          >
            Clear Selection
          </Button>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-primary/20">
        <span className="text-sm text-muted-foreground">Quick actions:</span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBulkUpdate(selectedItems, { status: 'damaged' })}
          iconName="AlertTriangle"
          className="text-warning hover:text-warning"
        >
          Mark Damaged
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBulkUpdate(selectedItems, { status: 'ok' })}
          iconName="CheckCircle"
          className="text-success hover:text-success"
        >
          Mark OK
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm(`Delete ${selectedItems?.length} selected items?`)) {
              onBulkDelete(selectedItems);
            }
          }}
          iconName="Trash2"
          className="text-error hover:text-error"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default BulkActions;