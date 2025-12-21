/**
 * Cancellation Status Normalizer
 * 
 * Maps external channel-specific cancellation statuses to unified internal statuses.
 * This ensures consistent handling of cancellations across different booking platforms.
 * 
 * Unified statuses: "cancelled", "declined", "voided", "failed", "unknown"
 */

/**
 * Normalizes cancellation status from external channels to internal unified format
 * 
 * @param {string} inputStatus - The external cancellation status from the channel
 * @param {string} channel - The channel identifier ("booking", "airbnb", "direct", etc.)
 * @returns {string} Unified internal cancellation status
 */
export function normalizeCancellationStatus(inputStatus, channel) {
  // Normalize input for case-insensitive comparison
  const normalizedInput = inputStatus?.toLowerCase()?.trim();
  const normalizedChannel = channel?.toLowerCase()?.trim();

  // Handle Booking.com statuses
  if (normalizedChannel === "booking") {
    switch (normalizedInput) {
      case "cancelled_by_guest": case"cancelled_by_hotel":
        return "cancelled";
      case "voided":
        return "voided";
      case "rejected":
        return "declined";
      default:
        return "unknown";
    }
  }

  // Handle Airbnb statuses
  if (normalizedChannel === "airbnb") {
    switch (normalizedInput) {
      case "cancelled": case"guest_cancelled": case"host_cancelled":
        return "cancelled";
      case "declined":
        return "declined";
      default:
        return "unknown";
    }
  }

  // Handle direct bookings (internal system)
  if (normalizedChannel === "direct") {
    return "cancelled";
  }

  // Default fallback for unknown channels
  return "unknown";
}

/**
 * Get all possible unified statuses
 * Useful for UI dropdowns, filters, and validation
 * 
 * @returns {string[]} Array of unified status values
 */
export function getUnifiedStatuses() {
  return ["cancelled", "declined", "voided", "failed", "unknown"];
}

/**
 * Validate if a status is a valid unified status
 * 
 * @param {string} status - Status to validate
 * @returns {boolean} True if status is valid unified status
 */
export function isValidUnifiedStatus(status) {
  return getUnifiedStatuses()?.includes(status?.toLowerCase()?.trim());
}