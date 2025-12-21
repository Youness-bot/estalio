import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const TeamMemberCard = ({ member, isAdmin, onEdit, onViewHistory }) => {
  const getRoleColor = (role) => {
    const colors = {
      'Manager': 'bg-primary text-primary-foreground',
      'Cleaner': 'bg-success text-success-foreground',
      'Maintenance': 'bg-warning text-warning-foreground',
      'Receptionist': 'bg-secondary text-secondary-foreground',
      'Administrator': 'bg-accent text-accent-foreground'
    };
    return colors?.[role] || 'bg-muted text-muted-foreground';
  };

  const getContractColor = (type) => {
    return type === 'Full-time' ? 'text-success' : 'text-warning';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-card transition-smooth">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Image
            src={member?.avatar}
            alt={member?.avatarAlt}
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {member?.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member?.role)}`}>
              {member?.role}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Icon name="Mail" size={14} className="mr-2" />
              <span className="truncate">{member?.email}</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Icon name="Calendar" size={14} className="mr-2" />
              <span>Started: {member?.startDate}</span>
            </div>

            <div className="flex items-center text-sm">
              <Icon name="FileText" size={14} className="mr-2 text-muted-foreground" />
              <span className={getContractColor(member?.contractType)}>
                {member?.contractType}
              </span>
            </div>

            {isAdmin && (
              <div className="flex items-center text-sm text-foreground font-medium">
                <Icon name="DollarSign" size={14} className="mr-2 text-muted-foreground" />
                <span>{member?.salary}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              iconName="Edit"
              iconPosition="left"
              onClick={() => onEdit(member)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="History"
              iconPosition="left"
              onClick={() => onViewHistory(member)}
            >
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="MessageCircle"
            >
              Contact
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberCard;