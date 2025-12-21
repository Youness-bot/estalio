import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const WorkflowBuilder = ({ isOpen, onClose, onSave, templates = [] }) => {
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState('booking_confirmed');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [conditions, setConditions] = useState({});
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const triggerOptions = [
    { value: 'booking_confirmed', label: 'Booking Confirmed' },
    { value: 'checkin_time', label: 'Check-in Time' },
    { value: 'checkout_time', label: 'Check-out Time' },
    { value: 'guest_message', label: 'Guest Message Received' },
    { value: 'manual', label: 'Manual Trigger' },
    { value: 'scheduled', label: 'Scheduled Time' }
  ];

  const templateOptions = templates?.map(template => ({
    value: template?.id,
    label: `${template?.name} (${template?.type})`
  }));

  React.useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setWorkflowName('');
      setWorkflowDescription('');
      setTriggerType('booking_confirmed');
      setSelectedTemplate('');
      setDelayMinutes(0);
      setConditions({});
      setIsActive(true);
      setError('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!workflowName?.trim()) {
      setError('Please enter a workflow name');
      return;
    }

    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        triggerType,
        templateId: selectedTemplate,
        delayMinutes: parseInt(delayMinutes) || 0,
        triggerConditions: conditions,
        isActive,
        status: 'draft'
      };

      await onSave(workflowData);
      onClose();
    } catch (err) {
      console.error('Error saving workflow:', err);
      setError('Failed to save workflow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTriggerConditions = () => {
    switch (triggerType) {
      case 'checkin_time':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Hours Before Check-in
            </label>
            <Input
              type="number"
              value={conditions?.hours_before || 24}
              onChange={(e) => setConditions(prev => ({
                ...prev,
                hours_before: parseInt(e?.target?.value) || 24
              }))}
              placeholder="24"
              min="0"
            />
          </div>
        );
      
      case 'checkout_time':
        return (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Hours Before Check-out
            </label>
            <Input
              type="number"
              value={conditions?.hours_before || 2}
              onChange={(e) => setConditions(prev => ({
                ...prev,
                hours_before: parseInt(e?.target?.value) || 2
              }))}
              placeholder="2"
              min="0"
            />
          </div>
        );
      
      case 'scheduled':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Schedule Time
              </label>
              <Input
                type="time"
                value={conditions?.scheduled_time || '09:00'}
                onChange={(e) => setConditions(prev => ({
                  ...prev,
                  scheduled_time: e?.target?.value
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Days of Week
              </label>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']?.map((day, index) => (
                  <label key={day} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={conditions?.days_of_week?.includes(index) || false}
                      onChange={(e) => {
                        const days = conditions?.days_of_week || [];
                        if (e?.target?.checked) {
                          setConditions(prev => ({
                            ...prev,
                            days_of_week: [...days, index]
                          }));
                        } else {
                          setConditions(prev => ({
                            ...prev,
                            days_of_week: days?.filter(d => d !== index)
                          }));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-xs text-foreground">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="Workflow" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Workflow Builder</h2>
              <p className="text-sm text-muted-foreground">Create automated message workflows</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Workflow Name *
              </label>
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e?.target?.value)}
                placeholder="e.g., Welcome New Guests"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e?.target?.value)}
                placeholder="Describe what this workflow does..."
                className="w-full h-20 p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Trigger Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Trigger Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Trigger Type *
              </label>
              <Select
                options={triggerOptions}
                value={triggerType}
                onChange={setTriggerType}
                disabled={isSaving}
              />
            </div>

            {renderTriggerConditions()}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Delay (minutes)
              </label>
              <Input
                type="number"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e?.target?.value)}
                placeholder="0"
                min="0"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long to wait before sending the message after trigger
              </p>
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Message Template</h3>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Template *
              </label>
              {templateOptions?.length > 0 ? (
                <Select
                  options={templateOptions}
                  value={selectedTemplate}
                  onChange={setSelectedTemplate}
                  placeholder="Select a template..."
                  disabled={isSaving}
                />
              ) : (
                <div className="p-4 border border-border rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Icon name="AlertCircle" size={16} />
                    <span className="text-sm">No templates available. Create a template first.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Status</h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e?.target?.checked)}
                className="rounded border-border"
                disabled={isSaving}
              />
              <label htmlFor="isActive" className="text-sm text-foreground">
                Activate workflow immediately
              </label>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={16} className="text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Icon name="Info" size={14} />
            <span>Workflows can be edited and paused after creation</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || !workflowName?.trim() || !selectedTemplate}
              iconName={isSaving ? "Loader" : "Save"}
              iconPosition="left"
            >
              {isSaving ? 'Saving...' : 'Create Workflow'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;