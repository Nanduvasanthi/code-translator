const PistonCompiler = require('./PistonCompiler');

class CompilerFactory {
    constructor() {
        this.pistonCompiler = new PistonCompiler();
    }
    
    createCompiler(language) {
        const lang = language.toLowerCase();
        
        // Use single Piston compiler for all languages
        if (this.pistonCompiler.getSupportedLanguages().includes(lang)) {
            return {
                compile: async (code) => {
                    return await this.pistonCompiler.compile(code, lang);
                }
            };
        }
        
        throw new Error(`Unsupported language: ${language}`);
    }
    
    getSupportedLanguages() {
        return this.pistonCompiler.getSupportedLanguages();
    }
    
    validateLanguage(language) {
        const supported = this.getSupportedLanguages();
        return supported.includes(language.toLowerCase());
    }
    
    getCompilerInfo() {
        return {
            compiler: 'PistonCompiler',
            api: 'Piston API (emkc.org)',
            features: ['Real compilation', 'Actual execution', 'Free unlimited'],
            languages: this.getSupportedLanguages(),
            versions: this.pistonCompiler.languageVersions
        };
    }
}

// Export singleton instance
const compilerFactory = new CompilerFactory();
module.exports = compilerFactory;