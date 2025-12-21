import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import Button from '../../../components/ui/Button';

const TrendChart = () => {
  const [selectedMetric, setSelectedMetric] = useState('occupancy');
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  const metrics = {
    occupancy: {
      label: currentLanguage === 'fr' ? 'Occupation' : currentLanguage === 'ar' ? 'الإشغال' : 'Occupancy',
      color: '#3B82F6',
      data: [
        { name: 'Jan', value: 75 },
        { name: 'Feb', value: 82 },
        { name: 'Mar', value: 78 },
        { name: 'Apr', value: 85 },
        { name: 'May', value: 92 },
        { name: 'Jun', value: 88 },
        { name: 'Jul', value: 95 }
      ]
    },
    revenue: {
      label: currentLanguage === 'fr' ? 'Revenus' : currentLanguage === 'ar' ? 'الإيرادات' : 'Revenue',
      color: '#10B981',
      data: [
        { name: 'Jan', value: 45000 },
        { name: 'Feb', value: 52000 },
        { name: 'Mar', value: 48000 },
        { name: 'Apr', value: 58000 },
        { name: 'May', value: 65000 },
        { name: 'Jun', value: 62000 },
        { name: 'Jul', value: 72000 }
      ]
    },
    tasks: {
      label: currentLanguage === 'fr' ? 'Tâches' : currentLanguage === 'ar' ? 'المهام' : 'Tasks',
      color: '#F59E0B',
      data: [
        { name: 'Jan', value: 125 },
        { name: 'Feb', value: 142 },
        { name: 'Mar', value: 138 },
        { name: 'Apr', value: 155 },
        { name: 'May', value: 168 },
        { name: 'Jun', value: 162 },
        { name: 'Jul', value: 175 }
      ]
    },
    satisfaction: {
      label: currentLanguage === 'fr' ? 'Satisfaction' : currentLanguage === 'ar' ? 'الرضا' : 'Satisfaction',
      color: '#8B5CF6',
      data: [
        { name: 'Jan', value: 4.2 },
        { name: 'Feb', value: 4.4 },
        { name: 'Mar', value: 4.3 },
        { name: 'Apr', value: 4.5 },
        { name: 'May', value: 4.7 },
        { name: 'Jun', value: 4.6 },
        { name: 'Jul', value: 4.8 }
      ]
    }
  };

  const currentMetric = metrics?.[selectedMetric];

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          {currentLanguage === 'fr' ? 'Tendances' : currentLanguage === 'ar' ? 'الاتجاهات' : 'Trends'}
        </h3>
        <div className="flex space-x-2">
          {Object.entries(metrics)?.map(([key, metric]) => (
            <Button
              key={key}
              variant={selectedMetric === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric(key)}
            >
              {metric?.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentMetric?.data}>
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-popover-foreground)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={currentMetric?.color}
              strokeWidth={2}
              dot={{ fill: currentMetric?.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: currentMetric?.color, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;