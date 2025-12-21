import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';

const NewReservationModal = ({ isOpen, onClose, onSave, initialData = null, isEditMode = false }) => {
  const currentId = initialData?.id || null;
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    property: '',
    channel: '',
    grossAmount: '',
    notes: '',
    bookingPaymentType: 'property_collect',
    paymentMethod: ''
  });

  const [errors, setErrors] = useState({});
  const [propertyOptions, setPropertyOptions] = useState([]);

  // 🔒 Date d’aujourd’hui en ISO (YYYY-MM-DD)
  const todayISO = new Date().toISOString().split('T')[0];

  // 🔥 Global modal error
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        ?.from('properties')
        ?.select('id, name, property_code');

      if (!error) {
        setPropertyOptions(
          data?.map((p) => ({
            value: p?.id,
            label: `${p?.name} (${p?.property_code})`
          }))
        );
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        clientName: initialData?.guestName || '',
        clientEmail: initialData?.guestEmail || '',
        clientPhone: initialData?.guestPhone || '',
        checkIn: initialData?.checkInDate || '',
        checkOut: initialData?.checkOutDate || '',
        adults: initialData?.adults || 1,
        children: initialData?.children || 0,
        property: initialData?.propertyId || '',
        channel: initialData?.bookingChannel || '',
        grossAmount: initialData?.grossAmount || '',
        notes: initialData?.notes || '',
        bookingPaymentType: initialData?.bookingPaymentType || 'property_collect',
        paymentMethod: initialData?.paymentMethod || ''
      }));
    }
  }, [initialData]);

  const channelOptions = [
    { value: 'direct', label: 'Direct Booking' },
    { value: 'booking', label: 'Booking.com' },
    { value: 'airbnb', label: 'Airbnb' },
    { value: 'expedia', label: 'Expedia' },
    { value: 'vrbo', label: 'VRBO' }
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // ⭐ Si on change check-in → reset check-out
    if (field === 'checkIn') {
      setFormData((prev) => ({
        ...prev,
        checkIn: value,
        checkOut: '' // 🔥 Reset check-out
      }));
    }

    if (errors?.[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const isOtaChannel = ['booking', 'airbnb', 'expedia', 'vrbo'].includes(
    String(formData.channel || '').toLowerCase()
  );
  const isDirectChannel = String(formData.channel || '').toLowerCase() === 'direct';

  // 🔍 Vérification Overlap
  const checkOverlap = async () => {
    if (!formData.property || !formData.checkIn || !formData.checkOut) return false;

    const { data, error } = await supabase
      ?.from('reservations')
      ?.select('id, check_in_date, check_out_date, status')
      .eq('property_id', formData.property)
      .neq('status', 'cancelled')
      .neq('id', currentId);

    if (error || !data) return false;

    const newIn = new Date(formData.checkIn);
    const newOut = new Date(formData.checkOut);

    return data.some((r) => {
      const existingIn = new Date(r.check_in_date);
      const existingOut = new Date(r.check_out_date);
      return newIn < existingOut && newOut > existingIn;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.clientName?.trim()) newErrors.clientName = 'Client name required';
    if (!formData?.clientEmail?.trim()) newErrors.clientEmail = 'Email required';
    if (!/\S+@\S+\.\S+/.test(formData?.clientEmail)) newErrors.clientEmail = 'Invalid email';

    if (!formData?.checkIn) newErrors.checkIn = 'Check-in required';
    if (!formData?.checkOut) newErrors.checkOut = 'Check-out required';

    if (formData?.checkIn && formData?.checkOut) {
      const inDate = new Date(formData.checkIn);
      const outDate = new Date(formData.checkOut);
      if (inDate >= outDate) newErrors.checkOut = 'Check-out must be after check-in';
    }

    if (!formData?.property) newErrors.property = 'Select property';
    if (!formData?.channel) newErrors.channel = 'Select channel';

    if (!formData?.grossAmount || parseFloat(formData.grossAmount) <= 0)
      newErrors.grossAmount = 'Invalid amount';

    if (isOtaChannel && !formData.bookingPaymentType)
      newErrors.bookingPaymentType = 'Select payment flow';

    if (isDirectChannel && !formData.paymentMethod)
      newErrors.paymentMethod = 'Select payment method';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    const hasOverlap = await checkOverlap();
    if (hasOverlap) {
      setGlobalError('This property is already booked for these dates.');
      return;
    }

    const totalGuests =
      parseInt(formData.adults || 0, 10) + parseInt(formData.children || 0, 10);

    const nights = Math.ceil(
      (new Date(formData.checkOut) - new Date(formData.checkIn)) / 86400000
    );

    let bookingPaymentType = 'property_collect';
    let paymentMethodLabel = 'Cash at property';

    if (isOtaChannel) {
      bookingPaymentType = formData.bookingPaymentType;
      paymentMethodLabel =
        bookingPaymentType === 'booking_collect'
          ? 'Paid via channel'
          : 'Pay at property';
    } else if (isDirectChannel) {
      if (formData.paymentMethod === 'online') {
        bookingPaymentType = 'booking_collect';
        paymentMethodLabel = 'Online payment';
      } else if (formData.paymentMethod === 'card') {
        bookingPaymentType = 'property_collect';
        paymentMethodLabel = 'Card at property';
      }
    }

    const reservationData = {
      guestName: formData.clientName,
      guestEmail: formData.clientEmail,
      guestPhone: formData.clientPhone,
      checkInDate: formData.checkIn,
      checkOutDate: formData.checkOut,
      adults: parseInt(formData.adults || 1, 10),
      children: parseInt(formData.children || 0, 10),
      totalGuests,
      nights,
      propertyId: formData.property,
      bookingChannel: formData.channel,
      bookingPaymentType,
      paymentMethod: paymentMethodLabel,
      grossAmount: Number(formData.grossAmount),
      currency: 'MAD',
      notes: formData.notes,
      specialRequests: formData.notes,
      status: 'confirmed'
    };

    onSave(reservationData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

      {globalError && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-3 text-red-600">
              Reservation Conflict
            </h2>
            <p className="text-sm text-gray-700 mb-4">{globalError}</p>
            <Button variant="default" fullWidth onClick={() => setGlobalError('')}>
              OK
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="p-6 border-b border-border flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name={isEditMode ? 'Edit' : 'Plus'} size={18} color="var(--color-primary)" />
            </div>
            <h2 className="text-xl font-semibold">
              {isEditMode ? 'Edit Reservation' : 'New Reservation'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} iconName="X" />
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* CLIENT INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Client Name"
                placeholder="Enter full name"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                error={errors.clientName}
              />

              <Input
                label="Email"
                type="email"
                placeholder="example@mail.com"
                value={formData.clientEmail}
                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                error={errors.clientEmail}
              />
            </div>

            <Input
              label="Phone"
              placeholder="Example: +212 6 12 34 56 78"
              value={formData.clientPhone}
              onChange={(e) => handleInputChange('clientPhone', e.target.value)}
            />
          </div>

          {/* BOOKING DETAILS */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Booking Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* CHECK-IN */}
              <Input
                label="Check-in"
                type="date"
                placeholder="Select check-in date"
                value={formData.checkIn}
                min={todayISO}
                onChange={(e) =>
                  handleInputChange('checkIn', e.target.value)
                }
                error={errors.checkIn}
              />

              {/* CHECK-OUT (🔥 Désactivé tant que check-in vide) */}
              <Input
                label="Check-out"
                type="date"
                placeholder="Select check-out date"
                value={formData.checkOut}
                disabled={!formData.checkIn} // 🔥 OPTION A
                min={
                  formData.checkIn
                    ? new Date(
                        new Date(formData.checkIn).getTime() + 86400000
                      )
                        .toISOString()
                        .split('T')[0]
                    : todayISO
                }
                onChange={(e) =>
                  handleInputChange('checkOut', e.target.value)
                }
                error={errors.checkOut}
              />

              <div className="flex items-end">
                <div className="w-full p-3 bg-muted/20 rounded-md border">
                  <div className="text-sm">Nights</div>
                  <div className="text-lg font-semibold">
                    {formData.checkIn && formData.checkOut
                      ? Math.ceil(
                          (new Date(formData.checkOut) - new Date(formData.checkIn)) /
                            86400000
                        )
                      : 0}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* GUESTS */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Guests</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Adults"
                type="number"
                min="1"
                placeholder="Number of adults"
                value={formData.adults}
                onChange={(e) => handleInputChange('adults', e.target.value)}
              />

              <Input
                label="Children"
                type="number"
                min="0"
                placeholder="Number of children"
                value={formData.children}
                onChange={(e) => handleInputChange('children', e.target.value)}
              />

              <div className="flex items-end">
                <div className="p-3 bg-muted/20 rounded-md border w-full">
                  <div className="text-sm">Total Guests</div>
                  <div className="text-lg font-semibold">
                    {parseInt(formData.adults || 0, 10) +
                      parseInt(formData.children || 0, 10)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PROPERTY & CHANNEL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Property"
              placeholder="Select a property"
              options={propertyOptions}
              value={formData.property}
              onChange={(val) => handleInputChange('property', val)}
              error={errors.property}
            />

            <Select
              label="Booking Channel"
              placeholder="Select channel"
              options={channelOptions}
              value={formData.channel}
              onChange={(val) => handleInputChange('channel', val)}
              error={errors.channel}
            />
          </div>

          {/* CONDITIONAL PAYMENT SECTION */}
          {isOtaChannel && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Channel Payment Flow</h3>
              <Select
                label="How does the guest pay?"
                placeholder="Select payment flow"
                value={formData.bookingPaymentType}
                onChange={(val) => handleInputChange('bookingPaymentType', val)}
                options={[
                  { value: 'booking_collect', label: 'Paid online via channel' },
                  { value: 'property_collect', label: 'Guest pays at property' }
                ]}
                error={errors.bookingPaymentType}
              />
            </div>
          )}

          {isDirectChannel && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Direct Payment Method</h3>
              <Select
                label="Payment Method"
                placeholder="Select payment method"
                value={formData.paymentMethod}
                onChange={(val) => handleInputChange('paymentMethod', val)}
                options={[
                  { value: 'cash', label: 'Cash at property' },
                  { value: 'card', label: 'Card at property' },
                  { value: 'online', label: 'Online payment' }
                ]}
                error={errors.paymentMethod}
              />
            </div>
          )}

          {/* AMOUNT */}
          <Input
            label="Gross Amount (MAD)"
            placeholder="Total amount paid or due"
            type="number"
            value={formData.grossAmount}
            onChange={(e) => handleInputChange('grossAmount', e.target.value)}
            error={errors.grossAmount}
          />

          {/* NOTES */}
          <div>
            <label className="block mb-2 text-sm font-medium">Notes</label>
            <textarea
              className="w-full p-3 border rounded-md"
              rows="3"
              placeholder="Add optional notes (ex: late arrival, special requests…) "
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" variant="default" iconName="Save">
              {isEditMode ? 'Update Reservation' : 'Create Reservation'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NewReservationModal;
