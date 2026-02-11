import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Code,
  Cpu,
  Download,
  Globe,
  Zap,
  BarChart,
  Clock,
  Terminal,
  ArrowUpRight,
  PlayCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Database,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';
import { apiService, DashboardData } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        console.log('🔐 No auth token or user found, redirecting to login');
        navigate('/auth/login');
        return false;
      }
      
      try {
        const user = JSON.parse(userStr);
        if (user && user.email && user.email !== 'guest@example.com') {
          console.log('✅ User authenticated:', user.email);
          setIsCheckingAuth(false);
          return true;
        }
      } catch (e) {
        console.error('Error parsing user:', e);
      }
      
      console.log('🔐 Invalid user data, redirecting to login');
      navigate('/auth/login');
      return false;
    };
    
    const isAuthenticated = checkAuth();
    
    if (isAuthenticated) {
      console.log('🔄 Dashboard: Fetching data...');
      fetchDashboardData();
    }
    
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 [Dashboard] Starting fetch...');
      
      const data = await apiService.getDashboardData(selectedPeriod);
      
      console.log('✅ [Dashboard] Data received:', {
        success: data.success,
        user: data.user?.name,
        isGuest: data.user?.isGuest,
        message: data.message
      });
      
      // Check if backend says we're unauthorized
      if (data.message?.includes('Unauthorized') || data.message?.includes('Please login')) {
        console.log('🔐 Unauthorized response from backend');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth/login');
        return;
      }
      
      setDashboardData(data);
      setLastRefreshed(new Date());
      
    } catch (err: any) {
      console.error('❌ [Dashboard] Fetch error:', err);
      
      // If it's an authentication error, redirect to login
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth/login');
        return;
      }
      
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  // Get user from localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLogout = () => {
    apiService.logout();
    navigate('/auth/login', { replace: true });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleExportReport = async () => {
    try {
      if (dashboardData) {
        const csvContent = createCSVReport(dashboardData);
        downloadCSV(csvContent, `dashboard-report-${selectedPeriod}.csv`);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report. Please try again.');
    }
  };

  const createCSVReport = (data: DashboardData): string => {
    const headers = ['Type', 'Title', 'Description', 'Time', 'Status'];
    const activities = data.recentActivities.map(activity => [
      activity.type,
      activity.title,
      activity.description,
      activity.time,
      activity.status
    ]);
    
    return [headers, ...activities].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <PlayCircle className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'translation':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'compilation':
        return <Terminal className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (value: number, previousValue: number) => {
    if (value > previousValue) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < previousValue) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };


  // Add this line above the useMemo:
const defaultStats = {
  totalTranslations: 0,
  totalCompilations: 0,
  featureSupportRate: 0,
  translationAccuracy: 0,
  CompilationSuccessRate: 0,
  mostUsedPair: 'None',
  avgResponseTime: 0
};

const stats = useMemo(() => {
  if (!dashboardData) return defaultStats; // Now defaultStats is defined
  
  const totalTranslations = dashboardData.totalTranslations || 0;
  const totalCompilations = dashboardData.totalCompilations || 0;
  const featureSupportRate = dashboardData.featureSupportRate || 0;
  const translationAccuracy = dashboardData.translationAccuracy || 0;
  const compilationSuccessRate = dashboardData.compilationSuccessRate || 0;
  const mostUsedPair =  dashboardData.mostUsedPair || 'None';
  const avgResponseTime = dashboardData.avgResponseTime || 0;
  return {
    totalTranslations,
    totalCompilations,
    featureSupportRate,
    translationAccuracy,
    compilationSuccessRate,
    mostUsedPair,
    avgResponseTime
  };
}, [dashboardData]);
  // Calculate stats from dashboard data - memoized


  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Loading state for dashboard data
  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard data...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {currentUser?.email ? `Loading data for: ${currentUser.email}` : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchDashboardData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Retry Loading
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no data but no error (edge case)
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Dashboard Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No dashboard data available. You might need to perform some translations first.
          </p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with User Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {currentUser?.name || dashboardData.user?.name || 'User'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentUser?.email || dashboardData.user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['day', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as 'day' | 'week' | 'month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-gray-600 dark:text-gray-300"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {lastRefreshed && (
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
              {formatTimeAgo(lastRefreshed)}
            </span>
          )}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Total Translations Card */}
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Translations</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.totalTranslations.toLocaleString()}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
        <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
    </div>
    <div className="mt-4">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Code translations performed
      </span>
    </div>
  </div>

  {/* Total Compilations Card */}
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Compilations</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.totalCompilations.toLocaleString()}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
        <Terminal className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>
    </div>
    <div className="mt-4">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Code executions & compilations
      </span>
    </div>
  </div>

  {/* Feature Support Rate Card */}
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Feature Support</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.featureSupportRate.toFixed(1)}%
        </p>
      </div>
      <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
        <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
      </div>
    </div>
    <div className="mt-4">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Code features supported by translator
      </span>
    </div>
  </div>
</div>


      {/* Charts and Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Usage Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Language Usage</h2>
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {dashboardData.languageUsage && dashboardData.languageUsage.length > 0 ? (
              dashboardData.languageUsage.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.language}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.count.toLocaleString()} times
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No language usage data</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Start translating code to see language statistics
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        {/* Performance Metrics */}
<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Performance</h2>
    <Activity className="h-5 w-5 text-gray-500" />
  </div>
  <div className="space-y-6">
    {/* Translation Accuracy */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Translation Accuracy</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-green-600">
            {stats.translationAccuracy.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${stats.translationAccuracy}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Translated code compiles successfully
      </p>
    </div>

    {/* Compilation Success */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Compilation Success</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-blue-600">
            {stats.compilationSuccessRate.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${stats.compilationSuccessRate}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Your original code compiles successfully
      </p>
    </div>

    {/* Most Used Language Pair */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Most Used Translation</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-purple-600">
            {stats.mostUsedPair}
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-500"
          style={{ width: '80%' }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Your most frequent translation direction
      </p>
    </div>

    {/* Average Response Time */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-amber-600">
            {stats.avgResponseTime.toFixed(2)}s
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, stats.avgResponseTime * 20)}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Average time for your translations
      </p>
    </div>
  </div>
</div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Recent Activity</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your latest code translations and compilations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {lastRefreshed ? `Updated ${formatTimeAgo(lastRefreshed)}` : 'Just now'}
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? (
            dashboardData.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    {getTypeIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(activity.status)}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {activity.description}
                    </p>
                    {activity.languageFrom && activity.languageTo && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                          {activity.languageFrom}
                        </span>
                        <ArrowUpRight className="h-3 w-3 text-gray-500" />
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                          {activity.languageTo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No recent activities found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Start translating code to see your activity here!
              </p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={() => navigate('/app/history')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
          >
            View all your activity →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Code className="h-8 w-8" />
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Start Translating</h3>
          <p className="text-blue-100 mb-4">
            Convert code between 20+ programming languages instantly
          </p>
          <button
            onClick={() => navigate('/app/translator')}
            className="w-full bg-white text-blue-600 hover:bg-blue-50 font-medium py-2.5 rounded-lg transition-colors"
          >
            Open Translator
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Terminal className="h-8 w-8" />
            <Cpu className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Run & Compile</h3>
          <p className="text-purple-100 mb-4">
            Execute and compile code in multiple languages with one click
          </p>
          <button
            onClick={() => navigate('/app/compiler')}
            className="w-full bg-white text-purple-600 hover:bg-purple-50 font-medium py-2.5 rounded-lg transition-colors"
          >
            Open Compiler
          </button>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-8 w-8" />
            <Database className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">View History</h3>
          <p className="text-amber-100 mb-4">
            Access your past translations and compilation records
          </p>
          <button
            onClick={() => navigate('/app/history')}
            className="w-full bg-white text-amber-600 hover:bg-amber-50 font-medium py-2.5 rounded-lg transition-colors"
          >
            Open History
          </button>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Settings className="h-8 w-8" />
            <User className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Settings</h3>
          <p className="text-emerald-100 mb-4">
            Configure your preferences and manage account settings
          </p>
          <button
            onClick={() => navigate('/app/settings')}
            className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-medium py-2.5 rounded-lg transition-colors"
          >
            Open Settings
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  navigate('/app/settings');
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-5 w-5" />
                Settings
              </button>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;