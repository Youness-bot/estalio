import { supabase } from '../lib/supabase';

export const auditService = {

  // ----------------------------------------------------
  // 🔥 ENREGISTRER UN ÉVÉNEMENT (fonction principale)
  // ----------------------------------------------------
  async logEvent({
    action,
    entityType = null,
    entityId = null,
    entityName = null,
    details = '',
    severity = 'medium',
    metadata = null,
    success = true
  }) {
    try {
      // Récupérer le user connecté
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        console.warn("⚠ Impossible d'enregistrer un log : utilisateur non authentifié.");
        return null;
      }

      // Préparer la ligne
      const logEntry = {
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        details,
        severity,
        metadata,
        success,
        user_agent: navigator?.userAgent || null,
        ip_address: null   // ajouté plus tard si nécessaire
      };

      // Insérer dans Supabase
      console.log("📌 AUDIT LOG TRIGGERED", logEntry);
      const { data, error } = await supabase
        .from('audit_logs')
        .insert(logEntry)
        .select()
        .single();

      if (error) {
        console.error("❌ Error inserting audit log:", error);
        return null;
      }

      return data;

    } catch (err) {
      console.error('💥 Exception in logEvent:', err);
      return null;
    }
  },

  // ----------------------------------------------------
  // 🔍 RÉCUPÉRER LES LOGS
  // ----------------------------------------------------
  async getAuditLogs() {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (err) {
      console.error("❌ Failed fetching audit logs:", err);
      return [];
    }
  },

  // ----------------------------------------------------
  // Exemples simples d’actions standards
  // ----------------------------------------------------
  async logLogin(success = true) {
    return this.logEvent({
      action: 'login',
      entityType: 'user',
      details: success ? 'Connexion réussie' : 'Tentative échouée',
      severity: success ? 'low' : 'high',
      success
    });
  },

  async logLogout() {
    return this.logEvent({
      action: 'logout',
      entityType: 'user',
      details: 'Utilisateur déconnecté',
      severity: 'low'
    });
  },

  async logEntityAction(action, entityType, entityId, entityName, details) {
    return this.logEvent({
      action,
      entityType,
      entityId,
      entityName,
      details
    });
  }
};
