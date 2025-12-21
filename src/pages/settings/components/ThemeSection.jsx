import React, { useState, useEffect } from 'react';

import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { settingsService } from '../../../services/settingsService';

const ThemeSection = () => {
  const [settings, setSettings] = useState({
    themeMode: 'light',
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
    fontSize: 'medium',
    sidebarCollapsed: false,
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService?.getThemeSettings();
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
      await settingsService?.updateThemeSettings(settings);
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

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' }
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' }
  ];

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' }
  ];

  const dateFormatOptions = [
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' },
    { value: 'dd MMM yyyy', label: 'DD MMM YYYY' }
  ];

  const timeFormatOptions = [
    { value: '12h', label: '12 Hour' },
    { value: '24h', label: '24 Hour' }
  ];

  const colorPresets = [
    { name: 'Blue', primary: '#3b82f6', accent: '#8b5cf6' },
    { name: 'Green', primary: '#10b981', accent: '#06b6d4' },
    { name: 'Purple', primary: '#8b5cf6', accent: '#ec4899' },
    { name: 'Orange', primary: '#f59e0b', accent: '#ef4444' },
    { name: 'Indigo', primary: '#6366f1', accent: '#14b8a6' }
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
        <h3 className="text-lg font-semibold text-foreground">Appearance & Localization</h3>
        <p className="text-sm text-muted-foreground">Customize the look and feel of your workspace</p>
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
      {/* Theme & Colors */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Theme & Colors</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Theme Mode"
            value={settings?.themeMode}
            onChange={(value) => handleChange('themeMode', value)}
            options={themeOptions}
          />
          <Select
            label="Font Size"
            value={settings?.fontSize}
            onChange={(value) => handleChange('fontSize', value)}
            options={fontSizeOptions}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-3">Color Presets</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {colorPresets?.map(preset => (
              <button
                key={preset?.name}
                onClick={() => {
                  handleChange('primaryColor', preset?.primary);
                  handleChange('accentColor', preset?.accent);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  settings?.primaryColor === preset?.primary 
                    ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex space-x-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: preset?.primary }}
                  ></div>
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: preset?.accent }}
                  ></div>
                </div>
                <span className="text-xs text-foreground">{preset?.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Primary Color</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={settings?.primaryColor}
                onChange={(e) => handleChange('primaryColor', e?.target?.value)}
                className="w-12 h-10 rounded border border-border"
              />
              <input
                type="text"
                value={settings?.primaryColor}
                onChange={(e) => handleChange('primaryColor', e?.target?.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="#3b82f6"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Accent Color</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={settings?.accentColor}
                onChange={(e) => handleChange('accentColor', e?.target?.value)}
                className="w-12 h-10 rounded border border-border"
              />
              <input
                type="text"
                value={settings?.accentColor}
                onChange={(e) => handleChange('accentColor', e?.target?.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="#8b5cf6"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Localization */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Localization</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Language"
            value={settings?.language}
            onChange={(value) => handleChange('language', value)}
            options={languageOptions}
          />
          <Select
            label="Currency"
            value={settings?.currency}
            onChange={(value) => handleChange('currency', value)}
            options={currencyOptions}
          />
          <Select
            label="Date Format"
            value={settings?.dateFormat}
            onChange={(value) => handleChange('dateFormat', value)}
            options={dateFormatOptions}
          />
          <Select
            label="Time Format"
            value={settings?.timeFormat}
            onChange={(value) => handleChange('timeFormat', value)}
            options={timeFormatOptions}
          />
        </div>
      </div>
      {/* Layout Preferences */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Layout Preferences</h4>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings?.sidebarCollapsed}
              onChange={(e) => handleChange('sidebarCollapsed', e?.target?.checked)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Collapse Sidebar by Default</span>
              <p className="text-xs text-muted-foreground">Start with a collapsed sidebar for more content space</p>
            </div>
          </label>
        </div>
      </div>
      {/* Preview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-base font-medium text-foreground mb-4">Preview</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: settings?.primaryColor }}
            ></div>
            <span className="text-sm text-foreground">Primary color sample</span>
          </div>
          <div className="flex items-center space-x-3">
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: settings?.accentColor }}
            ></div>
            <span className="text-sm text-foreground">Accent color sample</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Date format: {new Date()?.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}
          </div>
          <div className="text-sm text-muted-foreground">
            Currency: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: settings.currency
            })?.format(1234.56)}
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
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ThemeSection;