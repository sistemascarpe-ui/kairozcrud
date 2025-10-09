import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const LoginForm = ({ onSignIn, isLoading: parentLoading, error: parentError }) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Ingrese un correo electrónico válido';
    }

    if (!formData?.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData?.password?.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (onSignIn) {
      // Use parent's sign in handler
      onSignIn(formData.email, formData.password);
    } else {
      // Fallback to direct auth context usage
      setIsLoading(true);
      try {
        const result = await signIn(formData.email, formData.password);
        if (result?.error) {
          setErrors({ general: result.error });
        }
      } catch (error) {
        setErrors({ general: 'Error de conexión. Intente nuevamente.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPassword = () => {
    // Mock forgot password functionality
    alert('Funcionalidad de recuperación de contraseña próximamente disponible.');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error Message */}
        {(errors?.general || parentError) && (
          <div className="bg-error/10 border border-error/20 rounded-md p-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-error">{errors?.general || parentError}</p>
            </div>
          </div>
        )}

        {/* Email Input */}
        <Input
          label="Correo Electrónico"
          type="email"
          name="email"
          placeholder="ejemplo@kairozoptics.com"
          value={formData?.email}
          onChange={handleInputChange}
          error={errors?.email}
          required
          disabled={isLoading}
          className="w-full"
        />

        {/* Password Input */}
        <Input
          label="Contraseña"
          type="password"
          name="password"
          placeholder="Ingrese su contraseña"
          value={formData?.password}
          onChange={handleInputChange}
          error={errors?.password}
          required
          disabled={isLoading}
          className="w-full"
        />

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between">
          <Checkbox
            label="Recordarme"
            name="rememberMe"
            checked={formData?.rememberMe}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-primary hover:text-primary/80 transition-smooth"
            disabled={isLoading}
          >
            ¿Olvidó su contraseña?
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading || parentLoading}
          iconName="LogIn"
          iconPosition="left"
          disabled={isLoading || parentLoading}
        >
          {(isLoading || parentLoading) ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;