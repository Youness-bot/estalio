import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import ReservationRowActions from './ReservationRowActions';

const ReservationTable = ({ reservations, currentCurrency }) => {
  const navigate = useNavigate();

  const getCurrencySymbol = (currency) => {
    const symbols = { USD: '$', EUR: '€', MAD: 'د.م.' };
    return symbols?.[currency] || currency;
  };

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    const rates = { MAD: 1, EUR: 0.093, USD: 0.10 };
    const baseAmount = amount / rates?.[fromCurrency];
    return (baseAmount * rates?.[toCurrency])?.toFixed(2);
  };

  // ⭐ COULEURS VIVES STYLE BOOKING/AIRBNB
  const getChannelBadge = (channel) => {
    const c = channel?.toLowerCase();

    const channelStyles = {
      direct: "bg-green-600 text-white",
      airbnb: "bg-red-600 text-white",
      booking: "bg-blue-600 text-white",
      expedia: "bg-orange-500 text-white",
      vrbo: "bg-purple-600 text-white",
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
          channelStyles[c] || "bg-gray-300 text-gray-800"
        }`}
      >
        {channel}
      </span>
    );
  };

  // ⭐ STATUTS CLAIRS & VISIBLES
  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();

    const statusStyles = {
      confirmed: "bg-green-600 text-white",
      pending: "bg-orange-500 text-white",
      cancelled: "bg-red-600 text-white",
      completed: "bg-gray-400 text-white",
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
          statusStyles[s] || "bg-gray-300 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Dates</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Property</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Channel</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Gross</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Net</th>
              <th className="text-center p-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>

          <tbody>
            {reservations?.map((reservation) => {
              const isCancelled =
                reservation?.status?.toLowerCase?.() === "cancelled";

              return (
                <tr
                  key={reservation?.id}
                  className={`border-b border-border ${
                    isCancelled
                      ? "bg-muted/40 opacity-60 cursor-not-allowed"
                      : "hover:bg-muted/20"
                  }`}
                >
                  {/* 👤 CLIENT */}
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon name="User" size={16} color="var(--color-primary)" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {reservation?.guestName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {reservation?.guestEmail}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 📅 DATES */}
                  <td className="p-4">
                    <div className="text-sm">
                      <div className="font-medium text-foreground">
                        {formatDate(reservation?.checkInDate)}
                      </div>
                      <div className="text-muted-foreground">
                        to {formatDate(reservation?.checkOutDate)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {reservation?.nights} nights
                      </div>
                    </div>
                  </td>

                  {/* 🏠 PROPERTY */}
                  <td className="p-4">
                    <div className="text-sm">
                      <div className="font-medium text-foreground">
                        {reservation?.propertyName}
                      </div>
                      <div className="text-muted-foreground">
                        {reservation?.propertyCode}
                      </div>
                    </div>
                  </td>

                  {/* 🌐 CHANNEL */}
                  <td className="p-4">
                    {getChannelBadge(reservation?.bookingChannel)}
                  </td>

                  {/* 🔵 STATUS */}
                  <td className="p-4">
                    {getStatusBadge(reservation?.status)}
                  </td>

                  {/* 💰 GROSS */}
                  <td className="p-4 text-right">
                    <div className="font-medium text-foreground">
                      {getCurrencySymbol(currentCurrency)}{" "}
                      {convertCurrency(reservation?.grossAmount, "MAD", currentCurrency)}
                    </div>
                  </td>

                  {/* 💸 NET */}
                  <td className="p-4 text-right">
                    <div className="font-medium text-foreground">
                      {getCurrencySymbol(currentCurrency)}{" "}
                      {convertCurrency(reservation?.netAmount, "MAD", currentCurrency)}
                    </div>
                  </td>

                  {/* ⚙️ ACTIONS */}
                  <td className="p-4">
                    <ReservationRowActions reservation={reservation} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* EMPTY STATE */}
      {reservations?.length === 0 && (
        <div className="text-center py-12">
          <Icon
            name="Calendar"
            size={48}
            color="var(--color-muted-foreground)"
            className="mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No reservations found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or create a new reservation.
          </p>
          <Button variant="default" iconName="Plus" iconPosition="left">
            New Reservation
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReservationTable;