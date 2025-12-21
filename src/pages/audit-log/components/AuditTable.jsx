import React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info,
  User,
  Activity,
  Calendar,
  Globe
} from 'lucide-react';

const AuditTable = ({ logs, onRowClick, onSort, sortConfig, loading }) => {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'low':
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (severity) {
      case 'critical':
        return `${baseClasses} bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300`;
      case 'high':
        return `${baseClasses} bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300`;
      case 'medium':
        return `${baseClasses} bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300`;
      case 'low':
      default:
        return `${baseClasses} bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300`;
    }
  };

  const getActionBadge = (action) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (action) {
      case 'login': case'logout':
        return `${baseClasses} bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300`;
      case 'create':
        return `${baseClasses} bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300`;
      case 'update':
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300`;
      case 'delete':
        return `${baseClasses} bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300`;
      case 'view':
        return `${baseClasses} bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300`;
      case 'export':
        return `${baseClasses} bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date?.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) {
      return <div className="w-4 h-4" />; // Placeholder for alignment
    }
    return sortConfig?.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const handleHeaderClick = (column) => {
    if (onSort) {
      onSort(column);
    }
  };

  if (loading) {
    return (
      <div className="audit-table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {[1, 2, 3, 4, 5]?.map((index) => (
                <tr key={index}>
                  {[1, 2, 3, 4, 5, 6, 7]?.map((cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-table-container">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th 
                onClick={() => handleHeaderClick('createdAt')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date & Time
                  {getSortIcon('createdAt')}
                </div>
              </th>
              <th 
                onClick={() => handleHeaderClick('user')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  User
                  {getSortIcon('user')}
                </div>
              </th>
              <th 
                onClick={() => handleHeaderClick('action')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  Action
                  {getSortIcon('action')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Details
              </th>
              <th 
                onClick={() => handleHeaderClick('severity')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  Severity
                  {getSortIcon('severity')}
                </div>
              </th>
              <th 
                onClick={() => handleHeaderClick('success')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  Status
                  {getSortIcon('success')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {logs?.length > 0 ? (
              logs?.map((log) => (
                <tr 
                  key={log?.id} 
                  onClick={() => onRowClick && onRowClick(log)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatDate(log?.createdAt)}</span>
                      {log?.ipAddress && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {log?.ipAddress}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {log?.user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {log?.user?.fullName || 'Unknown User'}
                        </div>
                        {log?.user?.role && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {log?.user?.role}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getActionBadge(log?.action)}>
                      {log?.action?.charAt(0)?.toUpperCase() + log?.action?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {log?.entityName && (
                        <div className="font-medium">{log?.entityName}</div>
                      )}
                      {log?.entityType && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {log?.entityType?.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                      <div className="truncate" title={log?.details}>
                        {log?.details}
                      </div>
                      {log?.sessionId && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Session: {log?.sessionId?.substring(0, 12)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(log?.severity)}
                      <span className={getSeverityBadge(log?.severity)}>
                        {log?.severity?.charAt(0)?.toUpperCase() + log?.severity?.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {log?.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        log?.success 
                          ? 'text-green-700 dark:text-green-400' :'text-red-700 dark:text-red-400'
                      }`}>
                        {log?.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Activity className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No audit logs found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      No audit logs match your current filters.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTable;