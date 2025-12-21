import React from 'react';
import TaskCard from './TaskCard';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';


const TaskList = ({ tasks, onEdit, onComplete, onReassign, onNewTask }) => {
  const groupTasksByDate = (tasks) => {
    const grouped = {};
    tasks?.forEach(task => {
      const date = task?.scheduledDate;
      if (!grouped?.[date]) {
        grouped[date] = [];
      }
      grouped?.[date]?.push(task);
    });
    return grouped;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow?.setDate(today?.getDate() + 1);
    
    if (date?.toDateString() === today?.toDateString()) {
      return 'Today';
    } else if (date?.toDateString() === tomorrow?.toDateString()) {
      return 'Tomorrow';
    } else {
      return date?.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const groupedTasks = groupTasksByDate(tasks);
  const sortedDates = Object.keys(groupedTasks)?.sort();

  if (tasks?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckSquare" size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Found</h3>
          <p className="text-muted-foreground mb-6">
            No tasks match your current filters. Try adjusting your search criteria or create a new task.
          </p>
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={onNewTask}
          >
            Create New Task
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates?.map(date => (
        <div key={date} className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{formatDate(date)}</h3>
              <span className="text-sm text-muted-foreground">
                {groupedTasks?.[date]?.length} task{groupedTasks?.[date]?.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupedTasks?.[date]?.map(task => (
                <TaskCard
                  key={task?.id}
                  task={task}
                  onEdit={onEdit}
                  onComplete={onComplete}
                  onReassign={onReassign}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;