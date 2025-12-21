import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { settingsService } from '../../../services/settingsService';

const ApiKeysSection = () => {
  const [apiKeys, setApiKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [testingConnection, setTestingConnection] = useState(null);

  useEffect(() => {
    loadApiIntegrations();
  }, []);

  const loadApiIntegrations = async () => {
    try {
      setLoading(true);
      const integrations = await settingsService?.getApiIntegrations();
      
      // Convert array to object for easier access
      const apiKeysObj = {};
      integrations?.forEach(integration => {
        apiKeysObj[integration.serviceName] = {
          ...integration?.additionalConfig,
          apiKey: integration?.apiKey,
          status: integration?.status,
          lastTested: integration?.lastTestedAt,
          lastSync: integration?.lastSyncAt
        };
      });
      
      setApiKeys(apiKeysObj);
    } catch (err) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (service) => {
    setTestingConnection(service);
    
    try {
      const result = await settingsService?.testApiConnection(service);
      
      setApiKeys(prev => ({
        ...prev,
        [service]: {
          ...prev?.[service],
          status: result?.status,
          lastTested: result?.lastTestedAt
        }
      }));
    } catch (err) {
      setError(err?.message);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSaveKey = async (service, field, value) => {
    try {
      // Get current integration data
      const currentData = apiKeys?.[service] || {};
      
      // Update the specific field
      const updatedConfig = { ...currentData };
      updatedConfig[field] = value;
      
      // Save to database
      await settingsService?.updateApiIntegration(
        service,
        updatedConfig?.apiKey || updatedConfig?.accountSid,
        updatedConfig?.authToken || updatedConfig?.clientSecret,
        updatedConfig
      );
      
      // Update local state
      setApiKeys(prev => ({
        ...prev,
        [service]: {
          ...prev?.[service],
          [field]: value,
          status: 'pending'
        }
      }));
    } catch (err) {
      setError(err?.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-success';
      case 'error': return 'text-error';
      case 'syncing': return 'text-warning';
      case 'pending': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return 'CheckCircle';
      case 'error': return 'XCircle';
      case 'syncing': return 'RefreshCw';
      case 'pending': return 'Clock';
      default: return 'Circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString)?.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">{error}</p>
        <Button onClick={loadApiIntegrations} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">API Keys & Integrations</h3>
        <p className="text-sm text-muted-foreground">Configure external service integrations and API credentials</p>
      </div>
      
      {/* Twilio Configuration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="MessageSquare" size={20} color="white" />
            </div>
            <div>
              <h4 className="text-base font-medium text-foreground">Twilio SMS</h4>
              <p className="text-sm text-muted-foreground">SMS notifications and WhatsApp messaging</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Icon 
              name={getStatusIcon(apiKeys?.twilio?.status || 'pending')} 
              size={16} 
              className={getStatusColor(apiKeys?.twilio?.status || 'pending')}
            />
            <span className={`text-sm ${getStatusColor(apiKeys?.twilio?.status || 'pending')}`}>
              {apiKeys?.twilio?.status || 'pending'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="Account SID"
            type="text"
            value={apiKeys?.twilio?.accountSid || ''}
            onChange={(e) => handleSaveKey('twilio', 'accountSid', e?.target?.value)}
            placeholder="Enter Twilio Account SID"
          />
          <Input
            label="Auth Token"
            type="password"
            value={apiKeys?.twilio?.authToken || ''}
            onChange={(e) => handleSaveKey('twilio', 'authToken', e?.target?.value)}
            placeholder="Enter Twilio Auth Token"
          />
          <Input
            label="Phone Number"
            type="tel"
            value={apiKeys?.twilio?.phoneNumber || ''}
            onChange={(e) => handleSaveKey('twilio', 'phoneNumber', e?.target?.value)}
            placeholder="+1234567890"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Last tested: {formatDate(apiKeys?.twilio?.lastTested)}
          </span>
          <Button
            variant="outline"
            size="sm"
            iconName="TestTube"
            iconPosition="left"
            loading={testingConnection === 'twilio'}
            onClick={() => handleTestConnection('twilio')}
          >
            Test Connection
          </Button>
        </div>
      </div>

      {/* Resend Email Configuration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Icon name="Mail" size={20} color="white" />
            </div>
            <div>
              <h4 className="text-base font-medium text-foreground">Resend Email</h4>
              <p className="text-sm text-muted-foreground">Email notifications and marketing</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Icon 
              name={getStatusIcon(apiKeys?.resend?.status || 'pending')} 
              size={16} 
              className={getStatusColor(apiKeys?.resend?.status || 'pending')}
            />
            <span className={`text-sm ${getStatusColor(apiKeys?.resend?.status || 'pending')}`}>
              {apiKeys?.resend?.status || 'pending'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="API Key"
            type="password"
            value={apiKeys?.resend?.apiKey || ''}
            onChange={(e) => handleSaveKey('resend', 'apiKey', e?.target?.value)}
            placeholder="Enter Resend API Key"
          />
          <Input
            label="Domain"
            type="text"
            value={apiKeys?.resend?.domain || ''}
            onChange={(e) => handleSaveKey('resend', 'domain', e?.target?.value)}
            placeholder="your-domain.com"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Last tested: {formatDate(apiKeys?.resend?.lastTested)}
          </span>
          <Button
            variant="outline"
            size="sm"
            iconName="TestTube"
            iconPosition="left"
            loading={testingConnection === 'resend'}
            onClick={() => handleTestConnection('resend')}
          >
            Test Connection
          </Button>
        </div>
      </div>

      {/* iCal Sync Configuration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <Icon name="Calendar" size={20} color="white" />
            </div>
            <div>
              <h4 className="text-base font-medium text-foreground">iCal Synchronization</h4>
              <p className="text-sm text-muted-foreground">Calendar sync with external platforms</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Icon 
              name={getStatusIcon(apiKeys?.ical?.status || 'pending')} 
              size={16} 
              className={getStatusColor(apiKeys?.ical?.status || 'pending')}
            />
            <span className={`text-sm ${getStatusColor(apiKeys?.ical?.status || 'pending')}`}>
              {apiKeys?.ical?.status || 'pending'}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <Input
            label="iCal Sync URL"
            type="url"
            value={apiKeys?.ical?.syncUrl || ''}
            onChange={(e) => handleSaveKey('ical', 'syncUrl', e?.target?.value)}
            placeholder="https://calendar.google.com/calendar/ical/..."
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Last sync: {formatDate(apiKeys?.ical?.lastSync)}
          </span>
          <Button
            variant="outline"
            size="sm"
            iconName="RefreshCw"
            iconPosition="left"
            loading={testingConnection === 'ical'}
            onClick={() => handleTestConnection('ical')}
          >
            Sync Now
          </Button>
        </div>
      </div>

      {/* Google Sheets Configuration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
              <Icon name="FileSpreadsheet" size={20} color="white" />
            </div>
            <div>
              <h4 className="text-base font-medium text-foreground">Google Sheets</h4>
              <p className="text-sm text-muted-foreground">Data export and reporting integration</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Icon 
              name={getStatusIcon(apiKeys?.google_sheets?.status || 'pending')} 
              size={16} 
              className={getStatusColor(apiKeys?.google_sheets?.status || 'pending')}
            />
            <span className={`text-sm ${getStatusColor(apiKeys?.google_sheets?.status || 'pending')}`}>
              {apiKeys?.google_sheets?.status || 'pending'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <Input
            label="Client ID"
            type="text"
            value={apiKeys?.google_sheets?.clientId || ''}
            onChange={(e) => handleSaveKey('google_sheets', 'clientId', e?.target?.value)}
            placeholder="Enter Google OAuth Client ID"
          />
          <Input
            label="Client Secret"
            type="password"
            value={apiKeys?.google_sheets?.clientSecret || ''}
            onChange={(e) => handleSaveKey('google_sheets', 'clientSecret', e?.target?.value)}
            placeholder="Enter Google OAuth Client Secret"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Last sync: {formatDate(apiKeys?.google_sheets?.lastSync)}
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="ExternalLink"
              iconPosition="left"
            >
              Authorize
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="TestTube"
              iconPosition="left"
              loading={testingConnection === 'google_sheets'}
              onClick={() => handleTestConnection('google_sheets')}
            >
              Test Connection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysSection;