import React from 'react';

const OccupancyWidget = ({ occupancyData }) => {
  if (!occupancyData) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const getOccupancyColor = (rate) => {
    if (rate >= 80) return 'text-red-600 bg-red-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getOccupancyBarColor = (rate) => {
    if (rate >= 80) return 'bg-red-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Portfolio Occupancy</h3>
        <div className="text-xs text-gray-500">
          Updates {occupancyData?.nextUpdate || 'in 2 hours'}
        </div>
      </div>
      {/* Overall Occupancy */}
      <div className="text-center mb-6">
        <div className={`text-3xl font-bold mb-2 px-3 py-2 rounded-lg ${getOccupancyColor(occupancyData?.overall || 0)}`}>
          {Math.round(occupancyData?.overall || 0)}%
        </div>
        <div className="text-sm text-gray-600">Overall Occupancy Rate</div>
      </div>
      {/* Property Breakdown */}
      {occupancyData?.properties && occupancyData?.properties?.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3">By Property</h4>
          <div className="space-y-3">
            {occupancyData?.properties?.map((property, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 truncate" title={property?.name}>
                    {property?.name}
                  </span>
                  <span className="font-medium">{Math.round(property?.rate || 0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getOccupancyBarColor(property?.rate || 0)}`}
                    style={{ width: `${Math.min(property?.rate || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Active Pricing Rules */}
      {occupancyData?.activePricingRules && occupancyData?.activePricingRules?.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-3">Active Rules Impact</h4>
          <div className="space-y-2">
            {occupancyData?.activePricingRules?.map((rule, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-700 truncate" title={rule?.property}>
                  {rule?.property}
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {rule?.adjustment > 0 ? '+' : ''}{rule?.adjustment}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Empty State */}
      {(!occupancyData?.properties || occupancyData?.properties?.length === 0) && 
       (!occupancyData?.activePricingRules || occupancyData?.activePricingRules?.length === 0) && (
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No occupancy data available</p>
          <p className="text-xs text-gray-400 mt-1">Create properties and reservations to see occupancy rates</p>
        </div>
      )}
    </div>
  );
};

export default OccupancyWidget;