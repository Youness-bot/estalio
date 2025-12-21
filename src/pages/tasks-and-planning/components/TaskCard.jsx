import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TaskCard = ({ task, onEdit, onComplete, onReassign }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'in-progress': return 'bg-warning text-warning-foreground';
      case 'pending': return 'bg-muted text-muted-foreground';
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'cleaning': return 'Sparkles';
      case 'maintenance': return 'Wrench';
      case 'inspection': return 'Search';
      case 'checkin': return 'LogIn';
      case 'checkout': return 'LogOut';
      case 'laundry': return 'Shirt';
      case 'supplies': return 'Package';
      default: return 'CheckSquare';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-card transition-smooth">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon 
            name={getTaskTypeIcon(task?.type)} 
            size={18} 
            className={getPriorityColor(task?.priority)} 
          />
          <h3 className="font-medium text-foreground">{task?.title}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task?.status)}`}>
          {task?.status?.charAt(0)?.toUpperCase() + task?.status?.slice(1)}
        </span>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="Building" size={14} />
          <span>{task?.property}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="User" size={14} />
          <span>{task?.assignedTo}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="Clock" size={14} />
          <span>{task?.scheduledTime}</span>
        </div>
        
        {task?.estimatedDuration && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Icon name="Timer" size={14} />
            <span>{task?.estimatedDuration}</span>
          </div>
        )}
      </div>
      {task?.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {task?.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {task?.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              iconName="Check"
              onClick={() => onComplete(task?.id)}
            >
              Complete
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            iconName="Edit"
            onClick={() => onEdit(task)}
          />
          
          <Button
            variant="ghost"
            size="sm"
            iconName="UserCheck"
            onClick={() => onReassign(task)}
          />
        </div>
        
        {task?.priority === 'high' && (
          <Icon name="AlertTriangle" size={16} className="text-destructive" />
        )}
      </div>
    </div>
  );
};

export default TaskCard;