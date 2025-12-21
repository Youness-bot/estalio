import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Globe, DollarSign, Eye, Check, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const AccountProfile = () => {
  const { user, userProfile, updateProfile, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: '',
    language: 'en',
    currency: 'USD'
  });

  // Track if form has been modified
  const [isModified, setIsModified] = useState(false);

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'ar', label: 'العربية' }
  ];

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'MAD', label: 'MAD (د.م.)' }
  ];

  useEffect(() => {
    if (userProfile) {
      const savedLanguage = localStorage.getItem('language') || 'en';
      const savedCurrency = localStorage.getItem('currency') || 'USD';
      
      setProfileData({
        fullName: userProfile?.full_name || '',
        language: savedLanguage,
        currency: savedCurrency
      });
    }
  }, [userProfile]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsModified(true);
    setMessage('');
    setError('');
  };

  const handleSaveProfile = async () => {
    if (!isModified) {
      setMessage('No changes to save');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Update profile in database
      const { error: updateError } = await updateProfile({
        full_name: profileData?.fullName
      });

      if (updateError) throw updateError;

      // Update local preferences
      localStorage.setItem('language', profileData?.language);
      localStorage.setItem('currency', profileData?.currency);

      // Apply language changes
      if (profileData?.language === 'ar') {
        document.documentElement?.setAttribute('dir', 'rtl');
      } else {
        document.documentElement?.setAttribute('dir', 'ltr');
      }

      setMessage('Profile updated successfully!');
      setIsModified(false);

      // Auto-clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);

    } catch (err) {
      setError(`Failed to update profile: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      setError('No email address found');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error: resetError } = await resetPassword(user?.email);
      
      if (resetError) throw resetError;

      setMessage('Password reset email sent successfully! Check your inbox.');
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setMessage(''), 5000);

    } catch (err) {
      setError(`Failed to send reset email: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardChanges = () => {
    if (userProfile) {
      const savedLanguage = localStorage.getItem('language') || 'en';
      const savedCurrency = localStorage.getItem('currency') || 'USD';
      
      setProfileData({
        fullName: userProfile?.full_name || '',
        language: savedLanguage,
        currency: savedCurrency
      });
    }
    setIsModified(false);
    setMessage('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-1">
            Manage your personal information and preferences
          </p>
        </div>
      </div>
      {/* Success/Error Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-400 mr-3" />
            <p className="text-sm text-green-700">{message}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="w-5 h-5 text-red-400 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Profile Information */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Personal Information
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Profile Avatar */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xl font-medium text-white">
                {profileData?.fullName?.charAt(0)?.toUpperCase() || 
                 user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {profileData?.fullName || 'No name set'}
              </h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                id="fullName"
                value={profileData?.fullName}
                onChange={(e) => handleInputChange('fullName', e?.target?.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email address cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={userProfile?.role || 'user'}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 capitalize"
                disabled
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Role is assigned by administrators
            </p>
          </div>
        </div>
      </div>
      {/* Application Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Application Preferences
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Language Preference */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                id="language"
                value={profileData?.language}
                onChange={(e) => handleInputChange('language', e?.target?.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {languages?.map(lang => (
                  <option key={lang?.value} value={lang?.value}>
                    {lang?.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Currency Preference */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                id="currency"
                value={profileData?.currency}
                onChange={(e) => handleInputChange('currency', e?.target?.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {currencies?.map(curr => (
                  <option key={curr?.value} value={curr?.value}>
                    {curr?.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Security Settings */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Settings
          </h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Password</h3>
              <p className="text-sm text-gray-500">
                Change your password by requesting a reset email
              </p>
            </div>
            <Button
              onClick={handleResetPassword}
              variant="outline"
              disabled={loading}
              className="flex items-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              Reset Password
            </Button>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {isModified && (
          <Button
            variant="outline"
            onClick={handleDiscardChanges}
            disabled={loading}
          >
            Discard Changes
          </Button>
        )}
        <Button
          onClick={handleSaveProfile}
          disabled={loading || !isModified}
          className="flex items-center"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : null}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default AccountProfile;