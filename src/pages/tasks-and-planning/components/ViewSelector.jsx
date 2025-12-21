import React from 'react';
import Button from '../../../components/ui/Button';

const ViewSelector = ({ currentView, onViewChange }) => {
  const views = [
    { id: 'month', label: 'Month', icon: 'Calendar' },
    { id: 'week', label: 'Week', icon: 'CalendarDays' },
    { id: 'day', label: 'Day', icon: 'CalendarCheck' },
    { id: 'list', label: 'List', icon: 'List' }
  ];

  return (
    <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
      {views?.map((view) => (
        <Button
          key={view?.id}
          variant={currentView === view?.id ? 'default' : 'ghost'}
          size="sm"
          iconName={view?.icon}
          iconPosition="left"
          onClick={() => onViewChange(view?.id)}
          className="px-3"
        >
          {view?.label}
        </Button>
      ))}
    </div>
  );
};

export default ViewSelector;