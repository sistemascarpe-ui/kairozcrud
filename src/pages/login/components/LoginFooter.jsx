import React from 'react';
import Icon from '../../../components/AppIcon';

const LoginFooter = () => {
  const currentYear = new Date()?.getFullYear();

  return (
    <div className="mt-8 text-center space-y-4">
      {/* Security Notice */}
      <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
        <Icon name="Shield" size={16} />
        <span>Conexión segura y cifrada</span>
      </div>

      {/* Copyright */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          © {currentYear} Ópticas Kairoz. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginFooter;