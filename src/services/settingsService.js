import { supabase } from '../lib/supabase';

export const settingsService = {
  // Get all settings for a user
  async getUserSettings(userId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('app_settings')?.select('*')?.eq('user_id', user?.id);

    if (error) throw error;
    
    // Convert to camelCase for React
    return data?.map(row => ({
      id: row?.id,
      userId: row?.user_id,
      category: row?.category,
      settingKey: row?.setting_key,
      settingValue: row?.setting_value,
      dataType: row?.data_type,
      isEncrypted: row?.is_encrypted,
      description: row?.description,
      createdAt: row?.created_at,
      updatedAt: row?.updated_at
    }));
  },

  // Update or create a setting
  async updateSetting(category, settingKey, settingValue, dataType = 'text') {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('app_settings')?.upsert({
        user_id: user?.id,
        category: category,
        setting_key: settingKey,
        setting_value: settingValue,
        data_type: dataType
      })?.select()?.single();

    if (error) throw error;
    
    // Convert back to camelCase
    return {
      id: data?.id,
      userId: data?.user_id,
      category: data?.category,
      settingKey: data?.setting_key,
      settingValue: data?.setting_value,
      dataType: data?.data_type,
      createdAt: data?.created_at,
      updatedAt: data?.updated_at
    };
  },

  // API Integrations
  async getApiIntegrations() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('api_integrations')?.select('*')?.eq('user_id', user?.id);

    if (error) throw error;
    
    return data?.map(row => ({
      id: row?.id,
      userId: row?.user_id,
      serviceName: row?.service_name,
      apiKey: row?.api_key,
      apiSecret: row?.api_secret,
      additionalConfig: row?.additional_config,
      status: row?.status,
      lastTestedAt: row?.last_tested_at,
      lastSyncAt: row?.last_sync_at,
      errorMessage: row?.error_message,
      createdAt: row?.created_at,
      updatedAt: row?.updated_at
    }));
  },

  async updateApiIntegration(serviceName, apiKey, apiSecret, additionalConfig = {}) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('api_integrations')?.upsert({
        user_id: user?.id,
        service_name: serviceName,
        api_key: apiKey,
        api_secret: apiSecret,
        additional_config: additionalConfig,
        status: 'pending'
      })?.select()?.single();

    if (error) throw error;
    
    return {
      id: data?.id,
      userId: data?.user_id,
      serviceName: data?.service_name,
      apiKey: data?.api_key,
      status: data?.status,
      createdAt: data?.created_at,
      updatedAt: data?.updated_at
    };
  },

  async testApiConnection(serviceName) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    // Simulate API test - in real app, this would call the actual API
    const simulatedSuccess = Math.random() > 0.2;
    
    const { data, error } = await supabase?.from('api_integrations')?.update({
        status: simulatedSuccess ? 'connected' : 'error',
        last_tested_at: new Date()?.toISOString(),
        error_message: simulatedSuccess ? null : 'Connection test failed'
      })?.eq('user_id', user?.id)?.eq('service_name', serviceName)?.select()?.single();

    if (error) throw error;
    
    return {
      success: simulatedSuccess,
      status: data?.status,
      lastTestedAt: data?.last_tested_at
    };
  },

  // Notification Settings
  async getNotificationSettings() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('notification_settings')?.select('*')?.eq('user_id', user?.id)?.single();

    if (error && error?.code !== 'PGRST116') throw error;
    
    if (!data) {
      // Create default settings if none exist
      return await this.updateNotificationSettings({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        marketingEmails: false,
        notificationFrequency: 'immediate',
        timezone: 'UTC'
      });
    }
    
    return {
      id: data?.id,
      userId: data?.user_id,
      emailNotifications: data?.email_notifications,
      smsNotifications: data?.sms_notifications,
      pushNotifications: data?.push_notifications,
      marketingEmails: data?.marketing_emails,
      notificationFrequency: data?.notification_frequency,
      quietHoursStart: data?.quiet_hours_start,
      quietHoursEnd: data?.quiet_hours_end,
      timezone: data?.timezone,
      createdAt: data?.created_at,
      updatedAt: data?.updated_at
    };
  },

  async updateNotificationSettings(settings) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('notification_settings')?.upsert({
        user_id: user?.id,
        email_notifications: settings?.emailNotifications,
        sms_notifications: settings?.smsNotifications,
        push_notifications: settings?.pushNotifications,
        marketing_emails: settings?.marketingEmails,
        notification_frequency: settings?.notificationFrequency,
        quiet_hours_start: settings?.quietHoursStart,
        quiet_hours_end: settings?.quietHoursEnd,
        timezone: settings?.timezone
      })?.select()?.single();

    if (error) throw error;
    
    return {
      id: data?.id,
      userId: data?.user_id,
      emailNotifications: data?.email_notifications,
      smsNotifications: data?.sms_notifications,
      pushNotifications: data?.push_notifications,
      marketingEmails: data?.marketing_emails,
      notificationFrequency: data?.notification_frequency,
      quietHoursStart: data?.quiet_hours_start,
      quietHoursEnd: data?.quiet_hours_end,
      timezone: data?.timezone,
      updatedAt: data?.updated_at
    };
  },

  // Theme Settings
  async getThemeSettings() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('theme_settings')?.select('*')?.eq('user_id', user?.id)?.single();

    if (error && error?.code !== 'PGRST116') throw error;
    
    if (!data) {
      // Create default settings if none exist
      return await this.updateThemeSettings({
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
    }
    
    return {
      id: data?.id,
      userId: data?.user_id,
      themeMode: data?.theme_mode,
      primaryColor: data?.primary_color,
      accentColor: data?.accent_color,
      fontSize: data?.font_size,
      sidebarCollapsed: data?.sidebar_collapsed,
      language: data?.language,
      currency: data?.currency,
      dateFormat: data?.date_format,
      timeFormat: data?.time_format,
      createdAt: data?.created_at,
      updatedAt: data?.updated_at
    };
  },

  async updateThemeSettings(settings) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('theme_settings')?.upsert({
        user_id: user?.id,
        theme_mode: settings?.themeMode,
        primary_color: settings?.primaryColor,
        accent_color: settings?.accentColor,
        font_size: settings?.fontSize,
        sidebar_collapsed: settings?.sidebarCollapsed,
        language: settings?.language,
        currency: settings?.currency,
        date_format: settings?.dateFormat,
        time_format: settings?.timeFormat
      })?.select()?.single();

    if (error) throw error;
    
    return {
      id: data?.id,
      userId: data?.user_id,
      themeMode: data?.theme_mode,
      primaryColor: data?.primary_color,
      accentColor: data?.accent_color,
      fontSize: data?.font_size,
      sidebarCollapsed: data?.sidebar_collapsed,
      language: data?.language,
      currency: data?.currency,
      dateFormat: data?.date_format,
      timeFormat: data?.time_format,
      updatedAt: data?.updated_at
    };
  }
};