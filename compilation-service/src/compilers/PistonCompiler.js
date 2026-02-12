class PistonCompiler {
    constructor() {
        this.name = 'PistonCompiler';
        this.apiUrl = 'https://emkc.org/api/v2/piston/execute';
        // ONLY Java, C, Python
        this.supportedLanguages = ['python', 'java', 'c'];
        this.languageVersions = {
            'python': '3.10.0',
            'java': '15.0.2',
            'c': '10.2.0'
        };
    }

    async compile(code, language) {
        console.log(`🚀 Piston API Compiling ${language}...`);
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    language: language,
                    version: this.languageVersions[language] || '*',
                    files: [
                        {
                            content: code
                        }
                    ],
                    stdin: '',
                    args: [],
                    compile_timeout: 10000,
                    run_timeout: 3000
                })
            });

            if (!response.ok) {
                throw new Error(`Piston API error: ${response.status}`);
            }

            const result = await response.json();
            
            const run = result.run || {};
            const compile = result.compile || {};
            
            return {
                success: run.code === 0,
                output: run.stdout || '',
                stderr: run.stderr || compile.stderr || '',
                error: run.stderr || compile.stderr || '',
                apiDetails: {
                    exitCode: run.code,
                    language: language,
                    engine: 'piston',
                    compiler: 'PistonCompiler'
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`💥 Piston API error:`, error.message);
            return {
                success: false,
                language: language,
                output: '',
                stderr: error.message,
                errors: [`Piston compilation failed: ${error.message}`],
                warnings: [],
                timestamp: new Date().toISOString(),
                compilationEngine: 'piston-error'
            };
        }
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    isAvailable() {
        return false;
    }
}

module.exports = PistonCompiler;