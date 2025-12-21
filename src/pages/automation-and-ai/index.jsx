import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import AutomationBlock from './components/AutomationBlock';
import TemplateCategory from './components/TemplateCategory';
import AIGenerationModal from './components/AIGenerationModal';
import AutomationStats from './components/AutomationStats';
import WorkflowBuilder from './components/WorkflowBuilder';
import { automationService } from '../../services/automationService';

const AutomationAndAI = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [generatingBlocks, setGeneratingBlocks] = useState({});
  
  // Real data states
  const [templates, setTemplates] = useState([]);
  const [publicTemplates, setPublicTemplates] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [templatesData, publicTemplatesData, workflowsData, statsData] = await Promise.all([
        automationService?.getTemplates(),
        automationService?.getPublicTemplates(),
        automationService?.getWorkflows(),
        automationService?.getStats()
      ]);

      setTemplates(templatesData);
      setPublicTemplates(publicTemplatesData);
      setWorkflows(workflowsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading automation data:', err);
      setError('Failed to load automation data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await automationService?.getAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  // Group templates by category
  const getTemplateCategories = () => {
    const categories = {};
    templates?.forEach(template => {
      if (!categories?.[template?.category]) {
        categories[template.category] = {
          id: template?.category,
          name: getCategoryDisplayName(template?.category),
          templates: []
        };
      }
      categories?.[template?.category]?.templates?.push({
        id: template?.id,
        name: template?.name,
        description: template?.description,
        estimatedTime: '2 min',
        languages: ['EN'],
        isPopular: template?.usageCount > 10,
        isAiGenerated: template?.isAiGenerated
      });
    });
    return Object.values(categories);
  };

  const getCategoryDisplayName = (category) => {
    const displayNames = {
      checkin: 'Check-in Instructions',
      checkout: 'Check-out Messages',
      welcome: 'Welcome Messages',
      followup: 'Follow-up Messages',
      recommendations: 'Local Recommendations',
      confirmations: 'Booking Confirmations',
      reminders: 'Reminders'
    };
    return displayNames?.[category] || category?.charAt(0)?.toUpperCase() + category?.slice(1);
  };

  const quickActionTemplates = templates?.slice(0, 4)?.map(template => ({
    id: template?.id,
    type: template?.type,
    title: template?.name,
    description: template?.description,
    template: template?.content
  }));

  const tabOptions = [
    { value: 'templates', label: 'Message Templates' },
    { value: 'workflows', label: 'Automation Workflows' },
    { value: 'analytics', label: 'Performance Analytics' }
  ];

  const handleGenerate = async (blockId) => {
    setGeneratingBlocks(prev => ({ ...prev, [blockId]: true }));
    
    try {
      // Find the template for this block
      const template = templates?.find(t => t?.id === blockId);
      if (template?.aiPrompt) {
        // Regenerate using AI
        await automationService?.generateMessageWithAI(
          template?.aiPrompt,
          template?.type,
          template?.category
        );
      }
      
      setTimeout(() => {
        setGeneratingBlocks(prev => ({ ...prev, [blockId]: false }));
        setShowAIModal(true);
      }, 1500);
    } catch (err) {
      console.error('Error generating content:', err);
      setGeneratingBlocks(prev => ({ ...prev, [blockId]: false }));
    }
  };

  const handleCopy = (template) => {
    navigator.clipboard?.writeText(template);
  };

  const handleSaveWorkflow = async (workflow) => {
    try {
      await automationService?.createWorkflow(workflow);
      await loadData(); // Refresh workflows
      setShowWorkflowBuilder(false);
    } catch (err) {
      console.error('Error saving workflow:', err);
    }
  };

  const handleAIGeneration = async (content) => {
    try {
      await loadData(); // Refresh templates if AI generated and saved
    } catch (err) {
      console.error('Error after AI generation:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading automation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automation & AI</h1>
            <p className="text-muted-foreground">
              Streamline guest communications with intelligent automation
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select
              options={tabOptions}
              value={activeTab}
              onChange={setActiveTab}
              className="w-48"
            />
            <Button
              variant="default"
              onClick={() => setShowWorkflowBuilder(true)}
              iconName="Plus"
              iconPosition="left"
            >
              New Workflow
            </Button>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="p-6">
        {activeTab === 'templates' && (
          <>
            {/* Stats */}
            <AutomationStats stats={stats} />

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
                  <p className="text-sm text-muted-foreground">
                    Generate messages instantly with AI assistance
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowAIModal(true)}
                  iconName="Sparkles"
                  iconPosition="left"
                >
                  Generate Custom Message
                </Button>
              </div>

              {quickActionTemplates?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {quickActionTemplates?.map((block) => (
                    <AutomationBlock
                      key={block?.id}
                      type={block?.type}
                      title={block?.title}
                      description={block?.description}
                      template={block?.template}
                      onGenerate={() => handleGenerate(block?.id)}
                      onCopy={() => handleCopy(block?.template)}
                      isGenerating={generatingBlocks?.[block?.id]}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon name="MessageSquare" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No templates available yet</p>
                  <Button
                    variant="default"
                    onClick={() => setShowAIModal(true)}
                    iconName="Sparkles"
                    iconPosition="left"
                  >
                    Create Your First Template
                  </Button>
                </div>
              )}
            </div>

            {/* Template Library */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Template Library</h2>
                  <p className="text-sm text-muted-foreground">
                    Browse and customize pre-built message templates
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={loadData}
                  iconName="RefreshCw"
                  iconPosition="left"
                >
                  Refresh Templates
                </Button>
              </div>

              <div className="space-y-4">
                {getTemplateCategories()?.map((category) => (
                  <TemplateCategory
                    key={category?.id}
                    category={category}
                    templates={category?.templates}
                    onSelectTemplate={setSelectedTemplate}
                    selectedTemplate={selectedTemplate}
                  />
                ))}
                
                {getTemplateCategories()?.length === 0 && (
                  <div className="text-center py-8">
                    <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">No template categories available</p>
                    <Button
                      variant="outline"
                      onClick={() => setShowAIModal(true)}
                      iconName="Plus"
                      iconPosition="left"
                    >
                      Create Template
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'workflows' && (
          <div className="bg-card border border-border rounded-lg p-6">
            {workflows?.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Active Workflows</h3>
                    <p className="text-muted-foreground">Manage your automation workflows</p>
                  </div>
                  <Button
                    variant="default"
                    onClick={() => setShowWorkflowBuilder(true)}
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Create Workflow
                  </Button>
                </div>
                
                {workflows?.map((workflow) => (
                  <div key={workflow?.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{workflow?.name}</h4>
                        <p className="text-sm text-muted-foreground">{workflow?.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>Trigger: {workflow?.triggerType?.replace('_', ' ')}</span>
                          <span>Status: {workflow?.status}</span>
                          <span>Executions: {workflow?.executionCount || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${workflow?.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm text-muted-foreground">
                          {workflow?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Icon name="Workflow" size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Automation Workflows</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create intelligent workflows that automatically respond to guest actions and booking events
                </p>
                <Button
                  variant="default"
                  onClick={() => setShowWorkflowBuilder(true)}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Create Your First Workflow
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-card border border-border rounded-lg p-6">
            {analytics?.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Performance Analytics</h3>
                    <p className="text-muted-foreground">Track message delivery and engagement</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={loadAnalytics}
                    iconName="RefreshCw"
                    iconPosition="left"
                  >
                    Refresh Analytics
                  </Button>
                </div>
                
                {/* Analytics content would go here */}
                <div className="text-center py-8">
                  <Icon name="BarChart3" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Analytics dashboard coming soon</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Icon name="BarChart3" size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Performance Analytics</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Track message delivery rates, guest engagement, and automation effectiveness
                </p>
                <Button
                  variant="outline"
                  onClick={loadAnalytics}
                  iconName="TrendingUp"
                  iconPosition="left"
                >
                  Load Analytics
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Modals */}
      <AIGenerationModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGeneration}
        template={selectedTemplate}
      />
      <WorkflowBuilder
        isOpen={showWorkflowBuilder}
        onClose={() => setShowWorkflowBuilder(false)}
        onSave={handleSaveWorkflow}
        templates={templates}
      />
    </div>
  );
};

export default AutomationAndAI;