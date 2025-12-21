import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { auditService } from '../../../services/auditService';

const ReservationRowActions = ({ reservation }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const rawChannel =
    reservation?.bookingChannel ||
    reservation?.channel ||
    "direct";

  const channelLower = rawChannel?.toLowerCase?.() || "direct";
  const isDirect = channelLower === "direct";

  const isCancelled =
    reservation?.status?.toLowerCase?.() === "cancelled";

  // ------------------------------------------------------
  // ⭐ VIEW DETAILS (log + navigation)
  // ------------------------------------------------------
  const handleViewDetails = async () => {
    await auditService.logEvent({
      action: "reservation_viewed",
      entityType: "reservation",
      entityId: reservation?.id,
      entityName: reservation?.guestName,
      details: "Reservation viewed from table row"
    });

    navigate(`/reservations/${reservation?.id}`);
    setIsMenuOpen(false);
  };

  // ------------------------------------------------------
  // ⭐ MESSAGE SECTION OPENED
  // ------------------------------------------------------
  const handleMessage = async () => {
    await auditService.logEvent({
      action: "reservation_messages_opened",
      entityType: "reservation",
      entityId: reservation?.id,
      entityName: reservation?.guestName,
      details: "User opened messaging section"
    });

    navigate(`/reservations/${reservation?.id}?scroll=messages`);
    setIsMenuOpen(false);
  };

  // ------------------------------------------------------
  // ⭐ EDIT RESERVATION
  // ------------------------------------------------------
  const handleEditReservation = async () => {
    if (!isDirect || isCancelled) return;

    await auditService.logEvent({
      action: "reservation_edit_opened",
      entityType: "reservation",
      entityId: reservation?.id,
      entityName: reservation?.guestName,
      details: "Edit form opened"
    });

    navigate(`/reservations/${reservation?.id}/edit`);
    setIsMenuOpen(false);
  };

  // ------------------------------------------------------
  // ⭐ DUPLICATE
  // ------------------------------------------------------
  const handleDuplicateReservation = async () => {
    if (!isDirect || isCancelled) return;

    await auditService.logEvent({
      action: "reservation_duplicate",
      entityType: "reservation",
      entityId: reservation?.id,
      entityName: reservation?.guestName,
      details: "User started duplicating this reservation"
    });

    navigate(`/reservations/${reservation?.id}/edit?mode=duplicate`);
    setIsMenuOpen(false);
  };

  // ------------------------------------------------------
  // ⭐ DELETE RESERVATION
  // ------------------------------------------------------
  const handleDeleteReservation = async () => {
    if (!isDirect || !reservation?.id || isCancelled) return;

    const ok = window.confirm(
      "This direct reservation will be permanently deleted. Do you want to continue?"
    );
    if (!ok) {
      setIsMenuOpen(false);
      return;
    }

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservation.id);

      if (error) {
        console.error("Supabase delete error:", error);

        await auditService.logEvent({
          action: "reservation_delete_failed",
          entityType: "reservation",
          entityId: reservation.id,
          entityName: reservation?.guestName,
          details: error.message,
          success: false,
          severity: "high"
        });

        alert("Failed to delete reservation.");
      } else {
        await auditService.logEvent({
          action: "reservation_deleted",
          entityType: "reservation",
          entityId: reservation.id,
          entityName: reservation?.guestName,
          details: "Reservation deleted successfully"
        });

        alert("Reservation deleted successfully.");
        window.location.reload();
      }
    } catch (err) {
      console.error("Delete error:", err);

      await auditService.logEvent({
        action: "reservation_delete_exception",
        entityType: "reservation",
        entityId: reservation.id,
        entityName: reservation?.guestName,
        details: err.message,
        success: false,
        severity: "high"
      });

      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
      setIsMenuOpen(false);
    }
  };

  // ------------------------------------------------------
  // ⭐ CANCEL RESERVATION
  // ------------------------------------------------------
  const handleCancelReservation = async () => {
    if (!reservation?.id || isCancelled) return;

    const confirmText = isDirect
      ? "Do you really want to cancel this direct reservation?"
      : `This reservation comes from ${rawChannel}. The cancellation will be processed through the channel manager once connected. Continue?`;

    const ok = window.confirm(confirmText);
    if (!ok) {
      setIsMenuOpen(false);
      return;
    }

    try {
      setIsCancelling(true);

      if (isDirect) {
        // Direct cancellation
        const { error } = await supabase
          .from("reservations")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
            updated_by: user?.id || null,
          })
          .eq("id", reservation.id);

        if (error) {
          console.error("Direct cancel error:", error);

          await auditService.logEvent({
            action: "reservation_cancel_failed",
            entityType: "reservation",
            entityId: reservation.id,
            entityName: reservation?.guestName,
            details: error.message,
            success: false,
            severity: "high"
          });

          alert("Failed to cancel the reservation.");
        } else {
          await auditService.logEvent({
            action: "reservation_cancelled",
            entityType: "reservation",
            entityId: reservation.id,
            entityName: reservation?.guestName,
            details: "Direct reservation cancelled successfully"
          });

          alert("Reservation cancelled successfully.");
          window.location.reload();
        }

        return;
      }

      // Channel-manager mode (future ready)
      const payload = {
        bookingId: reservation.id,
        source: "channel",
        channel: channelLower,
        userId: user?.id || null,
      };

      const res = await fetch("/api/reservations/cancelReservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        console.error("Cancel error:", data);

        await auditService.logEvent({
          action: "reservation_cancel_failed",
          entityType: "reservation",
          entityId: reservation.id,
          details: "Channel-manager cancellation failed",
          success: false,
          severity: "high"
        });

        alert("Failed to cancel reservation. Please try again.");
      } else {
        await auditService.logEvent({
          action: "reservation_cancelled_channel",
          entityType: "reservation",
          entityId: reservation.id,
          details: `Cancellation requested through channel: ${channelLower}`
        });

        alert("Reservation cancelled successfully.");
        window.location.reload();
      }
    } catch (err) {
      console.error("Cancel reservation error:", err);

      await auditService.logEvent({
        action: "reservation_cancel_exception",
        entityType: "reservation",
        entityId: reservation.id,
        details: err.message,
        success: false,
        severity: "high"
      });

      alert("An error occurred while cancelling reservation.");
    } finally {
      setIsCancelling(false);
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    if (isCancelling || isDeleting) return;
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex items-center justify-center space-x-2">

      <Button
        variant="ghost"
        size="icon"
        onClick={handleViewDetails}
        title="View Details"
      >
        <Icon name="Eye" size={16} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleMessage}
        title="Send Message"
      >
        <Icon name="MessageCircle" size={16} />
      </Button>

      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMenu}
          title="More Actions"
          disabled={isCancelling || isDeleting}
        >
          <Icon name="MoreHorizontal" size={16} />
        </Button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsMenuOpen(false)}
            />

            <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-lg shadow-xl z-20 animate-fade">

              {isDirect && !isCancelled && (
                <>
                  <button
                    onClick={handleEditReservation}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex items-center space-x-2 font-medium"
                  >
                    <Icon name="Edit" size={16} className="text-blue-600" />
                    <span className="text-blue-700">Edit Reservation</span>
                  </button>

                  <button
                    onClick={handleDuplicateReservation}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 flex items-center space-x-2 font-medium"
                  >
                    <Icon name="Copy" size={16} className="text-purple-600" />
                    <span className="text-purple-700">Duplicate Reservation</span>
                  </button>

                  <button
                    onClick={handleDeleteReservation}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center space-x-2 font-medium text-red-700"
                    disabled={isDeleting}
                  >
                    <Icon name="Trash" size={16} className="text-red-600" />
                    <span>{isDeleting ? "Deleting…" : "Delete Reservation"}</span>
                  </button>
                </>
              )}

              {!isCancelled && (
                <button
                  onClick={handleCancelReservation}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-orange-50 flex items-center space-x-2 font-medium text-orange-700 rounded-b-lg"
                  disabled={isCancelling}
                >
                  <Icon name="XCircle" size={16} className="text-orange-600" />
                  <span>{isCancelling ? "Cancelling…" : "Cancel Reservation"}</span>
                </button>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReservationRowActions;
