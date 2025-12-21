import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { settingsService } from '../../../services/settingsService';

const NotificationSection = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    notificationFrequency: 'immediate',
    quietHoursStart: '',
    quietHoursEnd: '',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService?.getNotificationSettings();
      setSettings(data);
    } catch (err) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await settingsService?.updateNotificationSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const frequencyOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">Configure how and when you receive notifications</p>
      </div>
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <p className="text-success text-sm">Settings saved successfully!</p>
        </div>
      )}
      {/* Notification Types */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Notification Channels</h4>
        <div className="space-y-4">
          <Checkbox
            id="email-notifications"
            label="Email Notifications"
            description="Receive notifications via email"
            checked={settings?.emailNotifications}
            onChange={(checked) => handleChange('emailNotifications', checked)}
          />
          <Checkbox
            id="sms-notifications"
            label="SMS Notifications"
            description="Receive notifications via text message"
            checked={settings?.smsNotifications}
            onChange={(checked) => handleChange('smsNotifications', checked)}
          />
          <Checkbox
            id="push-notifications"
            label="Push Notifications"
            description="Receive browser push notifications"
            checked={settings?.pushNotifications}
            onChange={(checked) => handleChange('pushNotifications', checked)}
          />
          <Checkbox
            id="marketing-emails"
            label="Marketing Emails"
            description="Receive product updates and promotional content"
            checked={settings?.marketingEmails}
            onChange={(checked) => handleChange('marketingEmails', checked)}
          />
        </div>
      </div>
      {/* Notification Frequency */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Notification Frequency</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Frequency"
            value={settings?.notificationFrequency}
            onChange={(value) => handleChange('notificationFrequency', value)}
            options={frequencyOptions}
          />
          <Select
            label="Timezone"
            value={settings?.timezone}
            onChange={(value) => handleChange('timezone', value)}
            options={timezoneOptions}
          />
        </div>
      </div>
      {/* Quiet Hours */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Quiet Hours</h4>
        <p className="text-sm text-muted-foreground mb-4">Set time periods when you don't want to receive notifications</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Start Time</label>
            <input
              type="time"
              value={settings?.quietHoursStart || ''}
              onChange={(e) => handleChange('quietHoursStart', e?.target?.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">End Time</label>
            <input
              type="time"
              value={settings?.quietHoursEnd || ''}
              onChange={(e) => handleChange('quietHoursEnd', e?.target?.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
      {/* Preview Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Notification Preview</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Icon name="Bell" size={16} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">New Reservation</p>
              <p className="text-xs text-muted-foreground">You have a new reservation for Villa Sunset</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <Icon name="AlertTriangle" size={16} className="text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">Maintenance Required</p>
              <p className="text-xs text-muted-foreground">Air conditioning maintenance scheduled</p>
            </div>
          </div>
        </div>
      </div>
      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={saving}
          iconName="Save"
          iconPosition="left"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default NotificationSection;