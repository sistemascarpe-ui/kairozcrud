import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardCards = [
    {
      title: 'Inventario',
      icon: '📦',
      path: '/inventory-management',
    },
    {
      title: 'Clientes',
      icon: '👥',
      path: '/customer-management',
    },
    {
      title: 'Notas de Venta',
      icon: '🧾',
      path: '/sales-management',
    },
    {
      title: 'Métricas',
      icon: '📊',
      path: '/metrics-management',
    },
    {
      title: 'Marcas',
      icon: '🏷️',
      path: '/brand-management',
    },
    {
      title: 'Empresas',
      icon: '🏢',
      path: '/empresa-management',
    },
    {
      title: 'Adeudos',
      icon: '💰',
      path: '/adeudos-management',
    },
    {
      title: 'Admin Folios',
      icon: '⚙️',
      path: '/admin-folios',
    },
    {
      title: 'Campañas',
      icon: '📋',
      path: '/campaign-management',
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-blue-600">
      <header className="backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-10 w-auto drop-shadow-lg"
              />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white/90 drop-shadow">
                Bienvenido, {user?.email || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                className="text-white hover:text-orange-200 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white/10 backdrop-blur-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">Dashboard</h2>
          <p className="text-white/90 text-xl drop-shadow">Selecciona una opción</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className="backdrop-blur-sm rounded-3xl p-12 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-white/10 group"
            >
              <div className="text-center">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">{card.icon}</div>
                <h3 className="text-3xl font-bold text-white group-hover:text-orange-200 transition-colors duration-300 drop-shadow">{card.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;