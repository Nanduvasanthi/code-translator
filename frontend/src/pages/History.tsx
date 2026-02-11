import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  Copy, 
  Code2, 
  Globe,
  Terminal,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  FileText,
  BarChart,
  Tag,
  Zap,
  Cpu,
  ArrowUpRight,
  MoreVertical,
  PlayCircle,
  Loader2,
  FileCode,
  ExternalLink,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'translation' | 'compilation';
  title: string;
  description: string;
  sourceLanguage: string;
  targetLanguage?: string;
  timestamp: string;
  duration: string;
  status: 'success' | 'error';
  size: string;
  tags: string[];
  codePreview: string;
  output?: string;
  createdAt: string;
  sourceCode?: string;
  translatedCode?: string;
  executionTime?: number;
  language?: string;
  code?: string;
}

interface HistoryStats {
  totalItems: number;
  successRate: number;
  totalTimeSaved: string;
  mostUsedLanguage: string;
  topTags: string[];
}

const History: React.FC = () => {
  const navigate = useNavigate();
  
  // Environment variables
  const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  
  // State management
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showCodePreview, setShowCodePreview] = useState<string | null>(null);
  const [showOutputPreview, setShowOutputPreview] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('select type');
  const [filterStatus, setFilterStatus] = useState<string>('select status');
  const [filterLanguage, setFilterLanguage] = useState<string>('select language');
  const [dateRange, setDateRange] = useState<string>('select date range');

  // Fetch user's history from backend
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view history');
        return;
      }

      // Fetch translations
      const translationsResponse = await fetch(`${BACKEND_API_URL}/api/translations/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let translations: any[] = [];
      if (translationsResponse.ok) {
        const translationsData = await translationsResponse.json();
        translations = translationsData.success ? translationsData.translations : [];
      }

      // Fetch compilations
      const compilationsResponse = await fetch(`${BACKEND_API_URL}/api/compiler/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let compilations: any[] = [];
      if (compilationsResponse.ok) {
        const compilationsData = await compilationsResponse.json();
        compilations = compilationsData.success ? compilationsData.compilations : [];
      }

      // Format translations data
      const formattedTranslations: HistoryItem[] = translations.map((item: any) => ({
        id: item.id || item._id,
        type: 'translation',
        title: `${item.sourceLanguage} to ${item.targetLanguage} Translation`,
        description: `Translated ${item.sourceCode?.length || 0} characters`,
        sourceLanguage: item.sourceLanguage,
        targetLanguage: item.targetLanguage,
        timestamp: formatTimeAgo(new Date(item.createdAt)),
        duration: item.executionTime ? `${item.executionTime}ms` : 'N/A',
        status: item.status === 'success' ? 'success' : 'error',
        size: `${Math.round((item.sourceCode?.length || 0) / 1024 * 100) / 100} KB`,
        tags: [item.sourceLanguage, item.targetLanguage, 'translation'],
        codePreview: item.sourceCode?.substring(0, 200) + (item.sourceCode?.length > 200 ? '...' : ''),
        output: item.translatedCode?.substring(0, 200),
        createdAt: item.createdAt,
        sourceCode: item.sourceCode,
        translatedCode: item.translatedCode,
        executionTime: item.executionTime
      }));

      // Format compilations data
      const formattedCompilations: HistoryItem[] = compilations.map((item: any) => ({
        id: item.id || item._id,
        type: 'compilation',
        title: `${item.language} Compilation`,
        description: `Compiled ${item.code?.length || 0} characters`,
        sourceLanguage: item.language,
        timestamp: formatTimeAgo(new Date(item.createdAt)),
        duration: item.executionTime ? `${item.executionTime}ms` : 'N/A',
        status: item.status === 'success' ? 'success' : 'error',
        size: `${Math.round((item.code?.length || 0) / 1024 * 100) / 100} KB`,
        tags: [item.language, 'compilation', item.isExecution ? 'execution' : 'compile-only'],
        codePreview: item.code?.substring(0, 200) + (item.code?.length > 200 ? '...' : ''),
        output: item.output || item.error || 'No output',
        createdAt: item.createdAt,
        language: item.language,
        code: item.code
      }));

      // Combine and sort by date
      const allItems = [...formattedTranslations, ...formattedCompilations]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setHistoryItems(allItems);
      
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Calculate statistics
  const calculateStats = (): HistoryStats => {
    const totalItems = historyItems.length;
    const successfulItems = historyItems.filter(item => item.status === 'success').length;
    const successRate = totalItems > 0 ? (successfulItems / totalItems) * 100 : 0;
    
    // Find most used language
    const languageCount: Record<string, number> = {};
    historyItems.forEach(item => {
      languageCount[item.sourceLanguage] = (languageCount[item.sourceLanguage] || 0) + 1;
      if (item.targetLanguage) {
        languageCount[item.targetLanguage] = (languageCount[item.targetLanguage] || 0) + 1;
      }
    });
    
    const mostUsedLanguage = Object.entries(languageCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';
    
    // Calculate total time saved (assuming each translation/compilation saved 30 seconds)
    const totalTimeSavedMinutes = Math.round(totalItems * 0.5);
    const totalTimeSaved = totalTimeSavedMinutes > 60 
      ? `${Math.floor(totalTimeSavedMinutes / 60)} hours ${totalTimeSavedMinutes % 60} minutes`
      : `${totalTimeSavedMinutes} minutes`;
    
    // Get top tags
    const allTags = historyItems.flatMap(item => item.tags);
    const tagCount: Record<string, number> = {};
    allTags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
    
    const topTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
    
    return {
      totalItems,
      successRate: parseFloat(successRate.toFixed(1)),
      totalTimeSaved,
      mostUsedLanguage,
      topTags
    };
  };

  // Load history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // Available filters
  const types = ['Select type', 'Translation', 'Compilation'];
  const statuses = ['Select status', 'Success', 'Error'];
  const languages = ['Select language', 'Python', 'Java', 'C'];
  const dateRanges = ['Select date range', 'Today', 'Yesterday', 'Last 7 days', 'Last 30 days'];

  // Filter history items
  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'select type' || 
                       (filterType === 'translation' && item.type === 'translation') ||
                       (filterType === 'compilation' && item.type === 'compilation');
    
    const matchesStatus = filterStatus === 'select status' || 
                         (filterStatus === 'success' && item.status === 'success') ||
                         (filterStatus === 'error' && item.status === 'error');
    
    const matchesLanguage = filterLanguage === 'select language' || 
                           item.sourceLanguage === filterLanguage ||
                           (item.targetLanguage && item.targetLanguage === filterLanguage);
    
    return matchesSearch && matchesType && matchesStatus && matchesLanguage;
  });

  const stats = calculateStats();

  const restoreItem = (item: HistoryItem) => {
    if (item.type === 'translation') {
      navigate('/app/translator', {
        state: {
          sourceCode: item.sourceCode || item.codePreview,
          sourceLanguage: item.sourceLanguage,
          targetLanguage: item.targetLanguage,
          fromHistory: true
        }
      });
    } else if (item.type === 'compilation') {
      navigate('/app/compiler', {
        state: {
          initialCode: item.sourceCode || item.codePreview || item.code,
          initialLanguage: item.sourceLanguage || item.language,
          fromHistory: true
        }
      });
    }
  };

  const viewFullCode = (item: HistoryItem) => {
    const code = item.sourceCode || item.codePreview || item.code;
    if (code) {
      setShowCodePreview(code);
    }
  };

  const viewFullOutput = (item: HistoryItem) => {
    if (item.output) {
      setShowOutputPreview(item.output);
    }
  };

  // Add this state for tracking copy status
