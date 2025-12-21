import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PropertyCard = ({
  property,
  onViewDetails,
  onArchive,
  onToggleActivation,
  onPublicView,
  onOwnerView,
  onShareWhatsApp,
  onReservation
}) => {
  const [showActions, setShowActions] = useState(false);

  // ✅ MAJ ICI : on lit le BON champ
  const lifecycleStatus = property?.status || 'available';
  const operationalStatus = property?.operationalStatus;

  const getLifecycleBadge = () => {
    switch (lifecycleStatus) {
      case 'available':
        return { label: 'Disponible', cls: 'bg-emerald-600 text-white' };
      case 'reserved':
        return { label: 'Réservée', cls: 'bg-amber-500 text-white' };
      case 'disabled':
        return { label: 'Désactivée', cls: 'bg-gray-400 text-white' };
      case 'archived':
        return { label: 'Archivée', cls: 'bg-slate-700 text-white' };
      default:
        return { label: lifecycleStatus, cls: 'bg-muted text-muted-foreground' };
    }
  };

  const getOperationalBadge = () => {
    switch (operationalStatus) {
      case 'cleaning':
        return { label: 'Cleaning', cls: 'bg-sky-500 text-white' };
      case 'maintenance':
        return { label: 'Maintenance', cls: 'bg-rose-600 text-white' };
      default:
        return null;
    }
  };

  const lifecycleBadge = getLifecycleBadge();
  const operationalBadge = getOperationalBadge();

  const handleArchiveToggle = () => {
    const nextArchived = lifecycleStatus !== 'archived';
    if (!window.confirm(
      nextArchived
        ? 'Archiver cette propriété ? Elle ne sera plus réservable.'
        : 'Désarchiver cette propriété ? Elle redeviendra disponible.'
    )) return;
    onArchive?.(property.id, lifecycleStatus);
  };

  const handleActivationToggle = () => {
    const nextDisabled = lifecycleStatus !== 'disabled';
    if (!window.confirm(
      nextDisabled
        ? 'Désactiver cette propriété ? Elle ne sera plus réservable.'
        : 'Activer cette propriété ? Elle redeviendra réservable.'
    )) return;
    onToggleActivation?.(property.id, lifecycleStatus);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card hover:shadow-modal transition-smooth">
      <div className="relative h-48">
        <Image
          src={property?.image}
          alt={property?.imageAlt}
          className="w-full h-full object-cover"
        />

        {/* BADGES */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className={`px-2 py-1 rounded-md text-xs font-semibold ${lifecycleBadge.cls}`}>
            {lifecycleBadge.label}
          </div>
          {operationalBadge && (
            <div className={`px-2 py-1 rounded-md text-xs font-semibold ${operationalBadge.cls}`}>
              {operationalBadge.label}
            </div>
          )}
        </div>

        {/* ACTIVER / DÉSACTIVER */}
        {lifecycleStatus !== 'reserved' && lifecycleStatus !== 'archived' && (
          <div className="absolute top-3 right-3">
            <button
              onClick={handleActivationToggle}
              className={`px-2 py-1 rounded-md text-xs font-semibold text-white ${
  lifecycleStatus === 'disabled'
    ? 'bg-blue-600 hover:bg-blue-700'     // Activer
    : 'bg-orange-500 hover:bg-orange-600' // Désactiver
}`}
            >
              {lifecycleStatus === 'disabled' ? 'Activer' : 'Désactiver'}
            </button>
          </div>
        )}

        {/* … */}
        <div className="absolute bottom-3 right-3">
          <Button
            variant="ghost"
            size="icon"
            iconName="MoreVertical"
            onClick={() => setShowActions(!showActions)}
            className="bg-card/90 backdrop-blur-sm"
          />

          {showActions && (
            <div className="absolute right-0 bottom-full mb-2 bg-popover border rounded-md shadow-modal z-10 min-w-[200px]">
              <button
                onClick={() => onPublicView?.(property)}
                className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted"
              >
                <Icon name="ExternalLink" size={14} />
                Public view
              </button>

              <button
  onClick={() => onOwnerView?.(property)}
  className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted"
>
  <Icon name="User" size={14} />
  Owner view
</button>


              <div className="border-t my-1" />

              <button
                onClick={handleArchiveToggle}
                className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted text-warning"
              >
                <Icon name="Archive" size={14} />
                {lifecycleStatus === 'archived' ? 'Désarchiver' : 'Archiver'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold">{property?.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{property?.location}</p>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2"><Icon name="Home" size={14} />{property?.type}</div>
          <div className="flex items-center gap-2"><Icon name="Maximize" size={14} />{property?.area} m²</div>
          <div className="flex items-center gap-2"><Icon name="Users" size={14} />{property?.capacity}</div>
          <div className="flex items-center gap-2"><Icon name="Bed" size={14} />{property?.bedrooms}</div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(property)}
            className="flex-1"
            iconName="Eye"
          >
            Détails
          </Button>

          <Button
            size="sm"
            onClick={() => onReservation?.(property)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            iconName="Calendar"
          >
            Réservation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
