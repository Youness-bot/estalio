import React from 'react';

const RuleAnalytics = ({ analyticsData }) => {
  if (!analyticsData) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-6">Rule Analytics</h3>
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            ${analyticsData?.totalRevenueImpact?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-600">Total Revenue Impact</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analyticsData?.rulesTriggered || 0}
          </div>
          <div className="text-sm text-gray-600">Rules Triggered</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analyticsData?.bookingsAffected || 0}
          </div>
          <div className="text-sm text-gray-600">Bookings Affected</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            +{analyticsData?.avgRateIncrease || 0}%
          </div>
          <div className="text-sm text-gray-600">Avg Rate Increase</div>
        </div>
      </div>
      {/* Daily Impact Chart */}
      {analyticsData?.dailyImpact && analyticsData?.dailyImpact?.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3">Daily Impact (Last 7 Days)</h4>
          <div className="flex items-end justify-between h-32 bg-gray-50 rounded-lg p-4">
            {analyticsData?.dailyImpact?.map((day, index) => {
              const maxImpact = Math.max(...analyticsData?.dailyImpact?.map(d => Math.abs(d?.impact)));
              const height = maxImpact > 0 ? Math.abs(day?.impact) / maxImpact * 80 : 0;
              const isPositive = day?.impact >= 0;
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="text-xs text-gray-600 mb-1">
                    ${Math.abs(day?.impact)?.toFixed(0)}
                  </div>
                  <div
                    className={`w-8 rounded-t ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ height: `${height}px` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">{day?.date}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Rule Performance */}
      {analyticsData?.rulePerformance && analyticsData?.rulePerformance?.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3">Top Performing Rules</h4>
          <div className="space-y-2">
            {analyticsData?.rulePerformance?.slice(0, 4)?.map((rule, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span className="text-sm text-gray-700">{rule?.name}</span>
                <span className={`text-sm font-medium ${rule?.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${rule?.impact?.toLocaleString() || '0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Effectiveness by Category */}
      {analyticsData?.effectiveness && analyticsData?.effectiveness?.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3">Rule Effectiveness</h4>
          <div className="space-y-3">
            {analyticsData?.effectiveness?.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item?.category}</span>
                  <span className="font-medium">{item?.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item?.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Recommendations */}
      {analyticsData?.recommendations && analyticsData?.recommendations?.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-3">AI Recommendations</h4>
          <div className="space-y-2">
            {analyticsData?.recommendations?.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleAnalytics;