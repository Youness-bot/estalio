import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DateRangeFilter = ({ onDateRangeChange, initialRange }) => {
  const [startDate, setStartDate] = useState(initialRange?.start || '');
  const [endDate, setEndDate] = useState(initialRange?.end || '');
  const [quickSelect, setQuickSelect] = useState('custom');

  const quickRanges = [
    { 
      id: 'today', 
      label: 'Today',
      getValue: () => {
        const today = new Date()?.toISOString()?.split('T')?.[0];
        return { start: today, end: today };
      }
    },
    { 
      id: 'week', 
      label: 'This Week',
      getValue: () => {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        return {
          start: startOfWeek?.toISOString()?.split('T')?.[0],
          end: endOfWeek?.toISOString()?.split('T')?.[0]
        };
      }
    },
    { 
      id: 'month', 
      label: 'This Month',
      getValue: () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          start: startOfMonth?.toISOString()?.split('T')?.[0],
          end: endOfMonth?.toISOString()?.split('T')?.[0]
        };
      }
    },
    { 
      id: 'quarter', 
      label: 'This Quarter',
      getValue: () => {
        const today = new Date();
        const quarter = Math.floor(today?.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        return {
          start: startOfQuarter?.toISOString()?.split('T')?.[0],
          end: endOfQuarter?.toISOString()?.split('T')?.[0]
        };
      }
    },
    { 
      id: 'year', 
      label: 'This Year',
      getValue: () => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        return {
          start: startOfYear?.toISOString()?.split('T')?.[0],
          end: endOfYear?.toISOString()?.split('T')?.[0]
        };
      }
    }
  ];

  useEffect(() => {
    if (startDate && endDate) {
      onDateRangeChange({ start: startDate, end: endDate });
    }
  }, [startDate, endDate, onDateRangeChange]);

  const handleQuickSelect = (rangeId) => {
    setQuickSelect(rangeId);
    if (rangeId === 'custom') return;
    
    const range = quickRanges?.find(r => r?.id === rangeId);
    if (range) {
      const { start, end } = range?.getValue();
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setQuickSelect('custom');
    onDateRangeChange({ start: '', end: '' });
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Quick Select Buttons */}
        <div className="flex flex-wrap gap-2">
          {quickRanges?.map((range) => (
            <Button
              key={range?.id}
              variant={quickSelect === range?.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuickSelect(range?.id)}
            >
              {range?.label}
            </Button>
          ))}
          <Button
            variant={quickSelect === 'custom' ? "default" : "outline"}
            size="sm"
            onClick={() => handleQuickSelect('custom')}
          >
            Custom
          </Button>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={16} color="var(--color-muted-foreground)" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e?.target?.value);
                setQuickSelect('custom');
              }}
              className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            />
          </div>
          
          <span className="text-muted-foreground">to</span>
          
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e?.target?.value);
                setQuickSelect('custom');
              }}
              className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            iconName="X"
          >
            Clear
          </Button>
        </div>
      </div>
      
      {/* Selected Range Display */}
      {startDate && endDate && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="CalendarDays" size={16} color="var(--color-primary)" />
              <span className="text-sm font-medium text-foreground">
                Selected Range: {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1} days
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;