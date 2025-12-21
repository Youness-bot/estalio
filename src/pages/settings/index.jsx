import React, { useState, useEffect } from 'react';


import Header from '../../components/ui/Header';

import RoleAccessSection from './components/RoleAccessSection';
import ApiKeysSection from './components/ApiKeysSection';
import LocalizationSection from './components/LocalizationSection';
import ThemeSection from './components/ThemeSection';
import NotificationSection from './components/NotificationSection';
import BackupSection from './components/BackupSection';

const Settings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('roles');
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const settingsSections = [
    {
      id: 'roles',
      name: 'Roles & Access',
      icon: 'Shield',
      description: 'Manage user permissions and access control'
    },
    {
      id: 'api',
      name: 'API Keys',
      icon: 'Key',
      description: 'Configure external service integrations'
    },
    {
      id: 'localization',
      name: 'Language & Currency',
      icon: 'Globe',
      description: 'Regional settings and localization'
    },
    {
      id: 'theme',
      name: 'Appearance',
      icon: 'Palette',
      description: 'Theme and visual preferences'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: 'Bell',
      description: 'Email, SMS, and push notification settings'
    },
    {
      id: 'backup',
      name: 'Backup & Export',
      icon: 'HardDrive',
      description: 'Data backup and export configuration'
    }
  ];

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'roles':
        return <RoleAccessSection />;
      case 'api':
        return <ApiKeysSection />;
      case 'localization':
        return <LocalizationSection />;
      case 'theme':
        return <ThemeSection />;
      case 'notifications':
        return <NotificationSection />;
      case 'backup':
        return <BackupSection />;
      default:
        return <RoleAccessSection />;
    }
  };

  const getSectionTitle = () => {
    const section = settingsSections?.find(s => s?.id === activeSection);
    return section ? section?.name : 'Settings';
  };

  const getSectionDescription = () => {
    const section = settingsSections?.find(s => s?.id === activeSection);
    return section ? section?.description : 'Configure system settings';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your PropertyFlow application preferences and system settings
        </p>
      </div>

      {/* Settings Sections - Single scroll container */}
      <div className="space-y-6">
        <ThemeSection />
        <LocalizationSection />
        <NotificationSection />
        <RoleAccessSection />
        <ApiKeysSection />
        <BackupSection />
      </div>
    </div>
  );
};

export default Settings;