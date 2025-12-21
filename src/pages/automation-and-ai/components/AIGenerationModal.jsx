import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { automationService } from '../../../services/automationService';

const AIGenerationModal = ({ isOpen, onClose, onGenerate, template }) => {
  const [prompt, setPrompt] = useState('');
  const [messageType, setMessageType] = useState('whatsapp');
  const [category, setCategory] = useState('welcome');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [generationId, setGenerationId] = useState(null);

  const messageTypeOptions = [
    { value: 'whatsapp', label: 'WhatsApp Message' },
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'push_notification', label: 'Push Notification' }
  ];

  const categoryOptions = [
    { value: 'welcome', label: 'Welcome Messages' },
    { value: 'checkin', label: 'Check-in Instructions' },
    { value: 'checkout', label: 'Check-out Messages' },
    { value: 'followup', label: 'Follow-up Messages' },
    { value: 'recommendations', label: 'Local Recommendations' },
    { value: 'confirmations', label: 'Booking Confirmations' },
    { value: 'reminders', label: 'Reminders' }
  ];

  React.useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setPrompt('');
      setGeneratedContent('');
      setError('');
      setTemplateName('');
      setTemplateDescription('');
      setGenerationId(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prompt?.trim()) {
      setError('Please enter a prompt for AI generation');
      return;
    }

    try {
      setIsGenerating(true);
      setError('');
      
      const result = await automationService?.generateMessageWithAI(prompt, messageType, category);
      
      setGeneratedContent(result?.content);
      setGenerationId(result?.generationId);
      
      // Auto-generate template name from prompt
      const autoName = prompt?.slice(0, 50)?.replace(/[^\w\s]/gi, '')?.trim();
      setTemplateName(autoName || 'AI Generated Template');
      setTemplateDescription(`Generated ${messageType} ${category} message`);
      
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!generatedContent || !templateName?.trim()) {
      setError('Please generate content and provide a template name');
      return;
    }

    try {
      setIsGenerating(true);
      
      await automationService?.saveAIGenerationAsTemplate(
        generationId,
        templateName,
        templateDescription
      );
      
      onGenerate?.(generatedContent);
      onClose();
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard?.writeText(generatedContent);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="Sparkles" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI Message Generator</h2>
              <p className="text-sm text-muted-foreground">Generate personalized messages with AI</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Message Type
              </label>
              <Select
                options={messageTypeOptions}
                value={messageType}
                onChange={setMessageType}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <Select
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Describe what you want to generate
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e?.target?.value)}
                placeholder="E.g., Create a friendly welcome message for guests arriving at a beachfront property with check-in instructions and local recommendations..."
                className="w-full h-24 p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isGenerating}
              />
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt?.trim()}
              className="w-full"
              iconName={isGenerating ? "Loader" : "Sparkles"}
              iconPosition="left"
            >
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={16} className="text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            </div>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Generated Content</h3>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Icon name="Copy" size={16} className="mr-2" />
                  Copy
                </Button>
              </div>
              
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                  {generatedContent}
                </pre>
              </div>

              {/* Save as Template */}
              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="text-sm font-medium text-foreground">Save as Template</h4>
                
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Template Name
                  </label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e?.target?.value)}
                    placeholder="Enter template name..."
                    disabled={isGenerating}
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Description (Optional)
                  </label>
                  <Input
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e?.target?.value)}
                    placeholder="Enter template description..."
                    disabled={isGenerating}
                  />
                </div>

                <Button
                  onClick={handleSaveAsTemplate}
                  disabled={isGenerating || !templateName?.trim()}
                  className="w-full"
                  iconName={isGenerating ? "Loader" : "Save"}
                  iconPosition="left"
                >
                  {isGenerating ? 'Saving...' : 'Save as Template'}
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && !generatedContent && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Icon name="Loader" size={32} className="animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Generating your message with AI...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Icon name="Info" size={14} />
            <span>AI-generated content may require review and customization</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {!generatedContent && (
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt?.trim()}
              >
                Generate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerationModal;