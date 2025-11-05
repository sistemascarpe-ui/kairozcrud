import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('Smoke test: App renders Login page', () => {
  it('renders login form with email input label', async () => {
    render(<App />);
    // Debe existir el campo de correo electrónico en el formulario de login
    expect(await screen.findByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
    // Botón de acción principal
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });
});