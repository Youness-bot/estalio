import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { Checkbox } from '../../../components/ui/Checkbox';

const TodaysTasks = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);

    const mockTasks = [
      {
        id: 1,
        title: currentLanguage === 'fr' ? 'Nettoyage - Villa Océan' : currentLanguage === 'ar' ? 'تنظيف - فيلا المحيط' : 'Cleaning - Ocean Villa',
        type: 'cleaning',
        priority: 'high',
        time: '09:00',
        assignee: 'Maria Santos',
        completed: false
      },
      {
        id: 2,
        title: currentLanguage === 'fr' ? 'Maintenance - Appartement 3B' : currentLanguage === 'ar' ? 'صيانة - شقة 3ب' : 'Maintenance - Apartment 3B',
        type: 'maintenance',
        priority: 'medium',
        time: '11:30',
        assignee: 'Ahmed Hassan',
        completed: false
      },
      {
        id: 3,
        title: currentLanguage === 'fr' ? 'Inspection - Suite Royale' : currentLanguage === 'ar' ? 'تفتيش - الجناح الملكي' : 'Inspection - Royal Suite',
        type: 'inspection',
        priority: 'low',
        time: '14:00',
        assignee: 'Sophie Martin',
        completed: true
      },
      {
        id: 4,
        title: currentLanguage === 'fr' ? 'Transfert aéroport - Client VIP' : currentLanguage === 'ar' ? 'نقل المطار - عميل مميز' : 'Airport transfer - VIP Client',
        type: 'transfer',
        priority: 'high',
        time: '16:45',
        assignee: 'Carlos Rodriguez',
        completed: false
      },
      {
        id: 5,
        title: currentLanguage === 'fr' ? 'Réapprovisionnement - Studio 2A' : currentLanguage === 'ar' ? 'إعادة التزويد - استوديو 2أ' : 'Restocking - Studio 2A',
        type: 'restocking',
        priority: 'medium',
        time: '18:00',
        assignee: 'Lisa Chen',
        completed: false
      }
    ];

    setTasks(mockTasks);
  }, [currentLanguage]);

  const handleTaskToggle = (taskId) => {
    setTasks(prevTasks =>
      prevTasks?.map(task =>
        task?.id === taskId ? { ...task, completed: !task?.completed } : task
      )
    );
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case 'cleaning': return 'Sparkles';
      case 'maintenance': return 'Wrench';
      case 'inspection': return 'Search';
      case 'transfer': return 'Car';
      case 'restocking': return 'Package';
      default: return 'CheckSquare';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getTitle = () => {
    if (currentLanguage === 'fr') return "Tâches d'aujourd'hui";
    if (currentLanguage === 'ar') return 'مهام اليوم';
    return "Today's Tasks";
  };

  const getViewAllText = () => {
    if (currentLanguage === 'fr') return 'Voir tout';
    if (currentLanguage === 'ar') return 'عرض الكل';
    return 'View All';
  };

  const completedCount = tasks?.filter(task => task?.completed)?.length;
  const totalCount = tasks?.length;

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">{getTitle()}</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} {currentLanguage === 'fr' ? 'terminées' : currentLanguage === 'ar' ? 'مكتملة' : 'completed'}
          </p>
        </div>
        <button
          onClick={() => window.location.href = '#/tasks-and-planning'}
          className="text-sm text-primary hover:text-primary-foreground hover:bg-primary px-3 py-1 rounded-md transition-smooth"
        >
          {getViewAllText()}
        </button>
      </div>
      <div className="space-y-3">
        {tasks?.map((task) => (
          <div
            key={task?.id}
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-smooth hover:bg-muted ${
              task?.completed ? 'bg-muted bg-opacity-50 border-border' : 'bg-background border-border'
            }`}
          >
            <Checkbox
              checked={task?.completed}
              onChange={() => handleTaskToggle(task?.id)}
              className="flex-shrink-0"
            />
            
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              task?.completed ? 'bg-muted' : 'bg-primary bg-opacity-10'
            }`}>
              <Icon 
                name={getTaskIcon(task?.type)} 
                size={16} 
                color={task?.completed ? 'var(--color-muted-foreground)' : 'var(--color-primary)'} 
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium truncate ${
                  task?.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}>
                  {task?.title}
                </h4>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  <span className={`text-xs font-medium ${getPriorityColor(task?.priority)}`}>
                    ●
                  </span>
                  <span className="text-xs text-muted-foreground">{task?.time}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{task?.assignee}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TodaysTasks;