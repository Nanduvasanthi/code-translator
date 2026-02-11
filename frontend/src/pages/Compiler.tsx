import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Play, Copy, Download, ChevronDown, Eye, EyeOff,
  Maximize2, Minimize2, RotateCcw, Loader2,
  AlertTriangle, CheckCircle, Terminal, Code2,
  FileCode, BookOpen
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Add this with your other environment variables
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const COMPILATION_SERVICE_URL = import.meta.env.VITE_COMPILATION_SERVICE_URL || 'http://localhost:3002';

interface Language {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CompilationResult {
  output: string;
  errors: string[];
  warnings: string[];
  executionTime: number;
  memoryUsage: number;
  status: 'success' | 'error' | 'running' | 'pending';
}

const Compiler: React.FC = () => {
  const location = useLocation();
  const { editorTheme } = useTheme();
  
  // Debug: Check what's received from navigation
  useEffect(() => {
    console.log('📥 Compiler component mounted');
    console.log('📍 Location state:', location.state);
    console.log('📝 Initial code length:', location.state?.initialCode?.length || 0);
    console.log('📝 Initial code preview:', location.state?.initialCode?.substring(0, 100) + '...');
    console.log('🌐 Initial language:', location.state?.initialLanguage);
  }, [location.state]);

  // State
  const [code, setCode] = useState<string>(location.state?.initialCode || '');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(location.state?.initialLanguage || 'python');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [compilationResult, setCompilationResult] = useState<CompilationResult>({
    output: '',
    errors: [],
    warnings: [],
    executionTime: 0,
    memoryUsage: 0,
    status: 'pending'
  });
  const [input, setInput] = useState<string>('');
  
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);
  const [showExamples, setShowExamples] = useState<boolean>(false);

  // Environment variables
  const COMPILATION_SERVICE_URL = import.meta.env.VITE_COMPILATION_SERVICE_URL || 'http://localhost:3002';

  // Languages - Only Python, C, Java as requested
  const languages: Language[] = [
    { id: 'python', name: 'Python', icon: 'Py', color: 'from-green-500 to-emerald-600' },
    { id: 'java', name: 'Java', icon: 'Java', color: 'from-red-500 to-orange-600' },
    { id: 'c', name: 'C', icon: 'C', color: 'from-blue-500 to-cyan-600' },
  ];

