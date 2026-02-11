const CompilationService = require('./CompilationService');

// Create and export the compilation service instance
const compilationService = new CompilationService();

// Export the service class and instance
module.exports = {
    CompilationService: CompilationService,
    compilationService: compilationService,
    
    // Helper functions for direct use
    compile: async (code, language) => {
        return await compilationService.compile(code, language);
    },
    
    getSupportedLanguages: () => {
        return compilationService.getSupportedLanguages();
    },
    
    getServiceInfo: () => {
        return compilationService.getServiceInfo();
    }
};