import React, { useState, useMemo } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const ExpenseTable = ({ expenses, onDeleteExpense, onEditExpense, currentCurrency }) => {
  const [sortField, setSortField] = useState('expenseDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');

  const currencySymbols = {
    MAD: 'د.م.',
    EUR: '€',
    USD: '$'
  };

  const exchangeRates = {
    MAD: 1,
    EUR: 0.093,
    USD: 0.10
  };

  const convertAmount = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    const madAmount = amount / exchangeRates?.[fromCurrency];
    return madAmount * exchangeRates?.[toCurrency];
  };

  const formatAmount = (amount, currency) => {
    const symbol = currencySymbols?.[currency];
    return `${symbol} ${amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other' }
  ];

  // Generate property filter options from current expenses
  const properties = useMemo(() => {
    const propertySet = new Set();
    expenses?.forEach(expense => {
      const propertyName = expense?.propertyName || expense?.property;
      if (propertyName) {
        propertySet?.add(propertyName);
      }
    });
    
    const propertyOptions = [{ value: '', label: 'All Properties' }];
    Array.from(propertySet)?.forEach(property => {
      propertyOptions?.push({ value: property, label: property });
    });
    
    return propertyOptions;
  }, [expenses]);

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses?.filter(expense => {
      const searchableText = `${expense?.title || expense?.notes || ''} ${expense?.description || ''} ${expense?.category || ''}`?.toLowerCase();
      const matchesSearch = searchableText?.includes(searchTerm?.toLowerCase());
      const matchesCategory = !categoryFilter || expense?.category === categoryFilter;
      const propertyName = expense?.propertyName || expense?.property;
      const matchesProperty = !propertyFilter || propertyName === propertyFilter;
      
      return matchesSearch && matchesCategory && matchesProperty;
    });

    return filtered?.sort((a, b) => {
      let aValue = a?.[sortField];
      let bValue = b?.[sortField];
      
      // Handle different field names for dates
      if (sortField === 'expenseDate' || sortField === 'date') {
        aValue = new Date(a?.expenseDate || a?.date);
        bValue = new Date(b?.expenseDate || b?.date);
      }
      
      if (sortField === 'amount') {
        aValue = convertAmount(a?.amount, a?.currency, currentCurrency);
        bValue = convertAmount(b?.amount, b?.currency, currentCurrency);
      }
      
      if (sortField === 'property') {
        aValue = a?.propertyName || a?.property;
        bValue = b?.propertyName || b?.property;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [expenses, searchTerm, categoryFilter, propertyFilter, sortField, sortDirection, currentCurrency]);

  const totalAmount = useMemo(() => {
    return filteredAndSortedExpenses?.reduce((sum, expense) => {
      return sum + convertAmount(expense?.amount, expense?.currency, currentCurrency);
    }, 0);
  }, [filteredAndSortedExpenses, currentCurrency]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return 'ArrowUpDown';
    return sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      maintenance: 'bg-blue-100 text-blue-800',
      cleaning: 'bg-green-100 text-green-800',
      utilities: 'bg-yellow-100 text-yellow-800',
      supplies: 'bg-purple-100 text-purple-800',
      marketing: 'bg-pink-100 text-pink-800',
      insurance: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors?.[category] || colors?.other;
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header with filters */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-foreground">Expense Records</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="text-lg font-semibold text-primary">
              {formatAmount(totalAmount, currentCurrency)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="search"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            className="w-full"
          />
          
          <Select
            options={categories}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Filter by category"
          />
          
          <Select
            options={properties}
            value={propertyFilter}
            onChange={setPropertyFilter}
            placeholder="Filter by property"
          />
        </div>
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('expenseDate')}
                  className="flex items-center space-x-1 hover:text-foreground transition-smooth"
                >
                  <span>Date</span>
                  <Icon name={getSortIcon('expenseDate')} size={16} />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('property')}
                  className="flex items-center space-x-1 hover:text-foreground transition-smooth"
                >
                  <span>Property</span>
                  <Icon name={getSortIcon('property')} size={16} />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center space-x-1 hover:text-foreground transition-smooth"
                >
                  <span>Category</span>
                  <Icon name={getSortIcon('category')} size={16} />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center space-x-1 hover:text-foreground transition-smooth"
                >
                  <span>Amount</span>
                  <Icon name={getSortIcon('amount')} size={16} />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedExpenses?.map((expense, index) => (
              <tr key={expense?.id} className="border-b border-border hover:bg-muted/50 transition-smooth">
                <td className="p-4 text-sm text-foreground">
                  {formatDate(expense?.expenseDate || expense?.date)}
                </td>
                <td className="p-4 text-sm text-foreground">
                  {expense?.propertyName || expense?.property || 'Unknown Property'}
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(expense?.category)}`}>
                    {expense?.category?.charAt(0)?.toUpperCase() + expense?.category?.slice(1)}
                  </span>
                </td>
                <td className="p-4 text-sm font-medium text-foreground">
                  {formatAmount(convertAmount(expense?.amount, expense?.currency, currentCurrency), currentCurrency)}
                  {expense?.currency !== currentCurrency && (
                    <div className="text-xs text-muted-foreground">
                      {formatAmount(expense?.amount, expense?.currency)}
                    </div>
                  )}
                </td>
                <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                  {expense?.title || expense?.notes || '-'}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditExpense(expense)}
                      iconName="Edit"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteExpense(expense?.id)}
                      iconName="Trash2"
                      className="text-destructive hover:text-destructive"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden">
        {filteredAndSortedExpenses?.map((expense) => (
          <div key={expense?.id} className="p-4 border-b border-border last:border-b-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {expense?.propertyName || expense?.property || 'Unknown Property'}
                  </span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(expense?.category)}`}>
                    {expense?.category?.charAt(0)?.toUpperCase() + expense?.category?.slice(1)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {formatDate(expense?.expenseDate || expense?.date)}
                </div>
                <div className="text-lg font-semibold text-primary">
                  {formatAmount(convertAmount(expense?.amount, expense?.currency, currentCurrency), currentCurrency)}
                </div>
                {expense?.currency !== currentCurrency && (
                  <div className="text-xs text-muted-foreground">
                    Original: {formatAmount(expense?.amount, expense?.currency)}
                  </div>
                )}
                {(expense?.title || expense?.notes) && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {expense?.title || expense?.notes}
                  </div>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditExpense(expense)}
                  iconName="Edit"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteExpense(expense?.id)}
                  iconName="Trash2"
                  className="text-destructive hover:text-destructive"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredAndSortedExpenses?.length === 0 && (
        <div className="p-8 text-center">
          <Icon name="Receipt" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">No expenses found</h4>
          <p className="text-muted-foreground">
            {searchTerm || categoryFilter || propertyFilter
              ? 'Try adjusting your filters to see more results.' :'Start by adding your first expense using the form on the right.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExpenseTable;