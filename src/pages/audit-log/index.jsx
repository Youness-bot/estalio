import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auditService } from '../../services/auditService';
import AuditFilters from './components/AuditFilters';
import AuditTable from './components/AuditTable';
import AuditStats from './components/AuditStats';
import Button from '../../components/ui/Button';

const AuditLog = () => {
  const { userProfile } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    user: '',
    action: '',
    severity: '',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  // Check if user is admin (only admins can see all logs)
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    loadAuditData();
  }, [filters, isAdmin]);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load audit logs and statistics
      const [logsData, statsData] = await Promise.all([
        auditService?.getAuditLogs(filters, userProfile?.id),
        auditService?.getAuditStats(filters?.dateFrom, filters?.dateTo)
      ]);

      setAuditLogs(logsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading audit data:', err);
      setError(`Failed to load audit data: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSort = (column) => {
    setSortConfig(prevConfig => ({
      key: column,
      direction: prevConfig?.key === column && prevConfig?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = async () => {
    try {
      await auditService?.exportAuditLogs(filters);
      
      // Log the export action
      await auditService?.logEntityAction(
        'export',
        'report',
        null,
        'Audit Log Report',
        `Exported audit log report with filters: ${JSON.stringify(filters)}`,
        'medium'
      );
    } catch (err) {
      console.error('Export failed:', err);
      setError(`Export failed: ${err?.message}`);
    }
  };

  const handleRefresh = () => {
    loadAuditData();
  };

  const handleRowClick = (log) => {
    console.log('Audit log selected:', log);
    // Could open a detailed modal or navigate to details page
  };

  // Sort logs based on current sort configuration
  const sortedLogs = React.useMemo(() => {
    if (!sortConfig?.key) return auditLogs;

    return [...auditLogs]?.sort((a, b) => {
      const aValue = a?.[sortConfig?.key];
      const bValue = b?.[sortConfig?.key];

      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (sortConfig?.key === 'createdAt') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortConfig?.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue?.toLowerCase()?.localeCompare(bValue?.toLowerCase());
        return sortConfig?.direction === 'asc' ? comparison : -comparison;
      }

      if (aValue < bValue) return sortConfig?.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig?.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [auditLogs, sortConfig]);

  // Filter logs based on search and filters (client-side filtering for better UX)
  const filteredLogs = React.useMemo(() => {
    let filtered = sortedLogs;

    if (filters?.search && filters?.search?.trim() !== '') {
      const searchTerm = filters?.search?.toLowerCase()?.trim();
      filtered = filtered?.filter(log => 
        log?.details?.toLowerCase()?.includes(searchTerm) ||
        log?.entityName?.toLowerCase()?.includes(searchTerm) ||
        log?.user?.fullName?.toLowerCase()?.includes(searchTerm)
      );
    }

    return filtered;
  }, [sortedLogs, filters?.search]);

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Audit log access is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all system activities and changes for security and compliance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Log
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinecap="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-400"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Stats */}
      <AuditStats stats={stats} loading={loading} />

      {/* Filters */}
      <AuditFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
      />

      {/* Audit Table */}
      <div className="bg-card border border-border rounded-lg">
        <AuditTable
          logs={filteredLogs}
          onRowClick={handleRowClick}
          filters={filters}
          onSort={handleSort}
          sortConfig={sortConfig}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AuditLog;