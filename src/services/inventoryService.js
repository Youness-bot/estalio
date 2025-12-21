import { supabase } from '../lib/supabase';

export const inventoryService = {
  // Get all inventory items for the current user
  async getAll() {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('inventory_items')?.select(`
          *,
          properties (
            id,
            name,
            property_code
          )
        `)?.eq('user_id', user?.id)?.order('created_at', { ascending: false });

      if (error) throw error;

      // Convert snake_case to camelCase for React
      return data?.map(item => ({
        id: item?.id,
        name: item?.name,
        sku: item?.sku,
        category: item?.category,
        description: item?.description,
        currentStock: item?.current_stock,
        minStockLevel: item?.min_stock_level,
        maxStockLevel: item?.max_stock_level,
        unitCost: parseFloat(item?.unit_cost || 0),
        supplierName: item?.supplier_name,
        supplierContact: item?.supplier_contact,
        location: item?.location,
        status: item?.status,
        propertyId: item?.property_id,
        propertyName: item?.properties?.name || 'No Property',
        propertyCode: item?.properties?.property_code || '',
        lastRestockDate: item?.last_restock_date,
        createdAt: item?.created_at,
        updatedAt: item?.updated_at,
        // Calculate status based on stock levels
        calculatedStatus: item?.current_stock === 0 ? 'depleted' :
                         item?.current_stock <= item?.min_stock_level ? 'low-stock' :
                         item?.current_stock <= (item?.min_stock_level + 2) ? 'pre-alert' : 'ok'
      }));
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  },

  // Get inventory item by ID
  async getById(id) {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('inventory_items')?.select(`
          *,
          properties (
            id,
            name,
            property_code
          )
        `)?.eq('id', id)?.eq('user_id', user?.id)?.single();

      if (error) throw error;

      return {
        id: data?.id,
        name: data?.name,
        sku: data?.sku,
        category: data?.category,
        description: data?.description,
        currentStock: data?.current_stock,
        minStockLevel: data?.min_stock_level,
        maxStockLevel: data?.max_stock_level,
        unitCost: parseFloat(data?.unit_cost || 0),
        supplierName: data?.supplier_name,
        supplierContact: data?.supplier_contact,
        location: data?.location,
        status: data?.status,
        propertyId: data?.property_id,
        propertyName: data?.properties?.name || 'No Property',
        lastRestockDate: data?.last_restock_date,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  },

  // Create new inventory item
  async create(itemData) {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('inventory_items')?.insert({
          name: itemData?.name,
          sku: itemData?.sku,
          category: itemData?.category,
          description: itemData?.description,
          current_stock: itemData?.currentStock || 0,
          min_stock_level: itemData?.minStockLevel || 0,
          max_stock_level: itemData?.maxStockLevel || 100,
          unit_cost: itemData?.unitCost || 0,
          supplier_name: itemData?.supplierName,
          supplier_contact: itemData?.supplierContact,
          location: itemData?.location,
          property_id: itemData?.propertyId,
          user_id: user?.id
        })?.select()?.single();

      if (error) throw error;

      return {
        id: data?.id,
        name: data?.name,
        sku: data?.sku,
        category: data?.category,
        description: data?.description,
        currentStock: data?.current_stock,
        minStockLevel: data?.min_stock_level,
        maxStockLevel: data?.max_stock_level,
        unitCost: parseFloat(data?.unit_cost || 0),
        supplierName: data?.supplier_name,
        supplierContact: data?.supplier_contact,
        location: data?.location,
        status: data?.status,
        propertyId: data?.property_id,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  // Update inventory item
  async update(id, itemData) {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('inventory_items')?.update({
          name: itemData?.name,
          sku: itemData?.sku,
          category: itemData?.category,
          description: itemData?.description,
          current_stock: itemData?.currentStock,
          min_stock_level: itemData?.minStockLevel,
          max_stock_level: itemData?.maxStockLevel,
          unit_cost: itemData?.unitCost,
          supplier_name: itemData?.supplierName,
          supplier_contact: itemData?.supplierContact,
          location: itemData?.location,
          property_id: itemData?.propertyId
        })?.eq('id', id)?.eq('user_id', user?.id)?.select()?.single();

      if (error) throw error;

      return {
        id: data?.id,
        name: data?.name,
        sku: data?.sku,
        category: data?.category,
        description: data?.description,
        currentStock: data?.current_stock,
        minStockLevel: data?.min_stock_level,
        maxStockLevel: data?.max_stock_level,
        unitCost: parseFloat(data?.unit_cost || 0),
        supplierName: data?.supplier_name,
        supplierContact: data?.supplier_contact,
        location: data?.location,
        status: data?.status,
        propertyId: data?.property_id,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  // Delete inventory item
  async delete(id) {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { error } = await supabase?.from('inventory_items')?.delete()?.eq('id', id)?.eq('user_id', user?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  },

  // Get inventory statistics
  async getStatistics() {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('inventory_items')?.select('current_stock, min_stock_level, unit_cost, status')?.eq('user_id', user?.id);

      if (error) throw error;

      const totalItems = data?.length;
      const totalValue = data?.reduce((sum, item) => sum + (item?.current_stock * parseFloat(item?.unit_cost || 0)), 0);
      const lowStockItems = data?.filter(item => item?.current_stock <= item?.min_stock_level)?.length;
      const outOfStockItems = data?.filter(item => item?.current_stock === 0)?.length;

      return {
        totalItems,
        totalValue,
        lowStockItems,
        outOfStockItems,
        healthyStockItems: totalItems - lowStockItems - outOfStockItems
      };
    } catch (error) {
      console.error('Error fetching inventory statistics:', error);
      throw error;
    }
  },

  // Create inventory movement
  async createMovement(movementData) {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('inventory_movements')?.insert({
          inventory_item_id: movementData?.inventoryItemId,
          movement_type: movementData?.movementType, // 'in', 'out', 'adjustment'
          quantity: movementData?.quantity,
          reason: movementData?.reason,
          reference_id: movementData?.referenceId,
          user_id: user?.id
        })?.select()?.single();

      if (error) throw error;

      // Update the inventory item stock
      const { error: updateError } = await supabase?.rpc(
        'update_inventory_stock',
        {
          item_id: movementData?.inventoryItemId,
          movement_type: movementData?.movementType,
          quantity: movementData?.quantity
        }
      );

      if (updateError) {
        console.error('Error updating inventory stock:', updateError);
        // Still return the movement even if stock update fails
      }

      return {
        id: data?.id,
        inventoryItemId: data?.inventory_item_id,
        movementType: data?.movement_type,
        quantity: data?.quantity,
        reason: data?.reason,
        referenceId: data?.reference_id,
        createdAt: data?.created_at
      };
    } catch (error) {
      console.error('Error creating inventory movement:', error);
      throw error;
    }
  },

  // Bulk update items
  async bulkUpdate(itemIds, updates) {
    try {
      const { data: { user }, error: userError } = await supabase?.auth?.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const updateData = {};
      if (updates?.category) updateData.category = updates?.category;
      if (updates?.location) updateData.location = updates?.location;
      if (updates?.supplierName) updateData.supplier_name = updates?.supplierName;
      if (updates?.propertyId) updateData.property_id = updates?.propertyId;

      const { data, error } = await supabase?.from('inventory_items')?.update(updateData)?.in('id', itemIds)?.eq('user_id', user?.id)?.select();

      if (error) throw error;

      return data?.map(item => ({
        id: item?.id,
        name: item?.name,
        category: item?.category,
        location: item?.location,
        supplierName: item?.supplier_name,
        propertyId: item?.property_id
      }));
    } catch (error) {
      console.error('Error bulk updating inventory items:', error);
      throw error;
    }
  }
};

export default inventoryService;