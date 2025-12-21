import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PropertyDetailsModal = ({ isOpen, onClose, property, onEdit }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !property) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'Home' },
    { id: 'reservations', label: 'Reservations', icon: 'Calendar' },
    { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
    { id: 'analytics', label: 'Analytics', icon: 'TrendingUp' }
  ];

  const mockReservations = [
    {
      id: 1,
      guest: "Sarah Johnson",
      checkIn: "2024-11-15",
      checkOut: "2024-11-18",
      status: "Confirmed",
      revenue: "$450"
    },
    {
      id: 2,
      guest: "Michael Chen",
      checkIn: "2024-11-20",
      checkOut: "2024-11-25",
      status: "Pending",
      revenue: "$750"
    }
  ];

  const mockTasks = [
    {
      id: 1,
      title: "Deep cleaning",
      assignee: "Maria Santos",
      dueDate: "2024-11-14",
      status: "In Progress"
    },
    {
      id: 2,
      title: "Maintenance check",
      assignee: "Ahmed Hassan",
      dueDate: "2024-11-16",
      status: "Pending"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-success text-success-foreground';
      case 'Pending': return 'bg-warning text-warning-foreground';
      case 'In Progress': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  /* =====================================================
     ⭐ EDIT PROPERTY — CENTRAL & CLEAN
  ===================================================== */
  const handleEditProperty = () => {
    onClose();
    if (onEdit) {
      onEdit(property); // 🔥 ouvre AddPropertyModal en mode EDIT
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden">
              <Image
                src={property?.image}
                alt={property?.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{property?.name}</h2>
              <p className="text-sm text-muted-foreground">
                {property?.propertyCode} • {property?.location}
              </p>
            </div>
          </div>

          {/* ✅ SINGLE EDIT BUTTON (BEST UX LOCATION) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Edit"
              onClick={handleEditProperty}
            >
              Edit
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              iconName="X"
            />
          </div>
        </div>

        {/* TABS */}
        <div className="border-b border-border">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">

          {activeTab === 'overview' && (
            <div className="space-y-6">

              <div className="aspect-video rounded-lg overflow-hidden">
                <Image
                  src={property?.image}
                  alt={property?.imageAlt}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Property Information</h3>

                  {[
                    ['Type', property?.type],
                    ['Area', `${property?.area} m²`],
                    ['Capacity', `${property?.capacity} guests`],
                    ['Bedrooms', property?.bedrooms]
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(property?.status)}`}>
                      {property?.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Performance</h3>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Occupancy Rate:</span>
                    <span className="font-medium">{property?.occupancyRate || 0}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Revenue:</span>
                    <span className="font-medium">{property?.monthlyRevenue || '—'}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="space-y-4">
              {mockReservations.map(r => (
                <div key={r.id} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <strong>{r.guest}</strong>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {r.checkIn} → {r.checkOut} · {r.revenue}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {mockTasks.map(t => (
                <div key={t.id} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-1">
                    <strong>{t.title}</strong>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t.assignee} · {t.dueDate}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default PropertyDetailsModal;
