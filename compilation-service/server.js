// Load environment variables FIRST
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { compilationService } = require('./src');

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
    const info = compilationService.getServiceInfo();
    
    res.json({
        status: 'JDoodle Compilation Service is running',
        timestamp: new Date().toISOString(),
        service: info.name,
        version: info.version,
        supportedLanguages: compilationService.getSupportedLanguages(),
        engine: 'JDoodle API',
        dailyLimit: '100 free compilations per day',
        features: info.features
    });
});

// Compilation endpoint
app.post('/compile', async (req, res) => {
    try {
        const { code, language } = req.body;
        
        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Both code and language are required',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`\n📨 Compilation request received:`);
        console.log(`   Language: ${language}`);
        console.log(`   Code length: ${code.length} characters`);
        
        const result = await compilationService.compile(code, language);
        
        console.log(`📤 Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (result.success && result.output) {
            console.log(`   Output preview: ${result.output.substring(0, 80)}...`);
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('💥 Route error:', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Service info endpoint
app.get('/info', (req, res) => {
    res.json(compilationService.getServiceInfo());
});

// Languages endpoint
app.get('/languages', (req, res) => {
    res.json({
        supportedLanguages: compilationService.getSupportedLanguages(),
        timestamp: new Date().toISOString(),
        count: compilationService.getSupportedLanguages().length
    });
});

// Test compilation endpoint
app.post('/test', async (req, res) => {
    const testCodes = {
        python: 'print("Hello from Python!")\nprint(2 + 2)',
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        System.out.println(10 + 20);\n    }\n}',
        c: '#include <stdio.h>\nint main() {\n    printf("Hello from C!\\n");\n    printf("3 * 4 = %d\\n", 3 * 4);\n    return 0;\n}'
    };
    
    const results = {};
    const summary = { success: 0, failed: 0 };
    
    for (const [lang, code] of Object.entries(testCodes)) {
        try {
            results[lang] = await compilationService.compile(code, lang);
            if (results[lang].success) {
                summary.success++;
            } else {
                summary.failed++;
            }
        } catch (error) {
            results[lang] = { success: false, error: error.message };
            summary.failed++;
        }
    }
    
    res.json({
        testResults: results,
        summary: summary,
        timestamp: new Date().toISOString(),
        status: 'Test completed',
        engine: 'JDoodle API'
    });
});

// Start server
app.listen(port, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 COMPILATION SERVICE');
    console.log('='.repeat(60));
    console.log(`✅ Service running on http://localhost:${port}`);
    console.log(`📡 Health check: GET http://localhost:${port}/health`);
    console.log(`⚡ Compile endpoint: POST http://localhost:${port}/compile`);
    console.log(`📊 Info: GET http://localhost:${port}/info`);
    console.log(`🧪 Test: POST http://localhost:${port}/test`);
    
    console.log('\n📋 Supported Languages:');
    compilationService.getSupportedLanguages().forEach((lang, i) => {
        console.log(`   ${i + 1}. ${lang.charAt(0).toUpperCase() + lang.slice(1)}`);
    });
    
    // Show JDoodle status
    const compilerInfo = compilationService.getServiceInfo();
    console.log('\n🔧 Engine: JDoodle API');
    console.log(`📊 Status: ${compilerInfo.provider?.primary?.status || 'Active'}`);
    console.log(`🎯 Daily Limit: 100 free compilations`);
    console.log(`🔑 Credentials: ${process.env.JD_CLIENT_ID ? '✅ Configured' : '❌ Missing'}`);
    
    if (!process.env.JD_CLIENT_ID || !process.env.JD_CLIENT_SECRET) {
        console.log('\n⚠️  WARNING: JDoodle credentials not found in .env file!');
        console.log('   Create .env file with:');
        console.log('   JD_CLIENT_ID=your_client_id');
        console.log('   JD_CLIENT_SECRET=your_client_secret');
    }
    
    console.log('='.repeat(60) + '\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down compilation service gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down compilation service gracefully...');
    process.exit(0);
});

module.exports = app; // For testing