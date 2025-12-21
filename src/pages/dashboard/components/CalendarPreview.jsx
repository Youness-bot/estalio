import React, { useState, useEffect } from 'react';

import Button from '../../../components/ui/Button';

const CalendarPreview = ({ onNewReservation }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  const today = new Date();
  const currentMonth = today?.getMonth();
  const currentYear = today?.getFullYear();
  
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0)?.getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1)?.getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  
  const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  };

  const dayNames = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    ar: ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
  };

  const reservedDates = [5, 12, 18, 25, 28];
  const checkInDates = [8, 15, 22];
  const checkOutDates = [10, 17, 24];

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days?.push(<div key={`empty-${i}`} className="h-8"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today?.getDate();
      const isReserved = reservedDates?.includes(day);
      const isCheckIn = checkInDates?.includes(day);
      const isCheckOut = checkOutDates?.includes(day);
      
      let dayClass = "h-8 w-8 flex items-center justify-center text-sm rounded cursor-pointer hover:bg-muted transition-smooth";
      
      if (isToday) {
        dayClass += " bg-primary text-primary-foreground font-semibold";
      } else if (isReserved) {
        dayClass += " bg-success bg-opacity-20 text-success font-medium";
      } else if (isCheckIn) {
        dayClass += " bg-warning bg-opacity-20 text-warning font-medium";
      } else if (isCheckOut) {
        dayClass += " bg-error bg-opacity-20 text-error font-medium";
      } else {
        dayClass += " text-foreground hover:text-primary";
      }
      
      days?.push(
        <div key={day} className={dayClass}>
          {day}
        </div>
      );
    }
    
    return days;
  };

  const getTitle = () => {
    if (currentLanguage === 'fr') return 'Calendrier';
    if (currentLanguage === 'ar') return 'التقويم';
    return 'Calendar';
  };

  const getOpenText = () => {
    if (currentLanguage === 'fr') return 'Ouvrir';
    if (currentLanguage === 'ar') return 'فتح';
    return 'Open';
  };

  const getNewReservationText = () => {
    if (currentLanguage === 'fr') return '+ Nouvelle réservation';
    if (currentLanguage === 'ar') return '+ حجز جديد';
    return '+ New reservation';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{getTitle()}</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '#/reservations'}
          >
            {getOpenText()}
          </Button>
          <Button
            variant="default"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={onNewReservation}
          >
            {getNewReservationText()}
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="text-base font-medium text-foreground">
            {monthNames?.[currentLanguage]?.[currentMonth]} {currentYear}
          </h4>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {dayNames?.[currentLanguage]?.map((day, index) => (
            <div key={index} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {renderCalendarDays()}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-success bg-opacity-20 rounded"></div>
              <span className="text-muted-foreground">
                {currentLanguage === 'fr' ? 'Occupé' : currentLanguage === 'ar' ? 'محجوز' : 'Occupied'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-warning bg-opacity-20 rounded"></div>
              <span className="text-muted-foreground">
                {currentLanguage === 'fr' ? 'Arrivée' : currentLanguage === 'ar' ? 'وصول' : 'Check-in'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-error bg-opacity-20 rounded"></div>
              <span className="text-muted-foreground">
                {currentLanguage === 'fr' ? 'Départ' : currentLanguage === 'ar' ? 'مغادرة' : 'Check-out'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPreview;