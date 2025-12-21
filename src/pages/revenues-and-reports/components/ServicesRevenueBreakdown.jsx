import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Icon from '../../../components/AppIcon';

const ServicesRevenueBreakdown = ({ data, currency = 'USD' }) => {
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-modal">
          <p className="font-medium text-popover-foreground">{data?.service}</p>
          <p className="text-sm text-primary">
            Revenue: {formatValue(data?.revenue)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data?.percentage}% of services
          </p>
        </div>
      );
    }
    return null;
  };

  const totalRevenue = data?.reduce((sum, item) => sum + item?.revenue, 0);

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Services Revenue Breakdown</h3>
        <div className="text-sm text-muted-foreground">
          Total: {formatValue(totalRevenue)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="revenue"
              >
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS?.[index % COLORS?.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {data?.map((service, index) => (
            <div key={service?.service} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS?.[index % COLORS?.length] }}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{service?.service}</p>
                  <p className="text-xs text-muted-foreground">{service?.bookings} bookings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {formatValue(service?.revenue)}
                </p>
                <p className="text-xs text-muted-foreground">{service?.percentage}%</p>
              </div>
            </div>
          ))}

          {/* Trend Analysis */}
          <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="TrendingUp" size={16} color="var(--color-success)" />
              <span className="text-sm font-medium text-success">Growth Trend</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Airport transfers showing 15% month-over-month growth. Luggage services increased by 8%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesRevenueBreakdown;