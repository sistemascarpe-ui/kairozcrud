import React from 'react';
import Icon from '../../../components/AppIcon';

const CustomerStats = ({ customers }) => {
  const totalCustomers = customers?.length;
  const activeCustomers = customers?.filter(c => c?.status === 'active')?.length;
  const newCustomersThisMonth = customers?.filter(c => {
    const customerDate = new Date(c.createdAt);
    const now = new Date();
    return customerDate?.getMonth() === now?.getMonth() && 
           customerDate?.getFullYear() === now?.getFullYear();
  })?.length;
  
  const recentVisits = customers?.filter(c => {
    const visitDate = new Date(c.lastVisit);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo?.setDate(thirtyDaysAgo?.getDate() - 30);
    return visitDate >= thirtyDaysAgo;
  })?.length;

  const stats = [
    {
      id: 1,
      title: 'Total Clientes',
      value: totalCustomers,
      icon: 'Users',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: '+12%',
      changeType: 'positive'
    },
    {
      id: 2,
      title: 'Clientes Activos',
      value: activeCustomers,
      icon: 'UserCheck',
      color: 'text-success',
      bgColor: 'bg-success/10',
      change: '+8%',
      changeType: 'positive'
    },
    {
      id: 3,
      title: 'Nuevos Este Mes',
      value: newCustomersThisMonth,
      icon: 'UserPlus',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      change: '+24%',
      changeType: 'positive'
    },
    {
      id: 4,
      title: 'Visitas Recientes',
      value: recentVisits,
      icon: 'Calendar',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      change: '+5%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats?.map((stat) => (
        <div key={stat?.id} className="bg-card rounded-lg border border-border p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat?.title}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stat?.value?.toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg ${stat?.bgColor} flex items-center justify-center`}>
              <Icon name={stat?.icon} size={24} className={stat?.color} />
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            <Icon 
              name={stat?.changeType === 'positive' ? 'TrendingUp' : 'TrendingDown'} 
              size={16} 
              className={stat?.changeType === 'positive' ? 'text-success' : 'text-error'} 
            />
            <span className={`text-sm font-medium ml-1 ${
              stat?.changeType === 'positive' ? 'text-success' : 'text-error'
            }`}>
              {stat?.change}
            </span>
            <span className="text-sm text-muted-foreground ml-1">
              vs mes anterior
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomerStats;