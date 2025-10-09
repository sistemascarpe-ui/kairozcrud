import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import LoginFooter from './components/LoginFooter';

const LoginPage = () => {
  const { user, signIn, loading } = useAuth();
  const location = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');

  // Obtener la ruta desde donde vino el usuario (si fue redirigido)
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const handleSignIn = async (email, password) => {
    setIsSigningIn(true);
    setError('');
    
    try {
      const result = await signIn(email, password);
      
      if (result?.error) {
        toast.error(`Error de autenticación: ${result?.error}`);
        setError(result?.error);
      } else {
        toast.success('¡Bienvenido! Iniciando sesión...');
      }
      // Success case handled by auth context redirect
    } catch (err) {
      const errorMessage = 'Error de conexión. Intenta de nuevo.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - Ópticas Kairoz</title>
        <meta name="description" content="Accede a tu cuenta de Ópticas Kairoz para gestionar inventario y clientes" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md mx-auto px-4">
          <LoginHeader />
          
          <div className="mt-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{error}</span>
                  <button 
                    onClick={() => setError('')}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            <LoginForm 
              onSignIn={handleSignIn}
              isLoading={isSigningIn}
              error={error}
            />
          </div>
          
          <LoginFooter />
        </div>
      </div>
    </>
  );
};

export default LoginPage;