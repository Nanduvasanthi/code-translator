const PistonCompiler = require('./PistonCompiler');
const JDoodleCompiler = require('./JDoodleCompiler'); // Use JDoodle

class CompilerFactory {
    constructor() {
        // Initialize compilers
        this.pistonCompiler = new PistonCompiler();
        this.primaryCompiler = new JDoodleCompiler(); // JDoodle as primary
        
        // Default to JDoodle
        this.activeCompiler = 'jdoodle';
        
        // Supported languages
        this.supportedLanguages = ['python', 'java', 'c'];
    }
    
    createCompiler(language, options = {}) {
        const lang = language.toLowerCase();
        
        if (!this.supportedLanguages.includes(lang)) {
            throw new Error(`Unsupported language: ${language}. Supported: ${this.supportedLanguages.join(', ')}`);
        }
        
        const useCompiler = options.compiler || this.activeCompiler;
        
        if (useCompiler === 'piston' && this.pistonCompiler.getSupportedLanguages().includes(lang)) {
            console.log(`🚀 Using Piston API for ${lang}`);
            return {
                compile: async (code) => {
                    return await this.pistonCompiler.compile(code, lang);
                }
            };
        } else {
            console.log(`🟢 Using JDoodle for ${lang}`);
            return {
                compile: async (code) => {
                    return await this.primaryCompiler.compile(code, lang);
                }
            };
        }
    }
    
    async compileWithFallback(code, language) {
        const lang = language.toLowerCase();
        
        // Try JDoodle first
        try {
            console.log(`🟢 Attempting JDoodle for ${lang}...`);
            const result = await this.primaryCompiler.compile(code, lang);
            
            if (result.success === true) {
                console.log(`✅ JDoodle successful`);
                return {
                    ...result,
                    compiler: 'jdoodle'
                };
            } else {
                console.log(`⚠️ JDoodle failed, trying Piston...`);
                throw new Error('JDoodle failed');
            }
        } catch (jdoodleError) {
            // Fallback to Piston
            console.log(`🚀 Falling back to Piston API for ${lang}...`);
            try {
                const pistonResult = await this.pistonCompiler.compile(code, lang);
                return {
                    ...pistonResult,
                    compiler: 'piston',
                    fallback: true
                };
            } catch (pistonError) {
                throw new Error(`Both compilers failed. JDoodle: ${jdoodleError.message}, Piston: ${pistonError.message}`);
            }
        }
    }
    
    usePiston() {
        this.activeCompiler = 'piston';
        console.log('🔵 Switched to Piston API');
    }
    
    useJDoodle() {
        this.activeCompiler = 'jdoodle';
        console.log('🟢 Switched to JDoodle');
    }
    
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
    
    validateLanguage(language) {
        return this.supportedLanguages.includes(language.toLowerCase());
    }
    
    getCompilerInfo() {
        return {
            primary: {
                compiler: 'JDoodleCompiler',
                api: 'JDoodle API',
                status: this.primaryCompiler.isAvailable() ? 'active' : 'needs credentials',
                features: [
                    'FREE - 200 compilations per day',
                    'Requires free API key',
                    'Python, Java, C supported'
                ],
                languages: this.primaryCompiler.getSupportedLanguages(),
                setup: 'https://www.jdoodle.com/compiler-api/'
            },
            fallback: {
                compiler: 'PistonCompiler',
                api: 'Piston API (emkc.org)',
                status: 'unstable/offline',
                languages: this.pistonCompiler.getSupportedLanguages()
            },
            active: this.activeCompiler,
            allLanguages: this.supportedLanguages
        };
    }
}

// Export singleton instance
const compilerFactory = new CompilerFactory();
module.exports = compilerFactory;