import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Separate async operations object to avoid auth callback issues
  const profileOperations = {
    async load(userId) {
      if (!userId) return
      setProfileLoading(true)
      try {
        const { data, error } = await supabase?.from('usuarios')?.select('*')?.eq('id', userId)?.single()
        
        if (!error && data) {
          setUserProfile(data)
        }
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

  // Protected auth handlers - NEVER make these async
  const authStateHandlers = {
    onChange: (event, session) => {
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
    // Get initial session
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
      authStateHandlers?.onChange(null, session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      authStateHandlers?.onChange
    )

    return () => subscription?.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        if (error?.message?.includes('Invalid login credentials')) {
          return { error: 'Credenciales inválidas. Verifica tu email y contraseña.' }
        }
        return { error: error?.message };
      }
      
      return { data }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          error: 'No se puede conectar al servidor. Tu proyecto Supabase puede estar pausado. Verifica tu dashboard de Supabase.' 
        }
      }
      return { error: 'Error de conexión. Intenta de nuevo.' }
    }
  }

  const signUp = async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) {
        return { error: error?.message };
      }
      
      return { data }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          error: 'No se puede conectar al servidor. Verifica tu conexión de internet.' 
        }
      }
      return { error: 'Error al crear cuenta. Intenta de nuevo.' }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase?.auth?.signOut()
      if (error) {
        return { error: error?.message };
      }
      return { success: true }
    } catch (error) {
      return { error: 'Error al cerrar sesión.' }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext