const compilerFactory = require('./compilers/CompilerFactory');

class CompilationService {
    constructor() {
        this.supportedLanguages = compilerFactory.getSupportedLanguages();
        this.compilerInfo = compilerFactory.getCompilerInfo();
    }

    async compile(code, language, options = {}) {
    console.log(`🚀 Piston Compilation: ${language}, ${code.length} chars`);
    
    // Validate input
    if (!code || typeof code !== 'string') {
        throw new Error('Code must be a non-empty string');
    }

    if (!compilerFactory.validateLanguage(language)) {
        throw new Error(`Unsupported language: ${language}. Supported: ${this.supportedLanguages.join(', ')}`);
    }

    try {
        // Create compiler instance
        const compiler = compilerFactory.createCompiler(language);
        
        // Perform compilation via Piston API
        const result = await compiler.compile(code);
        
        // Add metadata
        result.timestamp = new Date().toISOString();
        result.serviceVersion = '2.0.0';
        result.compilationEngine = 'piston-api';
        
        // Fix: Use result.success directly from PistonCompiler
        const isSuccess = result.success === true;
        
        console.log(`✅ ${language} compilation ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        // Log details if compilation failed
        if (!isSuccess) {
            if (result.stderr && result.stderr.trim()) {
                console.log(`   Stderr: ${result.stderr.substring(0, 200)}`);
            } else if (result.errors && result.errors.length > 0) {
                console.log(`   Errors: ${result.errors.join(', ').substring(0, 200)}`);
            } else {
                console.log(`   Exit code: ${result.apiDetails?.exitCode}`);
            }
        } else if (result.output) {
            console.log(`   Output: ${result.output.substring(0, 100)}...`);
        }
        
        return result;
        
    } catch (error) {
        console.error(`💥 Compilation error: ${error.message}`);
        
        return {
            success: false,
            language: language,
            output: '',
            stderr: error.message,
            errors: [`Compilation service error: ${error.message}`],
            warnings: [],
            timestamp: new Date().toISOString(),
            compilationEngine: 'error'
        };
    }
}

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    getServiceInfo() {
        return {
            name: 'Piston API Compilation Service',
            version: '2.0.0',
            type: 'api-execution',
            engine: 'Piston API',
            languages: this.supportedLanguages,
            features: [
                'Real compilation and execution',
                'Accurate program output',
                'Free unlimited API',
                'Cross-platform deployment'
            ],
            provider: this.compilerInfo
        };
    }
}

module.exports = CompilationService;