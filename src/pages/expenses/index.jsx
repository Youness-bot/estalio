import React, { useState, useEffect } from 'react';
import { printEstalioReport } from '../../utils/printEstalioReport';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { expenseService } from '../../services/expenseService';


import ExpenseForm from './components/ExpenseForm';
import ExpenseTable from './components/ExpenseTable';
import ExpenseStats from './components/ExpenseStats';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentCurrency, setCurrentCurrency] = useState('MAD');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Preview mode detection
  const isPreviewMode = window.location?.hostname?.includes('builtwithrocket');

  useEffect(() => {
    // Load currency from localStorage
    const savedCurrency = localStorage.getItem('currency') || 'MAD';
    setCurrentCurrency(savedCurrency);
    
    loadExpenses();
  }, []);

  useEffect(() => {
    // Listen for currency changes from header
    const handleStorageChange = () => {
      const savedCurrency = localStorage.getItem('currency') || 'MAD';
      setCurrentCurrency(savedCurrency);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for direct localStorage changes
    const interval = setInterval(() => {
      const savedCurrency = localStorage.getItem('currency') || 'MAD';
      if (savedCurrency !== currentCurrency) {
        setCurrentCurrency(savedCurrency);
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentCurrency]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      
      if (isPreviewMode) {
        // Mock data for preview mode
        const mockExpenses = [
          {
            id: "1",
            propertyId: "mock-1",
            propertyName: "Villa Marrakech",
            propertyCode: "VLA001",
            title: "Pool cleaning and maintenance service",
            description: "Monthly pool maintenance and chemical balancing",
            category: "maintenance",
            amount: 2500.00,
            currency: "MAD",
            expenseDate: "2024-11-08",
            vendorName: "Pool Care Solutions",
            createdAt: "2024-11-08T10:30:00Z"
          },
          {
            id: "2", 
            propertyId: "mock-2",
            propertyName: "Riad Fès",
            propertyCode: "RID002",
            title: "Deep cleaning after guest checkout",
            description: "Complete property cleaning including linens",
            category: "cleaning",
            amount: 800.00,
            currency: "MAD",
            expenseDate: "2024-11-07",
            vendorName: "CleanPro Marrakech",
            createdAt: "2024-11-07T14:15:00Z"
          },
          {
            id: "3",
            propertyId: "mock-3", 
            propertyName: "Apartment Casablanca",
            propertyCode: "APM003",
            title: "Electricity bill for October",
            description: "Monthly electricity charges",
            category: "utilities",
            amount: 450.00,
            currency: "MAD",
            expenseDate: "2024-11-06",
            vendorName: "LYDEC",
            createdAt: "2024-11-06T09:20:00Z"
          }
        ];
        setExpenses(mockExpenses);
      } else {
        const data = await expenseService?.getAll();
        setExpenses(data || []);
      }
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError(err?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (expenseData) => {
    try {
      if (isPreviewMode) {
        // Simulate adding expense in preview mode
        const newExpense = {
          ...expenseData,
          id: Date.now()?.toString(),
          propertyName: expenseData?.propertyName || 'Villa Marrakech',
          propertyCode: expenseData?.propertyCode || 'DEMO',
          createdAt: new Date()?.toISOString()
        };
        setExpenses(prev => [newExpense, ...prev]);
        return;
      }

      const newExpense = await expenseService?.create({
        propertyId: expenseData?.propertyId,
        title: expenseData?.title,
        description: expenseData?.description,
        category: expenseData?.category,
        amount: expenseData?.amount,
        currency: expenseData?.currency || currentCurrency,
        expenseDate: expenseData?.expenseDate,
        vendorName: expenseData?.vendorName,
        isRecurring: expenseData?.isRecurring || false
      });
      
      setExpenses(prev => [newExpense, ...prev]);
    } catch (err) {
      console.error('Error adding expense:', err);
      setError(err?.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      if (isPreviewMode) {
        setExpenses(prev => prev?.filter(expense => expense?.id !== expenseId));
        return;
      }

      await expenseService?.delete(expenseId);
      setExpenses(prev => prev?.filter(expense => expense?.id !== expenseId));
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError(err?.message || 'Failed to delete expense');
    }
  };

  const handleEditExpense = (expense) => {
    // For now, just show an alert. In a real app, this would open an edit modal
    alert(`Edit functionality for expense: ${expense?.title || expense?.notes}`);
  };

  const handleExport = (format) => {
    setShowExportMenu(false);
    
    switch (format) {
      case 'csv':
        exportToCSV();
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'print':
        handlePrint();
        break;
      default:
        break;
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Property', 'Category', 'Amount', 'Currency', 'Notes'];
    const csvContent = [
      headers?.join(','),
      ...expenses?.map(expense => [
        expense?.expenseDate,
        expense?.propertyName || expense?.property,
        expense?.category,
        expense?.amount,
        expense?.currency,
        `"${expense?.title || expense?.notes || ''}"`
      ]?.join(','))
    ]?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL?.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    a?.click();
    window.URL?.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // In a real app, you would use a library like jsPDF
    alert('PDF export functionality would be implemented here');
  };

  const handlePrint = () => printEstalioReport({
    title: 'Dépenses', subtitle: 'Rapport des dépenses',
    filters: [['Devise affichée', currentCurrency]],
    columns: [
      { label: 'Date', key: 'expenseDate' }, { label: 'Propriété', value: x => x.propertyName || x.property },
      { label: 'Catégorie', key: 'category' }, { label: 'Dépense', value: x => x.title || x.notes },
      { label: 'Fournisseur', key: 'vendorName' }, { label: 'Montant', value: x => `${x.amount ?? '—'} ${x.currency || currentCurrency}` }
    ], rows: expenses, summary: [['Total des dépenses', expenses.length]]
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={20} className="text-destructive" />
            <span className="text-destructive font-medium">Error: {error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="mt-2 text-sm text-destructive underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage property-related expenses and budgets
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" iconName="Printer" iconPosition="left" onClick={handlePrint}>Imprimer</Button>
          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
            onClick={() => setShowExportMenu(!showExportMenu)} 
          >
            Export
          </Button>
        </div>
      </div>

      {/* Expense Stats */}
      <ExpenseStats expenses={expenses} currentCurrency={currentCurrency} />

      {/* Main Content - Single scroll container */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Expense Form & Table */}
        <div className="xl:col-span-2 space-y-6">
          <ExpenseForm 
            onSubmit={handleAddExpense} 
            currentCurrency={currentCurrency}
            isPreviewMode={isPreviewMode}
          />
          <ExpenseTable
            expenses={expenses}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            currentCurrency={currentCurrency}
          />
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Additional stats or filters can go here */}
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;