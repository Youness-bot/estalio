import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import { reservationService } from "../../../services/reservationService";
import Button from "../../../components/ui/Button";

const PaymentDetailsCard = ({ reservation, onPaymentUpdated }) => {
  const [currentCurrency, setCurrentCurrency] = useState("MAD");
  const [loading, setLoading] = useState(false);

  const [conversionRates] = useState({
    MAD: 1,
    EUR: 0.093,
    USD: 0.10,
  });

  useEffect(() => {
    const saved = localStorage.getItem("currency") || "MAD";
    setCurrentCurrency(saved);
  }, []);

  // ==============================
  // Currency Helpers
  // ==============================
  const convertAmount = (amount, from = "MAD") => {
    if (!amount) return 0;
    if (from === currentCurrency) return amount;

    const madAmount =
      from === "MAD" ? amount : amount / conversionRates[from];

    return madAmount * conversionRates[currentCurrency];
  };

  const formatCurrency = (amount, currency = currentCurrency) => {
    const symbols = { MAD: "د.م", EUR: "€", USD: "$" };
    const converted = convertAmount(amount);
    return `${symbols[currency]}${converted.toFixed(2)}`;
  };

  // ==============================
  // Payment Status UI
  // ==============================
  const paymentStatus = reservation?.payment_status || "unpaid";

  const statusConfig = {
    paid: { bg: "bg-green-100", text: "text-green-800", icon: "CheckCircle" },
    partial: { bg: "bg-blue-100", text: "text-blue-800", icon: "AlertCircle" },
    unpaid: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "Clock" },
    refunded: { bg: "bg-red-100", text: "text-red-800", icon: "RefreshCw" },
  };

  const badge = statusConfig[paymentStatus] || statusConfig.unpaid;

  // ==============================
  // Extract Payment Fields
  // ==============================
  const gross = reservation?.gross_amount || 0;
  const cityTax = reservation?.city_tax_amount || 0;
  const taxableBase = reservation?.taxable_base_amount || 0;
  const commission = reservation?.channel_commission_amount || 0;
  const bankFee = reservation?.bank_fee_amount || 0;
  const net = reservation?.net_amount || 0;

  const paymentMethod = reservation?.payment_method || "N/A";
  const paidAt = reservation?.paid_at
    ? new Date(reservation.paid_at).toLocaleString()
    : "N/A";

  const channel = reservation?.booking_channel?.toLowerCase();
  const type = reservation?.booking_payment_type;

  // ==============================
  // FINAL LOGIC: WHEN TO SHOW BUTTON?
  // ==============================
  console.log("DEBUG CHANNEL:", `"${channel}"`, "TYPE:", `"${type}"`);

  const canMarkAsPaid =
    paymentStatus !== "paid" &&
    (
      // 🔹 ALL property_collect bookings (OTA or direct)
      type === "property_collect" ||

      // 🔹 Direct bookings paid on site (cash or card)
      (channel === "direct" && paymentMethod !== "Online payment")
    );

  // ==============================
  // Handle Payment Update
  // ==============================
  const markAsPaid = async () => {
    try {
      setLoading(true);

      const updated = await reservationService.markAsPaid(reservation.id);

      if (onPaymentUpdated) {
        onPaymentUpdated(updated);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error marking as paid:", err);
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Icon name="CreditCard" size={20} className="mr-2" />
          Payment Details
        </h2>

        <div className="flex items-center space-x-3">

          {/* BADGE */}
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${badge.bg} ${badge.text}`}
          >
            <Icon name={badge.icon} size={12} className="mr-1" />
            {paymentStatus}
          </span>

          {/* ⭐ BUTTON */}
          {canMarkAsPaid && (
            <Button
              variant="default"
              size="sm"
              onClick={markAsPaid}
              disabled={loading}
            >
              {loading ? "Updating..." : "Mark as Paid"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT SIDE */}
        <div className="space-y-4">

          {/* Payment Summary */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Payment Summary</h3>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gross Amount:</span>
              <span className="font-medium">{formatCurrency(gross)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">City Tax:</span>
              <span className="text-error">-{formatCurrency(cityTax)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Channel Commission:</span>
              <span className="text-error">-{formatCurrency(commission)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Bank Fee:</span>
              <span className="text-error">-{formatCurrency(bankFee)}</span>
            </div>

            <div className="border-t border-border pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Net Revenue:</span>
                <span className="text-lg font-bold text-success">
                  {formatCurrency(net)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Payment Method</h3>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Icon name="CreditCard" size={16} color="white" />
              </div>
              <div>
                <p className="text-sm font-medium">{paymentMethod}</p>
                <p className="text-xs text-muted-foreground">Paid At: {paidAt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <h3 className="text-sm font-medium mb-3">Fee Breakdown</h3>

          <div className="space-y-2">
            <div className="flex justify-between bg-muted p-3 rounded">
              <span className="text-sm">Taxable Base</span>
              <span className="font-medium">{formatCurrency(taxableBase)}</span>
            </div>
            <div className="flex justify-between bg-muted p-3 rounded">
              <span className="text-sm">Commission</span>
              <span className="text-error">-{formatCurrency(commission)}</span>
            </div>
            <div className="flex justify-between bg-muted p-3 rounded">
              <span className="text-sm">Bank Fee</span>
              <span className="text-error">-{formatCurrency(bankFee)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Conversion Notice */}
      {currentCurrency !== "MAD" && (
        <div className="mt-4 p-3 bg-blue-50 rounded flex items-center">
          <Icon name="Info" size={16} className="text-blue-600 mr-2" />
          <p className="text-xs text-blue-800">
            Converted from MAD → {currentCurrency} at rate: 1 MAD ={" "}
            {conversionRates[currentCurrency]} {currentCurrency}
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentDetailsCard;
