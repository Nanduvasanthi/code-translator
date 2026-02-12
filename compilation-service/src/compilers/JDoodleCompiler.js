const BaseCompiler = require('./BaseCompiler');
const path = require('path');

// ✅ Load .env from the correct path (compilation-service/.env)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class JDoodleCompiler extends BaseCompiler {
    constructor() {
        super();
        this.name = 'JDoodleCompiler';
        this.apiUrl = 'https://api.jdoodle.com/v1/execute';
        
        // ✅ LOAD CREDENTIALS FROM .ENV FILE
        this.clientId = process.env.JD_CLIENT_ID;
        this.clientSecret = process.env.JD_CLIENT_SECRET;
        
        this.supportedLanguages = ['python', 'java', 'c'];
        
        this.languageMap = {
            'python': 'python3',
            'java': 'java',
            'c': 'c'
        };
        
        this.versionMap = {
            'python': '4',
            'java': '4',
            'c': '5'
        };
    }

    async compile(code, language) {
        console.log(`🚀 JDoodle Compiling ${language}...`);
        
        const lang = language.toLowerCase();
        
        if (!this.supportedLanguages.includes(lang)) {
            throw new Error(`Language ${language} not supported by JDoodle`);
        }

        // ✅ CHECK IF CREDENTIALS ARE LOADED FROM .ENV
        if (!this.clientId || !this.clientSecret) {
            console.error('❌ JDoodle credentials not found in .env file!');
            console.error('📁 Expected .env location:', path.join(__dirname, '../../.env'));
            return {
                success: false,
                language: language,
                output: '',
                stderr: 'JDoodle credentials not configured. Please check your .env file.',
                errors: ['JDoodle credentials missing from .env'],
                warnings: [],
                timestamp: new Date().toISOString(),
                compilationEngine: 'jdoodle-error'
            };
        }

        try {
            const payload = {
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                script: code,
                language: this.languageMap[lang],
                versionIndex: this.versionMap[lang],
                stdin: ''
            };

            console.log(`📦 Sending request to JDoodle...`);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`JDoodle API error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            
            const isSuccess = result.statusCode === 200 && !result.error;
            
            return {
                success: isSuccess,
                output: result.output || '',
                stderr: result.error || '',
                error: result.error || '',
                apiDetails: {
                    exitCode: result.statusCode || 0,
                    language: language,
                    engine: 'jdoodle',
                    compiler: 'JDoodleCompiler',
                    memory: result.memory,
                    cpuTime: result.cpuTime
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`💥 JDoodle compilation error:`, error.message);
            return {
                success: false,
                language: language,
                output: '',
                stderr: error.message,
                errors: [`JDoodle compilation failed: ${error.message}`],
                warnings: [],
                timestamp: new Date().toISOString(),
                compilationEngine: 'jdoodle-error'
            };
        }
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    isAvailable() {
        return this.clientId && this.clientSecret;
    }
}

module.exports = JDoodleCompiler;