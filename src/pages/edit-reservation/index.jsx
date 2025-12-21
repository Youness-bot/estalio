import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NewReservationModal from '../reservations/components/NewReservationModal';
import { reservationService } from '../../services/reservationService';

const ReservationEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadReservation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex?.test(id)) {
          throw new Error('Invalid reservation ID format');
        }

        const data = await reservationService?.getById(id);
        setReservation(data);
      } catch (err) {
        console.error('Error loading reservation:', err);
        setError(err?.message || 'Failed to load reservation');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadReservation();
    }
  }, [id]);

  const handleSave = async (updates) => {
    try {
      await reservationService?.update(id, updates);
      navigate('/reservations');
    } catch (err) {
      console.error('Error updating reservation:', err);
      throw err; // Let modal handle the error display
    }
  };

  const handleClose = () => {
    navigate('/reservations');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading reservation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Error Loading Reservation</h2>
          </div>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Reservations
          </button>
        </div>
      </div>
    );
  }

  // Success - show edit modal
  if (!reservation) return null;

  return (
    <NewReservationModal
      isOpen={true}
      onClose={handleClose}
      onSave={handleSave}
      initialData={reservation}
      isEditMode={true}
    />
  );
};

export default ReservationEditPage;