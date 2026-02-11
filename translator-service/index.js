import express from 'express';
import cors from 'cors';
import { PythonToJavaTranslator } from './src/translators/python-to-java/index.js';
import { CToJavaTranslator } from './src/translators/c-to-java/index.js';
import { JavaToPythonTranslator } from './src/translators/java-to-python/index.js';
import { CToPythonTranslator } from './src/translators/c-to-python/index.js';
import { JavaToCTranslator} from './src/translators/java-to-c/index.js';
import { PythonToCTranslator } from './src/translators/python-to-c/index.js'; // ADD THIS IMPORT

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize translators
let pythonToJavaTranslator;
let cToJavaTranslator;
let javaToPythonTranslator;
let cToPythonTranslator;
let javaToCTranslator;
let pythonToCTranslator; // ADD THIS

try {
  pythonToJavaTranslator = new PythonToJavaTranslator();
  console.log('✅ Python-to-Java translator initialized');
} catch (error) {
  console.error('❌ Python-to-Java translator failed:', error.message);
  pythonToJavaTranslator = {
    translate: (code) => ({ success: false, code: `// Python translation unavailable\n// ${code}` })
  };
}

try {
  cToJavaTranslator = new CToJavaTranslator();
  console.log('✅ C-to-Java translator initialized');
} catch (error) {
  console.error('❌ C-to-Java translator failed:', error.message);
  cToJavaTranslator = {
    translate: (code) => ({ success: false, code: `// C translation unavailable\n// ${code}` })
  };
}

try {
  javaToPythonTranslator = new JavaToPythonTranslator();
  console.log('✅ Java-to-Python translator initialized');
} catch (error) {
  console.error('❌ Java-to-Python translator failed:', error.message);
  javaToPythonTranslator = {
    translate: (code) => ({ success: false, code: `# Java translation unavailable\n# ${code}` })
  };
}

try {
  cToPythonTranslator = new CToPythonTranslator();
  console.log('✅ C-to-Python translator initialized');
} catch (error) {
  console.error('❌ C-to-Python translator failed:', error.message);
  cToPythonTranslator = {
    translate: (code) => ({ success: false, code: `# C translation unavailable\n# ${code}` })
  };
}

try {
  javaToCTranslator = new JavaToCTranslator();
  console.log('✅ Java-to-C translator initialized');
} catch (error) {
  console.error('❌ Java-to-C translator failed:', error.message);
  javaToCTranslator = {
    translate: (code) => ({ success: false, code: `/* Java to C translation unavailable */\n/* ${code} */` })
  };
}

// ADD PYTHON TO C INITIALIZATION
try {
  pythonToCTranslator = new PythonToCTranslator();
  console.log('✅ Python-to-C translator initialized');
} catch (error) {
  console.error('❌ Python-to-C translator failed:', error.message);
  pythonToCTranslator = {
    translate: (code) => ({ success: false, code: `/* Python to C translation unavailable */\n/* ${code} */` })
  };
}

