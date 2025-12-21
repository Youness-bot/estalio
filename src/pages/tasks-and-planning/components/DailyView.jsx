import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import TaskCard from './TaskCard';

const DailyView = ({ tasks, currentDate, onDateChange, onTaskClick, onNewTask, onEdit, onComplete, onReassign }) => {
  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDateString = (offset = 0) => {
    const date = new Date();
    date?.setDate(date?.getDate() + currentDate + offset);
    return date?.toISOString()?.split('T')?.[0];
  };

  const todayTasks = tasks?.filter(task => task?.scheduledDate === getDateString());
  
  const groupTasksByTime = (tasks) => {
    const timeSlots = {
      morning: [], // 6:00 - 11:59
      afternoon: [], // 12:00 - 17:59
      evening: [], // 18:00 - 23:59
      unscheduled: [] // No specific time
    };

    tasks?.forEach(task => {
      if (!task?.scheduledTime) {
        timeSlots?.unscheduled?.push(task);
        return;
      }

      const hour = parseInt(task?.scheduledTime?.split(':')?.[0]);
      if (hour >= 6 && hour < 12) {
        timeSlots?.morning?.push(task);
      } else if (hour >= 12 && hour < 18) {
        timeSlots?.afternoon?.push(task);
      } else {
        timeSlots?.evening?.push(task);
      }
    });

    // Sort tasks within each time slot by time
    Object.keys(timeSlots)?.forEach(slot => {
      if (slot !== 'unscheduled') {
        timeSlots?.[slot]?.sort((a, b) => a?.scheduledTime?.localeCompare(b?.scheduledTime));
      }
    });

    return timeSlots;
  };

  const timeSlots = groupTasksByTime(todayTasks);

  const getTimeSlotIcon = (slot) => {
    switch (slot) {
      case 'morning': return 'Sunrise';
      case 'afternoon': return 'Sun';
      case 'evening': return 'Sunset';
      default: return 'Clock';
    }
  };

  const getTimeSlotLabel = (slot) => {
    switch (slot) {
      case 'morning': return 'Morning (6:00 - 11:59)';
      case 'afternoon': return 'Afternoon (12:00 - 17:59)';
      case 'evening': return 'Evening (18:00 - 23:59)';
      default: return 'Unscheduled';
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronLeft"
              onClick={() => onDateChange(currentDate - 1)}
            />
            <h2 className="text-xl font-semibold text-foreground">
              {formatDate(getDateString())}
            </h2>
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronRight"
              onClick={() => onDateChange(currentDate + 1)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(0)}
            >
              Today
            </Button>
            <Button
              variant="default"
              size="sm"
              iconName="Plus"
              iconPosition="left"
              onClick={() => onNewTask(getDateString())}
            >
              New Task
            </Button>
          </div>
        </div>
      </div>
      {/* Daily Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="CheckSquare" size={20} className="text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{todayTasks?.length}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Icon name="CheckCircle" size={20} className="text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {todayTasks?.filter(t => t?.status === 'completed')?.length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Icon name="Clock" size={20} className="text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {todayTasks?.filter(t => t?.status === 'in-progress')?.length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <Icon name="AlertTriangle" size={20} className="text-destructive" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {todayTasks?.filter(t => t?.status === 'overdue')?.length}
              </div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </div>
        </div>
      </div>
      {/* Time Slots */}
      {Object.entries(timeSlots)?.map(([slot, slotTasks]) => (
        <div key={slot} className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name={getTimeSlotIcon(slot)} size={18} className="text-muted-foreground" />
                <h3 className="font-semibold text-foreground">{getTimeSlotLabel(slot)}</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {slotTasks?.length} task{slotTasks?.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="p-4">
            {slotTasks?.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {slotTasks?.map(task => (
                  <TaskCard
                    key={task?.id}
                    task={task}
                    onEdit={onEdit}
                    onComplete={onComplete}
                    onReassign={onReassign}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="Calendar" size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No tasks scheduled for this time slot</p>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Plus"
                  iconPosition="left"
                  onClick={() => onNewTask(getDateString())}
                  className="mt-3"
                >
                  Add Task
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
      {todayTasks?.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Calendar" size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Today</h3>
            <p className="text-muted-foreground mb-6">
              You have no tasks scheduled for today. Create a new task to get started.
            </p>
            <Button
              variant="default"
              iconName="Plus"
              iconPosition="left"
              onClick={() => onNewTask(getDateString())}
            >
              Create New Task
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyView;