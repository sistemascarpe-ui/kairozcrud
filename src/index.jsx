import React from "react";
import { createRoot } from "react-dom/client";
import { injectSpeedInsights } from '@vercel/speed-insights';
import { inject } from '@vercel/analytics';
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";

// Inyectar Speed Insights y Analytics
injectSpeedInsights();
inject();

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);