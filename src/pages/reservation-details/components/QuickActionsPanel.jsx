import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionsPanel = ({ reservation, onGenerateAI, onCopyDetails, onPrintInvoice }) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      await onGenerateAI();
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCopyDetails = async () => {
    try {
      await onCopyDetails();
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy details:', error);
    }
  };

  const handlePrintInvoice = () => {
    // Add print-specific styles
    const printStyles = `
      <style>
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { font-size: 12px; }
          .invoice-header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .invoice-details { margin-bottom: 20px; }
          .invoice-table { width: 100%; border-collapse: collapse; }
          .invoice-table th, .invoice-table td { border: 1px solid #000; padding: 8px; text-align: left; }
          .invoice-total { font-weight: bold; background-color: #f0f0f0; }
        }
      </style>
    `;

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${reservation?.id}</title>
          ${printStyles}
        </head>
        <body>
          <div class="invoice-header">
            <h1>PropertyFlow Invoice</h1>
            <p><strong>Reservation ID:</strong> ${reservation?.id}</p>
            <p><strong>Date:</strong> ${new Date()?.toLocaleDateString()}</p>
          </div>
          
          <div class="invoice-details">
            <h2>Client Information</h2>
            <p><strong>Name:</strong> ${reservation?.client?.name}</p>
            <p><strong>Email:</strong> ${reservation?.client?.email}</p>
            <p><strong>Phone:</strong> ${reservation?.client?.phone}</p>
          </div>

          <div class="invoice-details">
            <h2>Stay Details</h2>
            <p><strong>Property:</strong> ${reservation?.property?.name}</p>
            <p><strong>Check-in:</strong> ${new Date(reservation.dates.checkIn)?.toLocaleDateString()}</p>
            <p><strong>Check-out:</strong> ${new Date(reservation.dates.checkOut)?.toLocaleDateString()}</p>
            <p><strong>Guests:</strong> ${reservation?.guests?.total} (${reservation?.guests?.adults} adults, ${reservation?.guests?.children} children)</p>
          </div>

          <table class="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Accommodation</td>
                <td>$${reservation?.payment?.gross?.toFixed(2)}</td>
              </tr>
              ${reservation?.payment?.fees?.map(fee => `
                <tr>
                  <td>${fee?.name}</td>
                  <td>-$${fee?.amount?.toFixed(2)}</td>
                </tr>
              `)?.join('')}
              <tr class="invoice-total">
                <td><strong>Total</strong></td>
                <td><strong>$${reservation?.payment?.net?.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 40px;">
            <p><strong>Payment Status:</strong> ${reservation?.payment?.status}</p>
            <p><strong>Payment Method:</strong> ${reservation?.payment?.method}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow?.document?.write(invoiceContent);
    printWindow?.document?.close();
    printWindow?.print();
  };

  const quickActions = [
    {
      id: 'generate-ai',
      label: 'Generate AI Message',
      icon: 'Sparkles',
      variant: 'default',
      loading: isGeneratingAI,
      onClick: handleGenerateAI,
      description: 'Create personalized guest communication'
    },
    {
      id: 'copy-details',
      label: showCopySuccess ? 'Copied!' : 'Copy Details',
      icon: showCopySuccess ? 'Check' : 'Copy',
      variant: 'outline',
      onClick: handleCopyDetails,
      description: 'Copy reservation information to clipboard'
    },
    {
      id: 'print-invoice',
      label: 'Print Invoice',
      icon: 'Printer',
      variant: 'outline',
      onClick: handlePrintInvoice,
      description: 'Generate printable invoice'
    },
    {
      id: 'edit-reservation',
      label: 'Edit Reservation',
      icon: 'Edit',
      variant: 'ghost',
      onClick: () => console.log('Edit reservation'),
      description: 'Modify booking details'
    },
    {
      id: 'cancel-reservation',
      label: 'Cancel Reservation',
      icon: 'X',
      variant: 'destructive',
      onClick: () => console.log('Cancel reservation'),
      description: 'Cancel this booking'
    }
  ];

  const navigationActions = [
    {
      id: 'view-property',
      label: 'View Property',
      icon: 'Building',
      path: '#/properties',
      description: 'Go to property details'
    },
    {
      id: 'view-tasks',
      label: 'View All Tasks',
      icon: 'CheckSquare',
      path: '#/tasks-and-planning',
      description: 'Open task management'
    },
    {
      id: 'back-to-reservations',
      label: 'Back to Reservations',
      icon: 'ArrowLeft',
      path: '#/reservations',
      description: 'Return to reservations list'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center mb-6">
        <Icon name="Zap" size={20} className="mr-2" />
        <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
      </div>
      <div className="space-y-6">
        {/* Primary Actions */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Reservation Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            {quickActions?.map((action) => (
              <div key={action?.id} className="group">
                <Button
                  variant={action?.variant}
                  fullWidth
                  iconName={action?.icon}
                  iconPosition="left"
                  loading={action?.loading}
                  onClick={action?.onClick}
                  className="justify-start"
                >
                  {action?.label}
                </Button>
                <p className="text-xs text-muted-foreground mt-1 px-3 opacity-0 group-hover:opacity-100 transition-smooth">
                  {action?.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Actions */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Navigation</h3>
          <div className="space-y-2">
            {navigationActions?.map((action) => (
              <div key={action?.id} className="group">
                <Button
                  variant="ghost"
                  fullWidth
                  iconName={action?.icon}
                  iconPosition="left"
                  onClick={() => window.location.href = action?.path}
                  className="justify-start text-muted-foreground hover:text-foreground"
                >
                  {action?.label}
                </Button>
                <p className="text-xs text-muted-foreground mt-1 px-3 opacity-0 group-hover:opacity-100 transition-smooth">
                  {action?.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Reservation Status */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground mb-3">Reservation Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-foreground font-medium">{reservation?.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Channel:</span>
              <span className="text-foreground font-medium">{reservation?.channel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="text-foreground font-medium">
                {new Date()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="pt-4 border-t border-border">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Icon name="AlertTriangle" size={16} className="text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">Emergency Contact</span>
            </div>
            <p className="text-xs text-red-700">
              For urgent issues, contact property manager: +1 (555) 123-4567
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel;