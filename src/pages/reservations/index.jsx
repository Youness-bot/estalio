import React, { useState, useEffect } from 'react';
import { reservationService } from '../../services/reservationService';
import { auditService } from '../../services/auditService';

import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import CalendarPreview from './components/CalendarPreview';
import { useNavigate } from 'react-router-dom';
import ReservationFilters from './components/ReservationFilters';
import ReservationTable from './components/ReservationTable';
import NewReservationModal from './components/NewReservationModal';

const ReservationsPage = () => {
  const navigate = useNavigate();
  const [currentCurrency, setCurrentCurrency] = useState('MAD');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    channel: 'all',
    status: 'all',
    property: 'all',
    dateFrom: '',
  });

  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);

  // ⭐ PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ⭐ KPI
  const [statistics, setStatistics] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    thisMonth: 0
  });

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') || 'MAD';
    setCurrentCurrency(savedCurrency);
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const reservationsData = await reservationService?.getAll();

      setReservations(reservationsData);
      setFilteredReservations(reservationsData);

    } catch (err) {
      setError(err?.message);
      console.error('Error loading reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReservation = async (reservationId) => {
    // ⭐ AUDIT LOG
    await auditService?.logEvent({
      action: 'reservation_viewed',
      entityType: 'reservation',
      entityId: reservationId,
      details: 'User opened the reservation details page',
      severity: 'low',
      success: true
    });

    navigate(`/reservations/${reservationId}`);
  };

  const handleNewReservation = async (reservationData) => {
  try {
    const newReservation = await reservationService?.create(reservationData);
    
await loadReservations(); // Recharge toutes les données correctement

    // ⭐ AUDIT LOG – Succès création
    await auditService?.logEvent({
      action: 'create_reservation',
      entityType: 'reservation',
      entityId: newReservation?.id,
      entityName: newReservation?.guestName,
      details: 'Reservation created successfully'
    });

    setShowNewReservationModal(false);

  } catch (err) {
    console.error('Error creating reservation:', err);
    setError('Failed to create reservation');

    // ⭐ AUDIT LOG – Échec
    await auditService?.logEvent({
      action: 'create_reservation',
      entityType: 'reservation',
      details: 'Reservation creation failed',
      success: false,
      severity: 'high'
    });
  }
};
  const handleUpdateReservation = async (reservationId, updates) => {
  try {
    const updatedReservation = await reservationService?.update(reservationId, updates);

    const updateInArray = arr =>
      arr?.map(r => r?.id === reservationId ? updatedReservation : r);

    setReservations(updateInArray);
    setFilteredReservations(updateInArray);

    // ⭐ AUDIT LOG
    await auditService?.logEvent({
      action: 'reservation_updated',
      entityType: 'reservation',
      entityId: reservationId,
      entityName: updatedReservation?.guestName || 'Unknown guest',
      details: `Reservation updated with fields: ${Object.keys(updates)?.join(', ')}`,
      severity: 'medium',
      metadata: updates,
      success: true
    });

  } catch (err) {
    console.error('Error updating reservation:', err);
    setError('Failed to update reservation');

    // ⭐ AUDIT LOG (échec)
    await auditService?.logEvent({
      action: 'reservation_update_failed',
      entityType: 'reservation',
      entityId: reservationId,
      details: err?.message || 'Unknown error',
      severity: 'high',
      success: false
    });
  }
};

  // -------------------------------------------------------------
  // ⭐ FIX DÉFINITIF : MATCH EXACT DE DATE (sans l'heure)
  // -------------------------------------------------------------
  const matchesExactDate = (r, isoDate) => {
    if (!isoDate) return true;
    const d1 = new Date(r.checkInDate)?.toDateString();
    const d2 = new Date(isoDate)?.toDateString();
    return d1 === d2;
  };

  // -------------------------------------------------------------
  // ⭐ APPLICATION DES FILTRES
  // -------------------------------------------------------------
  const applyFilters = (currentFilters) => {
    let filtered = [...reservations];

    const matchesSearch = (r, term) =>
      !term ||
      r?.guestName?.toLowerCase()?.includes(term?.toLowerCase()) ||
      r?.clientName?.toLowerCase()?.includes(term?.toLowerCase()) ||
      r?.id?.toLowerCase()?.includes(term?.toLowerCase()) ||
      r?.reservationCode?.toLowerCase()?.includes(term?.toLowerCase());

    const matchesChannel = (r, c) =>
      c === 'all' ||
      r?.bookingChannel?.toLowerCase() === c?.toLowerCase();

    const matchesStatus = (r, s) =>
      s === 'all' ||
      r?.status?.toLowerCase() === s?.toLowerCase();

    const matchesProperty = (r, p) =>
      p === 'all' ||
      r?.propertyCode?.toLowerCase()?.includes(p?.toLowerCase()) ||
      r?.propertyName?.toLowerCase()?.includes(p?.toLowerCase());

    filtered = filtered?.filter(r =>
      matchesSearch(r, currentFilters?.search) &&
      matchesChannel(r, currentFilters?.channel) &&
      matchesStatus(r, currentFilters?.status) &&
      matchesProperty(r, currentFilters?.property) &&
      matchesExactDate(r, currentFilters?.dateFrom)
    );

    setFilteredReservations(filtered);
    setCurrentPage(1);
  };

  const handleFiltersChange = newFilters => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // ⭐ Synchronisation du calendrier → filtres (FIXE le décalage)
const handleCalendarDateSelect = (date) => {
  setSelectedDate(date);

  // Construction d'une date locale SANS toISOString() (évite le décalage d'un jour)
  const year = date?.getFullYear();
  const month = String(date?.getMonth() + 1)?.padStart(2, "0");
  const day = String(date?.getDate())?.padStart(2, "0");

  const iso = `${year}-${month}-${day}`;

  const newFilters = {
    ...filters,
    dateFrom: iso,
    dateTo: iso
  };

  setFilters(newFilters);
  applyFilters(newFilters);
};

  // CSV Export Handler
  const handleExport = () => {
    // CSV Headers
    const headers = [
      'ID',
      'Guest Name',
      'Guest Email',
      'Guest Phone',
      'Check-In Date',
      'Check-Out Date',
      'Adults',
      'Children',
      'Total Guests',
      'Nights',
      'Property Name',
      'Property Code',
      'Booking Channel',
      'Status',
      'Gross Amount',
      'Net Amount',
      'Currency'
    ];

    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue?.includes(',') || stringValue?.includes('"') || stringValue?.includes('\n')) {
        return `"${stringValue?.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Build CSV rows
    const rows = filteredReservations?.map(reservation => [
      escapeCSV(reservation?.id || ''),
      escapeCSV(reservation?.guestName || ''),
      escapeCSV(reservation?.guestEmail || ''),
      escapeCSV(reservation?.guestPhone || ''),
      escapeCSV(reservation?.checkInDate || ''),
      escapeCSV(reservation?.checkOutDate || ''),
      escapeCSV(reservation?.adults || ''),
      escapeCSV(reservation?.children || ''),
      escapeCSV(reservation?.totalGuests || ''),
      escapeCSV(reservation?.nights || ''),
      escapeCSV(reservation?.propertyName || ''),
      escapeCSV(reservation?.propertyCode || ''),
      escapeCSV(reservation?.bookingChannel || ''),
      escapeCSV(reservation?.status || ''),
      escapeCSV(reservation?.grossAmount || ''),
      escapeCSV(reservation?.netAmount || ''),
      escapeCSV(reservation?.currency || currentCurrency)
    ]);

    // Combine headers and rows
    const csvContent = [
      headers?.join(','),
      ...rows?.map(row => row?.join(','))
    ]?.join('\n');

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link?.setAttribute('href', url);
    link?.setAttribute('download', 'reservations_export.csv');
    link.style.visibility = 'hidden';
    
    document.body?.appendChild(link);
    link?.click();
    document.body?.removeChild(link);
  };

  // -------------------------------------------------------------
  // ⭐ KPI recalcul dynamique
  // -------------------------------------------------------------
  useEffect(() => {
    const now = new Date();
    const m = now?.getMonth();
    const y = now?.getFullYear();

    const newStats = {
      total: filteredReservations?.length,
      confirmed: filteredReservations?.filter(r => r?.status?.toLowerCase() === 'confirmed')?.length,
      pending: filteredReservations?.filter(r => r?.status?.toLowerCase() === 'pending')?.length,
      cancelled: filteredReservations?.filter(r => r?.status?.toLowerCase() === 'cancelled')?.length,
      thisMonth: filteredReservations?.filter(r => {
        const d = new Date(r?.checkInDate);
        return d?.getMonth() === m && d?.getFullYear() === y;
      })?.length
    };

    setStatistics(newStats);
  }, [filteredReservations]);

  // ⭐ PAGINATION
  const totalPages = Math.ceil(filteredReservations?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReservations = filteredReservations?.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span>{error}</span>
          <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError('')}>
            ✕
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Reservations</h1>
          <p className="text-muted-foreground">
            Manage bookings, track availability, and handle guest communications
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" iconName="Download" iconPosition="left" onClick={handleExport}>Export</Button>
          <Button variant="default" onClick={() => setShowNewReservationModal(true)} iconName="Plus" iconPosition="left">
            New Reservation
          </Button>
        </div>
      </div>
      {/* Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        <div className="xl:col-span-3 space-y-6">
          
          <ReservationFilters filters={filters} onFiltersChange={handleFiltersChange} />

          {/* ⭐ KPI */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reservations</p>
                  <p className="text-2xl font-semibold text-foreground">{statistics?.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="CalendarDays" size={22} color="#2563EB" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-semibold text-green-600">{statistics?.confirmed}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon name="CircleCheck" size={22} color="#16A34A" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-semibold text-orange-500">{statistics?.pending}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Icon name="Hourglass" size={22} color="#EA580C" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-semibold text-red-600">{statistics?.cancelled}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Icon name="CircleX" size={22} color="#DC2626" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-semibold text-foreground">{statistics?.thisMonth}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Icon name="BarChart3" size={22} color="#7C3AED" />
                </div>
              </div>
            </div>

          </div>

          {/* TABLE */}
          <ReservationTable
            reservations={paginatedReservations}
            currentCurrency={currentCurrency}
            onViewReservation={handleViewReservation}
            onUpdateReservation={handleUpdateReservation}
          />

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>

              {[...Array(totalPages)]?.map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>

            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1">
          <CalendarPreview
            selectedDate={selectedDate}
            onDateSelect={handleCalendarDateSelect}
            reservations={reservations}
          />
        </div>
      </div>
      <NewReservationModal
        isOpen={showNewReservationModal}
        onClose={() => setShowNewReservationModal(false)}
        onSave={handleNewReservation}
      />
    </div>
  );
};

export default ReservationsPage;