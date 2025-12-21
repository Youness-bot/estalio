import { supabase } from '../lib/supabase';
import { PERMISSION_PRESETS } from "../config/permissionPresets";
import { auditService } from "./auditService"
;   // 🔥 AJOUT IMPORTANT

export const userService = {

  // --------------------------
  // GET ALL USERS
  // --------------------------
  async getAllUsers() {
    try {
      console.log('🔍 Fetching all users…');

      const { data: profiles, error } = await supabase
        ?.from('user_profiles')
        ?.select(`
          id,
          email,
          full_name,
          role,
          is_active,
          avatar_url,
          permissions,
          created_at,
          updated_at
        `)
        ?.order('created_at', { ascending: false });

      if (error) {
        console.error("❌ Failed fetching users:", error);
        throw new Error(error.message);
      }

      return profiles?.map(profile => ({
        id: profile?.id,
        email: profile?.email,
        fullName: profile?.full_name,
        role: profile?.role,
        isActive: profile?.is_active ?? true,
        avatarUrl: profile?.avatar_url || "",
        permissions: profile?.permissions || {},
        createdAt: profile?.created_at,
        updatedAt: profile?.updated_at
      })) || [];

    } catch (err) {
      console.error("💥 Exception:", err);
      throw err;
    }
  },

  // --------------------------
  // CREATE USER (EDGE FUNCTION)
  // --------------------------
  async createUser({ email, fullName, role, avatarUrl }) {
    try {
      console.log("🚀 Creating user via Edge Function:", email);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            email,
            fullName,
            role,
            avatarUrl
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Edge Function failed:", data);
        throw new Error(data?.error || "Failed to create user");
      }

      // 🔥 LOG CREATION USER
      await auditService.logEvent({
        action: "USER_CREATED",
        entityType: "user",
        entityId: data?.id || null,
        entityName: email,
        details: `Utilisateur créé avec rôle ${role}`,
        severity: "medium"
      });

      console.log("✅ User created successfully via Edge Function");
      return data;

    } catch (err) {
      console.error("💥 Exception in createUser:", err);
      throw err;
    }
  },

  // --------------------------
  // UPDATE ROLE + AUTO PERMISSIONS
  // --------------------------
  async updateUserRole(userId, newRole) {
    try {
      console.log(`🔧 Updating role: ${userId} → ${newRole}`);

      const preset = PERMISSION_PRESETS?.[newRole] || {};

      const { data, error } = await supabase
        ?.from("user_profiles")
        ?.update({
          role: newRole,
          permissions: preset
        })
        ?.eq("id", userId)
        ?.select("*")
        ?.single();

      if (error) {
        console.error("❌ Role update failed:", error);
        throw new Error(error.message);
      }

      // 🔥 LOG ROLE CHANGE
      await auditService.logEvent({
        action: "USER_ROLE_UPDATED",
        entityType: "user",
        entityId: userId,
        entityName: data.email,
        details: `Rôle changé en ${newRole}`,
        severity: "medium"
      });

      return { success: true, data };

    } catch (err) {
      console.error("💥 Exception in updateUserRole:", err);
      throw err;
    }
  },

  // --------------------------
  // TOGGLE STATUS
  // --------------------------
  async toggleUserStatus(userId, isActive) {
    try {
      console.log(`🔧 Updating status: ${userId} → ${isActive}`);

      const { data, error } = await supabase
        ?.from("user_profiles")
        ?.update({ is_active: isActive })
        ?.eq("id", userId)
        ?.select("*")
        ?.single();

      if (error) {
        console.error("❌ Status update failed:", error);
        throw new Error(error.message);
      }

      // 🔥 LOG STATUS CHANGE
      await auditService.logEvent({
        action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entityType: "user",
        entityId: data.id,
        entityName: data.email,
        details: isActive ? "Utilisateur activé" : "Utilisateur désactivé",
        severity: "low"
      });

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        isActive: data.is_active,
        avatarUrl: data.avatar_url,
        permissions: data.permissions,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

    } catch (err) {
      console.error("💥 Exception:", err);
      throw err;
    }
  },

  // --------------------------
  // DELETE USER
  // --------------------------
  async deleteUser(userId) {
    try {
      console.log(`🗑️ Deleting user: ${userId}`);

      const { error } = await supabase
        ?.from("user_profiles")
        ?.delete()
        ?.eq("id", userId);

      if (error) {
        console.error("❌ Delete failed:", error);
        throw new Error(error.message);
      }

      // 🔥 LOG DELETE
      await auditService.logEvent({
        action: "USER_DELETED",
        entityType: "user",
        entityId: userId,
        entityName: null,
        details: "Utilisateur supprimé",
        severity: "high"
      });

      return { success: true };

    } catch (err) {
      console.error("💥 Exception:", err);
      throw err;
    }
  },

  // --------------------------
  // UPDATE PERMISSIONS
  // --------------------------
  async updateUserPermissions(userId, newPermissions) {
    try {
      console.log(`🔧 Updating permissions for user: ${userId}`);

      const { data, error } = await supabase
        ?.from("user_profiles")
        ?.update({ permissions: newPermissions })
        ?.eq("id", userId)
        ?.select("*")
        ?.single();

      if (error) {
        console.error("❌ Permission update failed:", error);
        throw new Error(error.message);
      }

      // 🔥 LOG PERMISSIONS UPDATE
      await auditService.logEvent({
        action: "USER_PERMISSIONS_UPDATED",
        entityType: "user",
        entityId: userId,
        entityName: data.email,
        details: "Permissions modifiées manuellement",
        metadata: newPermissions,
        severity: "medium"
      });

      return { success: true, data };

    } catch (err) {
      console.error("💥 Exception:", err);
      throw err;
    }
  }
};
