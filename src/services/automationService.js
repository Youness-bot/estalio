import { supabase } from '../lib/supabase';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const automationService = {
  // Get automation statistics
  async getStats() {
    try {
      const { data, error } = await supabase?.rpc('get_automation_stats');
      if (error) throw error;
      
      return data?.[0] || {
        totalTemplates: 0,
        activeWorkflows: 0,
        totalSent: 0,
        deliveryRate: 0,
        aiGenerations: 0
      };
    } catch (error) {
      console.error('Error fetching automation stats:', error);
      throw error;
    }
  },

  // Template management
  async getTemplates() {
    try {
      const { data, error } = await supabase?.from('automation_templates')?.select('*')?.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(template => ({
        id: template?.id,
        name: template?.name,
        description: template?.description,
        type: template?.template_type,
        category: template?.category,
        subject: template?.subject,
        content: template?.content,
        variables: template?.variables,
        isPublic: template?.is_public,
        usageCount: template?.usage_count,
        isAiGenerated: template?.is_ai_generated,
        aiPrompt: template?.ai_prompt,
        createdAt: template?.created_at,
        updatedAt: template?.updated_at
      })) || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  async createTemplate(templateData) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('automation_templates')?.insert({
          user_id: user?.id,
          name: templateData?.name,
          description: templateData?.description,
          template_type: templateData?.type,
          category: templateData?.category,
          subject: templateData?.subject,
          content: templateData?.content,
          variables: templateData?.variables || {},
          is_public: templateData?.isPublic || false,
          is_ai_generated: templateData?.isAiGenerated || false,
          ai_prompt: templateData?.aiPrompt
        })?.select()?.single();

      if (error) throw error;

      return {
        id: data?.id,
        name: data?.name,
        description: data?.description,
        type: data?.template_type,
        category: data?.category,
        subject: data?.subject,
        content: data?.content,
        variables: data?.variables,
        isPublic: data?.is_public,
        usageCount: data?.usage_count,
        isAiGenerated: data?.is_ai_generated,
        aiPrompt: data?.ai_prompt,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  async updateTemplate(templateId, templateData) {
    try {
      const { data, error } = await supabase?.from('automation_templates')?.update({
          name: templateData?.name,
          description: templateData?.description,
          template_type: templateData?.type,
          category: templateData?.category,
          subject: templateData?.subject,
          content: templateData?.content,
          variables: templateData?.variables,
          is_public: templateData?.isPublic
        })?.eq('id', templateId)?.select()?.single();

      if (error) throw error;

      return {
        id: data?.id,
        name: data?.name,
        description: data?.description,
        type: data?.template_type,
        category: data?.category,
        subject: data?.subject,
        content: data?.content,
        variables: data?.variables,
        isPublic: data?.is_public,
        usageCount: data?.usage_count,
        isAiGenerated: data?.is_ai_generated,
        aiPrompt: data?.ai_prompt,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  async deleteTemplate(templateId) {
    try {
      const { error } = await supabase?.from('automation_templates')?.delete()?.eq('id', templateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  // AI generation
  async generateMessageWithAI(prompt, messageType = 'whatsapp', category = 'welcome') {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create AI generation record
      const { data: generationRecord, error: createError } = await supabase?.from('ai_generation_history')?.insert({
          user_id: user?.id,
          prompt,
          template_type: messageType,
          category: category,
          status: 'generating',
          model_used: 'gpt-5-mini'
        })?.select()?.single();

      if (createError) throw createError;

      const startTime = Date.now();

      try {
        // Enhanced system prompts for different message types
        const systemPrompts = {
          whatsapp: 'You are an expert at creating engaging WhatsApp messages for property management. Create messages that are friendly, concise, use appropriate emojis, and follow WhatsApp best practices. Keep messages under 1000 characters and use line breaks for readability.',
          email: 'You are an expert at creating professional email communications for property management. Create well-structured emails with clear subject lines, proper formatting, and a professional yet warm tone. Include relevant sections and use proper email etiquette.',
          sms: 'You are an expert at creating concise SMS messages for property management. Keep messages under 160 characters, be clear and direct, and include only essential information.',
          push_notification: 'You are an expert at creating engaging push notifications for property management apps. Keep messages under 50 characters for title and 120 characters for body. Make them actionable and clear.'
        };

        const categoryContext = {
          welcome: 'Welcome new guests warmly and set expectations',
          checkin: 'Provide clear check-in instructions and helpful information',
          checkout: 'Remind about checkout procedures and request feedback',
          followup: 'Thank guests and encourage reviews while offering future incentives',
          recommendations: 'Suggest local attractions, restaurants, or activities',
          confirmations: 'Confirm bookings and provide reassurance',
          reminders: 'Gentle reminders about upcoming events or requirements'
        };

        const response = await openai?.chat?.completions?.create({
          model: 'gpt-5-mini',
          messages: [
            { 
              role: 'system', 
              content: `${systemPrompts?.[messageType] || systemPrompts?.whatsapp}\n\nContext: ${categoryContext?.[category] || 'General property management communication'}\n\nInclude relevant template variables like {{guestName}}, {{propertyName}}, {{checkInDate}}, {{checkOutDate}} where appropriate. Make the message engaging and professional.`
            },
            { 
              role: 'user', 
              content: prompt 
            },
          ],
          reasoning_effort: 'low', // Fast generation for templates
          verbosity: 'medium', // Balanced detail
        });

        const generatedContent = response?.choices?.[0]?.message?.content;
        const generationTime = Date.now() - startTime;

        // Update generation record with success
        const { error: updateError } = await supabase?.from('ai_generation_history')?.update({
            generated_content: generatedContent,
            status: 'completed',
            generation_time_ms: generationTime,
            tokens_used: response?.usage?.total_tokens || 0
          })?.eq('id', generationRecord?.id);

        if (updateError) console.error('Error updating generation record:', updateError);

        return {
          content: generatedContent,
          generationId: generationRecord?.id,
          tokensUsed: response?.usage?.total_tokens || 0,
          generationTime
        };

      } catch (aiError) {
        // Update generation record with failure
        const { error: failureError } = await supabase?.from('ai_generation_history')?.update({
            status: 'failed',
            error_message: aiError?.message,
            generation_time_ms: Date.now() - startTime
          })?.eq('id', generationRecord?.id);

        if (failureError) console.error('Error updating failure record:', failureError);

        throw aiError;
      }
    } catch (error) {
      console.error('Error generating message with AI:', error);
      throw error;
    }
  },

  async saveAIGenerationAsTemplate(generationId, templateName, templateDescription) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get generation record
      const { data: generation, error: getError } = await supabase?.from('ai_generation_history')?.select('*')?.eq('id', generationId)?.single();

      if (getError) throw getError;

      // Extract template variables from content
      const variableRegex = /\{\{(\w+)\}\}/g;
      const matches = generation?.generated_content?.match(variableRegex) || [];
      const variables = {};
      matches?.forEach(match => {
        const key = match?.replace(/[{}]/g, '');
        variables[key] = `${key?.charAt(0)?.toUpperCase()}${key?.slice(1)?.replace(/([A-Z])/g, ' $1')?.toLowerCase()}`;
      });

      // Create template
      const { data: template, error: createError } = await supabase?.from('automation_templates')?.insert({
          user_id: user?.id,
          name: templateName,
          description: templateDescription,
          template_type: generation?.template_type,
          category: generation?.category,
          content: generation?.generated_content,
          variables: variables,
          is_ai_generated: true,
          ai_prompt: generation?.prompt
        })?.select()?.single();

      if (createError) throw createError;

      // Update generation record with template reference
      const { error: linkError } = await supabase?.from('ai_generation_history')?.update({ template_id: template?.id })?.eq('id', generationId);

      if (linkError) console.error('Error linking generation to template:', linkError);

      return {
        id: template?.id,
        name: template?.name,
        description: template?.description,
        type: template?.template_type,
        category: template?.category,
        content: template?.content,
        variables: template?.variables,
        isAiGenerated: template?.is_ai_generated,
        aiPrompt: template?.ai_prompt,
        createdAt: template?.created_at
      };
    } catch (error) {
      console.error('Error saving AI generation as template:', error);
      throw error;
    }
  },

  // Workflow management
  async getWorkflows() {
    try {
      const { data, error } = await supabase?.from('automation_workflows')?.select(`
          *,
          template:automation_templates(name, template_type, category)
        `)?.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(workflow => ({
        id: workflow?.id,
        name: workflow?.name,
        description: workflow?.description,
        triggerType: workflow?.trigger_type,
        triggerConditions: workflow?.trigger_conditions,
        templateId: workflow?.template_id,
        template: workflow?.template,
        delayMinutes: workflow?.delay_minutes,
        status: workflow?.status,
        isActive: workflow?.is_active,
        executionCount: workflow?.execution_count,
        lastExecutedAt: workflow?.last_executed_at,
        createdAt: workflow?.created_at,
        updatedAt: workflow?.updated_at
      })) || [];
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  },

  async createWorkflow(workflowData) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('automation_workflows')?.insert({
          user_id: user?.id,
          name: workflowData?.name,
          description: workflowData?.description,
          trigger_type: workflowData?.triggerType,
          trigger_conditions: workflowData?.triggerConditions || {},
          template_id: workflowData?.templateId,
          delay_minutes: workflowData?.delayMinutes || 0,
          status: workflowData?.status || 'draft',
          is_active: workflowData?.isActive || false
        })?.select()?.single();

      if (error) throw error;

      return {
        id: data?.id,
        name: data?.name,
        description: data?.description,
        triggerType: data?.trigger_type,
        triggerConditions: data?.trigger_conditions,
        templateId: data?.template_id,
        delayMinutes: data?.delay_minutes,
        status: data?.status,
        isActive: data?.is_active,
        executionCount: data?.execution_count,
        lastExecutedAt: data?.last_executed_at,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  },

  async updateWorkflow(workflowId, workflowData) {
    try {
      const { data, error } = await supabase?.from('automation_workflows')?.update({
          name: workflowData?.name,
          description: workflowData?.description,
          trigger_type: workflowData?.triggerType,
          trigger_conditions: workflowData?.triggerConditions,
          template_id: workflowData?.templateId,
          delay_minutes: workflowData?.delayMinutes,
          status: workflowData?.status,
          is_active: workflowData?.isActive
        })?.eq('id', workflowId)?.select()?.single();

      if (error) throw error;

      return {
        id: data?.id,
        name: data?.name,
        description: data?.description,
        triggerType: data?.trigger_type,
        triggerConditions: data?.trigger_conditions,
        templateId: data?.template_id,
        delayMinutes: data?.delay_minutes,
        status: data?.status,
        isActive: data?.is_active,
        executionCount: data?.execution_count,
        lastExecutedAt: data?.last_executed_at,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  },

  async deleteWorkflow(workflowId) {
    try {
      const { error } = await supabase?.from('automation_workflows')?.delete()?.eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  },

  // Analytics
  async getAnalytics(dateRange = 30) {
    try {
      const startDate = new Date();
      startDate?.setDate(startDate?.getDate() - dateRange);

      const { data, error } = await supabase?.from('automation_analytics')?.select(`
          *,
          template:automation_templates(name, template_type, category)
        `)?.gte('sent_at', startDate?.toISOString())?.order('sent_at', { ascending: false });

      if (error) throw error;

      return data?.map(analytics => ({
        id: analytics?.id,
        templateId: analytics?.template_id,
        template: analytics?.template,
        workflowId: analytics?.workflow_id,
        propertyId: analytics?.property_id,
        reservationId: analytics?.reservation_id,
        sentAt: analytics?.sent_at,
        deliveredAt: analytics?.delivered_at,
        openedAt: analytics?.opened_at,
        clickedAt: analytics?.clicked_at,
        repliedAt: analytics?.replied_at,
        deliveryStatus: analytics?.delivery_status,
        errorDetails: analytics?.error_details,
        recipientInfo: analytics?.recipient_info
      })) || [];
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // AI Generation History
  async getAIGenerationHistory() {
    try {
      const { data, error } = await supabase?.from('ai_generation_history')?.select('*')?.order('created_at', { ascending: false })?.limit(50);

      if (error) throw error;

      return data?.map(generation => ({
        id: generation?.id,
        prompt: generation?.prompt,
        templateType: generation?.template_type,
        category: generation?.category,
        generatedContent: generation?.generated_content,
        status: generation?.status,
        errorMessage: generation?.error_message,
        modelUsed: generation?.model_used,
        tokensUsed: generation?.tokens_used,
        generationTimeMs: generation?.generation_time_ms,
        templateId: generation?.template_id,
        createdAt: generation?.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching AI generation history:', error);
      throw error;
    }
  },

  // Public templates
  async getPublicTemplates() {
    try {
      const { data, error } = await supabase?.from('automation_templates')?.select('*')?.eq('is_public', true)?.order('usage_count', { ascending: false });

      if (error) throw error;

      return data?.map(template => ({
        id: template?.id,
        name: template?.name,
        description: template?.description,
        type: template?.template_type,
        category: template?.category,
        subject: template?.subject,
        content: template?.content,
        variables: template?.variables,
        usageCount: template?.usage_count,
        isAiGenerated: template?.is_ai_generated,
        createdAt: template?.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching public templates:', error);
      throw error;
    }
  },

  // Copy public template to user's templates
  async copyPublicTemplate(publicTemplateId) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get public template
      const { data: template, error: getError } = await supabase?.from('automation_templates')?.select('*')?.eq('id', publicTemplateId)?.eq('is_public', true)?.single();

      if (getError) throw getError;

      // Create copy for user
      const { data: newTemplate, error: createError } = await supabase?.from('automation_templates')?.insert({
          user_id: user?.id,
          name: `${template?.name} (Copy)`,
          description: template?.description,
          template_type: template?.template_type,
          category: template?.category,
          subject: template?.subject,
          content: template?.content,
          variables: template?.variables,
          is_public: false,
          is_ai_generated: template?.is_ai_generated,
          ai_prompt: template?.ai_prompt
        })?.select()?.single();

      if (createError) throw createError;

      // Increment usage count of public template
      const { error: incrementError } = await supabase?.from('automation_templates')?.update({ usage_count: template?.usage_count + 1 })?.eq('id', publicTemplateId);

      if (incrementError) console.error('Error incrementing usage count:', incrementError);

      return {
        id: newTemplate?.id,
        name: newTemplate?.name,
        description: newTemplate?.description,
        type: newTemplate?.template_type,
        category: newTemplate?.category,
        subject: newTemplate?.subject,
        content: newTemplate?.content,
        variables: newTemplate?.variables,
        isAiGenerated: newTemplate?.is_ai_generated,
        aiPrompt: newTemplate?.ai_prompt,
        createdAt: newTemplate?.created_at
      };
    } catch (error) {
      console.error('Error copying public template:', error);
      throw error;
    }
  }
};