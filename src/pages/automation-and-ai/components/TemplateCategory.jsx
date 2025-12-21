import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TemplateCategory = ({ 
  category, 
  templates, 
  onSelectTemplate, 
  selectedTemplate 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getCategoryIcon = () => {
    switch (category?.id) {
      case 'checkin':
        return 'Key';
      case 'recommendations':
        return 'MapPin';
      case 'confirmations':
        return 'CheckCircle';
      case 'followup':
        return 'MessageCircle';
      case 'maintenance':
        return 'Wrench';
      default:
        return 'FileText';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Category Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted transition-smooth"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name={getCategoryIcon()} size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{category?.name}</h3>
            <p className="text-sm text-muted-foreground">{templates?.length} templates</p>
          </div>
        </div>
        <Icon 
          name={isExpanded ? "ChevronUp" : "ChevronDown"} 
          size={16} 
          className="text-muted-foreground" 
        />
      </div>
      {/* Templates List */}
      {isExpanded && (
        <div className="border-t border-border">
          {templates?.map((template) => (
            <div
              key={template?.id}
              className={`p-4 border-b border-border last:border-b-0 cursor-pointer transition-smooth ${
                selectedTemplate?.id === template?.id 
                  ? 'bg-primary/5 border-l-4 border-l-primary' :'hover:bg-muted'
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">{template?.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{template?.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Icon name="Clock" size={12} />
                      <span>{template?.estimatedTime}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Globe" size={12} />
                      <span>{template?.languages?.join(', ')}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {template?.isPopular && (
                    <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                      Popular
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    iconName="ExternalLink"
                    className="h-8 w-8"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateCategory;