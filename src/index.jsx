import React from "react";
import { createRoot } from "react-dom/client";
import { injectSpeedInsights } from '@vercel/speed-insights';
import { inject } from '@vercel/analytics';
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";

// Inyectar Speed Insights y Analytics solo fuera de entornos locales
try {
  const host = window?.location?.hostname || '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  const isPrivateLAN = host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.local');
  if (!isLocalHost && !isPrivateLAN) {
    injectSpeedInsights();
    inject();
  }
} catch (_) {
  // No afectar flujo de la app si falla la inyección
}

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);