import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { settingsService } from '../../../services/settingsService';

const BackupSection = () => {
  const [settings, setSettings] = useState({
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    backupRetention: '30',
    includeProperties: true,
    includeReservations: true,
    includeFinancials: true,
    includeUsers: false,
    exportFormat: 'json'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadBackupSettings();
  }, []);

  const loadBackupSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await settingsService?.getUserSettings();
      
      // Extract backup/export related settings
      const backupSettings = {};
      allSettings?.forEach(setting => {
        if (setting?.category === 'backup_export') {
          switch (setting?.settingKey) {
            case 'auto_backup_enabled':
              backupSettings.autoBackupEnabled = setting?.settingValue === 'true';
              break;
            case 'backup_frequency':
              backupSettings.backupFrequency = setting?.settingValue || 'daily';
              break;
            case 'backup_retention':
              backupSettings.backupRetention = setting?.settingValue || '30';
              break;
            case 'include_properties':
              backupSettings.includeProperties = setting?.settingValue !== 'false';
              break;
            case 'include_reservations':
              backupSettings.includeReservations = setting?.settingValue !== 'false';
              break;
            case 'include_financials':
              backupSettings.includeFinancials = setting?.settingValue !== 'false';
              break;
            case 'include_users':
              backupSettings.includeUsers = setting?.settingValue === 'true';
              break;
            case 'export_format':
              backupSettings.exportFormat = setting?.settingValue || 'json';
              break;
          }
        }
      });
      
      setSettings(prev => ({ ...prev, ...backupSettings }));
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
        settingsService?.updateSetting('backup_export', 'auto_backup_enabled', settings?.autoBackupEnabled?.toString(), 'boolean'),
        settingsService?.updateSetting('backup_export', 'backup_frequency', settings?.backupFrequency, 'text'),
        settingsService?.updateSetting('backup_export', 'backup_retention', settings?.backupRetention, 'number'),
        settingsService?.updateSetting('backup_export', 'include_properties', settings?.includeProperties?.toString(), 'boolean'),
        settingsService?.updateSetting('backup_export', 'include_reservations', settings?.includeReservations?.toString(), 'boolean'),
        settingsService?.updateSetting('backup_export', 'include_financials', settings?.includeFinancials?.toString(), 'boolean'),
        settingsService?.updateSetting('backup_export', 'include_users', settings?.includeUsers?.toString(), 'boolean'),
        settingsService?.updateSetting('backup_export', 'export_format', settings?.exportFormat, 'text')
      ]);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError('');
      
      // Simulate export process - in real app, this would generate actual export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock export file
      const exportData = {
        timestamp: new Date()?.toISOString(),
        format: settings?.exportFormat,
        includes: {
          properties: settings?.includeProperties,
          reservations: settings?.includeReservations,
          financials: settings?.includeFinancials,
          users: settings?.includeUsers
        },
        message: 'This is a demo export. In production, this would contain actual data.'
      };
      
      // Download the export
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `propertyflow-export-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement?.setAttribute('href', dataUri);
      linkElement?.setAttribute('download', exportFileDefaultName);
      linkElement?.click();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.message);
    } finally {
      setExporting(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const retentionOptions = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '3 months' },
    { value: '365', label: '1 year' }
  ];

  const formatOptions = [
    { value: 'json', label: 'JSON' },
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'Excel (XLSX)' }
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
        <h3 className="text-lg font-semibold text-foreground">Backup & Export</h3>
        <p className="text-sm text-muted-foreground">Configure automatic backups and data export options</p>
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
      {/* Backup Configuration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="HardDrive" size={20} color="white" />
          </div>
          <div>
            <h4 className="text-base font-medium text-foreground">Automatic Backup</h4>
            <p className="text-sm text-muted-foreground">Configure regular data backups</p>
          </div>
        </div>

        <div className="space-y-4">
          <Checkbox
            id="auto-backup"
            label="Enable Automatic Backup"
            description="Automatically create backups of your data"
            checked={settings?.autoBackupEnabled}
            onChange={(checked) => handleChange('autoBackupEnabled', checked)}
          />
          
          {settings?.autoBackupEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Backup Frequency"
                  value={settings?.backupFrequency}
                  onChange={(value) => handleChange('backupFrequency', value)}
                  options={frequencyOptions}
                />
                <Select
                  label="Retention Period"
                  value={settings?.backupRetention}
                  onChange={(value) => handleChange('backupRetention', value)}
                  options={retentionOptions}
                  description="How long to keep backup files"
                />
              </div>
            </>
          )}
        </div>
      </div>
      {/* Data Selection */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Data Selection</h4>
        <p className="text-sm text-muted-foreground mb-4">Choose which data to include in backups and exports</p>
        
        <div className="space-y-4">
          <Checkbox
            id="include-properties"
            label="Property Information"
            description="Property details, images, and configurations"
            checked={settings?.includeProperties}
            onChange={(checked) => handleChange('includeProperties', checked)}
          />
          
          <Checkbox
            id="include-reservations"
            label="Reservations & Bookings"
            description="All reservation data and guest information"
            checked={settings?.includeReservations}
            onChange={(checked) => handleChange('includeReservations', checked)}
          />
          
          <Checkbox
            id="include-financials"
            label="Financial Data"
            description="Revenue, expenses, and financial reports"
            checked={settings?.includeFinancials}
            onChange={(checked) => handleChange('includeFinancials', checked)}
          />
          
          <Checkbox
            id="include-users"
            label="User Data"
            description="User accounts and permissions (admin only)"
            checked={settings?.includeUsers}
            onChange={(checked) => handleChange('includeUsers', checked)}
          />
        </div>
      </div>
      {/* Export Options */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-medium text-foreground">Manual Export</h4>
            <p className="text-sm text-muted-foreground">Export data immediately in your preferred format</p>
          </div>
          <Button
            onClick={handleExport}
            loading={exporting}
            iconName="Download"
            iconPosition="left"
            variant="outline"
          >
            Export Now
          </Button>
        </div>

        <div className="mb-4">
          <Select
            label="Export Format"
            value={settings?.exportFormat}
            onChange={(value) => handleChange('exportFormat', value)}
            options={formatOptions}
          />
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <h5 className="text-sm font-medium text-foreground mb-2">Export Preview</h5>
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className={settings?.includeProperties ? "text-success" : "text-muted-foreground"}>
                ✓ Properties: {settings?.includeProperties ? "Included" : "Excluded"}
              </span>
            </div>
            <div>
              <span className={settings?.includeReservations ? "text-success" : "text-muted-foreground"}>
                ✓ Reservations: {settings?.includeReservations ? "Included" : "Excluded"}
              </span>
            </div>
            <div>
              <span className={settings?.includeFinancials ? "text-success" : "text-muted-foreground"}>
                ✓ Financials: {settings?.includeFinancials ? "Included" : "Excluded"}
              </span>
            </div>
            <div>
              <span className={settings?.includeUsers ? "text-success" : "text-muted-foreground"}>
                ✓ Users: {settings?.includeUsers ? "Included" : "Excluded"}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Backup History */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Recent Backups</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="CheckCircle" size={16} className="text-success" />
              <div>
                <span className="text-sm font-medium text-foreground">Backup Completed</span>
                <p className="text-xs text-muted-foreground">Today at 3:00 AM - 2.4 MB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" iconName="Download">
              Download
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="CheckCircle" size={16} className="text-success" />
              <div>
                <span className="text-sm font-medium text-foreground">Backup Completed</span>
                <p className="text-xs text-muted-foreground">Yesterday at 3:00 AM - 2.3 MB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" iconName="Download">
              Download
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="Clock" size={16} className="text-muted-foreground" />
              <div>
                <span className="text-sm font-medium text-foreground">Next Backup Scheduled</span>
                <p className="text-xs text-muted-foreground">Tomorrow at 3:00 AM</p>
              </div>
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
          Save Backup Settings
        </Button>
      </div>
    </div>
  );
};

export default BackupSection;