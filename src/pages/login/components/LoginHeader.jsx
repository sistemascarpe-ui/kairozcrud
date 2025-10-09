import React from 'react';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-soft">
            <img 
              src="/logo.png" 
              alt="Ópticas Kairoz Logo" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-foreground">
              Ópticas Kairoz
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestión
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Bienvenido de vuelta
        </h2>
        <p className="text-muted-foreground">
          Ingrese sus credenciales para acceder al sistema
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;