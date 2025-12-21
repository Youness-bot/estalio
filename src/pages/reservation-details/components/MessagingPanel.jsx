import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const MessagingPanel = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState('whatsapp');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp)?.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    // Simulate AI generation
    setTimeout(() => {
      const aiMessage = selectedTab === 'whatsapp' 
        ? "Hello! Thank you for choosing our property. Your check-in details have been sent to your email. Looking forward to hosting you! 🏠"
        : "Dear Guest,\n\nThank you for your reservation. We're excited to welcome you to our property. Please find your check-in instructions attached.\n\nBest regards,\nPropertyFlow Team";
      
      setNewMessage(aiMessage);
      setIsGeneratingAI(false);
    }, 2000);
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard?.writeText(content);
    // You could add a toast notification here
  };

  const handleSendMessage = () => {
    if (newMessage?.trim()) {
      onSendMessage({
        type: selectedTab,
        content: newMessage,
        sender: 'You',
        timestamp: new Date(),
        direction: 'outgoing'
      });
      setNewMessage('');
    }
  };

  const filteredMessages = messages?.filter(msg => msg?.type === selectedTab);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Icon name="MessageSquare" size={20} className="mr-2" />
          Communication History
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Sparkles"
            loading={isGeneratingAI}
            onClick={handleGenerateAI}
          >
            Generate AI Message
          </Button>
        </div>
      </div>
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setSelectedTab('whatsapp')}
          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
            selectedTab === 'whatsapp' ?'bg-card text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="MessageCircle" size={16} className="mr-2" />
          WhatsApp
        </button>
        <button
          onClick={() => setSelectedTab('email')}
          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
            selectedTab === 'email' ?'bg-card text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="Mail" size={16} className="mr-2" />
          Email
        </button>
      </div>
      {/* Messages List */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto scrollbar-thin">
        {filteredMessages?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="MessageSquare" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No {selectedTab} messages yet</p>
          </div>
        ) : (
          filteredMessages?.map((message, index) => (
            <div
              key={index}
              className={`flex ${message?.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message?.direction === 'outgoing' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{message?.sender}</span>
                  <button
                    onClick={() => handleCopyMessage(message?.content)}
                    className="opacity-70 hover:opacity-100 transition-smooth"
                  >
                    <Icon name="Copy" size={12} />
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message?.content}</p>
                <p className="text-xs opacity-70 mt-2">{formatTimestamp(message?.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Message Input */}
      <div className="space-y-3">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={`Type your ${selectedTab} message...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e?.target?.value)}
              onKeyPress={(e) => e?.key === 'Enter' && handleSendMessage()}
            />
          </div>
          <Button
            variant="default"
            iconName="Send"
            onClick={handleSendMessage}
            disabled={!newMessage?.trim()}
          >
            Send
          </Button>
        </div>
        
        {newMessage && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              iconName="Copy"
              onClick={() => handleCopyMessage(newMessage)}
            >
              Copy Message
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPanel;