import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  Home,
  Code2,
  Terminal,
  Clock,
  Settings,
  Menu,
  X,
  Globe,
  User,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';

// Import API service
import { apiService } from '../services/api';

interface NavItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
}

const HomePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && userMenuOpen) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [userMenuOpen]);

  // Get user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      const user = apiService.getCurrentUser();
      console.log('🏠 [HomePage] User data:', user);
      setCurrentUser(user);
      
      // If no user found, redirect to login
      if (!user) {
        console.log('🏠 [HomePage] No user found, redirecting to login');
        navigate('/auth/login');
      }
    };
    
    loadUserData();
    
    // Listen for storage changes (in case user logs in/out from another tab)
    const handleStorageChange = () => {
      loadUserData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  const navigation: NavItem[] = [
    { id: 'dashboard', name: 'Dashboard', icon: <Home size={20} />, path: '/app/dashboard' },
    { id: 'translator', name: 'Translator', icon: <Globe size={20} />, path: '/app/translator' },
    { id: 'compiler', name: 'Compiler', icon: <Terminal size={20} />, path: '/app/compiler' },
    { id: 'history', name: 'History', icon: <Clock size={20} />, path: '/app/history' },
    { id: 'settings', name: 'Settings', icon: <Settings size={20} />, path: '/app/settings' },
  ];

  // Get current nav item based on path
  const getCurrentNavItem = () => {
    const currentPath = location.pathname;
    // Check for exact matches first
    const exactMatch = navigation.find(item => item.path === currentPath);
    if (exactMatch) return exactMatch;
    
    // Check for partial matches (for nested routes)
    const partialMatch = navigation.find(item => currentPath.startsWith(item.path));
    return partialMatch || navigation[0];
  };

  const currentNavItem = getCurrentNavItem();

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === 'true';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleLogout = () => {
    console.log('🏠 [HomePage] Logging out...');
    apiService.logout();
    navigate('/auth/login');
  };

  // Get first letter of username for avatar
  const getUserInitial = () => {
    if (!currentUser?.name) {
      // Check if we have email
      if (currentUser?.email) {
        return currentUser.email.charAt(0).toUpperCase();
      }
      return 'U';
    }
    
    // Get first letter of username
    return currentUser.name.charAt(0).toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!currentUser) return 'Loading...';
    return currentUser.name || currentUser.email?.split('@')[0] || 'User';
  };

  // Get user email
  const getUserEmail = () => {
    if (!currentUser) return 'Loading...';
    return currentUser.email || 'No email';
  };

  // Get page description
  const getPageDescription = (pageId: string): string => {
    const descriptions: Record<string, string> = {
      dashboard: 'Overview of your code translation and compilation activities',
      translator: 'Convert code between multiple programming languages',
      compiler: 'Compile and execute code in various languages',
      history: 'View your past translations and compilations',
      settings: 'Configure your application preferences',
    };
    return descriptions[pageId] || '';
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Logo */}
              <Link to="/app/dashboard" className="flex items-center ml-2">
                <Code2 className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Code Translator
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  {getUserInitial()}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold">{getUserInitial()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {getUserDisplayName()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {getUserEmail()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {currentUser?.isGuest && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded dark:bg-yellow-900 dark:text-yellow-300">
                            Guest
                          </span>
                        )}
                        {currentUser?.googleId && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded dark:bg-green-900 dark:text-green-300">
                            Google
                          </span>
                        )}
                        {currentUser?.isVerified && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-300">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/app/settings"
                        className="block w-full text-left p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-16 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
              >
                <div className={location.pathname === item.path ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}>
                  {item.icon}
                </div>
                <span className="ml-3 font-medium">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User status card in sidebar */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold">{getUserInitial()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentUser?.isGuest ? 'Guest Mode' : 'Logged In'}
                </p>
              </div>
            </div>
            {currentUser?.translationsCount !== undefined && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Translations</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser.translationsCount}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-4 md:p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={currentNavItem.id === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}>
                {currentNavItem.icon}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentNavItem.name}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {getPageDescription(currentNavItem.id)}
              {currentUser?.isGuest && (
                <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                  (Guest Mode - <Link to="/auth/login" className="underline">Log in</Link> for personal data)
                </span>
              )}
            </p>
          </div>

          {/* Page Content - Renders the nested route */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 md:p-6">
            <Outlet />
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Code Translator v1.0 • 
              <span className="ml-2 font-medium">
                {currentUser?.isGuest ? 'Guest Session' : `User: ${getUserDisplayName()}`}
              </span>
              {currentUser?.createdAt && (
                <span className="ml-4">
                  Member since: {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default HomePage;