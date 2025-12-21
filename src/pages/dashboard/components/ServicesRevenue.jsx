import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const ServicesRevenue = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentCurrency, setCurrentCurrency] = useState('USD');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedCurrency = localStorage.getItem('currency') || 'USD';
    setCurrentLanguage(savedLanguage);
    setCurrentCurrency(savedCurrency);
  }, []);

  const services = [
    {
      id: 1,
      name: {
        en: 'Airport Transfer',
        fr: 'Transfert Aéroport',
        ar: 'نقل المطار'
      },
      icon: 'Car',
      revenue: {
        USD: 2850,
        EUR: 2565,
        MAD: 28500
      },
      bookings: 15,
      avgPrice: {
        USD: 190,
        EUR: 171,
        MAD: 1900
      },
      growth: '+12%',
      growthType: 'positive'
    },
    {
      id: 2,
      name: {
        en: 'Luggage Keeping',
        fr: 'Garde Bagages',
        ar: 'حفظ الأمتعة'
      },
      icon: 'Package',
      revenue: {
        USD: 1240,
        EUR: 1116,
        MAD: 12400
      },
      bookings: 31,
      avgPrice: {
        USD: 40,
        EUR: 36,
        MAD: 400
      },
      growth: '+8%',
      growthType: 'positive'
    },
    {
      id: 3,
      name: {
        en: 'Concierge Services',
        fr: 'Services Conciergerie',
        ar: 'خدمات الكونسيرج'
      },
      icon: 'Bell',
      revenue: {
        USD: 980,
        EUR: 882,
        MAD: 9800
      },
      bookings: 8,
      avgPrice: {
        USD: 122.5,
        EUR: 110.25,
        MAD: 1225
      },
      growth: '+5%',
      growthType: 'positive'
    },
    {
      id: 4,
      name: {
        en: 'Cleaning Services',
        fr: 'Services de Nettoyage',
        ar: 'خدمات التنظيف'
      },
      icon: 'Sparkles',
      revenue: {
        USD: 1560,
        EUR: 1404,
        MAD: 15600
      },
      bookings: 24,
      avgPrice: {
        USD: 65,
        EUR: 58.5,
        MAD: 650
      },
      growth: '-3%',
      growthType: 'negative'
    }
  ];

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'MAD': return 'د.م.';
      default: return '$';
    }
  };

  const formatCurrency = (amount, currency) => {
    const symbol = getCurrencySymbol(currency);
    const formattedAmount = amount?.toLocaleString();
    
    if (currency === 'MAD') {
      return `${formattedAmount} ${symbol}`;
    }
    return `${symbol}${formattedAmount}`;
  };

  const getTitle = () => {
    if (currentLanguage === 'fr') return 'Revenus des Services';
    if (currentLanguage === 'ar') return 'إيرادات الخدمات';
    return 'Services Revenue';
  };

  const getBookingsText = () => {
    if (currentLanguage === 'fr') return 'réservations';
    if (currentLanguage === 'ar') return 'حجوزات';
    return 'bookings';
  };

  const getAvgText = () => {
    if (currentLanguage === 'fr') return 'Moy.';
    if (currentLanguage === 'ar') return 'متوسط';
    return 'Avg.';
  };

  const totalRevenue = services?.reduce((sum, service) => sum + service?.revenue?.[currentCurrency], 0);

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">{getTitle()}</h3>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(totalRevenue, currentCurrency)}
          </p>
        </div>
        <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
          <Icon name="DollarSign" size={24} color="var(--color-primary)" />
        </div>
      </div>
      <div className="space-y-4">
        {services?.map((service) => (
          <div key={service?.id} className="flex items-center justify-between p-4 bg-muted bg-opacity-30 rounded-lg hover:bg-muted hover:bg-opacity-50 transition-smooth">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center border border-border">
                <Icon name={service?.icon} size={18} color="var(--color-foreground)" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  {service?.name?.[currentLanguage]}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {service?.bookings} {getBookingsText()} • {getAvgText()} {formatCurrency(service?.avgPrice?.[currentCurrency], currentCurrency)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(service?.revenue?.[currentCurrency], currentCurrency)}
              </p>
              <div className="flex items-center space-x-1">
                <Icon 
                  name={service?.growthType === 'positive' ? 'TrendingUp' : 'TrendingDown'} 
                  size={12} 
                  color={service?.growthType === 'positive' ? 'var(--color-success)' : 'var(--color-error)'} 
                />
                <span className={`text-xs font-medium ${
                  service?.growthType === 'positive' ? 'text-success' : 'text-error'
                }`}>
                  {service?.growth}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <button
          onClick={() => window.location.href = '#/revenues-and-reports'}
          className="w-full text-sm text-primary hover:text-primary-foreground hover:bg-primary py-2 px-4 rounded-md transition-smooth text-center"
        >
          {currentLanguage === 'fr' ? 'Voir le rapport détaillé' : currentLanguage === 'ar' ? 'عرض التقرير المفصل' : 'View Detailed Report'}
        </button>
      </div>
    </div>
  );
};

export default ServicesRevenue;