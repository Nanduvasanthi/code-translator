const compilerFactory = require('./compilers/CompilerFactory');

class CompilationService {
    constructor() {
        this.supportedLanguages = compilerFactory.getSupportedLanguages();
        this.compilerInfo = compilerFactory.getCompilerInfo();
    }

    async compile(code, language, options = {}) {
        console.log(`📨 Compilation request received:`);
        console.log(`   Language: ${language}`);
        console.log(`   Code length: ${code.length} characters`);
        
        // Validate input
        if (!code || typeof code !== 'string') {
            throw new Error('Code must be a non-empty string');
        }

        if (!compilerFactory.validateLanguage(language)) {
            throw new Error(`Unsupported language: ${language}. Supported: ${this.supportedLanguages.join(', ')}`);
        }

        try {
            // Use automatic fallback compilation
            const result = await compilerFactory.compileWithFallback(code, language);
            
            // Add metadata
            result.timestamp = new Date().toISOString();
            result.serviceVersion = '2.2.0';
            result.compilationEngine = result.compiler || 'onecompiler';
            
            const isSuccess = result.success === true;
            
            console.log(`✅ ${language} compilation ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
            
            if (!isSuccess) {
                if (result.stderr && result.stderr.trim()) {
                    console.log(`   Stderr: ${result.stderr.substring(0, 200)}`);
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

    // Method to force specific compiler
    async compileWithOneCompiler(code, language) {
        compilerFactory.useOneCompiler();
        return this.compile(code, language, { compiler: 'onecompiler' });
    }

    async compileWithPiston(code, language) {
        compilerFactory.usePiston();
        return this.compile(code, language, { compiler: 'piston' });
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    getServiceInfo() {
        return {
            name: 'Multi-Engine Compilation Service',
            version: '2.2.0',
            type: 'api-execution',
            engines: ['OneCompiler', 'Piston API'],
            languages: this.supportedLanguages,
            features: [
                'Real compilation and execution',
                'Automatic fallback between APIs',
                'No API keys required',
                '100 free compilations per day'
            ],
            provider: this.compilerInfo
        };
    }

    async testCompiler() {
        return await compilerFactory.testCompiler();
    }
}

module.exports = CompilationService;