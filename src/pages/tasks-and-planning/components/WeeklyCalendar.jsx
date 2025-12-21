import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const WeeklyCalendar = ({ tasks, currentWeek, onWeekChange, onTaskClick, onNewTask }) => {
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const getWeekDates = (weekOffset = 0) => {
    const today = new Date();
    const currentDay = today?.getDay();
    const monday = new Date(today);
    monday?.setDate(today?.getDate() - currentDay + 1 + (weekOffset * 7));
    
    return weekDays?.map((day, index) => {
      const date = new Date(monday);
      date?.setDate(monday?.getDate() + index);
      return {
        day,
        date: date?.getDate(),
        fullDate: date?.toISOString()?.split('T')?.[0],
        isToday: date?.toDateString() === new Date()?.toDateString()
      };
    });
  };

  const weekDates = getWeekDates(currentWeek);

  const getTasksForDate = (date) => {
    return tasks?.filter(task => task?.scheduledDate === date);
  };

  const getTaskColor = (task) => {
    switch (task?.status) {
      case 'completed': return 'bg-success/10 border-success text-success-foreground';
      case 'in-progress': return 'bg-warning/10 border-warning text-warning-foreground';
      case 'overdue': return 'bg-destructive/10 border-destructive text-destructive-foreground';
      default: return 'bg-primary/10 border-primary text-primary-foreground';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            iconName="ChevronLeft"
            onClick={() => onWeekChange(currentWeek - 1)}
          />
          <h3 className="font-semibold text-foreground">
            Week of {weekDates?.[0]?.fullDate}
          </h3>
          <Button
            variant="outline"
            size="sm"
            iconName="ChevronRight"
            onClick={() => onWeekChange(currentWeek + 1)}
          />
        </div>
        
        <Button
          variant="default"
          size="sm"
          iconName="Plus"
          iconPosition="left"
          onClick={onNewTask}
        >
          New Task
        </Button>
      </div>
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 min-h-96">
        {weekDates?.map((dayInfo, dayIndex) => (
          <div key={dayIndex} className="border-r border-border last:border-r-0">
            {/* Day Header */}
            <div className={`p-3 border-b border-border text-center ${
              dayInfo?.isToday ? 'bg-primary/5' : 'bg-muted/30'
            }`}>
              <div className="text-sm font-medium text-foreground">{dayInfo?.day}</div>
              <div className={`text-lg font-semibold ${
                dayInfo?.isToday ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {dayInfo?.date}
              </div>
            </div>

            {/* Tasks for the day */}
            <div className="p-2 space-y-2 min-h-80">
              {getTasksForDate(dayInfo?.fullDate)?.map((task, taskIndex) => (
                <div
                  key={taskIndex}
                  className={`p-2 rounded border cursor-pointer hover:shadow-sm transition-smooth ${getTaskColor(task)}`}
                  onClick={() => onTaskClick(task)}
                >
                  <div className="text-xs font-medium truncate">{task?.title}</div>
                  <div className="text-xs opacity-75 truncate">{task?.property}</div>
                  <div className="text-xs opacity-75">{task?.scheduledTime}</div>
                  {task?.assignedTo && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Icon name="User" size={10} />
                      <span className="text-xs truncate">{task?.assignedTo}</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add task button for empty days */}
              {getTasksForDate(dayInfo?.fullDate)?.length === 0 && (
                <button
                  onClick={() => onNewTask(dayInfo?.fullDate)}
                  className="w-full p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-smooth group"
                >
                  <Icon name="Plus" size={16} className="mx-auto text-muted-foreground group-hover:text-primary" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyCalendar;