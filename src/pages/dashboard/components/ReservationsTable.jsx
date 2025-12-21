import React, { useState, useEffect } from 'react';

import Button from '../../../components/ui/Button';

const ReservationsTable = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentCurrency, setCurrentCurrency] = useState('USD');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedCurrency = localStorage.getItem('currency') || 'USD';
    setCurrentLanguage(savedLanguage);
    setCurrentCurrency(savedCurrency);
  }, []);

  const reservations = [
  {
    id: 'RES-001',
    client: 'Sarah Johnson',
    avatar: "https://images.unsplash.com/photo-1684262855358-88f296a2cfc2",
    avatarAlt: 'Professional headshot of blonde woman in white blazer smiling at camera',
    checkIn: '2024-11-12',
    checkOut: '2024-11-15',
    nights: 3,
    channel: 'Airbnb',
    channelColor: 'bg-red-500',
    gross: {
      USD: 450,
      EUR: 405,
      MAD: 4500
    },
    net: {
      USD: 382.5,
      EUR: 344.25,
      MAD: 3825
    },
    status: 'confirmed',
    property: 'Ocean Villa'
  },
  {
    id: 'RES-002',
    client: 'Marco Rossi',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_154fbd838-1762273761814.png",
    avatarAlt: 'Professional headshot of dark-haired man in navy suit with confident smile',
    checkIn: '2024-11-14',
    checkOut: '2024-11-18',
    nights: 4,
    channel: 'Booking.com',
    channelColor: 'bg-blue-600',
    gross: {
      USD: 680,
      EUR: 612,
      MAD: 6800
    },
    net: {
      USD: 612,
      EUR: 550.8,
      MAD: 6120
    },
    status: 'confirmed',
    property: 'Royal Suite'
  },
  {
    id: 'RES-003',
    client: 'Emma Thompson',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1bfbdabdc-1762273361000.png",
    avatarAlt: 'Professional headshot of brunette woman in black blazer with warm smile',
    checkIn: '2024-11-16',
    checkOut: '2024-11-20',
    nights: 4,
    channel: 'Direct',
    channelColor: 'bg-green-600',
    gross: {
      USD: 520,
      EUR: 468,
      MAD: 5200
    },
    net: {
      USD: 520,
      EUR: 468,
      MAD: 5200
    },
    status: 'pending',
    property: 'Apartment 3B'
  },
  {
    id: 'RES-004',
    client: 'Ahmed Al-Rashid',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_162d317fb-1762274080739.png",
    avatarAlt: 'Professional headshot of Middle Eastern man in gray suit with friendly expression',
    checkIn: '2024-11-18',
    checkOut: '2024-11-22',
    nights: 4,
    channel: 'Airbnb',
    channelColor: 'bg-red-500',
    gross: {
      USD: 720,
      EUR: 648,
      MAD: 7200
    },
    net: {
      USD: 612,
      EUR: 550.8,
      MAD: 6120
    },
    status: 'confirmed',
    property: 'Studio 2A'
  },
  {
    id: 'RES-005',
    client: 'Sophie Martin',
    avatar: "https://images.unsplash.com/photo-1550985244-af33a8d1a9ef",
    avatarAlt: 'Professional headshot of blonde woman in light blue shirt with gentle smile',
    checkIn: '2024-11-20',
    checkOut: '2024-11-25',
    nights: 5,
    channel: 'Booking.com',
    channelColor: 'bg-blue-600',
    gross: {
      USD: 875,
      EUR: 787.5,
      MAD: 8750
    },
    net: {
      USD: 787.5,
      EUR: 708.75,
      MAD: 7875
    },
    status: 'confirmed',
    property: 'Ocean Villa'
  }];


  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'EUR':return '€';
      case 'MAD':return 'د.م.';
      default:return '$';
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      month: 'short',
      day: 'numeric',
      year: currentLanguage === 'ar' ? 'numeric' : undefined
    };

    return date?.toLocaleDateString(
      currentLanguage === 'fr' ? 'fr-FR' :
      currentLanguage === 'ar' ? 'ar-SA' : 'en-US',
      options
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':return 'bg-success text-success-foreground';
      case 'pending':return 'bg-warning text-warning-foreground';
      case 'cancelled':return 'bg-error text-error-foreground';
      default:return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status) => {
    if (currentLanguage === 'fr') {
      switch (status) {
        case 'confirmed':return 'Confirmé';
        case 'pending':return 'En attente';
        case 'cancelled':return 'Annulé';
        default:return status;
      }
    }
    if (currentLanguage === 'ar') {
      switch (status) {
        case 'confirmed':return 'مؤكد';
        case 'pending':return 'في الانتظار';
        case 'cancelled':return 'ملغي';
        default:return status;
      }
    }
    return status?.charAt(0)?.toUpperCase() + status?.slice(1);
  };

  const getTitle = () => {
    if (currentLanguage === 'fr') return 'Réservations Récentes';
    if (currentLanguage === 'ar') return 'الحجوزات الأخيرة';
    return 'Recent Reservations';
  };

  const getHeaders = () => {
    if (currentLanguage === 'fr') {
      return ['Client', 'Dates', 'Canal', 'Brut', 'Net', 'Actions'];
    }
    if (currentLanguage === 'ar') {
      return ['العميل', 'التواريخ', 'القناة', 'إجمالي', 'صافي', 'الإجراءات'];
    }
    return ['Client', 'Dates', 'Channel', 'Gross', 'Net', 'Actions'];
  };

  const headers = getHeaders();

  return (
    <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{getTitle()}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '#/reservations'}>

            {currentLanguage === 'fr' ? 'Voir tout' : currentLanguage === 'ar' ? 'عرض الكل' : 'View All'}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted bg-opacity-50">
            <tr>
              {headers?.map((header, index) =>
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {header}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reservations?.map((reservation) =>
            <tr key={reservation?.id} className="hover:bg-muted hover:bg-opacity-30 transition-smooth">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                      <img
                      src={reservation?.avatar}
                      alt={reservation?.avatarAlt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/assets/images/no_image.png';
                      }} />

                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{reservation?.client}</p>
                      <p className="text-xs text-muted-foreground">{reservation?.property}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">
                    <p>{formatDate(reservation?.checkIn)} - {formatDate(reservation?.checkOut)}</p>
                    <p className="text-xs text-muted-foreground">
                      {reservation?.nights} {currentLanguage === 'fr' ? 'nuits' : currentLanguage === 'ar' ? 'ليالي' : 'nights'}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${reservation?.channelColor}`}>
                    {reservation?.channel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  {formatCurrency(reservation?.gross?.[currentCurrency], currentCurrency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success">
                  {formatCurrency(reservation?.net?.[currentCurrency], currentCurrency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation?.status)}`}>
                      {getStatusText(reservation?.status)}
                    </span>
                    <Button
                    variant="ghost"
                    size="sm"
                    iconName="Eye"
                    onClick={() => window.location.href = '#/reservation-details'}>

                      {currentLanguage === 'fr' ? 'Voir' : currentLanguage === 'ar' ? 'عرض' : 'View'}
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>);

};

export default ReservationsTable;