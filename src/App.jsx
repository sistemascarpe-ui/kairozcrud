import React from "react";
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { MetricsProvider } from './contexts/MetricsContext';
import QueryProvider from './contexts/QueryProvider';
import Routes from "./Routes";

function App() {
  return (
    <HelmetProvider>
      <QueryProvider>
        <AuthProvider>
          <MetricsProvider>
            <Routes />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                    color: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                    color: '#fff',
                  },
                },
              }}
            />
          </MetricsProvider>
        </AuthProvider>
      </QueryProvider>
    </HelmetProvider>
  );
}

export default App;