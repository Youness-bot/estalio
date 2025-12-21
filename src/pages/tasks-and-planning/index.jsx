import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ViewSelector from './components/ViewSelector';
import TaskFilters from './components/TaskFilters';
import WeeklyCalendar from './components/WeeklyCalendar';
import MonthlyCalendar from './components/MonthlyCalendar';
import DailyView from './components/DailyView';
import TaskList from './components/TaskList';
import NewTaskModal from './components/NewTaskModal';
import taskService from '../../services/taskService';

const TasksAndPlanning = () => {
  const [currentView, setCurrentView] = useState('week');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentDate, setCurrentDate] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedTaskType, setSelectedTaskType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date()?.toISOString()?.split('T')?.[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)?.toISOString()?.split('T')?.[0]
  });
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0
  });

  // Load tasks from Supabase
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters = {
        propertyId: selectedProperty,
        taskType: selectedTaskType,
        dateRange: dateRange
      };
      
      const tasksData = await taskService?.getAll(filters);
      setTasks(tasksData || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(`Failed to load tasks: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const stats = await taskService?.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadTasks();
    loadStatistics();
  }, [selectedProperty, selectedTaskType, dateRange]);

  const filteredTasks = tasks?.filter(task => {
    const matchesProperty = selectedProperty === 'all' || task?.propertyId === selectedProperty;
    const matchesType = selectedTaskType === 'all' || task?.taskType === selectedTaskType;
    const taskDate = new Date(task?.dueDate || task?.createdAt);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const matchesDateRange = taskDate >= startDate && taskDate <= endDate;
    
    return matchesProperty && matchesType && matchesDateRange;
  });

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleNewTask = (prefilledDate = null) => {
    setShowNewTaskModal(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      setError('');
      await taskService?.create(taskData);
      await loadTasks();
      await loadStatistics();
      setShowNewTaskModal(false);
    } catch (err) {
      console.error('Error saving task:', err);
      setError(`Failed to save task: ${err?.message}`);
    }
  };

  const handleEditTask = async (task) => {
    try {
      setError('');
      // Implementation for editing task - could open a modal
      console.log('Edit task:', task);
    } catch (err) {
      console.error('Error editing task:', err);
      setError(`Failed to edit task: ${err?.message}`);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setError('');
      await taskService?.update(taskId, { 
        status: 'completed',
        completedAt: new Date()?.toISOString()
      });
      await loadTasks();
      await loadStatistics();
    } catch (err) {
      console.error('Error completing task:', err);
      setError(`Failed to complete task: ${err?.message}`);
    }
  };

  const handleReassignTask = async (task) => {
    try {
      setError('');
      // Implementation for reassigning task
      console.log('Reassign task:', task);
    } catch (err) {
      console.error('Error reassigning task:', err);
      setError(`Failed to reassign task: ${err?.message}`);
    }
  };

  const handleTaskClick = (task) => {
    console.log('Task clicked:', task);
    // Implementation for task details view
  };

  const handleClearFilters = () => {
    setSelectedProperty('all');
    setSelectedTaskType('all');
    setDateRange({
      start: new Date()?.toISOString()?.split('T')?.[0],
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)?.toISOString()?.split('T')?.[0]
    });
  };

  const renderCurrentView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'month':
        return (
          <MonthlyCalendar
            tasks={filteredTasks}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onTaskClick={handleTaskClick}
            onNewTask={handleNewTask}
          />
        );
      case 'week':
        return (
          <WeeklyCalendar
            tasks={filteredTasks}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
            onTaskClick={handleTaskClick}
            onNewTask={handleNewTask}
          />
        );
      case 'day':
        return (
          <DailyView
            tasks={filteredTasks}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onTaskClick={handleTaskClick}
            onNewTask={handleNewTask}
            onEdit={handleEditTask}
            onComplete={handleCompleteTask}
            onReassign={handleReassignTask}
          />
        );
      case 'list':
        return (
          <TaskList
            tasks={filteredTasks}
            onEdit={handleEditTask}
            onComplete={handleCompleteTask}
            onReassign={handleReassignTask}
            onNewTask={handleNewTask}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="CheckSquare" size={24} color="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tasks & Planning</h1>
              <p className="text-muted-foreground">Manage and schedule property maintenance tasks</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <ViewSelector 
              currentView={currentView} 
              onViewChange={handleViewChange} 
            />
            <Button
              variant="default"
              iconName="Plus"
              iconPosition="left"
              onClick={handleNewTask}
            >
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-destructive" />
            <p className="text-destructive font-medium">Error</p>
          </div>
          <p className="text-destructive/80 mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError('');
              loadTasks();
              loadStatistics();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filters */}
      <TaskFilters
        selectedProperty={selectedProperty}
        onPropertyChange={setSelectedProperty}
        selectedTaskType={selectedTaskType}
        onTaskTypeChange={setSelectedTaskType}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onClearFilters={handleClearFilters}
      />

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="CheckSquare" size={20} className="text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{statistics?.totalTasks || 0}</div>
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
              <div className="text-2xl font-bold text-foreground">{statistics?.completedTasks || 0}</div>
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
              <div className="text-2xl font-bold text-foreground">{statistics?.inProgressTasks || 0}</div>
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
              <div className="text-2xl font-bold text-foreground">{statistics?.overdueTasks || 0}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current View */}
      {renderCurrentView()}

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        onSave={handleSaveTask}
      />
    </div>
  );
};

export default TasksAndPlanning;