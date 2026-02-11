// services/api.ts - FIXED VERSION
const API_BASE_URL = 'http://localhost:5000/api';

console.log('🌐 API Base URL:', API_BASE_URL);

// Updated Interfaces for Session-Based System
export interface User {
  id?: string;
  sessionId?: string;
  email?: string;
  name: string;
  isVerified?: boolean;
  isGuest?: boolean;
  translationsCount?: number;
}

export interface RecentActivity {
  id: number | string;
  type: 'translation' | 'compilation' | 'project' | 'login';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'error' | 'running';
  languageFrom?: string;
  languageTo?: string;
}

export interface LanguageUsage {
  language: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PerformanceMetrics {
  translationAccuracy: number;
  compilationSpeed: number;
  codeQuality: string;
  uptime: number;
  totalTranslations?: number;
  successRate?: number;
  avgResponseTime?: number;
}

export interface DashboardData {
  success?: boolean;
  recentActivities: RecentActivity[];
  languageUsage: LanguageUsage[];
  performanceMetrics: PerformanceMetrics;
  user?: User;
  message?: string;
}

export interface CodeTranslationRequest {
  source_code: string;
  source_language: string;
  target_language: string;
}

export interface CodeTranslationResponse {
  success: boolean;
  translated_code?: string;
  error?: string;
  execution_time?: number;
  confidence?: number;
  warnings?: string[];
  sessionId?: string;
  translationId?: string;
}

class ApiService {
  private sessionId: string | null = null;
  private user: User | null = null;

  constructor() {
    // Load session from localStorage
    const sessionId = localStorage.getItem('sessionId');
    const userStr = localStorage.getItem('user');
    
    console.log('🔐 [API] Initializing...');
    
    if (sessionId) {
      this.sessionId = sessionId;
      console.log('🔐 [API] Loaded sessionId');
    }
    
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
        console.log('🔐 [API] Loaded user:', this.user.name);
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    }
    
    // If no user, create guest user
    if (!this.user) {
      this.user = {
        name: 'Guest User',
        email: 'guest@example.com',
        isGuest: true,
        translationsCount: 0
      };
      console.log('🔐 [API] Created guest user');
    }
  }

  // Initialize or get session (OPTIONAL - you might not need this)
  async initSession(): Promise<{ 
    success: boolean; 
    sessionId?: string; 
    user?: User; 
    message: string 
  }> {
    console.log('🔄 [API] Session initialization requested');
    
    // For now, just return a mock session
    const mockUser: User = {
      id: `guest-${Date.now()}`,
      name: 'Guest User',
      email: 'guest@example.com',
      isGuest: true,
      translationsCount: 0
    };
    
    this.user = mockUser;
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    console.log('✅ [API] Mock session created');
    
    return {
      success: true,
      sessionId: `session-${Date.now()}`,
      user: mockUser,
      message: 'Mock session created'
    };
  }

  // Update user name
  async updateUserName(name: string): Promise<{ 
    success: boolean; 
    user?: User; 
    message: string 
  }> {
    console.log('✏️ Updating user name to:', name);
    
    if (this.user) {
      this.user.name = name;
      localStorage.setItem('user', JSON.stringify(this.user));
      
      return {
        success: true,
        user: this.user,
        message: 'Name updated successfully'
      };
    }
    
    return {
      success: false,
      message: 'No user found'
    };
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Get session ID
  getSessionId(): string | null {
    return this.sessionId;
  }

  // Check if user has session
  hasSession(): boolean {
    return !!this.user;
  }

  isLoggedIn(): boolean {
    return !!this.user && !this.user.isGuest;
  }

  // Logout - clear session
  logout() {
    this.sessionId = null;
    this.user = null;
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log('👋 [API] Session cleared');
    window.location.href = '/auth/login';
  }

  // ===== DASHBOARD METHODS =====

  // In your api.ts file, update the getDashboardData function:

async getDashboardData(period: 'day' | 'week' | 'month' = 'week'): Promise<DashboardData> {
  console.log('📊 [API] Fetching dashboard data...');
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  console.log('🔐 Token exists:', !!token);
  console.log('👤 Stored user:', storedUser ? JSON.parse(storedUser).email : 'none');
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // CRITICAL: Always send token if it exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('📤 Sending Authorization header with token');
    } else {
      console.log('❌ NO TOKEN - This will show guest dashboard');
    }
    
    const response = await fetch(`${API_BASE_URL}/dashboard?period=${period}`, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    });

    console.log('📥 Response status:', response.status);
    
    const data = await response.json();
    console.log('✅ Dashboard response:', {
      success: data.success,
      user: data.user?.name,
      isGuest: data.user?.isGuest,
      message: data.message
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Dashboard fetch error:', error);
    
    return {
      success: false,
      recentActivities: [],
      languageUsage: [],
      performanceMetrics: {
        translationAccuracy: 0,
        compilationSpeed: 0,
        codeQuality: 'Error',
        uptime: 0
      },
      user: {
        name: 'Error',
        email: 'error@example.com',
        isGuest: true,
        translationsCount: 0
      },
      message: 'Connection error' 
    };
  }
}
// Helper method for POST request
private async getDashboardDataPOST(period: string, userData: any): Promise<DashboardData> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        period: period,
        user: userData
      }),
      credentials: 'include'
    });
    
    return await response.json();
  } catch (error) {
    console.error('❌ POST Dashboard error:', error);
    throw error;
  }
}
  // ===== TEST METHODS =====

  async checkHealth(): Promise<{ 
    status: string; 
    timestamp: string; 
    database: string; 
    server: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'unknown',
        server: 'Code Translator Backend'
      };
    }
  }

  async testConnection(): Promise<{ 
    success: boolean; 
    message: string; 
    timestamp: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/test`);
      const data = await response.json();
      return {
        success: response.ok,
        message: data.message || 'Connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Test connection failed:', error);
      return {
        success: false,
        message: 'Connection failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ===== OTHER METHODS (keep as is or remove if not needed) =====
  
  async translateCode(request: CodeTranslationRequest): Promise<CodeTranslationResponse> {
    console.log('🔤 [API] Translating code...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
        credentials: 'include'
      });
      
      return await response.json();
    } catch (error) {
      console.error('❌ Translation failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();