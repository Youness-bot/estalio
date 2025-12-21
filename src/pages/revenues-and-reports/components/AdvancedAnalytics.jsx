import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AdvancedAnalytics = ({ occupancyData, seasonalData, channelData, currency = 'USD' }) => {
  const [activeTab, setActiveTab] = useState('occupancy');

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

  const tabs = [
    { id: 'occupancy', label: 'Occupancy Correlation', icon: 'TrendingUp' },
    { id: 'seasonal', label: 'Seasonal Patterns', icon: 'Calendar' },
    { id: 'channel', label: 'Channel Effectiveness', icon: 'BarChart3' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-modal">
          <p className="font-medium text-popover-foreground">{label}</p>
          {payload?.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry?.color }}>
              {entry?.name}: {entry?.name?.includes('Revenue') ? formatValue(entry?.value) : `${entry?.value}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderOccupancyCorrelation = () => (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={occupancyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="occupancy" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              label={{ value: 'Occupancy Rate (%)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              dataKey="revenue"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => formatValue(value)}
              label={{ value: 'Revenue', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter dataKey="revenue" fill="var(--color-primary)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Target" size={16} color="var(--color-primary)" />
            <span className="text-sm font-medium text-foreground">Correlation</span>
          </div>
          <p className="text-2xl font-bold text-primary">0.87</p>
          <p className="text-xs text-muted-foreground">Strong positive correlation</p>
        </div>
        
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="TrendingUp" size={16} color="var(--color-success)" />
            <span className="text-sm font-medium text-foreground">Optimal Rate</span>
          </div>
          <p className="text-2xl font-bold text-success">85%</p>
          <p className="text-xs text-muted-foreground">Maximum revenue efficiency</p>
        </div>
        
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="AlertTriangle" size={16} color="var(--color-warning)" />
            <span className="text-sm font-medium text-foreground">Risk Threshold</span>
          </div>
          <p className="text-2xl font-bold text-warning">95%</p>
          <p className="text-xs text-muted-foreground">Overbooking risk zone</p>
        </div>
      </div>
    </div>
  );

  const renderSeasonalPatterns = () => (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={seasonalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickFormatter={(value) => formatValue(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--color-primary)" 
              strokeWidth={2}
              dot={{ fill: 'var(--color-primary)', strokeWidth: 2, r: 4 }}
              name="Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="occupancy" 
              stroke="var(--color-success)" 
              strokeWidth={2}
              dot={{ fill: 'var(--color-success)', strokeWidth: 2, r: 4 }}
              name="Occupancy Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-muted rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-3">Peak Season Insights</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Highest Revenue:</span>
              <span className="text-sm font-medium text-foreground">July</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Peak Occupancy:</span>
              <span className="text-sm font-medium text-foreground">August</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Growth Rate:</span>
              <span className="text-sm font-medium text-success">+23%</span>
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-3">Low Season Opportunities</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Lowest Revenue:</span>
              <span className="text-sm font-medium text-foreground">February</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Improvement Potential:</span>
              <span className="text-sm font-medium text-warning">+15%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Strategy:</span>
              <span className="text-sm font-medium text-primary">Long-stay discounts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChannelEffectiveness = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channelData?.map((channel, index) => (
          <div key={channel?.channel} className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">{channel?.channel}</h4>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                channel?.effectiveness > 80 ? 'bg-success/20 text-success' :
                channel?.effectiveness > 60 ? 'bg-warning/20 text-warning': 'bg-error/20 text-error'
              }`}>
                {channel?.effectiveness}% effective
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium text-foreground">{formatValue(channel?.revenue)}</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(channel?.revenue / Math.max(...channelData?.map(c => c?.revenue))) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Bookings</span>
                  <span className="font-medium text-foreground">{channel?.bookings}</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div 
                    className="bg-success h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(channel?.bookings / Math.max(...channelData?.map(c => c?.bookings))) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg. Value:</span>
                <span className="font-medium text-foreground">
                  {formatValue(Math.round(channel?.revenue / channel?.bookings))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="Lightbulb" size={16} color="var(--color-primary)" />
          <span className="text-sm font-medium text-primary">Optimization Recommendations</span>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Focus marketing efforts on Direct bookings to reduce commission costs</li>
          <li>• Optimize Airbnb listing photos and descriptions to improve conversion</li>
          <li>• Consider dynamic pricing strategy for Booking.com to increase revenue</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Advanced Analytics</h3>
          <Button variant="outline" size="sm" iconName="Download">
            Export Analysis
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-muted rounded-lg p-1">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                activeTab === tab?.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={tab?.icon} size={16} />
              <span>{tab?.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        {activeTab === 'occupancy' && renderOccupancyCorrelation()}
        {activeTab === 'seasonal' && renderSeasonalPatterns()}
        {activeTab === 'channel' && renderChannelEffectiveness()}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;