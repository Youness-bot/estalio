import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AutomationBlock = ({ 
  type, 
  title, 
  description, 
  template, 
  onGenerate, 
  onCopy,
  isGenerating = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeIcon = () => {
    switch (type) {
      case 'whatsapp':
        return 'MessageCircle';
      case 'email':
        return 'Mail';
      case 'sms':
        return 'Smartphone';
      default:
        return 'MessageSquare';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'whatsapp':
        return 'text-green-600';
      case 'email':
        return 'text-blue-600';
      case 'sms':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-card transition-smooth">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-muted ${getTypeColor()}`}>
            <Icon name={getTypeIcon()} size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
        />
      </div>

      {/* Template Preview */}
      <div className={`mb-4 transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-20'} overflow-hidden`}>
        <div className="bg-muted rounded-md p-3">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
            {template}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        <Button
          variant="default"
          onClick={onGenerate}
          loading={isGenerating}
          iconName="Sparkles"
          iconPosition="left"
          className="flex-1 sm:flex-none"
        >
          Generate with AI
        </Button>
        <Button
          variant="outline"
          onClick={onCopy}
          iconName="Copy"
          iconPosition="left"
        >
          Copy Template
        </Button>
        <Button
          variant="ghost"
          size="icon"
          iconName="Edit"
        />
      </div>
    </div>
  );
};

export default AutomationBlock;