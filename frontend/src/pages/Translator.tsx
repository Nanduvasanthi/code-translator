import React, { useState, useEffect } from 'react';
import { 
  Copy, Download, Play, History, ChevronDown, Eye, EyeOff,
  CheckCircle, Maximize2, Minimize2, RotateCcw, Sparkles,
  RefreshCw, Loader2, AlertTriangle, FileCode, Zap,
  Languages, ArrowRightLeft, BookOpen, Globe, Cpu, Workflow, Code2, Terminal,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface Language {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface TranslationHistory {
  id: number;
  sourceCode: string;
  sourceLanguage: string;
  targetCode: string;
  targetLanguage: string;
  timestamp: string;
}

interface SupportedFeature {
  id: string;
  name: string;
  description: string;
}

interface TranslationResponse {
  success: boolean;
  source_code: string;
  translated_code: string;
  source_language: string;
  target_language: string;
  translation_id: string;
  user_id: string;
  timestamp: string;
  error?: string;
}

const Translator: React.FC = () => {
  const navigate = useNavigate();
  const { editorTheme } = useTheme();
  
  // Environment variables
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const BACKEND_API_URL = `${BACKEND_URL}/api`;
  const COMPILATION_SERVICE_URL = import.meta.env.VITE_COMPILATION_SERVICE_URL || 'http://localhost:3002';
  const TRANSLATION_SERVICE_URL = import.meta.env.VITE_TRANSLATION_SERVICE_URL || 'http://localhost:3001';
  
  // State
  const [sourceCode, setSourceCode] = useState<string>('');
  const [translatedCode, setTranslatedCode] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState<string>('python');
  const [targetLanguage, setTargetLanguage] = useState<string>('java');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected'>('connected');
  const [translationHistory, setTranslationHistory] = useState<TranslationHistory[]>([]);
  const [showFeatures, setShowFeatures] = useState<boolean>(true);
  const [selectedFeature, setSelectedFeature] = useState<string>('basic-syntax');
  const [copiedSource, setCopiedSource] = useState<boolean>(false);
  const [copiedTarget, setCopiedTarget] = useState<boolean>(false);
  const [translationId, setTranslationId] = useState<string | null>(null);

  // Languages
  const languages: Language[] = [
    { id: 'python', name: 'Python', icon: 'Py', color: 'from-green-500 to-emerald-600' },
    { id: 'java', name: 'Java', icon: 'Java', color: 'from-red-500 to-orange-600' },
    { id: 'c', name: 'C', icon: 'C', color: 'from-blue-500 to-cyan-600' },
  ];

  // Features
  const supportedFeatures: SupportedFeature[] = [
    { id: 'basic-syntax', name: 'Basic Syntax', description: 'Print, variables, comments' },
    { id: 'data-types', name: 'Data Types', description: 'int, float, string, boolean' },
    { id: 'operators', name: 'Operators', description: 'Arithmetic, comparison, logical' },
    { id: 'control-flow', name: 'Control Flow', description: 'if-else statements' },
    { id: 'loops', name: 'Loops', description: 'for, while loops' },
    { id: 'arrays', name: 'Arrays', description: 'Arrays and lists' },
  ];

  // Language-specific examples
  const getLanguageExample = (langId: string, featureId: string): string => {
    const examples: Record<string, Record<string, string>> = {
      'python': {
        'basic-syntax': `# Basic Python Example
print("Hello, World!")

name = "Alice"
age = 25

print(f"Name: {name}")
print(f"Age: {age}")`,
        
        'data-types': `# Data Types in Python
x = 10           # int
y = 3.14         # float
name = "John"    # string
is_true = True   # boolean

print(f"Integer: {x}")
print(f"Float: {y}")
print(f"String: {name}")
print(f"Boolean: {is_true}")`,
        
        'operators': `# Operators in Python
a = 10
b = 3

# Arithmetic
print(f"a + b = {a + b}")
print(f"a - b = {a - b}")
print(f"a * b = {a * b}")
print(f"a / b = {a / b}")
print(f"a % b = {a % b}")

# Comparison
print(f"a == b: {a == b}")
print(f"a != b: {a != b}")
print(f"a > b: {a > b}")
print(f"a < b: {a < b}")

# Logical
x = True
y = False
print(f"x and y: {x and y}")
print(f"x or y: {x or y}")
print(f"not x: {not x}")`,
        
        'control-flow': `# Control Flow in Python
score = 85

if score >= 90:
    print("Excellent!")
elif score >= 80:
    print("Good job!")
elif score >= 70:
    print("Fair!")
elif score >= 60:
    print("Passing!")
else:
    print("Failed!")`,
        
        'loops': `# Loops in Python
# For loop
for i in range(5):
    print(f"Iteration {i}")

# While loop
count = 0
while count < 3:
    print(f"Count: {count}")
    count += 1`,
        
        'arrays': `# Create and access lists
numbers = [10, 20, 30, 40, 50]
fruits = ["apple", "banana", "cherry"]

print(numbers[0])
print(fruits[1])`
      },
      
      'java': {
        'basic-syntax': `// Basic Java Example
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        String name = "Alice";
        int age = 25;
        
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
    }
}`,
        
        'data-types': `// Data Types in Java
public class Main {
    public static void main(String[] args) {
        int x = 10;
        double y = 3.14;
        String name = "John";
        boolean isTrue = true;
        
        System.out.println("int: " + x);
        System.out.println("double: " + y);
        System.out.println("String: " + name);
        System.out.println("boolean: " + isTrue);
    }
}`,
        
        'operators': `// Operators in Java
public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 3;
        
        System.out.println("a + b = " + (a + b));
        System.out.println("a - b = " + (a - b));
        System.out.println("a * b = " + (a * b));
        System.out.println("a / b = " + (a / b));
        System.out.println("a % b = " + (a % b));
    }
}`,
        
        'control-flow': `// Control Flow in Java
public class Main {
    public static void main(String[] args) {
        int score = 85;
        
        if (score >= 90) {
            System.out.println("Excellent!");
        } else if (score >= 80) {
            System.out.println("Good job!");
        } else if (score >= 70) {
            System.out.println("Fair!");
        } else if (score >= 60) {
            System.out.println("Passing!");
        } else {
            System.out.println("Failed!");
        }
    }
}`,
        
        'loops': `// Loops in Java
public class Main {
    public static void main(String[] args) {
        // For loop
        for (int i = 0; i < 5; i++) {
            System.out.println("Iteration " + i);
        }
        
        // While loop
        int count = 0;
        while (count < 3) {
            System.out.println("Count: " + count);
            count++;
        }
    }
}`,
        
        'arrays': `// Arrays in Java
public class Main {
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3, 4, 5};
        String[] fruits = {"apple", "banana", "cherry"};
        
        System.out.println("First fruit: " + fruits[0]);
        System.out.println("Last number: " + numbers[numbers.length - 1]);
    }
}`
      },
      
      'c': {
        'basic-syntax': `// Basic C Example
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    
    char name[] = "Alice";
    int age = 25;
    
    printf("Name: %s\\n", name);
    printf("Age: %d\\n", age);
    
    return 0;
}`,
        
        'data-types': `// Data Types in C
#include <stdio.h>

int main() {
    int x = 10;
    float y = 3.14;
    char name[] = "John";
    
    printf("int: %d\\n", x);
    printf("float: %.2f\\n", y);
    printf("string: %s\\n", name);
    
    return 0;
}`,
        
        'operators': `// Operators in C
#include <stdio.h>

int main() {
    int a = 10;
    int b = 3;
    
    printf("a + b = %d\\n", a + b);
    printf("a - b = %d\\n", a - b);
    printf("a * b = %d\\n", a * b);
    printf("a / b = %d\\n", a / b);
    printf("a %% b = %d\\n", a % b);
    
    return 0;
}`,
        
        'control-flow': `// Control Flow in C
#include <stdio.h>

int main() {
    int score = 85;
    
    if (score >= 90) {
        printf("Excellent!\\n");
    } else if (score >= 80) {
        printf("Good job!\\n");
    } else if (score >= 70) {
        printf("Fair!\\n");
    } else if (score >= 60) {
        printf("Passing!\\n");
    } else {
        printf("Failed!\\n");
    }
    
    return 0;
}`,
        
        'loops': `// Loops in C
#include <stdio.h>

int main() {
    int i;
    
    // For loop
    for (i = 0; i < 5; i++) {
        printf("Iteration %d\\n", i);
    }
    
    // While loop
    int count = 0;
    while (count < 3) {
        printf("Count: %d\\n", count);
        count++;
    }
    
    return 0;
}`,
        
        'arrays': `// Arrays in C
#include <stdio.h>

int main() {
    int numbers[] = {1, 2, 3, 4, 5};
    char fruits[][10] = {"apple", "banana", "cherry"};
    
    printf("First fruit: %s\\n", fruits[0]);
    printf("Last number: %d\\n", numbers[4]);
    
    return 0;
}`
      }
    };

    if (examples[langId] && examples[langId][featureId]) {
      return examples[langId][featureId];
    }
    
    if (examples['python'] && examples['python'][featureId]) {
      return examples['python'][featureId];
    }
    
    return examples['python']['basic-syntax'];
  };

  // Load example based on selected language and feature
  const loadExample = (featureId: string) => {
    setSelectedFeature(featureId);
    const exampleCode = getLanguageExample(sourceLanguage, featureId);
    setSourceCode(exampleCode);
    showToast(`Loaded ${featureId.replace('-', ' ')} example in ${sourceLanguage}`, 'success');
  };

  // Validate source code using compilation service
  const validateSourceCode = async (): Promise<{valid: boolean, error?: string}> => {
  try {
    console.log('🔍 [VALIDATION] Starting...');
    
    const response = await fetch(`${COMPILATION_SERVICE_URL}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: sourceLanguage,
        code: sourceCode
      }),
    });

    const data = await response.json();
    console.log('Validation data:', data);
    
    if (response.ok && data.success !== false) {
      console.log('✅ Validation passed');
      return { valid: true };
    } else {
      // Since we know errorLength exists but error message might not
      const errorMsg = data.stderr || data.error || data.errors?.[0] || 
                  data.message || data.output || 
                  'Unknown compilation error';
                  
      console.log('❌ Validation failed:', errorMsg);
      return { valid: false, error: errorMsg };
    }
    
  } catch (error: any) {
    console.error('💥 Validation error:', error);
    return { valid: false, error: error.message };
  }
};

  // Translate code using translation service
  // Change this function:
const translateCode = async (): Promise<TranslationResponse | null> => {
  try {
    console.log('Calling translation service...');
    
    // CHANGE THIS LINE - Call your backend instead
    const response = await fetch(`${BACKEND_API_URL}/compile`, { // ← CHANGE THIS
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // ← ADD TOKEN
      },
      body: JSON.stringify({
        source_code: sourceCode,
        source_language: sourceLanguage,
        target_language: targetLanguage
      }),
    });

    const data = await response.json();
    console.log('Translation response:', data);
    
    return data;
  } catch (error) {
    console.error('Translation error:', error);
    return null;
  }
};


// Add this function after translateCode function:
const saveTranslationToDB = async (translationData: any) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, skipping database save');
      return null;
    }

    const response = await fetch(`${BACKEND_API_URL}/translations/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(translationData)
    });

    const data = await response.json();
    console.log('Saved to database:', data);
    return data;
  } catch (error) {
    console.error('Failed to save to database:', error);
    return null;
  }
};

  // Save translation to database
  

// Helper function to format compilation errors
const formatCompilationError = (error: string, language: string): string => {
  // Clean up the error message
  let cleanError = error
    .replace(/Piston API error:/g, '')
    .replace(/Compilation service error:/g, '')
    .trim();
  
  // Add language-specific tips
  const tips = {
    python: `\n// \n// 🔧 Python Tips:\n// • Check for missing quotes, parentheses, or colons (:)\n// • Ensure proper indentation (4 spaces per level)\n// • Make sure all variables are defined\n// • Comments start with #, not inline with code`,
    java: `\n// \n// 🔧 Java Tips:\n// • Check for missing semicolons (;)\n// • Ensure proper class structure\n// • Check variable declarations have types\n// • Make sure strings use double quotes`,
    c: `\n// \n// 🔧 C Tips:\n// • Check for missing semicolons (;)\n// • Ensure #include statements are correct\n// • Check function declarations have proper types\n// • Make sure to include main() function`
  };
  
  const languageTip = tips[language] || '';
  
  // Format error lines with comment markers
  const errorLines = cleanError.split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return '';
      return `// ${line}`;
    })
    .filter(line => line.length > 0)
    .join('\n');
  
  return `// ❌ COMPILATION ERROR (${language.toUpperCase()})\n// \n${errorLines}${languageTip}`;
};

  // Main translation handler
  const handleTranslateCode = async () => {
  if (!sourceCode.trim()) {
    setError('Please enter source code');
    return;
  }
  
  

  setIsTranslating(true);
  setError(null);
  setTranslatedCode('// Validating source code syntax...\n// Please wait...');

  try {
    // Step 1: Validate source code
    setTranslatedCode('// Step 1/3: Validating source code...');
    const validationResult = await validateSourceCode();
    
    if (!validationResult.valid) {
  // Format the compilation error properly
  const formattedError = formatCompilationError(validationResult.error || 'Syntax error', sourceLanguage);
  setTranslatedCode(formattedError);
  throw new Error(`Compilation failed: ${validationResult.error || 'Syntax error'}`);
}

    // Step 2: Translate code
    setTranslatedCode('// Step 2/3: Translating code...');
    const translationResult = await translateCode();
    
    if (!translationResult || !translationResult.success) {
      throw new Error(translationResult?.error || 'Translation service error');
    }

    setTranslatedCode(translationResult.translated_code);
    setTranslationId(translationResult.translation_id); 

    // Step 3: Save to database
    

    // Update state
    setTranslatedCode(translationResult.translated_code);
    setTranslationId(translationResult.translation_id);
    
    // Add to history
    const newHistory: TranslationHistory = {
      id: Date.now(),
      sourceCode: sourceCode.substring(0, 100) + (sourceCode.length > 100 ? '...' : ''),
      sourceLanguage,
      targetCode: translationResult.translated_code.substring(0, 100) + (translationResult.translated_code.length > 100 ? '...' : ''),
      targetLanguage,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTranslationHistory([newHistory, ...translationHistory.slice(0, 4)]);
    
    showToast('✓ Translation successful', 'success');
    
  } catch (error: any) {
    console.error('Translation error:', error);
    setError(error.message);
    
    // Don't overwrite if we already have a detailed error message
    // Only update if we don't already have a formatted compilation error
if (!translatedCode.includes('❌ COMPILATION ERROR') && !translatedCode.includes('🔧')) {
  if (error.message.includes('Compilation failed')) {
    // Extract just the error part
    const actualError = error.message.replace('Compilation failed: ', '');
    setTranslatedCode(formatCompilationError(actualError, sourceLanguage));
  } else {
    setTranslatedCode(`// ❌ Translation Failed\n// ${error.message}`);
  }
}
  } finally {
    setIsTranslating(false);
  }
};
  // Handle compile and run
  const handleCompileAndRun = () => {
  if (!translatedCode.trim()) {
    setError('Please translate code first');
    return;
  }

  console.log('📤 Navigating to compiler with translated code:', {
    codeLength: translatedCode.length,
    language: targetLanguage
  });

  // Navigate to compiler page with translated code
  // Note: Use /app/compiler not /compiler
  navigate('/app/compiler', {
    state: {
      initialCode: translatedCode,
      initialLanguage: targetLanguage,
      translationId: translationId
    }
  });
};

  // Check backend health
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('disconnected');
        }
      } catch (error) {
        setBackendStatus('disconnected');
        console.error('Backend health check failed:', error);
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    
    return () => clearInterval(interval);
  }, [BACKEND_URL]);

  // Initialize with basic example
  useEffect(() => {
    loadExample('basic-syntax');
  }, [sourceLanguage]);

    // Load saved default languages from localStorage
  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('generalSettings') || '{}');
    
    console.log('🔄 Loading saved settings:', savedSettings);
    
    if (savedSettings.defaultSourceLanguage) {
      setSourceLanguage(savedSettings.defaultSourceLanguage);
    }
    
    if (savedSettings.defaultTargetLanguage) {
      setTargetLanguage(savedSettings.defaultTargetLanguage);
    }
  }, []); // Empty dependency array = run once on mount

  // Initialize with basic example (THIS IS ALREADY THERE)
  useEffect(() => {
    loadExample('basic-syntax');
  }, [sourceLanguage]);

  // Swap languages
  const swapLanguages = () => {
  if (sourceLanguage !== targetLanguage) {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    
    // ✅ Save swapped languages to localStorage
    const currentSettings = JSON.parse(localStorage.getItem('generalSettings') || '{}');
    const newSettings = {
      ...currentSettings,
      defaultSourceLanguage: targetLanguage, // Swapped
      defaultTargetLanguage: sourceLanguage  // Swapped
    };
    
    localStorage.setItem('generalSettings', JSON.stringify(newSettings));
    console.log('💾 Saved swapped languages to settings:', newSettings);
  }
};


  // Prevent same source and target languages
