import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import {
  X,
  LayoutDashboard,
  Calendar,
  FileText,
  CheckSquare,
  Building,
  Package,
  Users,
  UserCog,
  CreditCard,
  DollarSign,
  TrendingUp,
  Zap,
  Settings,
  Shield
} from 'lucide-react';

const Sidebar = ({ isOpen = false, onClose }) => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const location = useLocation();
  const { userProfile } = useAuth();

  // 🔥 READ PERMISSIONS FROM USER PROFILE
  const perms = userProfile?.permissions || {};

  // 🔥 MENU WITH PERMISSION BINDING
  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      perm: 'dashboard.view'
    },
    {
      path: '/reservations',
      label: 'Reservations',
      icon: Calendar,
      perm: 'reservations.view'
    },
    {
      path: '/reservation-details',
      label: 'Reservation Details',
      icon: FileText,
      perm: 'reservationDetails.view'
    },
    {
      path: '/tasks-and-planning',
      label: 'Tasks & Planning',
      icon: CheckSquare,
      perm: 'tasks.view'
    },
    {
      path: '/properties',
      label: 'Properties',
      icon: Building,
      perm: 'properties.view'
    },
    {
      path: '/inventory-management',
      label: 'Inventory',
      icon: Package,
      perm: 'inventory.view'
    },
    {
      path: '/team-and-hr',
      label: 'Team & HR',
      icon: Users,
      perm: 'team.view'
    },
    {
      path: '/users-management',
      label: 'Users',
      icon: UserCog,
      perm: 'users.view'
    },
    {
      path: '/expenses',
      label: 'Expenses',
      icon: CreditCard,
      perm: 'expenses.view'
    },
    {
      path: '/pricing-rules',
      label: 'Pricing Rules',
      icon: DollarSign,
      perm: 'pricing.view'
    },
    {
      path: '/revenues-and-reports',
      label: 'Revenues & Reports',
      icon: TrendingUp,
      perm: 'revenues.view'
    },
    {
      path: '/automation-and-ai',
      label: 'Automation & AI',
      icon: Zap,
      perm: 'automation.view'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      perm: 'settings.view'
    },
    {
      path: '/audit-log',
      label: 'Audit Log',
      icon: Shield,
      perm: 'audit.view'
    }
  ];

  // Track active menu
  useEffect(() => {
    const currentPath = location?.pathname;
    const currentItem = menuItems?.find(item => item?.path === currentPath);
    if (currentItem) setActiveItem(currentItem?.path);
    else if (currentPath === '/') setActiveItem('dashboard');
  }, [location?.pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-60 bg-background dark:bg-gray-800 
        border-r border-border dark:border-gray-700 z-50 transform transition-transform 
        duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-foreground dark:text-white">
                Estalio
              </span>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-muted dark:hover:bg-gray-700 rounded-md"
            >
              <X className="w-5 h-5 text-muted-foreground dark:text-gray-300" />
            </button>
          </div>

          {/* MENU */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">

            {menuItems
              ?.filter(item => perms?.[item?.perm] === true)  // 🔥 PERMISSION FILTER
              ?.map(item => {
                const isActive = location?.pathname === item?.path;

                return (
                  <Link
                    key={item?.path}
                    to={item?.path}
                    onClick={() => onClose?.()}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item?.label}</span>
                  </Link>
                );
              })}
          </nav>

          {/* FOOTER */}
          <div className="p-4 border-t border-border dark:border-gray-700">
            <div className="text-xs text-muted-foreground dark:text-gray-400 text-center">
              © 2024 Estalio
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
