import React from 'react';

const InventoryStats = ({ items = {} }) => {
  const {
    totalItems = 0,
    totalValue = 0,
    lowStockItems = 0,
    outOfStockItems = 0,
    healthyStockItems = 0
  } = items;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const stats = [
    {
      title: 'Total Items',
      value: totalItems?.toLocaleString(),
      icon: '📦',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: null
    },
    {
      title: 'Total Value',
      value: formatCurrency(totalValue),
      icon: '💰',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      change: null
    },
    {
      title: 'Low Stock Alert',
      value: lowStockItems?.toLocaleString(),
      icon: '⚠️',
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: null
    },
    {
      title: 'Out of Stock',
      value: outOfStockItems?.toLocaleString(),
      icon: '🚫',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      change: null
    },
    {
      title: 'Healthy Stock',
      value: healthyStockItems?.toLocaleString(),
      icon: '✅',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {stats?.map((stat, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className={`w-12 h-12 ${stat?.bgColor} rounded-lg flex items-center justify-center text-xl`}>
              {stat?.icon}
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              {stat?.title}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {stat?.value}
              </span>
            </div>
          </div>

          {/* Progress bar for stock status */}
          {(stat?.title === 'Low Stock Alert' || stat?.title === 'Out of Stock') && totalItems > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${stat?.color}`}
                  style={{ 
                    width: `${Math.min((parseInt(stat?.value) / totalItems) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">
                {totalItems > 0 ? Math.round((parseInt(stat?.value) / totalItems) * 100) : 0}% of total
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InventoryStats;