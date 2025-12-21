import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const ExpenseStats = ({ expenses, currentCurrency }) => {
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

  const stats = useMemo(() => {
    const currentMonth = new Date()?.getMonth();
    const currentYear = new Date()?.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthExpenses = expenses?.filter(expense => {
      // Use expenseDate from database or date for compatibility
      const expenseDate = new Date(expense.expenseDate || expense.date);
      return expenseDate?.getMonth() === currentMonth && expenseDate?.getFullYear() === currentYear;
    });

    const lastMonthExpenses = expenses?.filter(expense => {
      const expenseDate = new Date(expense.expenseDate || expense.date);
      return expenseDate?.getMonth() === lastMonth && expenseDate?.getFullYear() === lastMonthYear;
    });

    const currentMonthTotal = currentMonthExpenses?.reduce((sum, expense) => {
      return sum + convertAmount(expense?.amount, expense?.currency, currentCurrency);
    }, 0);

    const lastMonthTotal = lastMonthExpenses?.reduce((sum, expense) => {
      return sum + convertAmount(expense?.amount, expense?.currency, currentCurrency);
    }, 0);

    const monthlyChange = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    // Category breakdown
    const categoryTotals = {};
    expenses?.forEach(expense => {
      const amount = convertAmount(expense?.amount, expense?.currency, currentCurrency);
      categoryTotals[expense.category] = (categoryTotals?.[expense?.category] || 0) + amount;
    });

    const totalAmount = Object.values(categoryTotals)?.reduce((sum, amount) => sum + amount, 0);

    const categoryBreakdown = Object.entries(categoryTotals)?.map(([category, amount]) => ({
        category,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
      }))?.sort((a, b) => b?.amount - a?.amount)?.slice(0, 5);

    // Property breakdown - handle both propertyName (from service) and property (legacy)
    const propertyTotals = {};
    expenses?.forEach(expense => {
      const amount = convertAmount(expense?.amount, expense?.currency, currentCurrency);
      const propertyKey = expense?.propertyName || expense?.property || 'Unknown Property';
      propertyTotals[propertyKey] = (propertyTotals?.[propertyKey] || 0) + amount;
    });

    const topProperty = Object.entries(propertyTotals)?.sort(([,a], [,b]) => b - a)?.[0];

    return {
      currentMonthTotal,
      monthlyChange,
      totalExpenses: expenses?.length,
      categoryBreakdown,
      topProperty: topProperty ? { property: topProperty?.[0], amount: topProperty?.[1] } : null,
      averageExpense: expenses?.length > 0 ? totalAmount / expenses?.length : 0
    };
  }, [expenses, currentCurrency]);

  const getCategoryColor = (category) => {
    const colors = {
      maintenance: 'bg-blue-500',
      cleaning: 'bg-green-500',
      utilities: 'bg-yellow-500',
      supplies: 'bg-purple-500',
      marketing: 'bg-pink-500',
      insurance: 'bg-indigo-500',
      taxes: 'bg-red-500',
      staff: 'bg-orange-500',
      other: 'bg-gray-500'
    };
    return colors?.[category] || colors?.other;
  };

  return (
    <div className="space-y-6">
      {/* Monthly Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Overview</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="TrendingUp" size={20} color="white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-xl font-semibold text-foreground">
                  {formatAmount(stats?.currentMonthTotal, currentCurrency)}
                </p>
              </div>
            </div>
            <div className={`flex items-center space-x-1 ${stats?.monthlyChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              <Icon name={stats?.monthlyChange >= 0 ? 'TrendingUp' : 'TrendingDown'} size={16} />
              <span className="text-sm font-medium">
                {Math.abs(stats?.monthlyChange)?.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-foreground">{stats?.totalExpenses}</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-lg font-semibold text-foreground">
                {formatAmount(stats?.averageExpense, currentCurrency)}
              </p>
              <p className="text-sm text-muted-foreground">Average</p>
            </div>
          </div>
        </div>
      </div>
      {/* Category Breakdown */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Categories</h3>
        
        <div className="space-y-3">
          {stats?.categoryBreakdown?.map((item, index) => (
            <div key={item?.category} className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 flex-1">
                <div className={`w-3 h-3 rounded-full ${getCategoryColor(item?.category)}`}></div>
                <span className="text-sm font-medium text-foreground capitalize">
                  {item?.category}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {item?.percentage?.toFixed(1)}%
                </span>
                <span className="text-sm font-medium text-foreground min-w-0">
                  {formatAmount(item?.amount, currentCurrency)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {stats?.categoryBreakdown?.length === 0 && (
          <div className="text-center py-8">
            <Icon name="PieChart" size={48} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No expense data available</p>
          </div>
        )}
      </div>
      {/* Top Property */}
      {stats?.topProperty && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Highest Expenses</h3>
          
          <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
            <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center">
              <Icon name="Building" size={20} color="white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {stats?.topProperty?.property}
              </p>
              <p className="text-lg font-semibold text-primary">
                {formatAmount(stats?.topProperty?.amount, currentCurrency)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseStats;