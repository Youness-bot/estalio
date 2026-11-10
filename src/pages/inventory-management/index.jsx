import React, { useState, useEffect } from 'react';
import { printEstalioReport } from '../../utils/printEstalioReport';
import Header from '../../components/ui/Header';

import InventoryStats from './components/InventoryStats';
import SearchBar from './components/SearchBar';
import BulkActions from './components/BulkActions';
import InventoryTable from './components/InventoryTable';
import AddItemModal from './components/AddItemModal';
import Button from '../../components/ui/Button';
import inventoryService from '../../services/inventoryService';

const InventoryManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    healthyStockItems: 0
  });

  useEffect(() => {
    loadInventoryItems();
    loadStatistics();
  }, []);

  const loadInventoryItems = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await inventoryService?.getAll();
      setItems(data);
    } catch (err) {
      console.error('Error loading inventory items:', err);
      setError(err?.message || 'Failed to load inventory items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await inventoryService?.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleAddItem = async (newItemData) => {
    try {
      setError('');
      const newItem = await inventoryService?.create(newItemData);
      setItems(prev => [newItem, ...prev]);
      await loadStatistics();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding item:', err);
      setError(err?.message || 'Failed to add item');
    }
  };

  const handleToggleStatus = async (itemId, newStatus) => {
    try {
      const item = items?.find(i => i?.id === itemId);
      if (!item) return;

      await inventoryService?.update(itemId, { ...item, status: newStatus });
      setItems(prev => prev?.map(item => 
        item?.id === itemId ? { ...item, status: newStatus } : item
      ));
    } catch (err) {
      console.error('Error updating item status:', err);
      setError(err?.message || 'Failed to update item status');
    }
  };

  const handleEditItem = async (updatedItem) => {
    try {
      setError('');
      const updated = await inventoryService?.update(updatedItem?.id, updatedItem);
      setItems(prev => prev?.map(item => 
        item?.id === updatedItem?.id ? updated : item
      ));
      await loadStatistics();
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err?.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        setError('');
        await inventoryService?.delete(itemId);
        setItems(prev => prev?.filter(item => item?.id !== itemId));
        await loadStatistics();
      } catch (err) {
        console.error('Error deleting item:', err);
        setError(err?.message || 'Failed to delete item');
      }
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      // This would integrate with task service when available
      console.log('Creating task:', taskData);
      // For now, just log the task creation
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleBulkUpdate = async (itemIds, updates) => {
    try {
      setError('');
      await inventoryService?.bulkUpdate(itemIds, updates);
      await loadInventoryItems();
      await loadStatistics();
      setSelectedItems([]);
    } catch (err) {
      console.error('Error bulk updating items:', err);
      setError(err?.message || 'Failed to bulk update items');
    }
  };

  const handleBulkDelete = async (itemIds) => {
    if (window.confirm(`Are you sure you want to delete ${itemIds?.length} items?`)) {
      try {
        setError('');
        await Promise.all(itemIds?.map(id => inventoryService?.delete(id)));
        setItems(prev => prev?.filter(item => !itemIds?.includes(item?.id)));
        await loadStatistics();
        setSelectedItems([]);
      } catch (err) {
        console.error('Error bulk deleting items:', err);
        setError(err?.message || 'Failed to bulk delete items');
      }
    }
  };

  const handleGenerateReport = (reportType) => {
    console.log('Generating report:', reportType);
    // This would typically generate and download a report
  };

  const filteredItems = items?.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm?.toLowerCase();
    
    // Handle special search filters
    if (searchTerm?.startsWith('type:')) {
      const type = searchTerm?.replace('type:', '');
      return item?.type === type;
    }
    
    if (searchTerm?.startsWith('status:')) {
      const status = searchTerm?.replace('status:', '');
      if (status === 'low-stock') {
        return item?.calculatedStatus === 'low-stock' || item?.calculatedStatus === 'depleted';
      }
      return item?.calculatedStatus === status;
    }
    
    // Regular text search
    return (item?.name?.toLowerCase()?.includes(searchLower) ||
    item?.category?.toLowerCase()?.includes(searchLower) ||
    item?.propertyName?.toLowerCase()?.includes(searchLower) ||
    (item?.supplierName && item?.supplierName?.toLowerCase()?.includes(searchLower)) || 
    (item?.description && item?.description?.toLowerCase()?.includes(searchLower)));
  });

  const handlePrint = () => printEstalioReport({
    title: 'Inventaire', subtitle: 'État des stocks',
    filters: [['Recherche', searchTerm || 'Tous les articles']],
    columns: [
      { label: 'Article', key: 'name' }, { label: 'Propriété', key: 'propertyName' },
      { label: 'Catégorie', key: 'category' }, { label: 'Type', key: 'type' },
      { label: 'Quantité', value: x => x.quantity ?? x.currentStock },
      { label: 'Statut', value: x => x.calculatedStatus || x.status }
    ], rows: filteredItems, summary: [['Articles affichés', filteredItems.length]]
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">Inventory Management</h1>
            <p className="text-muted-foreground">
              Track supplies, equipment, and amenities across all properties
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Consistent layout */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track supplies, equipment, and amenities across all properties
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" iconName="Printer" iconPosition="left" onClick={handlePrint}>Imprimer</Button>
          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
          >
            Export
          </Button>
          <Button
            variant="default"
            onClick={() => setIsAddModalOpen(true)}
            iconName="Plus"
            iconPosition="left"
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-destructive">⚠️</div>
            <div>
              <p className="text-destructive font-medium">Error</p>
              <p className="text-destructive/80 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-destructive hover:text-destructive/80"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search inventory items..."
          />
        </div>
        <BulkActions
          selectedItems={selectedItems}
          onBulkUpdate={handleBulkUpdate}
          onBulkAction={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
          onGenerateReport={handleGenerateReport}
          onClearSelection={() => setSelectedItems([])}
        />
      </div>

      {/* Stats Cards */}
      <InventoryStats items={statistics} />

      {/* Inventory Table - Single scroll container */}
      <div className="bg-card border border-border rounded-lg">
        <InventoryTable
          items={filteredItems}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onCreateTask={handleCreateTask}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={handleAddItem}
      />
    </div>
  );
};

export default InventoryManagement;