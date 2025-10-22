import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authSyncService } from '../services/authSyncService';

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(null)

  // Separate async operations object to avoid auth callback issues
  const profileOperations = {
    async load(userId) {
      if (!userId) return
      setProfileLoading(true)
      try {
        // Primero intentar sincronizar el usuario
        const syncResult = await authSyncService.getCurrentUserSync()
        
        if (syncResult.data) {
          setUserProfile(syncResult.data)
        } else if (syncResult.error) {
          console.warn('No se pudo sincronizar usuario, intentando carga directa:', syncResult.error)
          // Fallback: intentar cargar directamente
          const { data, error } = await supabase?.from('usuarios')?.select('*')?.eq('id', userId)?.single()
          
          if (!error && data) {
            setUserProfile(data)
          }
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

  // Timeout de sesión deshabilitado - la sesión nunca se cierra automáticamente
  // La sesión permanecerá activa hasta que el usuario cierre sesión manualmente

  const resetSessionTimeout = (rememberMe = false) => {
    // Función mantenida para compatibilidad pero sin funcionalidad de timeout
    // Limpia cualquier timeout existente
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  };

  const clearSessionTimeout = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  };

  // Protected auth handlers - NEVER make these async
  const authStateHandlers = {
    onChange: (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        profileOperations?.load(session?.user?.id) // Fire-and-forget
        // Verificar si recordarme está activo
        const rememberMe = localStorage.getItem('kairoz_remember_me') === 'true';
        resetSessionTimeout(rememberMe); // Reiniciar timeout al hacer login
      } else {
        profileOperations?.clear()
        clearSessionTimeout(); // Limpiar timeout al hacer logout
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

    // Event listeners de actividad removidos - no se necesita monitorear actividad del usuario
    // ya que el timeout de sesión está deshabilitado

    return () => {
      subscription?.unsubscribe()
      clearSessionTimeout();
      // No hay event listeners que limpiar - timeout deshabilitado
    }
  }, [user])

  const signIn = async (email, password, rememberMe = false) => {
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password,
        options: {
          // Configurar duración de sesión basada en recordarme
          ...(rememberMe && {
            // Para recordarme, usar una sesión más larga
            // Esto se maneja principalmente en el frontend con localStorage
          })
        }
      })
      
      if (error) {
        if (error?.message?.includes('Invalid login credentials')) {
          return { error: 'Credenciales inválidas. Verifica tu email y contraseña.' }
        }
        return { error: error?.message };
      }
      
      // Guardar preferencia de recordarme
      if (rememberMe) {
        localStorage.setItem('kairoz_remember_me', 'true');
        localStorage.setItem('kairoz_remembered_email', email);
      } else {
        localStorage.removeItem('kairoz_remember_me');
        localStorage.removeItem('kairoz_remembered_email');
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
      clearSessionTimeout(); // Limpiar timeout al cerrar sesión
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