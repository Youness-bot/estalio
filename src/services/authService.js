import { supabase } from '../lib/supabase';

export const authService = {
  async signIn(email, password) {
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('SignIn error:', error);
        return { data: null, error };
      }
      // 🚫 Check if user is active in user_profiles
const userId = data?.user?.id;

if (userId) {
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_active')
    .eq('id', userId)
    .single();
      console.log('CHECK_INACTIVE_STATUS →', profile?.is_active);
  if (profileError) {
    console.error('Profile fetch error:', profileError);
    return { data: null, error: { message: 'Erreur lors de la vérification du statut utilisateur.' } };
  }

  if (profile && profile.is_active === false) {
    // Force logout if session has been created
    await supabase.auth.signOut();

    return {
      data: null,
      error: { message: 'Votre compte est désactivé. Contactez un administrateur.' }
    };
  }
}
      return { data, error: null };
    } catch (error) {
      console.error('SignIn exception:', error);
      return { data: null, error: { message: 'Network error during sign in' } };
    }
  },

  async signUp(email, password, fullName, role = 'user') {
    try {
      // CRITICAL: Set metadata for is_admin_from_auth() function
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role, // This is essential for RLS admin function
            avatar_url: ''
          }
        }
      });
      
      if (error) {
        console.error('SignUp error:', error);
        
        // If public registrations are disabled, provide helpful error message
        if (error?.message?.includes('User not allowed') || error?.message?.includes('not authorized')) {
          return { 
            data: null, 
            error: { 
              ...error, 
              message: 'Les inscriptions publiques sont désactivées. Utilisez la fonction administrateur pour créer des utilisateurs.',
              isPublicRegistrationDisabled: true
            }
          };
        }
        
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('SignUp exception:', error);
      return { data: null, error: { message: 'Network error during sign up' } };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase?.auth?.signOut();
      
      if (error) {
        console.error('SignOut error:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('SignOut exception:', error);
      return { error: { message: 'Network error during sign out' } };
    }
  },

  async resetPassword(email) {
    try {
      const { error } = await supabase?.auth?.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      console.error('Reset password exception:', error);
      return { error: { message: 'Network error during password reset' } };
    }
  }
};