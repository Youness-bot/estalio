import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [initError, setInitError] = useState(null)

  // Isolated async operations - never called from auth callbacks
  const profileOperations = {
    async load(userId) {
      if (!userId || !supabase) return
      setProfileLoading(true)
      try {
        const { data, error } = await supabase
          ?.from('user_profiles')
          ?.select('*')
          ?.eq('id', userId)
          ?.single()

        if (!error) setUserProfile(data)
      } catch (error) {
        console.error('Profile load error:', error)
      } finally {
        setProfileLoading(false)
      }
    },

    clear() {
      setUserProfile(null)
      setProfileLoading(false)
    }
  }

  // Auth state handlers - PROTECTED from async modification
  const authStateHandlers = {
    // This handler MUST remain synchronous - Supabase requirement
    onChange: (event, session) => {
      // 🚫 BLOCK AUTO-LOGIN DURING PASSWORD RECOVERY
      if (event === "PASSWORD_RECOVERY") {
        setUser(null)
        setLoading(false)
        profileOperations?.clear()
        return
      }

      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        profileOperations?.load(session?.user?.id) // Fire-and-forget
      } else {
        profileOperations?.clear()
      }
    }
  }

  useEffect(() => {
    // Validate Supabase client before initialization
    if (!supabase) {
      console.error('Supabase client is not initialized. Check environment variables.')
      setInitError('Supabase configuration error. Please check your setup.')
      setLoading(false)
      return
    }

    // Validate auth object exists
    if (!supabase?.auth) {
      console.error('Supabase auth is not available.')
      setInitError('Authentication system is not available.')
      setLoading(false)
      return
    }

    // Initial session check with error handling for invalid refresh tokens
    const initializeAuth = async () => {
      try {
        // Additional validation before calling getSession
        if (typeof supabase?.auth?.getSession !== 'function') {
          console.error('supabase.auth.getSession is not a function')
          setInitError('Authentication method not available.')
          setLoading(false)
          return
        }

        const { data: { session }, error } = await supabase?.auth?.getSession()
        
        // Handle specific refresh token errors
        if (error) {
          if (
            error?.message?.includes('refresh_token_not_found') || 
            error?.message?.includes('Invalid Refresh Token')
          ) {
            // Silently clear invalid session
            await supabase?.auth?.signOut()
            authStateHandlers?.onChange(null, null)
            return
          }
          console.error('Auth initialization error:', error)
        }
        
        authStateHandlers?.onChange(null, session)
      } catch (err) {
        console.error('Failed to initialize auth:', err)
        setInitError(err?.message || 'Failed to initialize authentication')
        // Clear any stale session data
        authStateHandlers?.onChange(null, null)
      }
    }

    initializeAuth()

    // CRITICAL: This must remain synchronous and only execute if supabase exists
    let subscription = null
    if (supabase?.auth?.onAuthStateChange) {
      const { data } = supabase?.auth?.onAuthStateChange(authStateHandlers?.onChange)
      subscription = data?.subscription
    }

    return () => {
      if (subscription?.unsubscribe) {
        subscription?.unsubscribe()
      }
    };
  }, [])

  // Auth methods using service layer
  const signIn = async (email, password) => {
    if (!supabase) {
      return { error: { message: 'Authentication service not available.' } }
    }

    try {
      const result = await authService?.signIn(email, password)

      // Check is_active
      if (!result?.error && result?.data?.user) {
        const userId = result?.data?.user?.id;

        const { data: profile } = await supabase
          ?.from('user_profiles')
          ?.select('is_active')
          ?.eq('id', userId)
          ?.single()

        if (profile && profile?.is_active === false) {
          await supabase?.auth?.signOut();
          return {
            error: { message: "Votre compte est désactivé. Contactez l\'administrateur." }
          };
        }
      }

      return result

    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const signUp = async (email, password, fullName, role = 'user') => {
    if (!supabase) {
      return { error: { message: 'Authentication service not available.' } }
    }

    try {
      const result = await authService?.signUp(email, password, fullName, role)
      return result
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      return { error: { message: 'Authentication service not available.' } }
    }

    try {
      const result = await authService?.signOut()
      if (!result?.error) {
        setUser(null)
        profileOperations?.clear()
      }
      return result
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: { message: 'No user logged in' } }
    if (!supabase) {
      return { error: { message: 'Database service not available.' } }
    }
    
    try {
      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.update(updates)
        ?.eq('id', user?.id)
        ?.select()
        ?.single()

      if (!error) setUserProfile(data)
      return { data, error }

    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    initError,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}