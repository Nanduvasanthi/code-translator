import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  User,
  Sun,
  Moon,
  Globe,
  LogOut,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Save,
  Calendar,
  Clock,
  Code2,
  Terminal,
  Zap,
  FileText,
  Check,
  X,
  Palette,
  Type,
  Languages,
  Monitor,
  Mail,
  Info
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  
  // User profile state
  // User profile state - match backend response
const [user, setUser] = useState({
  name: '',
  email: '',
  username: '',
  firstName: '',
  lastName: '',
  joinedDate: '',
  lastLogin: '',
  translationsCount: 0,
  compilationsCount: 0,
  successRate: 0,
  profilePicture: '',
  isVerified: false
})
  
  // General settings
  const [general, setGeneral] = useState({
    defaultSourceLanguage: 'python',
    defaultTargetLanguage: 'java'
  });
  
  // Appearance settings
 
  
  // UI State
  const [activeTab, setActiveTab] = useState<string>('general');
  const { theme, fontSize, editorTheme, updateAppearance } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Load user data and settings
  useEffect(() => {
    loadUserData();
    loadSettings();
  }, []);
  
  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${BACKEND_API_URL}/api/settings/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
  const data = await response.json();
  console.log('✅ User data from backend:', data);
  
  setUser({
    name: data.name || data.firstName + ' ' + data.lastName,
    email: data.email || '',
    username: data.username || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    joinedDate: data.joinedDate || 'N/A',
    lastLogin: data.lastLogin || 'Today',
    translationsCount: data.translationsCount || 0,
    compilationsCount: data.compilationsCount || 0,
    successRate: data.successRate || 0,
    profilePicture: data.profilePicture || '',
    isVerified: data.isVerified || false
  });
}
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };
  
  const loadSettings = () => {
  // Load only general settings from localStorage
  const savedGeneral = JSON.parse(localStorage.getItem('generalSettings') || '{}');
  if (savedGeneral) setGeneral(prev => ({ ...prev, ...savedGeneral }));
  
  // Appearance is now handled by ThemeContext automatically
};
  
  const saveSettings = () => {
  try {
    // ✅ VALIDATION: Check if source and target are same
    if (general.defaultSourceLanguage === general.defaultTargetLanguage) {
      showMessage('Source and target languages cannot be the same!', 'error');
      return; // Don't save
    }
    
    // Save general settings
    localStorage.setItem('generalSettings', JSON.stringify(general));
    
    // Appearance is automatically saved by ThemeContext via updateAppearance
    
    showMessage('Settings saved successfully!', 'success');
  } catch (error) {
    showMessage('Failed to save settings', 'error');
  }
};
  
  


  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };
  
  const handleLogout = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Log Out</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Are you sure you want to logout?</p>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="cancelLogout" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            Cancel
          </button>
          <button id="confirmLogout" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            Log Out
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const cancelBtn = modal.querySelector('#cancelLogout');
    const confirmBtn = modal.querySelector('#confirmLogout');
    
    const cleanup = () => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    };
    
    cancelBtn?.addEventListener('click', cleanup);
    
    confirmBtn?.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login';
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
      }
    });
  };
  
  const handleDeleteAccount = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">Delete Account</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              This will permanently delete your account and all your data. This action cannot be undone.
            </p>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="cancelDelete" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            Cancel
          </button>
          <button id="confirmDelete" class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
            Delete Account
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const cancelBtn = modal.querySelector('#cancelDelete');
    const confirmBtn = modal.querySelector('#confirmDelete');
    
    const cleanup = () => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    };
    
    cancelBtn?.addEventListener('click', cleanup);
    
    confirmBtn?.addEventListener('click', async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_API_URL}/api/settings/account`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          showMessage('Failed to delete account', 'error');
        }
      } catch (error) {
        console.error('Failed to delete account:', error);
        showMessage('Failed to delete account', 'error');
      } finally {
        cleanup();
      }
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
      }
    });
  };
  
  const tabs = [
    { id: 'general', label: 'General', icon: <Globe className="h-5 w-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="h-5 w-5" /> },
    { id: 'account', label: 'Account', icon: <User className="h-5 w-5" /> },
    { id: 'profile', label: 'Profile', icon: <Info className="h-5 w-5" /> }
  ];
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          General Settings
        </h3>
        
        {/* ✅ ADD WARNING MESSAGE */}
        {general.defaultSourceLanguage === general.defaultTargetLanguage && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Source and target languages cannot be the same!
              </span>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Default Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Source Language
            </label>
            <select
              value={general.defaultSourceLanguage}
              onChange={(e) => setGeneral({ ...general, defaultSourceLanguage: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Target Language
            </label>
           <select
  value={general.defaultTargetLanguage}
  onChange={(e) => setGeneral({ ...general, defaultTargetLanguage: e.target.value })}
  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
>
  {['python', 'java', 'c']
    .filter(lang => lang !== general.defaultSourceLanguage) // ✅ Filter out source language
    .map(lang => (
      <option key={lang} value={lang} className="text-gray-900 dark:text-white">
        {lang.charAt(0).toUpperCase() + lang.slice(1)}
      </option>
    ))}
</select>
            
            {/* Show helpful message */}
            {general.defaultSourceLanguage === general.defaultTargetLanguage && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Please select a different target language
              </p>
            )}
          </div>
          
          {/* Show what will be applied */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Preview</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Translator will open with: <span className="font-bold">{general.defaultSourceLanguage.toUpperCase()} → {general.defaultTargetLanguage.toUpperCase()}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );


      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </h3>
              
              <div className="space-y-6">
               
                
                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Font Size
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => updateAppearance({ fontSize: size })}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all relative ${
                          fontSize === size
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Type className={`h-8 w-8 ${fontSize === size ? 'text-blue-500' : 'text-gray-500'}`} />
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{size}</span>
                        {fontSize === size && <Check className="h-5 w-5 text-blue-500 absolute top-2 right-2" />}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Editor Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Editor Theme
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['vs-dark', 'vs-light', 'monokai'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => updateAppearance({ editorTheme: theme })}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all relative ${
                          editorTheme === theme
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className={`h-8 w-full rounded ${
                          theme.includes('dark') || theme === 'monokai' ? 'bg-gray-800' : 'bg-gray-200'
                        }`} />
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {theme.replace('-', ' ')}
                        </span>
                        {editorTheme === theme && <Check className="h-5 w-5 text-blue-500 absolute top-2 right-2" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'account':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Actions
              </h3>
              
              <div className="space-y-6">
                {/* Logout */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <LogOut className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Log Out</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Sign out from this device
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
                
                {/* Delete Account */}
                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Delete Account</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Permanently delete your account and all data
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
                
                {/* Note about password */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-800 dark:text-blue-300">Change Password</div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        You can change your password on the login page by clicking "Forgot Password"
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Profile Information
              </h3>
              
              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Joined</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.joinedDate || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Last Login</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.lastLogin || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Activity Stats */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Activity Summary</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 className="h-5 w-5 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300">Translations</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.translationsCount}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">Compilations</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.compilationsCount}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <span className="text-gray-700 dark:text-gray-300">Success Rate</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.successRate}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Read-only note */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Profile information is view-only. Contact support to update your details.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your preferences and account
                </p>
              </div>
            </div>
            <button
              onClick={saveSettings}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Info Box */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mt-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Need Help?</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>• Settings are saved automatically</p>
                <p>• Changes apply immediately</p>
                <p>• Contact support for account changes</p>
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {/* Message Toast */}
      {message && (
        <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5 ${
          message.type === 'success' ? 'bg-green-500 text-white' :
          message.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
           message.type === 'error' ? <XCircle className="h-5 w-5" /> :
           <InfoIcon className="h-5 w-5" />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-4 hover:opacity-80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Helper components
const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);




export default Settings;