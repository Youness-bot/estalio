import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PlatformRevenueChart = ({ data, currency = 'USD' }) => {
  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'MAD': return 'د.م.';
      default: return '$';
    }
  };

  const formatValue = (value) => {
    return `${getCurrencySymbol(currency)}${value?.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-modal">
          <p className="font-medium text-popover-foreground">{label}</p>
          <p className="text-sm text-primary">
            Revenue: {formatValue(payload?.[0]?.value)}
          </p>
          <p className="text-xs text-muted-foreground">
            {payload?.[0]?.payload?.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Platform Revenue Distribution</h3>
        <div className="text-sm text-muted-foreground">
          Total: {formatValue(data?.reduce((sum, item) => sum + item?.revenue, 0))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="platform" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => formatValue(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="revenue" 
              fill="var(--color-primary)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Platform Breakdown */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {data?.map((platform, index) => (
          <div key={platform?.platform} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: platform?.color }}
              />
              <span className="text-sm font-medium text-foreground">{platform?.platform}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {formatValue(platform?.revenue)}
              </p>
              <p className="text-xs text-muted-foreground">{platform?.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformRevenueChart;