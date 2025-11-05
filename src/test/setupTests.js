import { expect } from 'vitest';
import matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// Mock de Supabase para evitar llamadas reales en pruebas
import { vi } from 'vitest';

vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: (cb) => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Invalid login credentials' } }),
        signOut: async () => ({ error: null })
      }
    }
  };
});

// Mock de authSyncService para evitar dependencias externas
vi.mock('../services/authSyncService', () => {
  return {
    authSyncService: {
      getCurrentUserSync: async () => ({ data: null, error: null, userNotFound: true })
    }
  };
});

// Silenciar window.scrollTo no implementado en jsdom
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-undef
  window.scrollTo = vi.fn();
}