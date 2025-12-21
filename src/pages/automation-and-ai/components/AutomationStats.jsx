import React from 'react';
import Icon from '../../../components/AppIcon';

const AutomationStats = ({ stats, loading = false }) => {
  const statsData = [
    {
      title: 'Templates',
      value: loading ? '...' : (stats?.totalTemplates || 0),
      icon: 'FileText',
      description: 'Message templates',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Workflows',
      value: loading ? '...' : (stats?.activeWorkflows || 0),
      icon: 'Workflow',
      description: 'Automation workflows',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Messages Sent',
      value: loading ? '...' : (stats?.totalSent || 0),
      icon: 'Send',
      description: 'Total messages sent',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Delivery Rate',
      value: loading ? '...' : `${stats?.deliveryRate || 0}%`,
      icon: 'TrendingUp',
      description: 'Successful deliveries',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'AI Generations',
      value: loading ? '...' : (stats?.aiGenerations || 0),
      icon: 'Sparkles',
      description: 'AI-generated content',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {statsData?.map((stat, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${stat?.bgColor}`}>
              <Icon name={stat?.icon} size={20} className={stat?.color} />
            </div>
            {loading && (
              <Icon name="Loader" size={16} className="animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{stat?.value}</p>
            <p className="text-sm font-medium text-foreground">{stat?.title}</p>
            <p className="text-xs text-muted-foreground">{stat?.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AutomationStats;