import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const LinkedTasksPanel = ({ tasks, onCreateTask, onUpdateTask }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    type: '',
    assignee: '',
    dueDate: '',
    priority: 'medium'
  });

  const taskTypes = [
    { value: 'cleaning', label: 'Cleaning', icon: 'Sparkles' },
    { value: 'maintenance', label: 'Maintenance', icon: 'Wrench' },
    { value: 'preparation', label: 'Preparation', icon: 'Package' },
    { value: 'inspection', label: 'Inspection', icon: 'Search' },
    { value: 'other', label: 'Other', icon: 'MoreHorizontal' }
  ];

  const priorityConfig = {
    'high': { bg: 'bg-red-100', text: 'text-red-800', icon: 'AlertTriangle' },
    'medium': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'Clock' },
    'low': { bg: 'bg-green-100', text: 'text-green-800', icon: 'CheckCircle' }
  };

  const statusConfig = {
    'pending': { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'Circle' },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'Play' },
    'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: 'CheckCircle' },
    'cancelled': { bg: 'bg-red-100', text: 'text-red-800', icon: 'X' }
  };

  const handleCreateTask = () => {
    if (newTask?.title && newTask?.type) {
      onCreateTask({
        ...newTask,
        id: `task-${Date.now()}`,
        status: 'pending',
        createdAt: new Date(),
        reservationId: 'current-reservation'
      });
      setNewTask({ title: '', type: '', assignee: '', dueDate: '', priority: 'medium' });
      setShowCreateForm(false);
    }
  };

  const handleStatusChange = (taskId, newStatus) => {
    onUpdateTask(taskId, { status: newStatus });
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTaskTypeIcon = (type) => {
    const taskType = taskTypes?.find(t => t?.value === type);
    return taskType ? taskType?.icon : 'Circle';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Icon name="CheckSquare" size={20} className="mr-2" />
          Linked Tasks
        </h2>
        <Button
          variant="outline"
          size="sm"
          iconName="Plus"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          Add Task
        </Button>
      </div>
      {/* Create Task Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-medium text-foreground mb-4">Create New Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Task Title</label>
              <input
                type="text"
                value={newTask?.title}
                onChange={(e) => setNewTask({ ...newTask, title: e?.target?.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter task title"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Task Type</label>
              <select
                value={newTask?.type}
                onChange={(e) => setNewTask({ ...newTask, type: e?.target?.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select type</option>
                {taskTypes?.map(type => (
                  <option key={type?.value} value={type?.value}>{type?.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Assignee</label>
              <input
                type="text"
                value={newTask?.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e?.target?.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Assign to..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Due Date</label>
              <input
                type="datetime-local"
                value={newTask?.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e?.target?.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Priority</label>
              <select
                value={newTask?.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e?.target?.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateTask}
              disabled={!newTask?.title || !newTask?.type}
            >
              Create Task
            </Button>
          </div>
        </div>
      )}
      {/* Tasks List */}
      <div className="space-y-4">
        {tasks?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="CheckSquare" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks linked to this reservation</p>
          </div>
        ) : (
          tasks?.map((task) => {
            const priority = priorityConfig?.[task?.priority];
            const status = statusConfig?.[task?.status];
            
            return (
              <div key={task?.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Icon name={getTaskTypeIcon(task?.type)} size={16} className="text-muted-foreground" />
                      <h3 className="text-sm font-medium text-foreground">{task?.title}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${priority?.bg} ${priority?.text}`}>
                        <Icon name={priority?.icon} size={10} className="mr-1" />
                        {task?.priority}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Assignee:</span>
                        <p className="text-foreground">{task?.assignee || 'Unassigned'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <p className="text-foreground">{task?.dueDate ? formatDate(task?.dueDate) : 'No due date'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>
                        <p className="text-foreground">{formatDate(task?.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${status?.bg} ${status?.text}`}>
                      <Icon name={status?.icon} size={10} className="mr-1" />
                      {task?.status}
                    </span>
                    
                    <div className="flex space-x-1">
                      {task?.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(task?.id, 'completed')}
                          className="h-8 w-8"
                        >
                          <Icon name="Check" size={14} />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.location.href = '#/tasks-and-planning'}
                        className="h-8 w-8"
                      >
                        <Icon name="ExternalLink" size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LinkedTasksPanel;