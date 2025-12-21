import { supabase } from '../lib/supabase';
import { auditService } from './auditService';
import { computeFinancials } from './finance/computeFinancials';

/**
 * Convertit n'importe quelle entrée date → ISO propre
 */
function toISO(dateValue) {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Déduit booking_payment_type
 */
function inferBookingPaymentType({ bookingChannel, paymentMethod }) {
  const channel = (bookingChannel || '').toLowerCase().trim();
  const method = (paymentMethod || '').toLowerCase().trim();

  if (channel === 'direct') {
    if (method.includes('online')) return 'direct_online';
    return 'property_collect';
  }

  if (method.includes('online') || method.includes('collect')) {
    return 'booking_collect';
  }

  return 'property_collect';
}

/**
 * Build payment meta
 */
function buildPaymentMeta({ bookingChannel, bookingPaymentType, rawPaymentMethod }) {
  const channel = (bookingChannel || '').toLowerCase().trim();
  const type = bookingPaymentType || 'property_collect';
  const method = (rawPaymentMethod || '').toLowerCase().trim();
  const nowIso = new Date().toISOString();

  const isDirect = channel === 'direct';
  const isOnline = method.includes('online');

  if (isDirect && isOnline) {
    return {
      paymentStatus: 'paid',
      paymentMethod: 'Online payment',
      paidAt: nowIso
    };
  }

  if (type === 'booking_collect') {
    return {
      paymentStatus: 'paid',
      paymentMethod: rawPaymentMethod || 'Booking Collect',
      paidAt: nowIso
    };
  }

  return {
    paymentStatus: 'unpaid',
    paymentMethod: rawPaymentMethod || 'Cash at property',
    paidAt: null
  };
}

export const reservationService = {

  async getAll() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          properties (id, name, property_code, location)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(r => ({
        id: r.id,
        reservationCode: r.reservation_code,
        propertyId: r.property_id,
        propertyName: r.properties?.name,
        propertyCode: r.properties?.property_code,
        propertyLocation: r.properties?.location,

        guestName: r.guest_name,
        guestEmail: r.guest_email,
        guestPhone: r.guest_phone,

        checkInDate: toISO(r.check_in_date),
        checkOutDate: toISO(r.check_out_date),

        nights: r.nights,
        adults: r.adults,
        children: r.children,
        totalGuests: r.total_guests,

        bookingChannel: r.booking_channel,
        bookingPaymentType: r.booking_payment_type,
        status: r.status,

        grossAmount: parseFloat(r.gross_amount),
        netAmount: parseFloat(r.net_amount),

        cityTaxAmount: r.city_tax_amount,
        taxableBaseAmount: r.taxable_base_amount,
        channelCommissionAmount: r.channel_commission_amount,
        bankFeeAmount: r.bank_fee_amount,
        bankFeeRate: r.bank_fee_rate,

        currency: r.currency,
        paymentStatus: r.payment_status,
        paymentMethod: r.payment_method,
        paidAt: r.paid_at,

        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));

    } catch (err) {
      console.error('Error fetching reservations:', err);
      throw err;
    }
  },

  async getById(id) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          properties(id, name, property_code, location, address)
        `)
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        reservationCode: data.reservation_code,
        propertyId: data.property_id,
        propertyName: data.properties?.name,
        propertyCode: data.properties?.property_code,
        propertyLocation: data.properties?.location,
        propertyAddress: data.properties?.address,

        guestName: data.guest_name,
        guestEmail: data.guest_email,
        guestPhone: data.guest_phone,

        checkInDate: toISO(data.check_in_date),
        checkOutDate: toISO(data.check_out_date),

        nights: data.nights,
        adults: data.adults,
        children: data.children,
        totalGuests: data.total_guests,

        bookingChannel: data.booking_channel,
        bookingPaymentType: data.booking_payment_type,
        status: data.status,

        grossAmount: data.gross_amount,
        netAmount: data.net_amount,

        cityTaxAmount: data.city_tax_amount,
        taxableBaseAmount: data.taxable_base_amount,
        channelCommissionAmount: data.channel_commission_amount,
        bankFeeAmount: data.bank_fee_amount,
        bankFeeRate: data.bank_fee_rate,

        currency: data.currency,
        financialBreakdown: data.financial_breakdown,

        paymentStatus: data.payment_status,
        paymentMethod: data.payment_method,
        paidAt: data.paid_at,

        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

    } catch (err) {
      console.error('Error getById:', err);
      throw err;
    }
  },

  async create(res) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const checkInISO = toISO(res.checkInDate);
      const checkOutISO = toISO(res.checkOutDate);

      const nights = Math.ceil(
        (new Date(checkOutISO) - new Date(checkInISO)) / 86400000
      );

      const bookingPaymentType =
        res.bookingPaymentType ||
        inferBookingPaymentType({
          bookingChannel: res.bookingChannel,
          paymentMethod: res.paymentMethod
        });

      const f = computeFinancials({
        gross_amount: res.grossAmount,
        booking_channel: res.bookingChannel,
        booking_payment_type: bookingPaymentType,
        adults: res.adults,
        children: res.children,
        nights,
        currency: res.currency || 'MAD'
      });

      const paymentMeta = buildPaymentMeta({
        bookingChannel: res.bookingChannel,
        bookingPaymentType,
        rawPaymentMethod: res.paymentMethod
      });

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          reservation_code: res.reservationCode || this.generateReservationCode(),
          property_id: res.propertyId,
          user_id: session.user.id,

          guest_name: res.guestName,
          guest_email: res.guestEmail,
          guest_phone: res.guestPhone,

          check_in_date: checkInISO,
          check_out_date: checkOutISO,

          nights,
          adults: res.adults,
          children: res.children,
          total_guests: (res.adults || 1) + (res.children || 0),

          booking_channel: res.bookingChannel,
          booking_payment_type: bookingPaymentType,

          gross_amount: res.grossAmount,
          net_amount: f.net,

          city_tax_amount: f.cityTax,
          taxable_base_amount: f.taxableBase,
          channel_commission_amount: f.commission,
          bank_fee_amount: f.bankFee,
          bank_fee_rate: f.meta.rules.bankFeeRate,
          financial_breakdown: f.breakdown,

          currency: res.currency || 'MAD',

          payment_status: paymentMeta.paymentStatus,
          payment_method: paymentMeta.paymentMethod,
          paid_at: paymentMeta.paidAt,

          status: res.status || 'pending',
          special_requests: res.specialRequests,
          notes: res.notes
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logEvent({
        action: 'CREATE_RESERVATION',
        entityType: 'reservation',
        entityId: data.id,
        entityName: data.reservation_code,
        details: `Reservation created for ${data.guest_name}`,
        severity: 'medium'
      });

      return data;

    } catch (err) {
      console.error('Error creating:', err);
      throw err;
    }
  },

  async update(id, updates) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const existing = await this.getById(id);
      const payload = {};

      // ---------- BASIC FIELDS ----------
      if (updates?.guestName) payload.guest_name = updates.guestName;
      if (updates?.guestEmail) payload.guest_email = updates.guestEmail;
      if (updates?.guestPhone) payload.guest_phone = updates.guestPhone;

            // ---------- DATES & PROPERTY (normalized) ----------
      const newCheckIn  = toISO(updates?.checkInDate || existing.checkInDate);
      const newCheckOut = toISO(updates?.checkOutDate || existing.checkOutDate);
      const newPropertyId = updates?.propertyId ?? existing.propertyId;

      // 🔥 Normalize all dates to yyyy-mm-dd
      const clean = (d) => {
        if (!d) return null;
        const iso =
          typeof d === "string"
            ? (d.includes("T") ? d : new Date(d).toISOString())
            : new Date(d).toISOString();
        return iso.split("T")[0];
      };

      const datesChanged =
        clean(newCheckIn) !== clean(existing.checkInDate) ||
        clean(newCheckOut) !== clean(existing.checkOutDate);

      const propertyChanged = newPropertyId !== existing.propertyId;

      const mustCheckOverlap = datesChanged || propertyChanged;

      // ---------- OVERLAP CHECK ONLY IF NEEDED ----------
      if (mustCheckOverlap) {
        const { data: conflicts, error: conflictErr } = await supabase
          .from('reservations')
          .select('id, check_in_date, check_out_date')
          .eq('user_id', session.user.id)
          .eq('property_id', newPropertyId)
          .neq('id', id);

        if (conflictErr) throw conflictErr;

        const overlap = conflicts?.some(r => {
          return (
            new Date(r.check_in_date) < new Date(newCheckOut) &&
            new Date(r.check_out_date) > new Date(newCheckIn)
          );
        });

        if (overlap) {
          throw new Error('Reservation conflict: these dates overlap with another booking.');
        }
      }

      // ---------- APPLY DATES / PROPERTY & NIGHTS ----------
      payload.check_in_date = newCheckIn;
      payload.check_out_date = newCheckOut;
      payload.property_id = newPropertyId;

      const nights = Math.ceil(
        (new Date(newCheckOut) - new Date(newCheckIn)) / 86400000
      );
      payload.nights = nights;

      // total guests stays in sync
      const nextAdults   = updates?.adults   ?? existing.adults ?? 1;
      const nextChildren = updates?.children ?? existing.children ?? 0;
      payload.adults = nextAdults;
      payload.children = nextChildren;
      payload.total_guests = nextAdults + nextChildren;
      if (updates?.adults !== undefined) payload.adults = updates.adults;
      if (updates?.children !== undefined) payload.children = updates.children;

      // ---------- PAYMENT LOGIC ----------
      const nextBookingChannel =
        updates?.bookingChannel ?? existing.bookingChannel;

      if (updates?.bookingChannel) {
        payload.booking_channel = updates.bookingChannel;
      }

      const nextPaymentMethod =
        updates?.paymentMethod ?? existing.paymentMethod;

      if (updates?.paymentMethod) {
        payload.payment_method = updates.paymentMethod;
      }

      const nextBookingPaymentType =
        updates?.bookingPaymentType ??
        existing.bookingPaymentType ??
        inferBookingPaymentType({
          bookingChannel: nextBookingChannel,
          paymentMethod: nextPaymentMethod
        });

      if (updates?.bookingPaymentType) {
        payload.booking_payment_type = updates.bookingPaymentType;
      }

      // ---------- RECOMPUTE FINANCIALS IF NEEDED ----------
      const requiresRecompute =
        updates?.grossAmount !== undefined ||
        updates?.bookingChannel ||
        updates?.bookingPaymentType ||
        updates?.adults !== undefined ||
        updates?.children !== undefined;

      if (updates?.grossAmount !== undefined) {
        payload.gross_amount = updates.grossAmount;
      }

      if (requiresRecompute) {
        const nights = existing.nights;

        const f = computeFinancials({
          gross_amount: updates.grossAmount ?? existing.grossAmount,
          booking_channel: nextBookingChannel,
          booking_payment_type: nextBookingPaymentType,
          adults: updates.adults ?? existing.adults,
          children: updates.children ?? existing.children,
          nights,
          currency: existing.currency
        });

        payload.net_amount = f.net;
        payload.city_tax_amount = f.cityTax;
        payload.taxable_base_amount = f.taxableBase;
        payload.channel_commission_amount = f.commission;
        payload.bank_fee_amount = f.bankFee;
        payload.bank_fee_rate = f.meta.rules.bankFeeRate;
        payload.financial_breakdown = f.breakdown;
      }

      if (
        updates?.bookingChannel ||
        updates?.bookingPaymentType ||
        updates?.paymentMethod
      ) {
        const paymentMeta = buildPaymentMeta({
          bookingChannel: nextBookingChannel,
          bookingPaymentType: nextBookingPaymentType,
          rawPaymentMethod: nextPaymentMethod
        });

        payload.payment_status = paymentMeta.paymentStatus;
        payload.payment_method = paymentMeta.paymentMethod;
        payload.paid_at = paymentMeta.paidAt;
      }

      // ---------- SAVE ----------
      const { data, error } = await supabase
        .from('reservations')
        .update(payload)
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) throw error;

      await auditService.logEvent({
        action: 'UPDATE_RESERVATION',
        entityType: 'reservation',
        entityId: data.id,
        entityName: data.reservation_code,
        details: `Reservation updated`,
        severity: 'low'
      });

      return data;

    } catch (err) {
      console.error('Error updating:', err);
      throw err;
    }
  },

  async markAsPaid(id, { paymentMethod } = {}) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const existing = await this.getById(id);

      const channel = (existing.bookingChannel || '').toLowerCase().trim();
      const type = (existing.bookingPaymentType || '').toLowerCase().trim();
      const currentMethod = (existing.paymentMethod || '').toLowerCase().trim();

      const isDirectOnline =
        channel === 'direct' && currentMethod.includes('online');

      const isOtaOnline = type === 'booking_collect';

      if (isDirectOnline || isOtaOnline) {
        throw new Error('This reservation is already paid online and cannot be updated manually.');
      }

      const nowIso = new Date().toISOString();
      const finalMethod =
        paymentMethod || existing.paymentMethod || 'Cash at property';

      const { data, error } = await supabase
        .from('reservations')
        .update({
          payment_status: 'paid',
          payment_method: finalMethod,
          paid_at: nowIso
        })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) throw error;

      await auditService.logEvent({
        action: 'MARK_RESERVATION_PAID',
        entityType: 'reservation',
        entityId: data.id,
        entityName: data.reservation_code,
        details: `Reservation marked as paid (${finalMethod})`,
        severity: 'low'
      });

      return data;

    } catch (err) {
      console.error('Error markAsPaid:', err);
      throw err;
    }
  },

  async delete(id) {
    try {
      const old = await this.getById(id);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      await auditService.logEvent({
        action: 'DELETE_RESERVATION',
        entityType: 'reservation',
        entityId: id,
        entityName: old.reservationCode,
        details: `Reservation deleted for ${old.guestName}`,
        severity: 'high'
      });

      return true;

    } catch (err) {
      console.error('Error deleting:', err);
      throw err;
    }
  },

  async getStatistics() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();

      return {
        total: data.length,
        confirmed: data.filter(r => r.status === 'confirmed').length,
        pending: data.filter(r => r.status === 'pending').length,
        cancelled: data.filter(r => r.status === 'cancelled').length,
        thisMonth: data.filter(r => {
          const d = new Date(r.check_in_date);
          return d.getMonth() === m && d.getFullYear() === y;
        }).length,
        totalRevenue: data.reduce(
          (s, r) => s + parseFloat(r.net_amount || 0),
          0
        )
      };

    } catch (err) {
      console.error('Error loading statistics:', err);
      throw err;
    }
  },
  async hasActiveReservation(propertyId) {
  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('property_id', propertyId)
    .in('status', ['confirmed', 'active'])
    .limit(1);

  if (error) throw error;
  return data.length > 0;
},

  generateReservationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = 'RSV';
    for (let i = 0; i < 6; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }
};
