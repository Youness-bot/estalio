import React from 'react';
import { Activity, AlertTriangle, Users, LogIn } from 'lucide-react';

const AuditStats = ({ stats, loading }) => {
  const statItems = [
    {
      title: 'Total Events',
      value: stats?.totalEvents || 0,
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      description: 'All audit events'
    },
    {
      title: 'Login Events',
      value: stats?.loginEvents || 0,
      icon: LogIn,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      description: 'User login activities'
    },
    {
      title: 'Critical Events',
      value: stats?.criticalEvents || 0,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900',
      description: 'High priority events'
    },
    {
      title: 'Active Users',
      value: stats?.uniqueUsers || 0,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      description: 'Unique users'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4]?.map((index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems?.map((item, index) => {
        const IconComponent = item?.icon;
        
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 ${item?.bgColor} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 ${item?.color}`} />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {item?.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof item?.value === 'number' ? item?.value?.toLocaleString() : item?.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item?.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      {/* Additional info cards */}
      {stats && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:col-span-2 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Most Active User:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats?.mostActiveUser || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Most Common Action:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {stats?.mostCommonAction || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Failed Events:</span>
                <span className={`text-sm font-medium ${stats?.failedEvents > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {stats?.failedEvents || 0}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuditStats;