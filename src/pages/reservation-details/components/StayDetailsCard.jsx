import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const StayDetailsCard = ({ reservation }) => {
  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const getChannelBadge = (channel) => {
    const channelConfig = {
      'Airbnb': { bg: 'bg-red-100', text: 'text-red-800', icon: 'Home' },
      'Booking.com': { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'Calendar' },
      'Direct': { bg: 'bg-green-100', text: 'text-green-800', icon: 'Phone' }
    };

    const config = channelConfig?.[channel] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'Globe' };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config?.bg} ${config?.text}`}>
        <Icon name={config?.icon} size={12} className="mr-1" />
        {channel}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Confirmed': { bg: 'bg-green-100', text: 'text-green-800' },
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-800' },
      'Completed': { bg: 'bg-blue-100', text: 'text-blue-800' }
    };

    const config = statusConfig?.[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config?.bg} ${config?.text}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Icon name="MapPin" size={20} className="mr-2" />
          Stay Details
        </h2>
        <div className="flex items-center space-x-2">
          {getChannelBadge(reservation?.channel)}
          {getStatusBadge(reservation?.status)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">{reservation?.property?.name}</h3>
            <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
              <Image
                src={reservation?.property?.image}
                alt={reservation?.property?.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Property Type:</span>
              <p className="text-foreground font-medium">{reservation?.property?.type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Property Code:</span>
              <p className="text-foreground font-medium">{reservation?.property?.code}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>
              <p className="text-foreground font-medium">{reservation?.property?.size}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Bedrooms:</span>
              <p className="text-foreground font-medium">{reservation?.property?.bedrooms}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Icon name="Calendar" size={16} className="mr-2 text-success" />
                <span className="text-sm font-medium text-foreground">Check-in</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{formatDate(reservation?.dates?.checkIn)}</p>
              <p className="text-sm text-muted-foreground">{reservation?.dates?.checkInTime}</p>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Icon name="Calendar" size={16} className="mr-2 text-error" />
                <span className="text-sm font-medium text-foreground">Check-out</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{formatDate(reservation?.dates?.checkOut)}</p>
              <p className="text-sm text-muted-foreground">{reservation?.dates?.checkOutTime}</p>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold text-primary">
                  {calculateNights(reservation?.dates?.checkIn, reservation?.dates?.checkOut)} nights
                </p>
              </div>
              <Icon name="Moon" size={32} className="text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Booking Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Reservation ID:</span>
                <p className="text-foreground font-medium">{reservation?.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Booked Date:</span>
                <p className="text-foreground font-medium">{formatDate(reservation?.bookedDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Source:</span>
                <p className="text-foreground font-medium">{reservation?.channel}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Reference:</span>
                <p className="text-foreground font-medium">{reservation?.reference || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StayDetailsCard;