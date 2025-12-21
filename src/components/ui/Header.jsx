import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, ChevronDown, Menu, X } from 'lucide-react';

const Header = () => {
  const { user, userProfile, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (!error) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleProfileClick = () => {
    navigate('/account-profile');
    setShowProfileMenu(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setShowProfileMenu(false);
  };

  const displayName =
    userProfile?.fullName ||
    user?.email?.split('@')?.[0] ||
    'Utilisateur';

  const displayEmail = userProfile?.email || user?.email || '';

  const displayRole = userProfile?.role || 'Utilisateur';

  const initials =
    userProfile?.fullName?.charAt(0)?.toUpperCase() ||
    userProfile?.email?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'E';

  return (
    <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200/80 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-white">E</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                Estalio
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Property & booking workspace
              </span>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Language / currency */}
            <div className="flex items-center space-x-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <span className="uppercase tracking-wide">FR</span>
              </div>
              <span className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center space-x-1">
                <span className="tracking-wide">EUR</span>
              </div>
            </div>

            {/* Auth area */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 px-2 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-gray-800 transition-colors duration-150 shadow-sm"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-semibold text-white">
                    {initials}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-medium text-gray-900 dark:text-white max-w-[140px] truncate">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {displayRole}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {displayName}
                      </div>
                      {displayEmail && (
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                          {displayEmail}
                        </div>
                      )}
                      <div className="mt-1 text-[10px] inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 border border-blue-100 dark:border-blue-800">
                        {displayRole}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Mon profil
                      </button>

                      <button
                        onClick={handleSettingsClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Paramètres
                      </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-900"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors duration-150"
              >
                Se connecter
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 pb-4">
            <div className="pt-3 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                <span>Langue : FR</span>
                <span>Devise : EUR</span>
              </div>

              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 px-1">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-semibold text-white">
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {displayName}
                      </span>
                      {displayEmail && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {displayEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full px-1 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Mon profil
                  </button>

                  <button
                    onClick={handleSettingsClick}
                    className="flex items-center w-full px-1 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-1 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-900 rounded-lg"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Se déconnecter
                  </button>
                </div>
              ) : (
                <div className="px-1">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Se connecter
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close profile dropdown */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;
