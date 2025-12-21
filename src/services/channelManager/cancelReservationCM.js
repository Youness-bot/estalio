import { supabase } from '../../lib/supabase';
import { auditService } from '../auditService';

/**
 * Centralized Reservation Cancellation Engine
 */
export async function cancelReservationCM(bookingId, payload) {
  try {
    if (!bookingId) throw new Error('Booking ID is required');
    if (!payload?.source) throw new Error('Cancellation source is required');

    // ---- AUTH CHECK ----
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // ---- FETCH RESERVATION ----
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw new Error(`Reservation not found: ${fetchError.message}`);
    if (reservation?.reservation_status === 'cancelled')
      throw new Error('Reservation is already cancelled');

    // ---- ROUTE CANCEL ----
    if (payload.source === 'direct') {
      return await handleDirectCancellation(bookingId, reservation, payload, user.id);
    }

    if (payload.source === 'channel') {
      return await handleChannelCancellation(bookingId, reservation, payload, user.id);
    }

    throw new Error('Invalid source');

  } catch (error) {
    console.error('Error in cancelReservationCM:', error);
    return {
      ok: false,
      error: error.message || 'Cancellation failed',
      bookingId
    };
  }
}

/**
 * DIRECT CANCELLATION (BOOKINGS CREATED INSIDE THE SYSTEM)
 */
async function handleDirectCancellation(bookingId, reservation, payload, userId) {
  try {
    const cancellationData = {
      reservation_status: 'cancelled',                       // <<< THE REAL COLUMN
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_source: 'direct',
      cancellation_channel: null,
      cancellation_reason: payload.reason || null,
      cancellation_payload: payload || {},
      notes: `${reservation?.notes || ''}\n\nCancelled on ${new Date().toISOString()}`.trim()
    };

    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(cancellationData)
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to cancel reservation: ${updateError.message}`);

    // ---- AUDIT LOG ----
    await auditService.logEvent({
      action: 'CANCEL_RESERVATION',
      entityType: 'reservation',
      entityId: bookingId,
      entityName: updatedReservation?.reservation_code,
      details: `Direct cancellation`,
      severity: 'medium',
      metadata: {
        ...cancellationData,
        guestName: reservation?.guest_name
      }
    });

    return {
      ok: true,
      bookingId,
      source: 'direct',
      message: 'Reservation cancelled successfully',
      data: updatedReservation
    };

  } catch (err) {
    throw new Error(`Direct cancellation failed: ${err.message}`);
  }
}

/**
 * CHANNEL CANCELLATION (Airbnb, Booking.com, etc.)
 * Currently simulated until Channel Manager is connected.
 */
async function handleChannelCancellation(bookingId, reservation, payload, userId) {
  try {
    const validChannels = ['airbnb', 'booking', 'expedia', 'vrbo'];
    if (!payload.channel || !validChannels.includes(payload.channel))
      throw new Error(`Invalid channel. Must be one of: ${validChannels.join(', ')}`);

    const cancellationData = {
      reservation_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_source: 'channel',
      cancellation_channel: payload.channel,
      cancellation_reason: payload.reason || null,
      cancellation_payload: payload || {},
      notes: `${reservation?.notes || ''}\n\nChannel cancellation (${payload.channel}) on ${new Date().toISOString()}`.trim()
    };

    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(cancellationData)
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to cancel reservation: ${updateError.message}`);

    // ---- AUDIT ----
    await auditService.logEvent({
      action: 'CANCEL_RESERVATION',
      entityType: 'reservation',
      entityId: bookingId,
      entityName: reservation?.reservation_code,
      details: `Channel cancellation simulated for ${payload.channel}`,
      severity: 'high',
      metadata: cancellationData
    });

    return {
      ok: true,
      bookingId,
      source: 'channel',
      message: 'Cancellation simulated (Channel Manager not connected yet)',
      data: updatedReservation
    };

  } catch (err) {
    throw new Error(`Channel cancellation failed: ${err.message}`);
  }
}
