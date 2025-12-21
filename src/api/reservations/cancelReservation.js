import { supabase } from '../../lib/supabase';
import { cancelReservationCM } from '../../services/channelManager/cancelReservationCM.js';
import { postCancellationEngine } from '../../services/reservations/postCancellationEngine.js';
import { auditService } from '../../services/auditService.js';

/**
 * POST /api/reservations/cancelReservation
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { bookingId, source, channel, reason, userId } = req.body || {};

    // ---------------------------------------------
    // VALIDATION
    // ---------------------------------------------
    if (!bookingId) {
      return res.status(400).json({ ok: false, error: 'bookingId is required' });
    }

    if (!source || !['direct', 'channel'].includes(source)) {
      return res.status(400).json({
        ok: false,
        error: 'source must be either "direct" or "channel"'
      });
    }

    if (source === 'channel' && !channel) {
      return res.status(400).json({
        ok: false,
        error: 'Missing channel for channel cancellation'
      });
    }

    if (!userId) {
      return res.status(400).json({ ok: false, error: 'userId is required' });
    }

    // ---------------------------------------------
    // CALL CENTRAL CANCELLATION ENGINE
    // ---------------------------------------------
    const result = await cancelReservationCM(bookingId, {
      source,
      channel: channel || null,
      reason: reason || null,
      metadata: {
        cancelledBy: userId,
        cancelledAt: new Date().toISOString()
      }
    });

    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        error: result.error || 'Cancellation failed',
        bookingId
      });
    }

    // ---------------------------------------------
    // FETCH UPDATED RESERVATION (AFTER CANCELLATION)
    // ---------------------------------------------
    const { data: updatedReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      console.warn('Unable to fetch updated reservation after cancellation:', fetchError);
    }

    // ---------------------------------------------
    // POST-CANCELLATION ENGINE (NON-BLOCKING)
    // ---------------------------------------------
    if (updatedReservation) {
      try {
        await postCancellationEngine({
          id: updatedReservation.id,
          start_date: updatedReservation.check_in_date,
          end_date: updatedReservation.check_out_date,
          cancellation_source: source,
          cancellation_channel: channel || null,
          cancellation_reason: reason || null,
          property_id: updatedReservation.property_id,
          status: updatedReservation.reservation_status,   // <<<<<< CORRECT
          ...updatedReservation
        });
      } catch (err) {
        console.warn('Post-cancellation engine failed:', err.message);
      }

      // ---------------------------------------------
      // AUDIT LOG
      // ---------------------------------------------
      try {
        await auditService.logEvent({
          action: 'CANCEL_RESERVATION',
          entityType: 'reservation',
          entityId: updatedReservation.id,
          entityName: `Reservation ${updatedReservation.reservation_code}`,
          details: JSON.stringify({
            source,
            channel: channel || null,
            reason: reason || null,
            cancelled_by: userId
          }),
          severity: 'medium',
          metadata: {
            source,
            channel: channel || null,
            reason: reason || null,
            cancelled_by: userId,
            booking_id: updatedReservation.id,
            reservation_code: updatedReservation.reservation_code
          },
          success: true
        });
      } catch (auditErr) {
        console.warn('Audit log failed:', auditErr.message);
      }
    }

    // ---------------------------------------------
    // FINAL SUCCESS RESPONSE
    // ---------------------------------------------
    return res.status(200).json({
      ok: true,
      status: 'cancelled',
      bookingId,
      cmResponse: result
    });

  } catch (error) {
    console.error('Cancellation endpoint error:', error);

    return res.status(500).json({
      ok: false,
      error: error.message || 'Unexpected cancellation error',
      bookingId: req.body?.bookingId || null
    });
  }
}