const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

// Update copyToClipboard function
const copyToClipboard = async (text: string, itemId?: string) => {
  try {
    await navigator.clipboard.writeText(text);
    
    if (itemId) {
      setCopiedItemId(itemId);
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedItemId(null);
      }, 2000);
    }
    
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

  const deleteItem = async (itemId: string) => {
  // Create a custom confirmation modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">Delete Item</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete this item?</p>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="cancelDelete" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
          Cancel
        </button>
        <button id="confirmDelete" class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
          Delete
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  return new Promise((resolve) => {
    const cancelBtn = modal.querySelector('#cancelDelete');
    const confirmBtn = modal.querySelector('#confirmDelete');
    
    const cleanup = () => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      resolve(false);
    };
    
    cancelBtn?.addEventListener('click', cleanup);
    
    confirmBtn?.addEventListener('click', async () => {
      try {
        const token = localStorage.getItem('token');
        const item = historyItems.find(i => i.id === itemId);
        
        if (item?.type === 'translation') {
          await fetch(`${BACKEND_API_URL}/api/translations/history/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } else if (item?.type === 'compilation') {
          await fetch(`${BACKEND_API_URL}/api/compiler/history/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        
        setHistoryItems(historyItems.filter(item => item.id !== itemId));
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        
        // Show success toast
        showToast('Item deleted successfully', 'success');
        resolve(true);
        
      } catch (err) {
        console.error('Failed to delete item:', err);
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        showToast('Failed to delete item', 'error');
        resolve(false);
      }
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
      }
    });
  });
};

