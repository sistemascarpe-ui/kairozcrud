import React from 'react';
import { vi, describe, it, expect } from 'vitest';

// Mock de App para evitar montar toda la aplicación
vi.mock('./App', () => ({ default: () => React.createElement('div', null, 'AppMock') }));

// Mocks de Vercel scripts
const injectSpeedInsightsMock = vi.fn();
const injectAnalyticsMock = vi.fn();
vi.mock('@vercel/speed-insights', () => ({ injectSpeedInsights: injectSpeedInsightsMock }));
vi.mock('@vercel/analytics', () => ({ inject: injectAnalyticsMock }));

describe('Index injection gating', () => {
  it('does not inject Vercel scripts in localhost', async () => {
    // Preparar el container root
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    // Importar index.jsx (ejecuta el gating)
    await import('./index.jsx');

    // En entorno jsdom/localhost, no debe llamarse la inyección
    expect(injectSpeedInsightsMock).not.toHaveBeenCalled();
    expect(injectAnalyticsMock).not.toHaveBeenCalled();
  });
});