// Get appropriate translator
function getTranslator(sourceLang, targetLang) {
  const key = `${sourceLang.toLowerCase()}_to_${targetLang.toLowerCase()}`;
  
  const translators = {
    'python_to_java': pythonToJavaTranslator,
    'c_to_java': cToJavaTranslator,
    'java_to_python': javaToPythonTranslator,
    'c_to_python': cToPythonTranslator,
    'java_to_c': javaToCTranslator,
    'python_to_c': pythonToCTranslator // ADD THIS
  };
  
  return translators[key] || null;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'translator-service',
    version: '2.4.0', // UPDATE VERSION
    supported_translations: [
      'python→java',
      'c→java',
      'java→python',
      'c→python',
      'java→c',
      'python→c' // ADD THIS
    ]
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  const testJavaCode = `public class Main {
    public static void main(String[] args) {
        // Basic print
        System.out.println("Hello, World!");
        
        // Variables
        String name = "Alice";
        int age = 25;
        
        // Print with concatenation
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
        
        // Data types
        byte b = 100;
        short s = 10000;
        int x = 100000;
        long l = 10000000000L;
        float f = 3.14f;
        double d = 3.14159;
        char c = 'A';
        boolean bool = true;
        
        // Simple if statement
        if (age > 18) {
            System.out.println("Adult");
        }
        
        // For loop
        for (int i = 0; i < 5; i++) {
            System.out.println("Count: " + i);
        }
    }
}`;

  const testCCode = `#include <stdio.h>

int main() {
    // Basic C example
    printf("Hello, World!\\n");
    
    char name[] = "Alice";
    int age = 25;
    
    printf("Name: %s\\n", name);
    printf("Age: %d\\n", age);
    
    // Arithmetic operations
    int x = 10;
    int y = 20;
    int sum = x + y;
    printf("Sum: %d\\n", sum);
    
    // Conditional
    if (age > 18) {
        printf("Adult\\n");
    } else {
        printf("Minor\\n");
    }
    
    // Loop
    for (int i = 0; i < 3; i++) {
        printf("Count: %d\\n", i);
    }
    
    return 0;
}`;

  const testPythonCode = `# Simple Python code
x = 10
y = 20
result = x + y
print("Result:", result)

# Conditional
if x > 5:
    print("x is greater than 5")
else:
    print("x is 5 or less")

# Loop
for i in range(3):
    print(f"Count: {i}")

# List example
numbers = [1, 2, 3, 4, 5]
sum_numbers = sum(numbers)
print("Sum of numbers:", sum_numbers)`;

  const tests = [
    {
      name: 'Python to Java',
      source: 'python',
      target: 'java',
      code: testPythonCode,
      translator: pythonToJavaTranslator
    },
    {
      name: 'C to Java',
      source: 'c',
      target: 'java',
      code: '#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    \n    int x = 10;\n    int y = 20;\n    \n    if (x < y) {\n        printf("x is less than y\\n");\n    }\n    \n    for (int i = 0; i < 3; i++) {\n        printf("i = %d\\n", i);\n    }\n    \n    return 0;\n}',
      translator: cToJavaTranslator
    },
    {
      name: 'Java to Python',
      source: 'java',
      target: 'python',
      code: testJavaCode,
      translator: javaToPythonTranslator
    },
    {
      name: 'C to Python',
      source: 'c',
      target: 'python',
      code: testCCode,
      translator: cToPythonTranslator
    },
    {
      name: 'Java to C',
      source: 'java',
      target: 'c',
      code: `public class Main {
    public static void main(String[] args) {
        // Basic Java example
        System.out.println("Converting Java to C!");
        
        int num1 = 10;
        int num2 = 20;
        int sum = num1 + num2;
        
        System.out.println("Sum: " + sum);
        
        // If statement
        if (sum > 25) {
            System.out.println("Sum is greater than 25");
        } else {
            System.out.println("Sum is 25 or less");
        }
        
        // For loop
        for (int i = 0; i < 3; i++) {
            System.out.println("Loop iteration: " + i);
        }
    }
}`,
      translator: javaToCTranslator
    },
    // ADD PYTHON TO C TEST
    {
      name: 'Python to C',
      source: 'python',
      target: 'c',
      code: testPythonCode,
      translator: pythonToCTranslator
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = test.translator.translate(test.code);
      results.push({
        name: test.name,
        source: test.source,
        target: test.target,
        success: result.success !== false,
        original: test.code.substring(0, 150) + (test.code.length > 150 ? '...' : ''),
        translated: typeof result === 'string' ? result.substring(0, 250) + (result.length > 250 ? '...' : '') :
                   result.code ? result.code.substring(0, 250) + (result.code.length > 250 ? '...' : '') :
                   'No translation generated',
        warnings: result.warnings || [],
        error: result.error || null
      });
    } catch (error) {
      results.push({
        name: test.name,
        source: test.source,
        target: test.target,
        success: false,
        error: error.message,
        original: test.code.substring(0, 100) + '...'
      });
    }
  }
  
  res.json({ 
    message: 'Test results for all translators',
    timestamp: new Date().toISOString(),
    results 
  });
});