useEffect(() => {
  if (sourceLanguage === targetLanguage) {
    console.log('⚠️ Same languages detected, checking saved defaults...');
    
    // First check localStorage for saved target language
    const savedSettings = JSON.parse(localStorage.getItem('generalSettings') || '{}');
    
    if (savedSettings.defaultTargetLanguage && savedSettings.defaultTargetLanguage !== sourceLanguage) {
      console.log('🎯 Using saved default target:', savedSettings.defaultTargetLanguage);
      setTargetLanguage(savedSettings.defaultTargetLanguage);
    } else {
      // Fallback: pick a different language from available options
      const otherLanguage = languages.find(lang => lang.id !== sourceLanguage);
      if (otherLanguage) {
        console.log('🔄 Falling back to:', otherLanguage.id);
        setTargetLanguage(otherLanguage.id);
      }
    }
  }
}, [sourceLanguage, targetLanguage, languages]);

  // Copy functions with visual feedback
  const copySourceCode = async () => {
    try {
      await navigator.clipboard.writeText(sourceCode);
      setCopiedSource(true);
      showToast('Source code copied to clipboard', 'success');
      setTimeout(() => setCopiedSource(false), 2000);
    } catch (err) {
      showToast('Failed to copy source code', 'error');
    }
  };

  const copyTargetCode = async () => {
    try {
      await navigator.clipboard.writeText(translatedCode);
      setCopiedTarget(true);
      showToast('Translated code copied to clipboard', 'success');
      setTimeout(() => setCopiedTarget(false), 2000);
    } catch (err) {
      showToast('Failed to copy translated code', 'error');
    }
  };

  // Helper functions
  const showToast = (message: string, type: 'success' | 'error') => {
    console.log(`${type}: ${message}`);
    // You can add a toast notification library here
  };

  const getLanguageInfo = (langId: string): Language => {
    return languages.find(lang => lang.id === langId) || languages[0];
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Globe className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Code Translator
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Translate code between programming languages
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  Backend: {backendStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/history')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <History className="h-4 w-4" />
            <span>History</span>
          </button>
          <button 
            onClick={() => setShowFeatures(!showFeatures)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <BookOpen className="h-4 w-4" />
            <span>Examples</span>
          </button>
        </div>
      </div>

      {/* Features Panel */}
      {showFeatures && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <Cpu className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Code Examples</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Basic syntax only (functions not supported)
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFeatures(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {supportedFeatures.map((feature) => (
              <div 
                key={feature.id}
                className={`p-4 rounded-lg border ${
                  selectedFeature === feature.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{feature.name}</span>
                  {selectedFeature === feature.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {feature.description}
                </p>
                <button
                  onClick={() => loadExample(feature.id)}
                  className={`w-full text-sm px-3 py-1.5 rounded ${
                    selectedFeature === feature.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {selectedFeature === feature.id ? '✓ Loaded' : 'Load Example'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Source Language */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Source Language</label>
            <div className="relative">
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg appearance-none text-gray-900 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id} className="text-gray-900 dark:text-white">{lang.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={swapLanguages}
              className="mt-6 p-3 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <ArrowRightLeft className="h-5 w-5" />
            </button>
          </div>

          {/* Target Language */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white  mb-2">Target Language</label>
            <div className="relative">
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg appearance-none text-gray-900 dark:text-white"
              >
                {languages.filter(lang => lang.id !== sourceLanguage).map((lang) => (
                  <option key={lang.id} value={lang.id} className="text-gray-900 dark:text-white">{lang.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          {/* Stats */}
          <div className="md:col-span-2">
            <div className="h-full p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Translation Ready</p>
                <span className={`text-xs px-2 py-1 rounded ${backendStatus === 'connected' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'  : 'bg-red-100 dark:bg-red-900/30  text-red-700 dark:text-red-300'}`}>
                  {backendStatus === 'connected' ? 'All Systems Go' : 'Service Offline'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {sourceCode.split('\n').length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Lines</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {sourceCode.split(' ').filter(w => w.trim()).length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {sourceLanguage}→{targetLanguage}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Translation</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTranslateCode}
              disabled={isTranslating || !sourceCode.trim() || sourceLanguage === targetLanguage}
              className="flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Translate Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleCompileAndRun}
              disabled={!translatedCode.trim() || isTranslating}
              className="flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Terminal className="h-5 w-5" />
              <span>Compile & Run</span>
            </button>
          </div>

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
        {/* Source Code */}
        <div className={isFullscreen ? 'hidden' : 'block'}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${getLanguageInfo(sourceLanguage).color}`}>
                    <span className="text-white text-sm font-bold">{getLanguageInfo(sourceLanguage).icon}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{getLanguageInfo(sourceLanguage).name} Code</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {supportedFeatures.find(f => f.id === selectedFeature)?.name} Example
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copySourceCode}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      copiedSource 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {copiedSource ? (
                      <>
                        <Check className="h-4 w-4" />
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
                    onClick={() => setSourceCode('')}
                    className="p-2 text-gray-500 dark:text-gray-400  hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Clear code"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                className={`w-full h-96 font-mono text-sm p-6 focus:outline-none resize-none ${editorTheme === 'vs-dark' ? 'bg-gray-900 text-gray-100' : editorTheme === 'vs-light' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-100'}`}
                spellCheck="false"
                placeholder="Enter your source code here..."
              />
              {showLineNumbers && (
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 overflow-y-auto">
                  {sourceCode.split('\n').map((_, index) => (
                    <div key={index} className="text-right pr-3 py-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {index + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Translated Code */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-900 dark:to-green-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${getLanguageInfo(targetLanguage).color}`}>
                    <span className="text-white text-sm font-bold">{getLanguageInfo(targetLanguage).icon}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{getLanguageInfo(targetLanguage).name} Translation</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {sourceLanguage} → {targetLanguage}
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyTargetCode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    copiedTarget 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {copiedTarget ? (
                    <>
                      <Check className="h-4 w-4" />
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
                value={translatedCode}
                readOnly
                 className={`w-full h-96 font-mono text-sm p-6 focus:outline-none
                  ${editorTheme === 'vs-dark' ? 'bg-gray-900 text-gray-100' : 
                   editorTheme === 'vs-light' ? 'bg-white text-gray-900' : 
                  'bg-gray-800 text-gray-100'}
                   ${translatedCode.includes('❌') ? 'text-red-600 dark:text-red-400' :
                   translatedCode.includes('Translating') ? 'text-blue-600 dark:text-blue-400' :
                   translatedCode.includes('✓') ? 'text-green-600 dark:text-green-400' : ''}`}
                spellCheck="false"
                placeholder="Translated code will appear here..."
              />
              {showLineNumbers && (
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-100 dark:bg-gray-900 border-r overflow-y-auto">
                  {translatedCode.split('\n').map((_, index) => (
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

      {/* History Panel */}
      {showHistory && translationHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Translations</h3>
            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3">
            {translationHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium capitalize">
                      {item.sourceLanguage} → {item.targetLanguage}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">{item.sourceCode}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.timestamp}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSourceCode(item.sourceCode);
                    setSourceLanguage(item.sourceLanguage);
                    setTargetLanguage(item.targetLanguage);
                    setShowHistory(false);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Info */}
      
    </div>
  );
};

export default Translator;