const showToast = (message: string, type: 'success' | 'error' | 'info') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
    toast.classList.add('translate-x-0');
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('translate-x-0');
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

  const clearAllHistory = async () => {
  // Create custom modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">Clear All History</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            This will permanently delete all your translation and compilation history. This action cannot be undone.
          </p>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="cancelClear" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
          Cancel
        </button>
        <button id="confirmClear" class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
          Clear All History
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  return new Promise((resolve) => {
    const cancelBtn = modal.querySelector('#cancelClear');
    const confirmBtn = modal.querySelector('#confirmClear');
    
    const cleanup = () => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      resolve(false);
    };
    
    cancelBtn?.addEventListener('click', cleanup);
    
    confirmBtn?.addEventListener('click', async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Clear translations
        await fetch(`${BACKEND_API_URL}/api/translations/history/clear`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Clear compilations
        await fetch(`${BACKEND_API_URL}/api/compiler/history/clear`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Update state
        setHistoryItems([]);
        
        // Close modal
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        
        // Show success toast
        showToast('All history cleared successfully', 'success');
        resolve(true);
        
      } catch (err) {
        console.error('Failed to clear history:', err);
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        showToast('Failed to clear history', 'error');
        resolve(false);
      }
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
      }
    });
  });
};

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'translation': return <Globe className="h-4 w-4 text-blue-500" />;
      case 'compilation': return <Terminal className="h-4 w-4 text-green-500" />;
      default: return <Code2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'error': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-3 w-3" />;
      case 'error': return <XCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && historyItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load History
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchHistory}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <HistoryIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your History</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your translations and compilations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={clearAllHistory}
            disabled={historyItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Activities</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalItems.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <HistoryIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.successRate}%
              </h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time Saved</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalTimeSaved}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top Language</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.mostUsedLanguage}
              </h3>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Code2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by title, language, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                {types.map((type) => (
                  <option key={type} value={type.toLowerCase()}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                {statuses.map((status) => (
                  <option key={status} value={status.toLowerCase()}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                {languages.map((language) => (
                  <option key={language} value={language.toLowerCase()}>
                    {language}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                {dateRanges.map((range) => (
                  <option key={range} value={range.toLowerCase()}>
                    {range}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Top Tags */}
        {stats.topTags.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Popular Tags:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.topTags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History Content */}
      <div className="space-y-4">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredItems.length} of {historyItems.length} items
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <FileText className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <GridIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          // List View
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Activity</th>
                      <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Languages</th>
                      <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                      <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Time</th>
                      <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              {getTypeIcon(item.type)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{item.sourceLanguage}</span>
                            {item.targetLanguage && (
                              <>
                                <ArrowUpRight className="h-3 w-3 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.targetLanguage}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                          {item.timestamp}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {/* Restore Button */}
                            <button
                              onClick={() => restoreItem(item)}
                              className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                              title="Restore to editor"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            
                            {/* View Code Button */}
                            <button
                              onClick={() => viewFullCode(item)}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                              title="View full code"
                            >
                              <Code2 className="h-4 w-4" />
                            </button>
                            
                            {/* View Output Button (if available) */}
                            {item.output && (
                              <button
                                onClick={() => viewFullOutput(item)}
                                className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg transition-colors"
                                title="View output"
                              >
                                <Terminal className="h-4 w-4" />
                              </button>
                            )}
                            
                            
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <HistoryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery || filterType !== 'select type' || filterStatus !== 'select status' || filterLanguage !== 'select language' 
                    ? 'No matching history found'
                    : 'No history yet'
                  }
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery ? 'Try adjusting your search or filters' : 'Start translating or compiling code to build your history'}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      <Code2 className="h-3 w-3 text-blue-500" />
                      <span className="text-sm text-gray-900 dark:text-white">{item.sourceLanguage}</span>
                    </div>
                    {item.targetLanguage && (
                      <>
                        <ArrowUpRight className="h-3 w-3 text-gray-400" />
                        <div className="flex items-center gap-1">
                          <Code2 className="h-3 w-3 text-green-500" />
                          <span className="text-sm text-gray-900 dark:text-white">{item.targetLanguage}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons - ALWAYS VISIBLE */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => restoreItem(item)}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex-1 flex items-center justify-center gap-1"
                      title="Restore"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="text-xs">Restore</span>
                    </button>
                    <button
                      onClick={() => viewFullCode(item)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex-1 flex items-center justify-center gap-1"
                      title="View Code"
                    >
                      <Code2 className="h-4 w-4" />
                      <span className="text-xs">Code</span>
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex-1 flex items-center justify-center gap-1"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-xs">Delete</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.timestamp}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <HistoryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No matching history found' : 'No history yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'Try adjusting your search or filters' : 'Start using the translator or compiler'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Code Preview Modal */}
      {/* Code Preview Modal */}
{/* Code Preview Modal */}
{/* Code Preview Modal */}
{showCodePreview && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">Full Code</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(showCodePreview, 'code-modal')}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
            title="Copy code"
          >
            {copiedItemId === 'code-modal' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => setShowCodePreview(null)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="p-4 overflow-auto max-h-[70vh] bg-gray-900">
        <pre className="font-mono text-sm text-gray-100 p-4 rounded-lg whitespace-pre-wrap">
          {showCodePreview}
        </pre>
      </div>
    </div>
  </div>
)}

{/* Output Preview Modal */}
{showOutputPreview && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">Output</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(showOutputPreview, 'output-modal')}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Copy output"
          >
            {copiedItemId === 'output-modal' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => setShowOutputPreview(null)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="p-4 overflow-auto max-h-[70vh] bg-gray-50 dark:bg-gray-900">
        <pre className="font-mono text-sm text-gray-800 dark:text-gray-300 p-4 rounded-lg whitespace-pre-wrap">
          {showOutputPreview}
        </pre>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

// Grid icon component
const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

export default History;