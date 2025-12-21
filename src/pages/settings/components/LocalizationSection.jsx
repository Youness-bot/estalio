import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const LocalizationSection = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12');
  const [numberFormat, setNumberFormat] = useState('1,234.56');
  const [rtlEnabled, setRtlEnabled] = useState(false);

  const languages = [
    { 
      value: 'en', 
      label: 'English',
      description: 'English (United States)'
    },
    { 
      value: 'fr', 
      label: 'Français',
      description: 'French (France)'
    },
    { 
      value: 'ar', 
      label: 'العربية',
      description: 'Arabic (Morocco)'
    }
  ];

  const currencies = [
    { 
      value: 'USD', 
      label: 'USD ($)',
      description: 'US Dollar - Base rate: 1.00'
    },
    { 
      value: 'EUR', 
      label: 'EUR (€)',
      description: 'Euro - Rate: 0.093 (vs MAD)'
    },
    { 
      value: 'MAD', 
      label: 'MAD (د.م.)',
      description: 'Moroccan Dirham - Rate: 1.00'
    }
  ];

  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', description: '11/09/2024' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', description: '09/11/2024' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', description: '2024-11-09' },
    { value: 'DD MMM YYYY', label: 'DD MMM YYYY', description: '09 Nov 2024' }
  ];

  const timeFormats = [
    { value: '12', label: '12-hour', description: '2:30 PM' },
    { value: '24', label: '24-hour', description: '14:30' }
  ];

  const numberFormats = [
    { value: '1,234.56', label: '1,234.56', description: 'US/UK format' },
    { value: '1.234,56', label: '1.234,56', description: 'European format' },
    { value: '1 234,56', label: '1 234,56', description: 'French format' },
    { value: '1٬234.56', label: '1٬234.56', description: 'Arabic format' }
  ];

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedCurrency = localStorage.getItem('currency') || 'USD';
    const savedDateFormat = localStorage.getItem('dateFormat') || 'MM/DD/YYYY';
    const savedTimeFormat = localStorage.getItem('timeFormat') || '12';
    const savedNumberFormat = localStorage.getItem('numberFormat') || '1,234.56';
    
    setCurrentLanguage(savedLanguage);
    setCurrentCurrency(savedCurrency);
    setDateFormat(savedDateFormat);
    setTimeFormat(savedTimeFormat);
    setNumberFormat(savedNumberFormat);
    setRtlEnabled(savedLanguage === 'ar');
  }, []);

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    localStorage.setItem('language', language);
    
    const isRtl = language === 'ar';
    setRtlEnabled(isRtl);
    
    if (isRtl) {
      document.documentElement?.setAttribute('dir', 'rtl');
      setNumberFormat('1٬234.56');
    } else {
      document.documentElement?.setAttribute('dir', 'ltr');
      if (numberFormat === '1٬234.56') {
        setNumberFormat('1,234.56');
      }
    }
  };

  const handleCurrencyChange = (currency) => {
    setCurrentCurrency(currency);
    localStorage.setItem('currency', currency);
  };

  const handleDateFormatChange = (format) => {
    setDateFormat(format);
    localStorage.setItem('dateFormat', format);
  };

  const handleTimeFormatChange = (format) => {
    setTimeFormat(format);
    localStorage.setItem('timeFormat', format);
  };

  const handleNumberFormatChange = (format) => {
    setNumberFormat(format);
    localStorage.setItem('numberFormat', format);
  };

  const getCurrencyRate = (currency) => {
    const rates = { USD: 0.10, EUR: 0.093, MAD: 1.00 };
    return rates?.[currency] || 1.00;
  };

  const formatSampleAmount = (amount, currency, format) => {
    const rate = getCurrencyRate(currency);
    const convertedAmount = amount * rate;
    
    let formattedNumber;
    switch (format) {
      case '1.234,56':
        formattedNumber = convertedAmount?.toFixed(2)?.replace('.', ',')?.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        break;
      case '1 234,56':
        formattedNumber = convertedAmount?.toFixed(2)?.replace('.', ',')?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        break;
      case '1٬234.56':
        formattedNumber = convertedAmount?.toFixed(2)?.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
        break;
      default:
        formattedNumber = convertedAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 });
    }
    
    const symbols = { USD: '$', EUR: '€', MAD: 'د.م.' };
    return `${symbols?.[currency]} ${formattedNumber}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Language & Regional Settings</h3>
        <p className="text-sm text-muted-foreground">Configure display language, currency, and regional formatting preferences</p>
      </div>

      {/* Language Selection */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Icon name="Globe" size={20} className="text-primary" />
          <div>
            <h4 className="text-base font-medium text-foreground">Display Language</h4>
            <p className="text-sm text-muted-foreground">Choose your preferred interface language</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Interface Language"
            options={languages}
            value={currentLanguage}
            onChange={handleLanguageChange}
            description="Changes will apply immediately"
          />
          
          <div className="flex items-center space-x-4 pt-6">
            <Checkbox
              label="Enable RTL Layout"
              description="Right-to-left text direction for Arabic"
              checked={rtlEnabled}
              disabled={currentLanguage !== 'ar'}
            />
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h5 className="text-sm font-medium text-foreground mb-2">Preview</h5>
          <div className="text-sm text-muted-foreground">
            {currentLanguage === 'en' && "Welcome to PropertyFlow - Manage your properties efficiently"}
            {currentLanguage === 'fr' && "Bienvenue sur PropertyFlow - Gérez vos propriétés efficacement"}
            {currentLanguage === 'ar' && "مرحباً بك في PropertyFlow - إدارة ممتلكاتك بكفاءة"}
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Icon name="DollarSign" size={20} className="text-success" />
          <div>
            <h4 className="text-base font-medium text-foreground">Currency & Financial Display</h4>
            <p className="text-sm text-muted-foreground">Configure currency and number formatting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Primary Currency"
            options={currencies}
            value={currentCurrency}
            onChange={handleCurrencyChange}
            description="All amounts will be displayed in this currency"
          />

          <Select
            label="Number Format"
            options={numberFormats}
            value={numberFormat}
            onChange={handleNumberFormatChange}
            description="How numbers and decimals are displayed"
          />
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h5 className="text-sm font-medium text-foreground mb-2">Currency Preview</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Revenue: </span>
              <span className="font-medium">{formatSampleAmount(12500, currentCurrency, numberFormat)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Expenses: </span>
              <span className="font-medium">{formatSampleAmount(3750, currentCurrency, numberFormat)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Net: </span>
              <span className="font-medium text-success">{formatSampleAmount(8750, currentCurrency, numberFormat)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date & Time Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Icon name="Calendar" size={20} className="text-accent" />
          <div>
            <h4 className="text-base font-medium text-foreground">Date & Time Format</h4>
            <p className="text-sm text-muted-foreground">Customize how dates and times are displayed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Date Format"
            options={dateFormats}
            value={dateFormat}
            onChange={handleDateFormatChange}
            description="Format for displaying dates"
          />

          <Select
            label="Time Format"
            options={timeFormats}
            value={timeFormat}
            onChange={handleTimeFormatChange}
            description="12-hour or 24-hour time display"
          />
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h5 className="text-sm font-medium text-foreground mb-2">Date & Time Preview</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Check-in: </span>
              <span className="font-medium">
                {dateFormat === 'MM/DD/YYYY' && '11/09/2024'}
                {dateFormat === 'DD/MM/YYYY' && '09/11/2024'}
                {dateFormat === 'YYYY-MM-DD' && '2024-11-09'}
                {dateFormat === 'DD MMM YYYY' && '09 Nov 2024'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Time: </span>
              <span className="font-medium">
                {timeFormat === '12' ? '2:30 PM' : '14:30'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Icon name="MapPin" size={20} className="text-secondary" />
          <div>
            <h4 className="text-base font-medium text-foreground">Regional Preferences</h4>
            <p className="text-sm text-muted-foreground">Additional regional and cultural settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <Checkbox
            label="Use metric system"
            description="Display measurements in meters, kilograms, etc."
            checked={currentLanguage !== 'en'}
          />
          
          <Checkbox
            label="Show currency conversion rates"
            description="Display exchange rates in financial reports"
            checked
          />
          
          <Checkbox
            label="Auto-detect user timezone"
            description="Automatically adjust times based on user location"
            checked
          />
        </div>
      </div>
    </div>
  );
};

export default LocalizationSection;