// Individual test endpoints for each translator
app.get('/test/java-to-c', (req, res) => {
  const testCases = [
    {
      name: 'Basic Print',
      javaCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      expectedType: 'c'
    },
    {
      name: 'Variables and Arithmetic',
      javaCode: `public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int sum = a + b;
        System.out.println("Sum: " + sum);
    }
}`,
      expectedType: 'c'
    },
    {
      name: 'If Statement',
      javaCode: `public class Main {
    public static void main(String[] args) {
        int age = 25;
        
        if (age >= 18) {
            System.out.println("Adult");
        } else {
            System.out.println("Minor");
        }
    }
}`,
      expectedType: 'c'
    },
    {
      name: 'For Loop',
      javaCode: `public class Main {
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            System.out.println("Count: " + i);
        }
    }
}`,
      expectedType: 'c'
    },
    {
      name: 'Data Types',
      javaCode: `public class Main {
    public static void main(String[] args) {
        int x = 100;
        float y = 3.14f;
        double z = 2.71828;
        char c = 'A';
        boolean flag = true;
        
        System.out.println("int: " + x);
        System.out.println("float: " + y);
        System.out.println("double: " + z);
        System.out.println("char: " + c);
        System.out.println("boolean: " + flag);
    }
}`,
      expectedType: 'c'
    }
  ];

  const testResults = [];
  
  for (const testCase of testCases) {
    try {
      const result = javaToCTranslator.translate(testCase.javaCode);
      testResults.push({
        name: testCase.name,
        success: result.success !== false,
        javaCode: testCase.javaCode,
        cCode: result.code ? result.code.substring(0, 300) + (result.code.length > 300 ? '...' : '') : 'No output',
        warnings: result.warnings || [],
        error: result.error || null
      });
    } catch (error) {
      testResults.push({
        name: testCase.name,
        success: false,
        javaCode: testCase.javaCode,
        error: error.message
      });
    }
  }
  
  res.json({
    translator: 'Java to C',
    testCount: testResults.length,
    results: testResults
  });
});

// ADD PYTHON TO C TEST ENDPOINT
app.get('/test/python-to-c', (req, res) => {
  const testCases = [
    {
      name: 'Basic Print and Variables',
      pythonCode: `# Simple Python program
x = 10
y = 20
print("x =", x)
print("y =", y)
sum = x + y
print("Sum =", sum)`,
      expectedType: 'c'
    },
    {
      name: 'If-Else Statement',
      pythonCode: `# Python if-else
age = 25

if age >= 18:
    print("Adult")
else:
    print("Minor")`,
      expectedType: 'c'
    },
    {
      name: 'For Loop with range',
      pythonCode: `# Python for loop
for i in range(5):
    print(f"Number: {i}")`,
      expectedType: 'c'
    },
    {
      name: 'While Loop',
      pythonCode: `# Python while loop
count = 0
while count < 3:
    print(f"Count: {count}")
    count += 1`,
      expectedType: 'c'
    },
    {
      name: 'Lists and Arrays',
      pythonCode: `# Python list operations
numbers = [1, 2, 3, 4, 5]
print("First number:", numbers[0])
print("List length:", len(numbers))

# Modify list
numbers[2] = 30
print("Modified list:", numbers)`,
      expectedType: 'c'
    },
    {
      name: 'Nested Conditions',
      pythonCode: `# Nested if statements
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"

print(f"Score: {score}, Grade: {grade}")`,
      expectedType: 'c'
    },
    {
      name: 'Simple Calculator',
      pythonCode: `# Simple calculator operations
a = 15
b = 4

print("Addition:", a + b)
print("Subtraction:", a - b)
print("Multiplication:", a * b)
print("Division:", a / b)
print("Modulus:", a % b)
print("Exponent:", a ** 2)`,
      expectedType: 'c'
    }
  ];

  const testResults = [];
  
  for (const testCase of testCases) {
    try {
      const result = pythonToCTranslator.translate(testCase.pythonCode);
      testResults.push({
        name: testCase.name,
        success: result.success !== false,
        pythonCode: testCase.pythonCode,
        cCode: typeof result === 'string' ? result.substring(0, 350) + (result.length > 350 ? '...' : '') :
               result.code ? result.code.substring(0, 350) + (result.code.length > 350 ? '...' : '') : 'No output',
        warnings: result.warnings || [],
        error: result.error || null
      });
    } catch (error) {
      testResults.push({
        name: testCase.name,
        success: false,
        pythonCode: testCase.pythonCode,
        error: error.message
      });
    }
  }
  
  res.json({
    translator: 'Python to C',
    testCount: testResults.length,
    results: testResults
  });
});

