import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const ClientInfoCard = ({ reservation }) => {
  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(`Hello ${reservation?.client?.name}, regarding your reservation ${reservation?.id}`);
    window.open(`https://wa.me/${reservation?.client?.phone?.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleEmailContact = () => {
    const subject = encodeURIComponent(`Reservation ${reservation?.id} - PropertyFlow`);
    window.open(`mailto:${reservation?.client?.email}?subject=${subject}`, '_blank');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Icon name="User" size={20} className="mr-2" />
          Client Information
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName="MessageCircle"
            onClick={handleWhatsAppContact}
          >
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Mail"
            onClick={handleEmailContact}
          >
            Email
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={reservation?.client?.avatar}
              alt={reservation?.client?.avatarAlt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-foreground">{reservation?.client?.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{reservation?.client?.nationality}</p>
            <div className="space-y-1">
              <div className="flex items-center text-sm">
                <Icon name="Mail" size={14} className="mr-2 text-muted-foreground" />
                <span className="text-foreground">{reservation?.client?.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <Icon name="Phone" size={14} className="mr-2 text-muted-foreground" />
                <span className="text-foreground">{reservation?.client?.phone}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Guest Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Adults:</span>
                <span className="ml-2 text-foreground font-medium">{reservation?.guests?.adults}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Children:</span>
                <span className="ml-2 text-foreground font-medium">{reservation?.guests?.children}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 text-foreground font-medium">{reservation?.guests?.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Language:</span>
                <span className="ml-2 text-foreground font-medium">{reservation?.client?.language}</span>
              </div>
            </div>
          </div>

          {reservation?.client?.preferences && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {reservation?.client?.preferences?.map((pref, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientInfoCard;