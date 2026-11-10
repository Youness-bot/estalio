import React, { useState, useEffect, useCallback, useRef } from 'react';
import { printEstalioReport } from '../../utils/printEstalioReport';
import Button from '../../components/ui/Button';
import PlatformRevenueChart from './components/PlatformRevenueChart';
import ServicesRevenueBreakdown from './components/ServicesRevenueBreakdown';
import ExpensesByPropertyTable from './components/ExpensesByPropertyTable';
import DateRangeFilter from './components/DateRangeFilter';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import revenueService from '../../services/revenueService';
import { useAuth } from '../../contexts/AuthContext';

const RevenuesAndReports = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-12-31'
  });
  
  // Enhanced loading and error states
  const [loading, setLoading] = useState({
    initial: true,
    data: false,
    export: false
  });
  const [errors, setErrors] = useState({
    platform: '',
    services: '',
    expenses: '',
    analytics: '',
    general: ''
  });
  
  // Data states - remove all mock data
  const [platformRevenueData, setPlatformRevenueData] = useState([]);
  const [servicesRevenueData, setServicesRevenueData] = useState([]);
  const [expensesByPropertyData, setExpensesByPropertyData] = useState([]);
  const [advancedAnalyticsData, setAdvancedAnalyticsData] = useState({
    occupancyCorrelation: [],
    seasonalPatterns: [],
    channelEffectiveness: []
  });

  // Prevent multiple simultaneous calls
  const loadingRef = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') || 'USD';
    setCurrentCurrency(savedCurrency);
  }, []);

  // Clear errors when authentication state changes
  useEffect(() => {
    if (authLoading) {
      setErrors({
        platform: '',
        services: '',
        expenses: '',
        analytics: '',
        general: ''
      });
    }
  }, [authLoading]);

  // Enhanced data loading with individual error handling
  const loadRevenueData = useCallback(async (forceReload = false) => {
    // Prevent multiple simultaneous calls
    if (loadingRef?.current && !forceReload) {
      console.log('Data loading already in progress, skipping...');
      return;
    }

    // Validate authentication state
    if (authLoading) {
      console.log('Still authenticating, waiting...');
      return;
    }

    if (!isAuthenticated || !user?.id) {
      console.log('User not authenticated, cannot load data');
      setLoading(prev => ({ ...prev, initial: false, data: false }));
      setErrors(prev => ({ ...prev, general: 'Please log in to view revenue data' }));
      return;
    }

    // Cancel any ongoing requests
    if (abortControllerRef?.current) {
      abortControllerRef?.current?.abort();
    }
    abortControllerRef.current = new AbortController();

    loadingRef.current = true;
    setLoading(prev => ({ ...prev, data: true, initial: false }));
    
    // Clear previous errors
    setErrors({
      platform: '',
      services: '',
      expenses: '',
      analytics: '',
      general: ''
    });

    console.log('Loading revenue data for user:', user?.id);

    try {
      // Load data with individual error handling
      const promises = [
        revenueService?.getPlatformRevenueData(user?.id, dateRange)
          ?.catch(err => {
            console.error('Platform revenue data failed:', err);
            setErrors(prev => ({ ...prev, platform: err?.message || 'Failed to load platform data' }));
            return [];
          }),
        revenueService?.getServicesRevenueData(user?.id, dateRange)
          ?.catch(err => {
            console.error('Services revenue data failed:', err);
            setErrors(prev => ({ ...prev, services: err?.message || 'Failed to load services data' }));
            return [];
          }),
        revenueService?.getExpensesByProperty(user?.id, dateRange)
          ?.catch(err => {
            console.error('Expenses by property failed:', err);
            setErrors(prev => ({ ...prev, expenses: err?.message || 'Failed to load expenses data' }));
            return [];
          }),
        revenueService?.getAdvancedAnalytics(user?.id, dateRange)
          ?.catch(err => {
            console.error('Advanced analytics failed:', err);
            setErrors(prev => ({ ...prev, analytics: err?.message || 'Failed to load analytics data' }));
            return {
              occupancyCorrelation: [],
              seasonalPatterns: [],
              channelEffectiveness: []
            };
          })
      ];

      const [
        platformData,
        servicesData,
        expensesData,
        analyticsData
      ] = await Promise.allSettled(promises);

      // Check if request was aborted
      if (abortControllerRef?.current?.signal?.aborted) {
        console.log('Request was aborted');
        return;
      }

      // Set data from settled promises
      setPlatformRevenueData(platformData?.status === 'fulfilled' ? (platformData?.value || []) : []);
      setServicesRevenueData(servicesData?.status === 'fulfilled' ? (servicesData?.value || []) : []);
      setExpensesByPropertyData(expensesData?.status === 'fulfilled' ? (expensesData?.value || []) : []);
      setAdvancedAnalyticsData(analyticsData?.status === 'fulfilled' ? (analyticsData?.value || {
        occupancyCorrelation: [],
        seasonalPatterns: [],
        channelEffectiveness: []
      }) : {
        occupancyCorrelation: [],
        seasonalPatterns: [],
        channelEffectiveness: []
      });

      console.log('Revenue data loaded successfully');
      
      // Check if all requests failed
      const allFailed = [platformData, servicesData, expensesData, analyticsData]?.every(result => result?.status === 'rejected');
      
      if (allFailed) {
        setErrors(prev => ({ 
          ...prev, 
          general: 'All data loading failed. Please check your connection and try again.' 
        }));
      }

    } catch (err) {
      console.error('Error loading revenue data:', err);
      
      if (abortControllerRef?.current?.signal?.aborted) {
        return;
      }
      
      // Handle authentication errors specifically
      if (err?.message?.includes('Authentication') || err?.message?.includes('JWT') || err?.message?.includes('session')) {
        setErrors(prev => ({ 
          ...prev, 
          general: 'Authentication session expired. Please refresh the page and log in again.' 
        }));
      } else {
        setErrors(prev => ({ 
          ...prev, 
          general: err?.message || 'Failed to load revenue data. Please try refreshing the page.' 
        }));
      }
    } finally {
      loadingRef.current = false;
      setLoading(prev => ({ ...prev, data: false, initial: false }));
    }
  }, [authLoading, isAuthenticated, user?.id, dateRange]);

  // Load data when authentication is ready and user changes
  useEffect(() => {
    if (!authLoading) {
      loadRevenueData();
    }
  }, [loadRevenueData, authLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef?.current) {
        abortControllerRef?.current?.abort();
      }
    };
  }, []);

  const handleDateRangeChange = useCallback((newDateRange) => {
    setDateRange(newDateRange);
    // Data will reload automatically due to useEffect dependency
  }, []);

  const handleExportReport = async () => {
    try {
      setLoading(prev => ({ ...prev, export: true }));
      setErrors(prev => ({ ...prev, general: '' }));
      
      // Verify authentication before export
      if (!user?.id) {
        throw new Error('Authentication session expired. Please refresh the page.');
      }
      
      const reportData = await revenueService?.generateRevenueReport(user?.id, dateRange);
      
      // Create and download JSON report
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `revenue-report-${dateRange?.start}-to-${dateRange?.end}.json`;
      
      const linkElement = document.createElement('a');
      linkElement?.setAttribute('href', dataUri);
      linkElement?.setAttribute('download', exportFileDefaultName);
      linkElement?.click();
      
    } catch (err) {
      console.error('Error exporting report:', err);
      if (err?.message?.includes('Authentication') || err?.message?.includes('JWT')) {
        setErrors(prev => ({ 
          ...prev, 
          general: 'Authentication required. Please refresh the page and try again.' 
        }));
      } else {
        setErrors(prev => ({ 
          ...prev, 
          general: err?.message || 'Failed to export report. Please try again.' 
        }));
      }
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  const handlePrint = () => printEstalioReport({
    title: 'Revenus & Rapports', subtitle: 'Synthèse financière',
    filters: [['Période', `${dateRange.start} — ${dateRange.end}`], ['Devise', currentCurrency]],
    columns: [
      { label: 'Source', key: 'source' }, { label: 'Détail', key: 'detail' },
      { label: 'Montant', key: 'amount' }
    ],
    rows: [
      ...platformRevenueData.map(x => ({ source: 'Plateforme', detail: x.platform || x.name || x.channel, amount: x.revenue ?? x.amount })),
      ...servicesRevenueData.map(x => ({ source: 'Services', detail: x.service || x.name || x.category, amount: x.revenue ?? x.amount })),
      ...expensesByPropertyData.map(x => ({ source: 'Dépenses', detail: x.propertyName || x.name || x.property, amount: x.expenses ?? x.totalExpenses ?? x.amount }))
    ],
    summary: [['Sources affichées', platformRevenueData.length + servicesRevenueData.length + expensesByPropertyData.length]]
  });

  const handleRefresh = useCallback(() => {
    if (!authLoading && isAuthenticated && user?.id) {
      loadRevenueData(true); // Force reload
    } else {
      window.location?.reload();
    }
  }, [authLoading, isAuthenticated, user?.id, loadRevenueData]);

  const clearError = useCallback((errorKey) => {
    setErrors(prev => ({ ...prev, [errorKey]: '' }));
  }, []);

  // Show loading spinner during authentication check
  if (authLoading || loading?.initial) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">Revenues & Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive financial analytics and revenue tracking
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {authLoading ? 'Authenticating...' : 'Loading revenue data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">Revenues & Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive financial analytics and revenue tracking
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-muted-foreground mb-4 text-4xl">🔒</div>
            <p className="text-muted-foreground mb-4">Please log in to view revenue data</p>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Revenues & Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive financial analytics and revenue tracking
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            iconName="RefreshCw"
            iconPosition="left"
            onClick={handleRefresh}
            disabled={loading?.data}
          >
            {loading?.data ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" iconName="Printer" iconPosition="left" onClick={handlePrint} disabled={loading?.data}>Imprimer</Button>
          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
            onClick={handleExportReport}
            disabled={loading?.export}
          >
            {loading?.export ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <DateRangeFilter
          initialRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      {/* Error Display */}
      {errors?.general && (
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-destructive text-lg">⚠️</div>
            <div className="flex-1">
              <p className="text-destructive font-medium">Error</p>
              <p className="text-destructive/80 text-sm">{errors?.general}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                className="text-destructive hover:text-destructive/80 text-sm underline"
                disabled={loading?.data}
              >
                Retry
              </button>
              <button 
                onClick={() => clearError('general')}
                className="text-destructive hover:text-destructive/80"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Loading Overlay for Data */}
      {loading?.data && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <p className="text-primary font-medium">Refreshing revenue data...</p>
          </div>
        </div>
      )}
      {/* Main Analytics Dashboard */}
      <div className="space-y-6">
        {/* Platform Revenue Chart */}
        <div className="relative">
          <PlatformRevenueChart data={platformRevenueData} dateRange={dateRange} />
          {errors?.platform && (
            <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground text-xs px-2 py-1 rounded">
              {errors?.platform}
              <button 
                onClick={() => clearError('platform')}
                className="ml-2 hover:text-destructive-foreground/80"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Services Revenue Breakdown */}
        <div className="relative">
          <ServicesRevenueBreakdown data={servicesRevenueData} dateRange={dateRange} />
          {errors?.services && (
            <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground text-xs px-2 py-1 rounded">
              {errors?.services}
              <button 
                onClick={() => clearError('services')}
                className="ml-2 hover:text-destructive-foreground/80"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Expenses by Property Table */}
        <div className="relative">
          <ExpensesByPropertyTable data={expensesByPropertyData} dateRange={dateRange} />
          {errors?.expenses && (
            <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground text-xs px-2 py-1 rounded">
              {errors?.expenses}
              <button 
                onClick={() => clearError('expenses')}
                className="ml-2 hover:text-destructive-foreground/80"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Advanced Analytics */}
        <div className="relative">
          <AdvancedAnalytics 
            occupancyData={advancedAnalyticsData?.occupancyCorrelation}
            seasonalData={advancedAnalyticsData?.seasonalPatterns}
            channelData={advancedAnalyticsData?.channelEffectiveness}
            dateRange={dateRange} 
          />
          {errors?.analytics && (
            <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground text-xs px-2 py-1 rounded">
              {errors?.analytics}
              <button 
                onClick={() => clearError('analytics')}
                className="ml-2 hover:text-destructive-foreground/80"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenuesAndReports;