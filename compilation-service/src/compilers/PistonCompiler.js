const axios = require('axios');

class PistonCompiler {
    constructor() {
        this.languageVersions = {
            python: '3.10.0',
            java: '15.0.2',
            c: '10.2.0'
        };
        
        this.apiUrl = 'https://emkc.org/api/v2/piston/execute';
    }
    
    async compile(code, language) {
        console.log(`🚀 Piston API compiling ${language}...`);
        
        const lang = language.toLowerCase();
        const version = this.languageVersions[lang];
        
        if (!version) {
            return {
                success: false,
                language: language,
                output: '',
                errors: [`Unsupported language: ${language}`],
                warnings: []
            };
        }
        
        try {
            // Prepare code based on language
            let preparedCode = this.prepareCode(code, lang);
            
            const response = await axios.post(this.apiUrl, {
                language: lang,
                version: version,
                files: [{
                    name: this.getFileName(lang),
                    content: preparedCode
                }]
            }, {
                timeout: 20000
            });
            
            const result = response.data;
            
            // Debug logging
            console.log(`Piston ${language} response:`, {
                exitCode: result.run?.code,
                hasStdout: !!result.run?.stdout,
                stdoutLength: result.run?.stdout?.length || 0,
                hasStderr: !!result.run?.stderr,
                stderrLength: result.run?.stderr?.length || 0,
                stderrPreview: result.run?.stderr?.substring(0, 100)
            });
            
            // Extract data from response
            const stderr = result.run?.stderr || '';
            const stdout = result.run?.stdout || '';
            const exitCode = result.run?.code || 0;
            
            // Determine success: exit code 0 AND no stderr
            // Note: Some languages might have warnings in stderr but still be successful
            // For validation purposes, we consider it successful if exit code is 0
            const hasStderr = stderr && stderr.trim().length > 0;
            const success = exitCode === 0; // Success if exit code is 0
            
            // Prepare errors array
            const errors = [];
            if (hasStderr) {
                errors.push(stderr.trim());
            }
            
            console.log(`Compilation result: ${success ? 'SUCCESS' : 'FAILED'}, Exit code: ${exitCode}, Has stderr: ${hasStderr}`);
            
            return {
                success: success,
                language: language,
                output: stdout,
                stderr: stderr,
                errors: errors,
                warnings: [],
                compilationType: 'piston-api',
                apiDetails: {
                    provider: 'Piston API',
                    exitCode: exitCode,
                    hasStderr: hasStderr,
                    languageVersion: version
                }
            };
            
        } catch (error) {
            console.error(`Piston API error for ${language}:`, error.message);
            
            return {
                success: false,
                language: language,
                output: '',
                stderr: error.message,
                errors: [`Piston API error: ${error.message}`],
                warnings: ['Check your code syntax']
            };
        }
    }
    
    prepareCode(code, language) {
        switch (language) {
            case 'java':
                // Ensure Java has proper class structure
                if (!code.includes('public class') && !code.includes('class Main')) {
                    return `public class Main {\n    public static void main(String[] args) {\n${code}\n    }\n}`;
                }
                break;
                
            case 'c':
                // Ensure C has main function
                if (!code.includes('int main') && !code.includes('void main') && !code.includes('main(')) {
                    return `#include <stdio.h>\n\nint main() {\n${code}\n    return 0;\n}`;
                }
                break;
        }
        return code;
    }
    
    getFileName(language) {
        switch (language) {
            case 'python': return 'main.py';
            case 'java': return 'Main.java';
            case 'c': return 'main.c';
            default: return 'code.txt';
        }
    }
    
    getSupportedLanguages() {
        return Object.keys(this.languageVersions);
    }
}

module.exports = PistonCompiler;