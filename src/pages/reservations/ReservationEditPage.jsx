import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import NewReservationModal from './components/NewReservationModal';
import { reservationService } from '../../services/reservationService';

/**
 * 🔥 Corrige les dates ISO pour input type="date"
 * "2026-01-01T00:00:00.000Z" → "2026-01-01"
 */
function toDateInputValue(isoString) {
  if (!isoString) return "";
  return isoString.split("T")[0];
}

const ReservationEditPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

  const isDuplicate = mode === "duplicate";

  const [reservation, setReservation] = useState(null);
  const [open, setOpen] = useState(true);

  // ⭐ Ajout demandé : navigate
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const data = await reservationService?.getById(id);
      setReservation(data);
    };
    load();
  }, [id]);

  const handleSave = async (updates) => {
    try {
      if (isDuplicate) {
        await reservationService?.create(updates);
        alert('Reservation duplicated successfully.');
      } else {
        await reservationService?.update(id, updates);
        alert('Reservation updated successfully.');
      }

      // ⭐ Remplacement exact demandé : navigate au lieu de setOpen(false)
      navigate('/reservations');

    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('An error occurred while saving the reservation.');
    }
  };

  if (!reservation) return null;

  // -----------------------------------------
  // INITIAL DATA HANDLING
  // -----------------------------------------
  let initialData;

  if (isDuplicate) {
    // 🔥 DUPLICATE: keep client info ONLY
    initialData = {
      guestName: reservation?.guestName || "",
      guestEmail: reservation?.guestEmail || "",
      guestPhone: reservation?.guestPhone || "",
      adults: reservation?.adults || 1,
      children: reservation?.children || 0,
      notes: reservation?.notes || "",

      // 🔥 RESET booking information
      checkInDate: "",
      checkOutDate: "",
      propertyId: "",
      bookingChannel: "",
      grossAmount: "",
    };
  } else {
    // 🔥 EDIT MODE (FULL DATA)
    initialData = {
      ...reservation,
      id: reservation.id,

      // 🔥 FIX: Convert ISO → yyyy-MM-dd for date inputs
      checkInDate: toDateInputValue(reservation.checkInDate),
      checkOutDate: toDateInputValue(reservation.checkOutDate),
    };
  }

  return (
    <NewReservationModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onSave={handleSave}
      initialData={initialData}
      isEditMode={!isDuplicate}
    />
  );
};

export default ReservationEditPage;
