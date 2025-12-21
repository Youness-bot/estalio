import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';


import KPICard from './components/KPICard';
import TrendChart from './components/TrendChart';
import CalendarPreview from './components/CalendarPreview';
import TodaysTasks from './components/TodaysTasks';
import ServicesRevenue from './components/ServicesRevenue';
import ReservationsTable from './components/ReservationsTable';
import NewReservationModal from './components/NewReservationModal';

const Dashboard = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedCurrency = localStorage.getItem('currency') || 'USD';
    setCurrentLanguage(savedLanguage);
    setCurrentCurrency(savedCurrency);
    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const stats = await dashboardService?.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      setError(err?.message);
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'MAD': return 'د.م.';
      default: return '$';
    }
  };

  const formatCurrency = (amount, currency) => {
    const symbol = getCurrencySymbol(currency);
    const formattedAmount = amount?.toLocaleString();
    
    if (currency === 'MAD') {
      return `${formattedAmount} ${symbol}`;
    }
    return `${symbol}${formattedAmount}`;
  };

  const getKPIData = () => {
    if (!dashboardStats?.kpis) {
      return [];
    }

    const { kpis } = dashboardStats;
    const trends = dashboardStats?.trends || {};

    return [
      {
        title: currentLanguage === 'fr' ? 'Taux d\'Occupation' : currentLanguage === 'ar' ? 'معدل الإشغال' : 'Occupancy Rate',
        value: kpis?.properties?.occupancyRate,
        unit: '%',
        change: trends?.revenue?.direction === 'up' ? '+5.2%' : trends?.revenue?.direction === 'down' ? '-2.1%' : '0%',
        changeType: trends?.revenue?.direction === 'up' ? 'positive' : trends?.revenue?.direction === 'down' ? 'negative' : 'neutral',
        icon: 'Building',
        color: 'primary'
      },
      {
        title: currentLanguage === 'fr' ? 'Revenus Totaux' : currentLanguage === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
        value: formatCurrency(kpis?.revenue?.total, currentCurrency),
        unit: '',
        change: trends?.revenue?.change ? `${trends?.revenue?.change > 0 ? '+' : ''}${trends?.revenue?.change?.toFixed(1)}%` : '0%',
        changeType: trends?.revenue?.direction === 'up' ? 'positive' : trends?.revenue?.direction === 'down' ? 'negative' : 'neutral',
        icon: 'DollarSign',
        color: 'success'
      },
      {
        title: currentLanguage === 'fr' ? 'Tâches En Attente' : currentLanguage === 'ar' ? 'المهام المعلقة' : 'Pending Tasks',
        value: kpis?.tasks?.pending,
        unit: currentLanguage === 'fr' ? 'tâches' : currentLanguage === 'ar' ? 'مهام' : 'tasks',
        change: kpis?.tasks?.overdue > 0 ? `-${kpis?.tasks?.overdue}` : '0',
        changeType: kpis?.tasks?.overdue > 0 ? 'negative' : 'neutral',
        icon: 'Clock',
        color: 'warning'
      },
      {
        title: currentLanguage === 'fr' ? 'Réservations Confirmées' : currentLanguage === 'ar' ? 'الحجوزات المؤكدة' : 'Confirmed Reservations',
        value: kpis?.reservations?.confirmed,
        unit: currentLanguage === 'fr' ? 'réservations' : currentLanguage === 'ar' ? 'حجوزات' : 'bookings',
        change: `+${kpis?.reservations?.currentMonth}`,
        changeType: 'positive',
        icon: 'Calendar',
        color: 'accent'
      },
      {
        title: currentLanguage === 'fr' ? 'Propriétés Actives' : currentLanguage === 'ar' ? 'العقارات النشطة' : 'Active Properties',
        value: kpis?.properties?.published,
        unit: currentLanguage === 'fr' ? 'propriétés' : currentLanguage === 'ar' ? 'عقارات' : 'properties',
        change: kpis?.properties?.available > kpis?.properties?.occupied ? `+${kpis?.properties?.available - kpis?.properties?.occupied}` : '0',
        changeType: kpis?.properties?.available > kpis?.properties?.occupied ? 'positive' : 'neutral',
        icon: 'Home',
        color: 'secondary'
      }
    ];
  };

  const getPageTitle = () => {
    if (currentLanguage === 'fr') return 'Tableau de Bord';
    if (currentLanguage === 'ar') return 'لوحة التحكم';
    return 'Dashboard';
  };

  const getWelcomeMessage = () => {
    const currentHour = new Date()?.getHours();
    let greeting;
    
    if (currentLanguage === 'fr') {
      if (currentHour < 12) greeting = 'Bonjour';
      else if (currentHour < 18) greeting = 'Bon après-midi';
      else greeting = 'Bonsoir';
    } else if (currentLanguage === 'ar') {
      if (currentHour < 12) greeting = 'صباح الخير';
      else if (currentHour < 18) greeting = 'مساء الخير';
      else greeting = 'مساء الخير';
    } else {
      if (currentHour < 12) greeting = 'Good morning';
      else if (currentHour < 18) greeting = 'Good afternoon';
      else greeting = 'Good evening';
    }
    
    return `${greeting}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading dashboard: {error}</p>
          <button 
            onClick={loadDashboardData}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpiData = getKPIData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{getPageTitle()}</h1>
        <p className="text-muted-foreground">{getWelcomeMessage()}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {kpiData?.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi?.title}
            value={kpi?.value}
            unit={kpi?.unit}
            change={kpi?.change}
            changeType={kpi?.changeType}
            icon={kpi?.icon}
            color={kpi?.color}
          />
        ))}
      </div>

      {/* Charts and Calendar Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TrendChart 
            data={dashboardStats?.revenueAnalytics?.monthlyData || []}
            loading={loading}
          />
        </div>
        <div>
          <CalendarPreview 
            onNewReservation={() => setIsNewReservationModalOpen(true)}
          />
        </div>
      </div>

      {/* Tasks and Services Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodaysTasks />
        <ServicesRevenue 
          data={dashboardStats?.expenseAnalytics?.categoryBreakdown || {}}
          loading={loading}
        />
      </div>

      {/* Reservations Table */}
      <ReservationsTable />

      {/* New Reservation Modal */}
      <NewReservationModal
        isOpen={isNewReservationModalOpen}
        onClose={() => setIsNewReservationModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};

export default Dashboard;