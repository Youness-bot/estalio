import { supabase } from '../../../src/lib/supabase';
import { auditService } from '../../../src/services/auditService';

/**
 * POST /api/reservations/deleteReservation
 */
export default async function handler(req, res) {
  if (req?.method !== 'POST') {
    return res?.status(405)?.json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const { reservationId, userId } = req?.body || {};

    if (!reservationId) {
      return res?.status(400)?.json({ ok: false, error: 'Missing required field: reservationId' });
    }

    if (!userId) {
      return res?.status(400)?.json({ ok: false, error: 'Missing required field: userId' });
    }

    // Load reservation
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, booking_channel, reservation_code, property_id, guest_name')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return res?.status(404)?.json({ ok: false, error: 'Reservation not found' });
    }

    // Only direct bookings can be deleted
    if (reservation?.booking_channel !== 'direct') {
      return res?.status(403)?.json({
        ok: false,
        error: `Cannot delete reservation from ${reservation?.booking_channel}. Only direct bookings can be deleted.`
      });
    }

    // Delete reservation
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId);

    if (deleteError) {
      console.error('Deletion error:', deleteError);
      return res?.status(500)?.json({
        ok: false,
        error: 'Failed to delete reservation'
      });
    }

    // Audit log (non-blocking)
    try {
      await auditService.logEvent({
        action: 'DELETE_RESERVATION',
        entityType: 'reservation',
        entityId: reservation.id,
        entityName: `Reservation ${reservation?.reservation_code || reservation?.id}`,
        details: JSON.stringify({
          booking_channel: reservation?.booking_channel,
          deleted_by: userId,
          guest_name: reservation?.guest_name,
          property_id: reservation?.property_id
        }),
        severity: 'high',
        metadata: {
          booking_channel: reservation?.booking_channel,
          deleted_by: userId,
          reservation_id: reservation?.id
        },
        success: true
      });
    } catch (err) {
      console.warn("Audit log failed:", err.message);
    }

    return res?.status(200)?.json({ ok: true, deletedId: reservationId });
  } catch (error) {
    console.error('Deletion error:', error);
    return res?.status(500)?.json({
      ok: false,
      error: error?.message || 'Unexpected server error'
    });
  }
}
