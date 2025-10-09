import React from 'react';

const MetricCard = ({ 
  title, 
  value, 
  icon: IconComponent, 
  color = 'blue', 
  trend, 
  subtitle,
  loading = false 
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      trend: trend?.startsWith('+') ? 'text-green-600' : 'text-red-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      trend: trend?.startsWith('+') ? 'text-green-600' : 'text-red-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      trend: trend?.startsWith('+') ? 'text-green-600' : 'text-red-600'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      trend: trend?.startsWith('+') ? 'text-green-600' : 'text-red-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      trend: trend?.startsWith('+') ? 'text-green-600' : 'text-red-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          {IconComponent && <IconComponent size={20} className={colors.icon} />}
        </div>
      </div>
      
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      
      {(trend || subtitle) && (
        <div className="flex items-center space-x-2 text-sm">
          {trend && (
            <span className={`font-medium ${colors.trend}`}>
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-gray-500">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;