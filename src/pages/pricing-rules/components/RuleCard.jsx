import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RuleCard = ({ rule, onToggle, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRuleTypeColor = (type) => {
    switch (type) {
      case 'seasonal': return 'bg-accent text-accent-foreground';
      case 'occupancy': return 'bg-success text-success-foreground';
      case 'advance': return 'bg-primary text-primary-foreground';
      case 'lastminute': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const symbols = { USD: '$', EUR: '€', MAD: 'د.م.' };
    return `${symbols?.[currency] || '$'}${amount?.toLocaleString()}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-card transition-smooth">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{rule?.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRuleTypeColor(rule?.type)}`}>
              {rule?.type?.charAt(0)?.toUpperCase() + rule?.type?.slice(1)}
            </span>
            {rule?.isActive && (
              <span className="px-2 py-1 bg-success text-success-foreground rounded-full text-xs font-medium">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{rule?.description}</p>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Adjustment</p>
              <p className="text-sm font-medium text-foreground">
                {rule?.adjustmentType === 'percentage' ? `${rule?.adjustment > 0 ? '+' : ''}${rule?.adjustment}%` : formatCurrency(rule?.adjustment)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Properties</p>
              <p className="text-sm font-medium text-foreground">{rule?.properties?.length} selected</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valid From</p>
              <p className="text-sm font-medium text-foreground">{rule?.startDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valid Until</p>
              <p className="text-sm font-medium text-foreground">{rule?.endDate}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggle(rule?.id)}
            iconName={rule?.isActive ? "ToggleRight" : "ToggleLeft"}
            className={rule?.isActive ? "text-success" : "text-muted-foreground"}
          />
        </div>
      </div>
      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border pt-4 space-y-4">
          {/* Conditions */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Trigger Conditions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rule?.conditions?.minStay && (
                <div className="flex items-center space-x-2">
                  <Icon name="Calendar" size={16} />
                  <span className="text-sm text-muted-foreground">Min stay: {rule?.conditions?.minStay} nights</span>
                </div>
              )}
              {rule?.conditions?.advanceBooking && (
                <div className="flex items-center space-x-2">
                  <Icon name="Clock" size={16} />
                  <span className="text-sm text-muted-foreground">Advance: {rule?.conditions?.advanceBooking} days</span>
                </div>
              )}
              {rule?.conditions?.occupancyThreshold && (
                <div className="flex items-center space-x-2">
                  <Icon name="TrendingUp" size={16} />
                  <span className="text-sm text-muted-foreground">Occupancy: &gt;{rule?.conditions?.occupancyThreshold}%</span>
                </div>
              )}
              {rule?.conditions?.dayOfWeek && (
                <div className="flex items-center space-x-2">
                  <Icon name="Calendar" size={16} />
                  <span className="text-sm text-muted-foreground">Days: {rule?.conditions?.dayOfWeek?.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Properties */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Applied Properties</h4>
            <div className="flex flex-wrap gap-2">
              {rule?.properties?.slice(0, 5)?.map((property, index) => (
                <span key={index} className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                  {property}
                </span>
              ))}
              {rule?.properties?.length > 5 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                  +{rule?.properties?.length - 5} more
                </span>
              )}
            </div>
          </div>

          {/* Revenue Impact */}
          {rule?.revenueImpact && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Revenue Impact (Last 30 days)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Bookings Affected</p>
                  <p className="text-sm font-medium text-foreground">{rule?.revenueImpact?.bookingsAffected}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue Change</p>
                  <p className={`text-sm font-medium ${rule?.revenueImpact?.revenueChange >= 0 ? 'text-success' : 'text-error'}`}>
                    {rule?.revenueImpact?.revenueChange >= 0 ? '+' : ''}{formatCurrency(rule?.revenueImpact?.revenueChange)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Rate Change</p>
                  <p className={`text-sm font-medium ${rule?.revenueImpact?.avgRateChange >= 0 ? 'text-success' : 'text-error'}`}>
                    {rule?.revenueImpact?.avgRateChange >= 0 ? '+' : ''}{rule?.revenueImpact?.avgRateChange}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(rule)}
              iconName="Edit"
              iconPosition="left"
            >
              Edit Rule
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(rule?.id)}
              iconName="Trash2"
              iconPosition="left"
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleCard;