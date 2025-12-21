import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ExpensesByPropertyTable = ({ data, currency = 'USD' }) => {
  const [sortField, setSortField] = useState('net');
  const [sortDirection, setSortDirection] = useState('desc');

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'MAD': return 'د.م.';
      default: return '$';
    }
  };

  const formatValue = (value) => {
    return `${getCurrencySymbol(currency)}${Math.abs(value)?.toLocaleString()}`;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data]?.sort((a, b) => {
    const aValue = a?.[sortField];
    const bValue = b?.[sortField];
    
    if (sortDirection === 'asc') {
      return aValue - bValue;
    }
    return bValue - aValue;
  });

  const getNetStatusColor = (net) => {
    if (net > 0) return 'text-success';
    if (net < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  const getNetStatusIcon = (net) => {
    if (net > 0) return 'TrendingUp';
    if (net < 0) return 'TrendingDown';
    return 'Minus';
  };

  const totals = data?.reduce((acc, item) => ({
    expenses: acc?.expenses + item?.expenses,
    revenues: acc?.revenues + item?.revenues,
    net: acc?.net + item?.net
  }), { expenses: 0, revenues: 0, net: 0 });

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Expenses by Property</h3>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" iconName="Download">
              Export
            </Button>
            <Button variant="outline" size="sm" iconName="Printer">
              Print
            </Button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 font-medium text-foreground">
                <button
                  onClick={() => handleSort('property')}
                  className="flex items-center space-x-1 hover:text-primary transition-smooth"
                >
                  <span>Property</span>
                  <Icon 
                    name={sortField === 'property' ? (sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'} 
                    size={14} 
                  />
                </button>
              </th>
              <th className="text-right p-4 font-medium text-foreground">
                <button
                  onClick={() => handleSort('expenses')}
                  className="flex items-center space-x-1 hover:text-primary transition-smooth ml-auto"
                >
                  <span>Expenses</span>
                  <Icon 
                    name={sortField === 'expenses' ? (sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'} 
                    size={14} 
                  />
                </button>
              </th>
              <th className="text-right p-4 font-medium text-foreground">
                <button
                  onClick={() => handleSort('revenues')}
                  className="flex items-center space-x-1 hover:text-primary transition-smooth ml-auto"
                >
                  <span>Revenues</span>
                  <Icon 
                    name={sortField === 'revenues' ? (sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'} 
                    size={14} 
                  />
                </button>
              </th>
              <th className="text-right p-4 font-medium text-foreground">
                <button
                  onClick={() => handleSort('net')}
                  className="flex items-center space-x-1 hover:text-primary transition-smooth ml-auto"
                >
                  <span>Net</span>
                  <Icon 
                    name={sortField === 'net' ? (sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'} 
                    size={14} 
                  />
                </button>
              </th>
              <th className="text-center p-4 font-medium text-foreground">Performance</th>
            </tr>
          </thead>
          <tbody>
            {sortedData?.map((property, index) => (
              <tr key={property?.id} className="border-b border-border hover:bg-muted/50 transition-smooth">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon name="Building" size={16} color="var(--color-primary)" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{property?.property}</p>
                      <p className="text-xs text-muted-foreground">{property?.type}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <span className="text-error font-medium">-{formatValue(property?.expenses)}</span>
                </td>
                <td className="p-4 text-right">
                  <span className="text-success font-medium">+{formatValue(property?.revenues)}</span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Icon 
                      name={getNetStatusIcon(property?.net)} 
                      size={14} 
                      color={`var(--color-${property?.net > 0 ? 'success' : property?.net < 0 ? 'error' : 'muted-foreground'})`}
                    />
                    <span className={`font-medium ${getNetStatusColor(property?.net)}`}>
                      {property?.net >= 0 ? '+' : ''}{formatValue(property?.net)}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          property?.profitMargin > 20 ? 'bg-success' : 
                          property?.profitMargin > 10 ? 'bg-warning' : 'bg-error'
                        }`}
                        style={{ width: `${Math.min(Math.abs(property?.profitMargin), 100)}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {property?.profitMargin?.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/50 border-t-2 border-border">
            <tr>
              <td className="p-4 font-semibold text-foreground">Total</td>
              <td className="p-4 text-right font-semibold text-error">
                -{formatValue(totals?.expenses)}
              </td>
              <td className="p-4 text-right font-semibold text-success">
                +{formatValue(totals?.revenues)}
              </td>
              <td className="p-4 text-right font-semibold">
                <div className="flex items-center justify-end space-x-1">
                  <Icon 
                    name={getNetStatusIcon(totals?.net)} 
                    size={14} 
                    color={`var(--color-${totals?.net > 0 ? 'success' : totals?.net < 0 ? 'error' : 'muted-foreground'})`}
                  />
                  <span className={getNetStatusColor(totals?.net)}>
                    {totals?.net >= 0 ? '+' : ''}{formatValue(totals?.net)}
                  </span>
                </div>
              </td>
              <td className="p-4 text-center">
                <span className="text-sm font-medium text-foreground">
                  {((totals?.net / totals?.revenues) * 100)?.toFixed(1)}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ExpensesByPropertyTable;