import React from 'react';

/**
 * CancellationBadge Component
 * 
 * Displays a unified cancellation status badge with color-coded status and optional channel tag
 * 
 * @param {string} status - Unified internal status: "cancelled", "declined", "voided", "failed", "unknown"
 * @param {string|null} channel - Source channel: "booking", "airbnb", "direct", etc.
 */
const CancellationBadge = ({ status, channel = null }) => {
  // Status configuration mapping
  const statusConfig = {
    cancelled: {
      color: 'bg-green-100 text-green-800 border-green-300',
      label: 'Cancelled'
    },
    declined: {
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      label: 'Declined'
    },
    voided: {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      label: 'Voided'
    },
    failed: {
      color: 'bg-red-100 text-red-800 border-red-300',
      label: 'Failed'
    },
    unknown: {
      color: 'bg-gray-200 text-gray-700 border-gray-400',
      label: 'Unknown'
    }
  };

  // Channel display names
  const channelLabels = {
    booking: 'Booking',
    airbnb: 'Airbnb',
    direct: 'Direct',
    expedia: 'Expedia',
    vrbo: 'VRBO'
  };

  // Get status configuration (fallback to unknown if status not found)
  const config = statusConfig?.[status?.toLowerCase()] || statusConfig?.unknown;
  
  // Get channel display name
  const channelLabel = channel ? (channelLabels?.[channel?.toLowerCase()] || channel) : null;

  return (
    <div className="inline-flex items-center gap-2">
      {/* Status Badge */}
      <span 
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config?.color}`}
      >
        {config?.label}
      </span>
      {/* Channel Tag (conditional) */}
      {channelLabel && (
        <span 
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
        >
          {channelLabel}
        </span>
      )}
    </div>
  );
};

export default CancellationBadge;