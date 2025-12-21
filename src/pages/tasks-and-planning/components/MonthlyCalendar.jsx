import React from 'react';

import Button from '../../../components/ui/Button';

const MonthlyCalendar = ({ tasks, currentMonth, onMonthChange, onTaskClick, onNewTask }) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0)?.getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const firstDay = new Date(year, month, 1)?.getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  };

  const getCurrentDate = () => {
    const today = new Date();
    return {
      year: today?.getFullYear(),
      month: today?.getMonth() + currentMonth,
      day: today?.getDate()
    };
  };

  const currentDate = getCurrentDate();
  const daysInMonth = getDaysInMonth(currentDate?.year, currentDate?.month);
  const firstDay = getFirstDayOfMonth(currentDate?.year, currentDate?.month);
  const today = new Date();

  const getTasksForDate = (day) => {
    const dateString = `${currentDate?.year}-${String(currentDate?.month + 1)?.padStart(2, '0')}-${String(day)?.padStart(2, '0')}`;
    return tasks?.filter(task => task?.scheduledDate === dateString);
  };

  const isToday = (day) => {
    return currentDate?.year === today?.getFullYear() && 
           currentDate?.month === today?.getMonth() && 
           day === today?.getDate();
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = 42; // 6 rows × 7 days

    // Previous month's trailing days
    for (let i = 0; i < firstDay; i++) {
      days?.push(
        <div key={`prev-${i}`} className="p-2 text-muted-foreground/50 bg-muted/20">
          <div className="text-sm">{getDaysInMonth(currentDate?.year, currentDate?.month - 1) - firstDay + i + 1}</div>
        </div>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDate(day);
      const isCurrentDay = isToday(day);

      days?.push(
        <div
          key={day}
          className={`p-2 border-r border-b border-border min-h-24 cursor-pointer hover:bg-muted/30 transition-smooth ${
            isCurrentDay ? 'bg-primary/5' : 'bg-card'
          }`}
          onClick={() => onNewTask(`${currentDate?.year}-${String(currentDate?.month + 1)?.padStart(2, '0')}-${String(day)?.padStart(2, '0')}`)}
        >
          <div className={`text-sm font-medium mb-1 ${
            isCurrentDay ? 'text-primary' : 'text-foreground'
          }`}>
            {day}
          </div>
          
          <div className="space-y-1">
            {dayTasks?.slice(0, 3)?.map((task, index) => (
              <div
                key={index}
                className={`text-xs p-1 rounded truncate cursor-pointer ${
                  task?.status === 'completed' ? 'bg-success/20 text-success-foreground' :
                  task?.status === 'in-progress' ? 'bg-warning/20 text-warning-foreground' :
                  task?.status === 'overdue' ? 'bg-destructive/20 text-destructive-foreground' :
                  'bg-primary/20 text-primary-foreground'
                }`}
                onClick={(e) => {
                  e?.stopPropagation();
                  onTaskClick(task);
                }}
              >
                {task?.title}
              </div>
            ))}
            
            {dayTasks?.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{dayTasks?.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    // Next month's leading days
    const remainingCells = totalCells - firstDay - daysInMonth;
    for (let day = 1; day <= remainingCells; day++) {
      days?.push(
        <div key={`next-${day}`} className="p-2 text-muted-foreground/50 bg-muted/20">
          <div className="text-sm">{day}</div>
        </div>
      );
    }

    return days;
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
            onClick={() => onMonthChange(currentMonth - 1)}
          />
          <h3 className="font-semibold text-foreground text-lg">
            {monthNames?.[currentDate?.month]} {currentDate?.year}
          </h3>
          <Button
            variant="outline"
            size="sm"
            iconName="ChevronRight"
            onClick={() => onMonthChange(currentMonth + 1)}
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
      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']?.map(day => (
          <div key={day} className="p-3 text-center font-medium text-muted-foreground bg-muted/30 border-r border-border last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default MonthlyCalendar;