// Lightweight adminService stub for Estalio SPA (frontend only, no service_role key)

export const adminService = {
  // Indique au code que l'admin "avancé" n'est pas configuré
  isConfigured() {
    return false;
  },

  getConfigStatus() {
    return {
      hasUrl: !!import.meta.env?.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env?.VITE_SUPABASE_ANON_KEY,
      hasServiceKey: false,
      clientCreated: false,
    };
  },

  async createUser() {
    return {
      data: null,
      error: {
        message: 'Admin service not configured. Using profile-only creation.',
        code: 'ADMIN_SERVICE_NOT_CONFIGURED',
      },
    };
  },

  async getAllUsersWithAuthStatus() {
    return {
      data: null,
      error: {
        message: 'Admin service not configured. Use fallback (user_profiles) only.',
        code: 'ADMIN_SERVICE_NOT_CONFIGURED',
      },
    };
  },

  async resendInvite() {
    return {
      data: null,
      error: { message: 'Invite emails via admin service are disabled in this setup.' },
    };
  },

  async sendRecoveryEmail() {
    return {
      data: null,
      error: { message: 'Use the public "Mot de passe oublié" form instead.' },
    };
  },

  async updateUserRole() {
    return {
      data: null,
      error: { message: 'Admin role updates via service role are disabled.' },
    };
  },

  async updateUserStatus() {
    return {
      data: null,
      error: { message: 'Admin status updates via service role are disabled.' },
    };
  },
};