  // Handle auto-run when coming from translator
  useEffect(() => {
    console.log('🔄 Auto-run useEffect triggered');
    console.log('📦 Has initialCode:', !!location.state?.initialCode);
    console.log('📦 InitialCode length:', location.state?.initialCode?.length || 0);
    
    if (location.state?.initialCode && location.state.initialCode.trim()) {
      console.log('🚀 Auto-running translated code in 1 second...');
      // Auto-run the translated code after a short delay
      const timer = setTimeout(() => {
        console.log('🏃‍♂️ Starting auto-run now...');
        handleCompileAndRun();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Compile and run code
  const handleCompileAndRun = async () => {
  if (!code.trim()) {
    setCompilationResult({
      output: '// Error: No code to compile',
      errors: ['No code provided'],
      warnings: [],
      executionTime: 0,
      memoryUsage: 0,
      status: 'error'
    });
    return;
  }

  console.log('🚀 Starting compilation for:', selectedLanguage);
  console.log('📝 Code length:', code.length);

  setIsRunning(true);
  setCompilationResult(prev => ({ ...prev, status: 'running', output: '// Compiling and running code...\n// Please wait...' }));

  try {
    // ADD THESE LINES:
    const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${BACKEND_API_URL}/api/compiler/execute`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: code,
        language: selectedLanguage,
        input: input
      }),
    });

    console.log('📨 Compilation response status:', response.status);
    
    const data = await response.json();
    console.log('📨 Compilation response data:', data);

    if (response.ok && data.success !== false) {
      setCompilationResult({
        output: data.output || data.result || '// No output generated',
        errors: data.errors || [],
        warnings: data.warnings || [],
        executionTime: data.execution_time || data.apiDetails?.exitCode || 0,
        memoryUsage: data.memory_usage || 0,
        status: 'success'
      });
      console.log('✅ Compilation succeeded');
      console.log('📦 Compilation ID:', data.compilation_id); // Check this!
    } else {
      const errorMsg = data.error || data.message || data.stderr || 'Compilation failed';
      console.error('❌ Compilation failed:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    console.error('💥 Compilation error:', error);
    setCompilationResult({
      output: `// ❌ Compilation/Run Failed\n// Error: ${error.message}`,
      errors: [error.message],
      warnings: [],
      executionTime: 0,
      memoryUsage: 0,
      status: 'error'
    });
  } finally {
    setIsRunning(false);
  }
};

  // Copy code to clipboard
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Copy output to clipboard
  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(compilationResult.output);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    } catch (err) {
      console.error('Failed to copy output:', err);
    }
  };

  // Download code
  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `code.${selectedLanguage}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Download output
  const downloadOutput = () => {
    const element = document.createElement('a');
    const file = new Blob([compilationResult.output], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'output.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Clear code
  const clearCode = () => {
    setCode('');
    setCompilationResult({
      output: '',
      errors: [],
      warnings: [],
      executionTime: 0,
      memoryUsage: 0,
      status: 'pending'
    });
  };

  // Get language info
  const getLanguageInfo = (langId: string): Language => {
    return languages.find(lang => lang.id === langId) || languages[0];
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'error': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'running': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <Terminal className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Code Compiler
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Compile and run code in Python, Java, or C
              </p>
            </div>
          </div>
        </div>
        
        
      </div>

      {/* Language Selection and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Language</label>
            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg appearance-none text-gray-900 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id} className="text-gray-900 dark:text-white">{lang.name} </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Stats */}
          <div className="md:col-span-3">
            <div className="h-full p-4 bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-900 dark:to-green-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    compilationResult.status === 'success' ? 'bg-green-500' :
                    compilationResult.status === 'error' ? 'bg-red-500' :
                    compilationResult.status === 'running' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{compilationResult.status}</span>
                </div>
                {compilationResult.executionTime > 0 && (
                  <span className="text-xs text-gray-500">
                    Time: {compilationResult.executionTime.toFixed(2)}s
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {code.split('\n').length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Lines</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {code.split(' ').filter(w => w.trim()).length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {getLanguageInfo(selectedLanguage).name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Language</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCompileAndRun}
            disabled={isRunning || !code.trim()}
            className="flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Compile & Run</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {showLineNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="hidden sm:inline">{showLineNumbers ? 'Hide Lines' : 'Show Lines'}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Code Editors */}
      <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
        {/* Code Editor */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${getLanguageInfo(selectedLanguage).color}`}>
                    <span className="text-white text-sm font-bold">{getLanguageInfo(selectedLanguage).icon}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Code Editor</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Write your {getLanguageInfo(selectedLanguage).name} code here
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyCode}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      copiedCode 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {copiedCode ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="text-sm">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={downloadCode}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Download code"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={clearCode}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Clear code"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                 className={`w-full h-96 font-mono text-sm p-6 focus:outline-none resize-none
                  ${editorTheme === 'vs-dark' ? 'bg-gray-900 text-gray-100' : 
                  editorTheme === 'vs-light' ? 'bg-white text-gray-900' : 
                  'bg-gray-800 text-gray-100'}`}
                spellCheck="false"
                placeholder={`Write your ${getLanguageInfo(selectedLanguage).name} code here...`}
              />
              {showLineNumbers && (
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 overflow-y-auto">
                  {code.split('\n').map((_, index) => (
                    <div key={index} className="text-right pr-3 py-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {index + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-900 dark:to-green-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5 text-green-600" />
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Output</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Compilation and execution results
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(compilationResult.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(compilationResult.status)}
                      <span className="capitalize">{compilationResult.status}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={copyOutput}
                  disabled={!compilationResult.output}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    copiedOutput 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50'
                  }`}
                >
                  {copiedOutput ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={compilationResult.output}
                readOnly
                 className={`w-full h-96 font-mono text-sm p-6 focus:outline-none
                 ${editorTheme === 'vs-dark' ? 'bg-gray-900 text-gray-100' : 
                 editorTheme === 'vs-light' ? 'bg-white text-gray-900' : 
                 'bg-gray-800 text-gray-100'}
                 ${compilationResult.output.includes('❌') ? 'text-red-600 dark:text-red-400' :
                 compilationResult.output.includes('Compiling') ? 'text-blue-600 dark:text-blue-400' :
                 compilationResult.status === 'success' ? 'text-black-600 dark:text-blue-400' : ''}`}
                spellCheck="false"
                placeholder="Output will appear here..."
              />
              {showLineNumbers && (
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-100 dark:bg-gray-900 border-r overflow-y-auto">
                  {compilationResult.output.split('\n').map((_, index) => (
                    <div key={index} className="text-right pr-3 py-1 text-xs text-gray-500 font-mono">
                      {index + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input Panel */}
      

      {/* Service Info */}
      
    </div>
  );
};

export default Compiler;