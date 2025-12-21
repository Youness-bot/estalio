import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const HistoryModal = ({ isOpen, onClose, member, historyData }) => {
  if (!isOpen || !member) return null;

  const getHistoryIcon = (type) => {
    const icons = {
      'absence': 'Calendar',
      'bonus': 'DollarSign',
      'promotion': 'TrendingUp',
      'warning': 'AlertTriangle',
      'training': 'BookOpen',
      'contract': 'FileText'
    };
    return icons?.[type] || 'Clock';
  };

  const getHistoryColor = (type) => {
    const colors = {
      'absence': 'text-warning',
      'bonus': 'text-success',
      'promotion': 'text-primary',
      'warning': 'text-error',
      'training': 'text-accent',
      'contract': 'text-secondary'
    };
    return colors?.[type] || 'text-muted-foreground';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-foreground">Employment History</h2>
            <span className="text-muted-foreground">- {member?.name}</span>
          </div>
          <Button variant="ghost" size="icon" iconName="X" onClick={onClose} />
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">2</div>
              <div className="text-sm text-muted-foreground">Total Absences</div>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-success">$1,200</div>
              <div className="text-sm text-muted-foreground">Total Bonuses</div>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">1</div>
              <div className="text-sm text-muted-foreground">Promotions</div>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-accent">3</div>
              <div className="text-sm text-muted-foreground">Trainings</div>
            </div>
          </div>

          {/* History Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Recent Activity</h3>
            {historyData?.map((item, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg">
                <div className={`p-2 rounded-full bg-background ${getHistoryColor(item?.type)}`}>
                  <Icon name={getHistoryIcon(item?.type)} size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground">{item?.title}</h4>
                    <span className="text-sm text-muted-foreground">{item?.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item?.description}</p>
                  {item?.amount && (
                    <div className="text-sm font-medium text-success">Amount: {item?.amount}</div>
                  )}
                  {item?.duration && (
                    <div className="text-sm text-muted-foreground">Duration: {item?.duration}</div>
                  )}
                  {item?.approvedBy && (
                    <div className="text-sm text-muted-foreground">Approved by: {item?.approvedBy}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Performance Metrics */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-foreground mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Attendance Rate</span>
                  <span className="text-sm font-medium text-success">96%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Task Completion</span>
                  <span className="text-sm font-medium text-primary">92%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Customer Rating</span>
                  <span className="text-sm font-medium text-accent">4.8/5</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Training Progress</span>
                  <span className="text-sm font-medium text-secondary">85%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button variant="outline" iconName="Download">
            Export History
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;