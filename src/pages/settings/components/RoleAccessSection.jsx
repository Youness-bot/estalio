import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { settingsService } from '../../../services/settingsService';

const RoleAccessSection = () => {
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    loginNotifications: true,
    apiAccess: false,
    dataExport: true,
    adminApproval: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadRoleAccessSettings();
  }, []);

  const loadRoleAccessSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await settingsService?.getUserSettings();
      
      // Extract role/access related settings
      const roleSettings = {};
      allSettings?.forEach(setting => {
        if (setting?.category === 'security' || setting?.category === 'roles_access') {
          switch (setting?.settingKey) {
            case 'two_factor_enabled':
              roleSettings.twoFactorEnabled = setting?.settingValue === 'true';
              break;
            case 'session_timeout':
              roleSettings.sessionTimeout = setting?.settingValue || '30';
              break;
            case 'login_notifications':
              roleSettings.loginNotifications = setting?.settingValue === 'true';
              break;
            case 'api_access':
              roleSettings.apiAccess = setting?.settingValue === 'true';
              break;
            case 'data_export':
              roleSettings.dataExport = setting?.settingValue === 'true';
              break;
            case 'admin_approval':
              roleSettings.adminApproval = setting?.settingValue === 'true';
              break;
          }
        }
      });
      
      setSettings(prev => ({ ...prev, ...roleSettings }));
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
      
      // Save each setting individually
      await Promise.all([
        settingsService?.updateSetting('security', 'two_factor_enabled', settings?.twoFactorEnabled?.toString(), 'boolean'),
        settingsService?.updateSetting('security', 'session_timeout', settings?.sessionTimeout, 'number'),
        settingsService?.updateSetting('security', 'login_notifications', settings?.loginNotifications?.toString(), 'boolean'),
        settingsService?.updateSetting('roles_access', 'api_access', settings?.apiAccess?.toString(), 'boolean'),
        settingsService?.updateSetting('roles_access', 'data_export', settings?.dataExport?.toString(), 'boolean'),
        settingsService?.updateSetting('roles_access', 'admin_approval', settings?.adminApproval?.toString(), 'boolean')
      ]);
      
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

  const sessionTimeoutOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '120', label: '2 hours' },
    { value: '480', label: '8 hours' },
    { value: '1440', label: '24 hours' }
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
        <h3 className="text-lg font-semibold text-foreground">Security & Access Control</h3>
        <p className="text-sm text-muted-foreground">Manage account security and access permissions</p>
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
      {/* Security Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="Shield" size={20} color="white" />
          </div>
          <div>
            <h4 className="text-base font-medium text-foreground">Security Settings</h4>
            <p className="text-sm text-muted-foreground">Configure account security features</p>
          </div>
        </div>

        <div className="space-y-4">
          <Checkbox
            id="two-factor"
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            checked={settings?.twoFactorEnabled}
            onChange={(checked) => handleChange('twoFactorEnabled', checked)}
          />
          
          <div>
            <Select
              label="Session Timeout"
              value={settings?.sessionTimeout}
              onChange={(value) => handleChange('sessionTimeout', value)}
              options={sessionTimeoutOptions}
              description="Automatically log out after period of inactivity"
            />
          </div>

          <Checkbox
            id="login-notifications"
            label="Login Notifications"
            description="Get notified when someone logs into your account"
            checked={settings?.loginNotifications}
            onChange={(checked) => handleChange('loginNotifications', checked)}
          />
        </div>
      </div>
      {/* Access Control */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <Icon name="Users" size={20} color="white" />
          </div>
          <div>
            <h4 className="text-base font-medium text-foreground">Access Control</h4>
            <p className="text-sm text-muted-foreground">Manage permissions and access levels</p>
          </div>
        </div>

        <div className="space-y-4">
          <Checkbox
            id="api-access"
            label="API Access"
            description="Allow access to API endpoints and integrations"
            checked={settings?.apiAccess}
            onChange={(checked) => handleChange('apiAccess', checked)}
          />
          
          <Checkbox
            id="data-export"
            label="Data Export"
            description="Allow exporting data and generating reports"
            checked={settings?.dataExport}
            onChange={(checked) => handleChange('dataExport', checked)}
          />

          <Checkbox
            id="admin-approval"
            label="Admin Approval Required"
            description="Require admin approval for sensitive actions"
            checked={settings?.adminApproval}
            onChange={(checked) => handleChange('adminApproval', checked)}
          />
        </div>
      </div>
      {/* Current Permissions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Current Permissions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Icon name="CheckCircle" size={16} className="text-success" />
            <span className="text-sm text-foreground">Property Management</span>
          </div>
          <div className="flex items-center space-x-3">
            <Icon name="CheckCircle" size={16} className="text-success" />
            <span className="text-sm text-foreground">Reservation Handling</span>
          </div>
          <div className="flex items-center space-x-3">
            <Icon name="CheckCircle" size={16} className="text-success" />
            <span className="text-sm text-foreground">Financial Reports</span>
          </div>
          <div className="flex items-center space-x-3">
            <Icon name="CheckCircle" size={16} className="text-success" />
            <span className="text-sm text-foreground">User Management</span>
          </div>
          <div className="flex items-center space-x-3">
            <Icon 
              name={settings?.apiAccess ? "CheckCircle" : "XCircle"} 
              size={16} 
              className={settings?.apiAccess ? "text-success" : "text-muted-foreground"}
            />
            <span className={`text-sm ${settings?.apiAccess ? "text-foreground" : "text-muted-foreground"}`}>
              API Access
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Icon 
              name={settings?.dataExport ? "CheckCircle" : "XCircle"} 
              size={16} 
              className={settings?.dataExport ? "text-success" : "text-muted-foreground"}
            />
            <span className={`text-sm ${settings?.dataExport ? "text-foreground" : "text-muted-foreground"}`}>
              Data Export
            </span>
          </div>
        </div>
      </div>
      {/* Security Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Security Status</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="CheckCircle" size={16} className="text-success" />
              <span className="text-sm font-medium text-foreground">Password Security</span>
            </div>
            <span className="text-xs text-success">Strong</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="AlertTriangle" size={16} className="text-warning" />
              <span className="text-sm font-medium text-foreground">Two-Factor Authentication</span>
            </div>
            <span className="text-xs text-warning">
              {settings?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="Clock" size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">Session Timeout</span>
            </div>
            <span className="text-xs text-primary">
              {sessionTimeoutOptions?.find(opt => opt?.value === settings?.sessionTimeout)?.label || 'Not set'}
            </span>
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
          Save Security Settings
        </Button>
      </div>
    </div>
  );
};

export default RoleAccessSection;