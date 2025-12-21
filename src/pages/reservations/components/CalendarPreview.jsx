import React, { useState, useMemo } from 'react';
import Button from '../../../components/ui/Button';

const CalendarPreview = ({ onDateSelect, selectedDate, reservations = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ------------------------------------------------------------
  // 🔥 1) EXTRACTION DES CHECK-IN UNIQUEMENT (hors cancelled)
  //     + PARSING "LOCAL" POUR ÉVITER LE décalage de 1 jour
  // ------------------------------------------------------------
  const checkIns = useMemo(() => {
    return reservations
      ?.filter(
        (r) =>
          r?.checkInDate &&
          r?.status?.toLowerCase() !== 'cancelled'
      )
      ?.map((r) => {
        const iso = String(r.checkInDate);
        const [yearStr, monthStr, dayStr] = iso.split('T')[0].split('-');

        const year = Number(yearStr);
        const month = Number(monthStr) - 1; 
        const day = Number(dayStr);

        return { day, month, year };
      });
  }, [reservations]);

  // ------------------------------------------------------------
  // 🔥 2) CHECK-IN UNIQUEMENT DU MOIS ACTUEL
  // ------------------------------------------------------------
  const filtered = useMemo(() => {
    return checkIns?.filter(
      (d) =>
        d.month === currentMonth.getMonth() &&
        d.year === currentMonth.getFullYear()
    );
  }, [checkIns, currentMonth]);

  // ------------------------------------------------------------
  // 🔥 3) DENSITÉ DES CHECK-IN
  // ------------------------------------------------------------
  const densityMap = useMemo(() => {
    return filtered?.reduce((acc, d) => {
      acc[d.day] = (acc[d.day] || 0) + 1;
      return acc;
    }, {});
  }, [filtered]);

  // ------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------
  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const formatMonthYear = (date) =>
    date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  // ------------------------------------------------------------
  // 🔥 4) COLORATION EXACTE DES CHECK-IN UNIQUEMENT
  // ------------------------------------------------------------
  const getCheckInColor = (day) => {
    const count = densityMap?.[day] || 0;

    if (count === 0) return '';
    if (count === 1) return 'bg-orange-300 text-white';
    if (count >= 2) return 'bg-orange-600 text-white';

    return '';
  };

  // ------------------------------------------------------------
  // 🔥 5) RENDU DU CALENDRIER
  // ------------------------------------------------------------
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();

      const selectedClass = isSelected ? 'ring-2 ring-primary' : '';
      const todayClass = isToday(day)
        ? 'bg-primary text-primary-foreground font-semibold'
        : '';

      const densityClass = getCheckInColor(day);

      days.push(
        <button
          key={day}
          onClick={() =>
            onDateSelect &&
            onDateSelect(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day
              )
            )
          }
          className={`
            h-8 w-8 text-sm rounded-md flex items-center justify-center
            transition-all duration-150 hover:bg-orange-50
            ${todayClass} ${selectedClass} ${densityClass}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Calendar</h3>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" iconName="ChevronLeft" onClick={() => navigateMonth(-1)} />
          <span className="text-sm font-medium min-w-[120px] text-center">
            {formatMonthYear(currentMonth)}
          </span>
          <Button variant="ghost" size="icon" iconName="ChevronRight" onClick={() => navigateMonth(1)} />
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {renderCalendarDays()}
      </div>

      {/* LEGEND */}
      <div className="space-y-2 text-xs text-muted-foreground mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary rounded"></div>
          <span>Today</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-300 rounded"></div>
          <span>Bookings (1 reservation)</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-600 rounded"></div>
          <span>High density (2+ reservations)</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarPreview;
