import React from 'react';
import Image from '../../../components/AppImage';

const LoginBackground = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-accent rounded-full blur-2xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
        {/* Hero Image */}
        <div className="mb-8 w-80 h-64 rounded-lg overflow-hidden shadow-soft">
          <Image
            src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=600&fit=crop"
            alt="Óptica moderna con gafas y equipos profesionales"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Welcome Content */}
        <div className="space-y-6 max-w-md">
          <h2 className="text-3xl font-bold text-foreground">
            Gestión Profesional de Óptica
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Sistema integral para la administración de inventario, clientes y prescripciones de su negocio óptico.
          </p>

          {/* Features List */}
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Control completo de inventario
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Gestión de clientes y prescripciones
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Reportes y análisis en tiempo real
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginBackground;