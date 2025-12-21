import { supabase } from '../../../lib/supabase';
import { postCancellationEngine } from '../../../services/reservations/postCancellationEngine';
import { auditService } from '../../../services/auditService';

/**
 * POST /api/webhooks/channelManager/cancellation
 * 
 * Channel Manager Cancellation Webhook Endpoint
 * 
 * This endpoint receives cancellation notifications from external Channel Managers
 * (Booking.com, Airbnb, Expedia, etc.) and updates the local reservation status.
 * 
 * Expected POST payload:
 * {
 *   externalBookingId: string,        // Required: External booking ID
 *   channel: string,                  // Required: "booking", "airbnb", "expedia", etc.
 *   status: string,                   // Required: "cancelled"
 *   reason?: string,                  // Optional: Cancellation reason
 *   timestamp: string,                // Required: ISO 8601 timestamp
 *   rawPayload: object                // Required: Full original JSON from external API
 * }
 * 
 * Response:
 * {
 *   ok: true/false,
 *   message: string,
 *   channel: string,
 *   externalBookingId: string
 * }
 */
export default async function handler(req, res) {
  // Only allow POST method
  if (req?.method !== 'POST') {
    return res?.status(405)?.json({ 
      ok: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Extract payload from request body
    const { 
      externalBookingId, 
      channel, 
      status, 
      reason, 
      timestamp, 
      rawPayload 
    } = req?.body || {};

    // ============================================================
    // STEP 1: Validate Required Fields
    // ============================================================
    
    if (!externalBookingId) {
      return res?.status(400)?.json({ 
        ok: false, 
        error: 'Missing required field: externalBookingId' 
      });
    }

    if (!channel) {
      return res?.status(400)?.json({ 
        ok: false, 
        error: 'Missing required field: channel' 
      });
    }

    if (!status || status !== 'cancelled') {
      return res?.status(400)?.json({ 
        ok: false, 
        error: 'Invalid or missing status. Must be "cancelled"' 
      });
    }

    if (!timestamp) {
      return res?.status(400)?.json({ 
        ok: false, 
        error: 'Missing required field: timestamp' 
      });
    }

    if (!rawPayload) {
      return res?.status(400)?.json({ 
        ok: false, 
        error: 'Missing required field: rawPayload' 
      });
    }

    // Validate channel value
    const validChannels = ['booking', 'airbnb', 'expedia', 'vrbo'];
    if (!validChannels?.includes(channel?.toLowerCase())) {
      return res?.status(400)?.json({ 
        ok: false, 
        error: `Invalid channel. Must be one of: ${validChannels?.join(', ')}` 
      });
    }

    // ============================================================
    // STEP 2: Look up Reservation by External Booking ID
    // ============================================================
    
    // Note: This assumes the reservation_code field stores the external booking ID
    // If you're using a different field or need to map external IDs, modify this query
    const { data: reservation, error: fetchError } = await supabase
      ?.from('reservations')
      ?.select('*')
      ?.eq('reservation_code', externalBookingId)
      ?.single();

    // If no matching reservation found, return 404
    if (fetchError || !reservation) {
      return res?.status(404)?.json({ 
        ok: false, 
        error: `No reservation found with externalBookingId: ${externalBookingId}`,
        details: fetchError?.message || 'Reservation does not exist in local database'
      });
    }

    // ============================================================
    // STEP 3: Update Reservation with Cancellation Details
    // 
    // TODO: Database Integration
    // ============================================================
    // 
    // When the reservations table schema is extended with dedicated cancellation fields,
    // uncomment and use the following update:
    // 
    // const { error: updateError } = await supabase
    //   ?.from('reservations')
    //   ?.update({
    //     cancellation_status: 'cancelled',
    //     cancellation_source: 'channel',
    //     cancellation_channel: channel?.toLowerCase(),
    //     cancellation_reason: reason || null,
    //     cancelled_at: timestamp,
    //     cancellation_payload: rawPayload,
    //     status: 'cancelled'
    //   })
    //   ?.eq('id', reservation?.id);
    // 
    // For now, we'll use the existing status field and notes:
    
    const { error: updateError } = await supabase
      ?.from('reservations')
      ?.update({
        status: 'cancelled',
        notes: `${reservation?.notes || ''}\n\nChannel Manager Cancellation:\n- Channel: ${channel}\n- External ID: ${externalBookingId}\n- Reason: ${reason || 'Not provided'}\n- Timestamp: ${timestamp}\n- Raw Payload: ${JSON?.stringify(rawPayload)}`?.trim()
      })
      ?.eq('id', reservation?.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return res?.status(500)?.json({
        ok: false,
        error: 'Failed to update reservation in database',
        details: updateError?.message
      });
    }

    // ============================================================
    // POST-CANCELLATION ENGINE CALL
    // ============================================================
    // Fetch the fully updated reservation to pass to the engine
    const { data: updatedReservation, error: fetchUpdatedError } = await supabase
      ?.from('reservations')
      ?.select('*')
      ?.eq('id', reservation?.id)
      ?.single();

    if (updatedReservation) {
      // Call post-cancellation engine (MUST NEVER block the cancellation flow)
      try {
        await postCancellationEngine({
          id: updatedReservation?.id,
          start_date: updatedReservation?.check_in_date,
          end_date: updatedReservation?.check_out_date,
          cancellation_source: 'channel',
          cancellation_channel: channel?.toLowerCase(),
          cancellation_reason: reason || null,
          property_id: updatedReservation?.property_id,
          status: updatedReservation?.status,
          external_booking_id: externalBookingId,
          ...updatedReservation
        });
      } catch (err) {
        // Log error but DO NOT stop the cancellation flow
        console.error("Post-cancellation engine error:", err?.message);
      }

      // ============================================================
      // AUDIT LOG - CANCEL RESERVATION (CHANNEL MANAGER)
      // ============================================================
      try {
        await auditService?.logEvent({
          action: 'CANCEL_RESERVATION',
          entityType: 'reservation',
          entityId: updatedReservation?.id,
          entityName: `Reservation ${updatedReservation?.reservation_code || externalBookingId}`,
          details: JSON.stringify({
            source: 'channel',
            channel: channel?.toLowerCase(),
            reason: reason || null,
            external_booking_id: externalBookingId
          }),
          severity: 'medium',
          metadata: {
            source: 'channel',
            channel: channel?.toLowerCase(),
            reason: reason || null,
            external_booking_id: externalBookingId,
            booking_id: updatedReservation?.id,
            reservation_code: updatedReservation?.reservation_code,
            raw_payload: rawPayload
          },
          success: true
        });
      } catch (auditErr) {
        // DO NOT block cancellation if audit logging fails
        console.warn("⚠️ Audit log failed for channel manager cancellation:", auditErr?.message);
      }
    } else if (fetchUpdatedError) {
      console.error("Failed to fetch updated reservation for post-cancellation engine:", fetchUpdatedError?.message);
    }

    // ============================================================
    // STEP 4: Return Success Response
    // ============================================================
    
    return res?.status(200)?.json({
      ok: true,
      message: 'Cancellation received',
      channel: channel?.toLowerCase(),
      externalBookingId
    });

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Return error response
    return res?.status(500)?.json({
      ok: false,
      error: error?.message || 'An unexpected error occurred while processing cancellation webhook'
    });
  }
}