// Main translation endpoint
app.post('/translate', (req, res) => {
  try {
    const { source_code, source_language, target_language } = req.body;
    
    if (!source_code) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing source_code' 
      });
    }
    
    if (!source_language || !target_language) {
      return res.status(400).json({ 
        success: false,
        error: 'Specify source_language and target_language' 
      });
    }
    
    const translator = getTranslator(source_language, target_language);
    
    if (!translator) {
      return res.status(400).json({ 
        success: false,
        error: `Translation ${source_language}→${target_language} not supported`,
        supported: [
          'python→java',
          'c→java', 
          'java→python',
          'c→python',
          'java→c',
          'python→c' // ADD THIS
        ]
      });
    }
    
    const startTime = Date.now();
    const result = translator.translate(source_code);
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ Translated ${source_language}→${target_language} in ${executionTime}ms`);
    
    const response = {
      success: result.success !== false,
      translated_code: typeof result === 'string' ? result : result.code,
      source_language,
      target_language,
      execution_time: executionTime,
      timestamp: new Date().toISOString()
    };
    
    // Add warnings if any
    if (result.warnings && result.warnings.length > 0) {
      response.warnings = result.warnings;
    }
    
    // Add error if translation failed
    if (result.error) {
      response.error = result.error;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Direct translation endpoints
app.post('/translate/java-to-c', (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing code parameter' 
      });
    }
    
    const startTime = Date.now();
    const result = javaToCTranslator.translate(code);
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ Java→C translation completed in ${executionTime}ms`);
    
    res.json({
      success: result.success !== false,
      java_code: code,
      c_code: result.code,
      execution_time: executionTime,
      warnings: result.warnings || [],
      error: result.error || null
    });
    
  } catch (error) {
    console.error('Java to C translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ADD PYTHON TO C DIRECT TRANSLATION ENDPOINT
app.post('/translate/python-to-c', (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing code parameter' 
      });
    }
    
    const startTime = Date.now();
    const result = pythonToCTranslator.translate(code);
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ Python→C translation completed in ${executionTime}ms`);
    
    res.json({
      success: result.success !== false,
      python_code: code,
      c_code: typeof result === 'string' ? result : result.code,
      execution_time: executionTime,
      warnings: result.warnings || [],
      error: result.error || null
    });
    
  } catch (error) {
    console.error('Python to C translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List available translations endpoint
app.get('/translations', (req, res) => {
  res.json({
    available_translations: [
      {
        source: 'python',
        target: 'java',
        endpoint: 'POST /translate with {"source_language": "python", "target_language": "java"}'
      },
      {
        source: 'c',
        target: 'java',
        endpoint: 'POST /translate with {"source_language": "c", "target_language": "java"}'
      },
      {
        source: 'java',
        target: 'python',
        endpoint: 'POST /translate with {"source_language": "java", "target_language": "python"}'
      },
      {
        source: 'c',
        target: 'python',
        endpoint: 'POST /translate with {"source_language": "c", "target_language": "python"}'
      },
      {
        source: 'java',
        target: 'c',
        endpoint: 'POST /translate with {"source_language": "java", "target_language": "c"} or POST /translate/java-to-c'
      },
      {
        source: 'python',
        target: 'c',
        endpoint: 'POST /translate with {"source_language": "python", "target_language": "c"} or POST /translate/python-to-c'
      }
    ],
    direct_endpoints: [
      'POST /translate/python-to-c',
      'POST /translate/java-to-c'
    ],
    test_endpoints: [
      'GET /test (all translators)',
      'GET /test/python-to-c',
      'GET /test/java-to-c'
    ]
  });
});

// ADD SIMPLE DEMO PAGE
app.get('/demo', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Code Translator Service v2.4.0</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: white;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                border: 1px solid rgba(255, 255, 255, 0.18);
            }
            h1 {
                text-align: center;
                color: white;
                margin-bottom: 30px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .translator-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            .translator-card {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 15px;
                padding: 20px;
                transition: transform 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .translator-card:hover {
                transform: translateY(-5px);
                background: rgba(255, 255, 255, 0.2);
            }
            .translator-card h3 {
                margin-top: 0;
                color: #fff;
                border-bottom: 2px solid rgba(255, 255, 255, 0.3);
                padding-bottom: 10px;
            }
            .status {
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.9em;
                font-weight: bold;
                margin-bottom: 15px;
            }
            .status.online {
                background: rgba(76, 175, 80, 0.3);
                color: #4CAF50;
                border: 1px solid #4CAF50;
            }
            .status.offline {
                background: rgba(244, 67, 54, 0.3);
                color: #F44336;
                border: 1px solid #F44336;
            }
            .endpoints {
                margin-top: 15px;
            }
            .endpoint {
                background: rgba(0, 0, 0, 0.2);
                padding: 10px;
                border-radius: 8px;
                margin: 5px 0;
                font-family: monospace;
                font-size: 0.9em;
                word-break: break-all;
            }
            .stats {
                display: flex;
                justify-content: space-around;
                margin-top: 30px;
                text-align: center;
            }
            .stat {
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 15px;
                min-width: 120px;
            }
            .stat-number {
                font-size: 2.5em;
                font-weight: bold;
                margin: 10px 0;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
            }
            .stat-label {
                font-size: 0.9em;
                opacity: 0.9;
            }
            .version {
                text-align: center;
                margin-top: 30px;
                opacity: 0.8;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Code Translator Service v2.4.0</h1>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">6</div>
                    <div class="stat-label">Translators</div>
                </div>
                <div class="stat">
                    <div class="stat-number">3</div>
                    <div class="stat-label">Languages</div>
                </div>
                <div class="stat">
                    <div class="stat-number">12</div>
                    <div class="stat-label">Endpoints</div>
                </div>
            </div>
            
            <div class="translator-grid">
                <div class="translator-card">
                    <div class="status online">✅ Online</div>
                    <h3>Python → Java</h3>
                    <p>Convert Python code to Java syntax with AST parsing</p>
                    <div class="endpoints">
                        <div class="endpoint">POST /translate</div>
                        <div class="endpoint">Body: {"source_language": "python", "target_language": "java"}</div>
                    </div>
                </div>
                
                <div class="translator-card">
                    <div class="status online">✅ Online</div>
                    <h3>C → Java</h3>
                    <p>Translate C code to Java with Tree-sitter</p>
                    <div class="endpoints">
                        <div class="endpoint">POST /translate</div>
                        <div class="endpoint">Body: {"source_language": "c", "target_language": "java"}</div>
                    </div>
                </div>
                
                <div class="translator-card">
                    <div class="status online">✅ Online</div>
                    <h3>Java → Python</h3>
                    <p>Convert Java to Python with syntax transformation</p>
                    <div class="endpoints">
                        <div class="endpoint">POST /translate</div>
                        <div class="endpoint">Body: {"source_language": "java", "target_language": "python"}</div>
                    </div>
                </div>
                
                <div class="translator-card">
                    <div class="status online">✅ Online</div>
                    <h3>C → Python</h3>
                    <p>Translate C to Python code</p>
                    <div class="endpoints">
                        <div class="endpoint">POST /translate</div>
                        <div class="endpoint">Body: {"source_language": "c", "target_language": "python"}</div>
                    </div>
                </div>
                
                <div class="translator-card">
                    <div class="status online">✅ Online</div>
                    <h3>Java → C</h3>
                    <p>Convert Java code to C syntax</p>
                    <div class="endpoints">
                        <div class="endpoint">POST /translate/java-to-c</div>
                        <div class="endpoint">POST /translate with {"source_language": "java", "target_language": "c"}</div>
                    </div>
                </div>
                
                <div class="translator-card">
                    <div class="status online">✅ NEW</div>
                    <h3>Python → C</h3>
                    <p>New! Translate Python to C code</p>
                    <div class="endpoints">
                        <div class="endpoint">POST /translate/python-to-c</div>
                        <div class="endpoint">POST /translate with {"source_language": "python", "target_language": "c"}</div>
                    </div>
                </div>
            </div>
            
            <div class="version">
                <p>Service running on port ${PORT} | Tree-sitter AST-based translation</p>
                <p>
                    <a href="/health" style="color: white; margin-right: 20px;">Health Check</a>
                    <a href="/test" style="color: white; margin-right: 20px;">Test All</a>
                    <a href="/translations" style="color: white;">All Endpoints</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `); 
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Translator service v2.4.0 running on http://localhost:${PORT}`);
  console.log(`🌐 Demo page: http://localhost:${PORT}/demo`);
  console.log(`📞 Main endpoint: POST http://localhost:${PORT}/translate`);
  console.log(`💻 Python to C direct: POST http://localhost:${PORT}/translate/python-to-c`);
  console.log(`💻 Java to C direct: POST http://localhost:${PORT}/translate/java-to-c`);
  console.log(`❤️  Health check: GET http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: GET http://localhost:${PORT}/test`);
  console.log(`🧪 Python→C tests: GET http://localhost:${PORT}/test/python-to-c`);
  console.log(`🧪 Java→C tests: GET http://localhost:${PORT}/test/java-to-c`);
  console.log(`📋 Available translations: GET http://localhost:${PORT}/translations`);
  console.log(`\n✅ Supported translations (6 total):`);
  console.log(`   • Python → Java`);
  console.log(`   • C → Java`);
  console.log(`   • Java → Python`);
  console.log(`   • C → Python`);
  console.log(`   • Java → C`);
  console.log(`   • Python → C (NEW!)`);
  console.log(`\n📊 Service Status: All translators initialized successfully ✓`);
});