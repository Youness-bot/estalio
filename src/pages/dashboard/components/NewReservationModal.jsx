import React, { useState, useEffect } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const NewReservationModal = ({ isOpen, onClose }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [formData, setFormData] = useState({
    adults: 2,
    children: 0,
    checkIn: '',
    checkOut: '',
    channel: '',
    property: '',
    clientName: '',
    clientEmail: '',
    clientPhone: ''
  });

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  const channelOptions = [
    { value: 'direct', label: currentLanguage === 'fr' ? 'Direct' : currentLanguage === 'ar' ? 'مباشر' : 'Direct' },
    { value: 'airbnb', label: 'Airbnb' },
    { value: 'booking', label: 'Booking.com' },
    { value: 'expedia', label: 'Expedia' },
    { value: 'vrbo', label: 'VRBO' }
  ];

  const propertyOptions = [
    { value: 'ocean-villa', label: currentLanguage === 'fr' ? 'Villa Océan' : currentLanguage === 'ar' ? 'فيلا المحيط' : 'Ocean Villa' },
    { value: 'royal-suite', label: currentLanguage === 'fr' ? 'Suite Royale' : currentLanguage === 'ar' ? 'الجناح الملكي' : 'Royal Suite' },
    { value: 'apartment-3b', label: currentLanguage === 'fr' ? 'Appartement 3B' : currentLanguage === 'ar' ? 'شقة 3ب' : 'Apartment 3B' },
    { value: 'studio-2a', label: currentLanguage === 'fr' ? 'Studio 2A' : currentLanguage === 'ar' ? 'استوديو 2أ' : 'Studio 2A' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    // Mock submission
    console.log('New reservation:', formData);
    onClose();
    // Reset form
    setFormData({
      adults: 2,
      children: 0,
      checkIn: '',
      checkOut: '',
      channel: '',
      property: '',
      clientName: '',
      clientEmail: '',
      clientPhone: ''
    });
  };

  const getTitle = () => {
    if (currentLanguage === 'fr') return 'Nouvelle Réservation';
    if (currentLanguage === 'ar') return 'حجز جديد';
    return 'New Reservation';
  };

  const getLabels = () => {
    if (currentLanguage === 'fr') {
      return {
        clientName: 'Nom du client',
        clientEmail: 'Email du client',
        clientPhone: 'Téléphone du client',
        property: 'Propriété',
        checkIn: "Date d'arrivée",
        checkOut: 'Date de départ',
        adults: 'Adultes',
        children: 'Enfants',
        channel: 'Canal de réservation',
        totalPersons: 'Total personnes',
        cancel: 'Annuler',
        create: 'Créer la réservation'
      };
    }
    if (currentLanguage === 'ar') {
      return {
        clientName: 'اسم العميل',
        clientEmail: 'بريد العميل الإلكتروني',
        clientPhone: 'هاتف العميل',
        property: 'العقار',
        checkIn: 'تاريخ الوصول',
        checkOut: 'تاريخ المغادرة',
        adults: 'البالغون',
        children: 'الأطفال',
        channel: 'قناة الحجز',
        totalPersons: 'إجمالي الأشخاص',
        cancel: 'إلغاء',
        create: 'إنشاء الحجز'
      };
    }
    return {
      clientName: 'Client Name',
      clientEmail: 'Client Email',
      clientPhone: 'Client Phone',
      property: 'Property',
      checkIn: 'Check-in Date',
      checkOut: 'Check-out Date',
      adults: 'Adults',
      children: 'Children',
      channel: 'Booking Channel',
      totalPersons: 'Total Persons',
      cancel: 'Cancel',
      create: 'Create Reservation'
    };
  };

  const labels = getLabels();
  const totalPersons = formData?.adults + formData?.children;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{getTitle()}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
          />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">
              {currentLanguage === 'fr' ? 'Informations Client' : currentLanguage === 'ar' ? 'معلومات العميل' : 'Client Information'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={labels?.clientName}
                type="text"
                value={formData?.clientName}
                onChange={(e) => handleInputChange('clientName', e?.target?.value)}
                placeholder={currentLanguage === 'fr' ? 'Entrez le nom' : currentLanguage === 'ar' ? 'أدخل الاسم' : 'Enter name'}
                required
              />
              
              <Input
                label={labels?.clientEmail}
                type="email"
                value={formData?.clientEmail}
                onChange={(e) => handleInputChange('clientEmail', e?.target?.value)}
                placeholder={currentLanguage === 'fr' ? 'Entrez l\'email' : currentLanguage === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                required
              />
            </div>

            <Input
              label={labels?.clientPhone}
              type="tel"
              value={formData?.clientPhone}
              onChange={(e) => handleInputChange('clientPhone', e?.target?.value)}
              placeholder={currentLanguage === 'fr' ? 'Entrez le téléphone' : currentLanguage === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
            />
          </div>

          {/* Reservation Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">
              {currentLanguage === 'fr' ? 'Détails de la Réservation' : currentLanguage === 'ar' ? 'تفاصيل الحجز' : 'Reservation Details'}
            </h3>

            <Select
              label={labels?.property}
              options={propertyOptions}
              value={formData?.property}
              onChange={(value) => handleInputChange('property', value)}
              placeholder={currentLanguage === 'fr' ? 'Sélectionnez une propriété' : currentLanguage === 'ar' ? 'اختر عقار' : 'Select a property'}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={labels?.checkIn}
                type="date"
                value={formData?.checkIn}
                onChange={(e) => handleInputChange('checkIn', e?.target?.value)}
                required
              />
              
              <Input
                label={labels?.checkOut}
                type="date"
                value={formData?.checkOut}
                onChange={(e) => handleInputChange('checkOut', e?.target?.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label={labels?.adults}
                type="number"
                min="1"
                max="10"
                value={formData?.adults}
                onChange={(e) => handleInputChange('adults', parseInt(e?.target?.value) || 0)}
                required
              />
              
              <Input
                label={labels?.children}
                type="number"
                min="0"
                max="10"
                value={formData?.children}
                onChange={(e) => handleInputChange('children', parseInt(e?.target?.value) || 0)}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{labels?.totalPersons}</label>
                <div className="h-10 px-3 py-2 bg-muted border border-border rounded-md flex items-center">
                  <span className="text-sm text-foreground font-medium">{totalPersons}</span>
                </div>
              </div>
            </div>

            <Select
              label={labels?.channel}
              options={channelOptions}
              value={formData?.channel}
              onChange={(value) => handleInputChange('channel', value)}
              placeholder={currentLanguage === 'fr' ? 'Sélectionnez un canal' : currentLanguage === 'ar' ? 'اختر قناة' : 'Select a channel'}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              {labels?.cancel}
            </Button>
            <Button
              type="submit"
              variant="default"
              iconName="Plus"
              iconPosition="left"
            >
              {labels?.create}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewReservationModal;