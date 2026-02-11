import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { protect } from '../../middleware/authMiddleware.js';
import Compilation from '../../models/Compilation.js';


const router = express.Router();

console.log('🔧 Compiler routes loading...');

// Helper function to call Piston API
async function callPistonAPI(code, language, stdin = '') {
    try {
        const pistonUrl = process.env.PISTON_API_URL || 'http://localhost:3002/compile';
        
        console.log(`📞 Calling Piston API for ${language}`);
        
        const response = await fetch(pistonUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                language: language.toLowerCase(),
                code: code,
                stdin: stdin
            })
        });
        
        const data = await response.json();
        
        return {
            success: data.success !== false,
            output: data.output || '',
            error: data.error || data.stderr || '',
            executionTime: data.execution_time || 0,
            exitCode: data.exitCode || 0
        };
        
    } catch (error) {
        console.error('❌ Piston API error:', error);
        return {
            success: false,
            output: '',
            error: 'Piston API failed: ' + error.message,
            executionTime: 0,
            exitCode: -1
        };
    }
}

// Helper function to execute commands (keep for backup if needed)
function executeCommand(command, args, stdin = '') {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const child = spawn(command, args);
        
        let output = '';
        let error = '';
        
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        if (stdin) {
            child.stdin.write(stdin);
            child.stdin.end();
        }
        
        child.on('close', (code) => {
            resolve({
                success: code === 0,
                output: output.trim(),
                error: error.trim(),
                executionTime: Date.now() - startTime,
                exitCode: code
            });
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            child.kill();
            resolve({
                success: false,
                output: '',
                error: 'Execution timeout (10 seconds)',
                executionTime: Date.now() - startTime,
                exitCode: -1
            });
        }, 10000);
    });
}

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Compiler service is running',
        timestamp: new Date().toISOString()
    });
});

// Get user's compilation history
router.get('/history', protect, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const compilations = await Compilation.find({ 
            userId: req.user._id 
        })
        .sort({ createdAt: -1 })
        .limit(50);

        console.log(`📊 Found ${compilations.length} compilations for user ${req.user.email}`);

        res.json({
            success: true,
            count: compilations.length,
            compilations: compilations.map(c => ({
                id: c._id,
                code: c.code.substring(0, 200) + (c.code.length > 200 ? '...' : ''),
                language: c.language,
                output: c.output,
                error: c.error,
                status: c.status,
                executionTime: c.executionTime,
                createdAt: c.createdAt
            }))
        });

    } catch (error) {
        console.error('❌ History fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch compilation history'
        });
    }
});

// Execute code for Python, Java, C
router.post('/execute', protect, async (req, res) => {
    
    try {
        console.log('🔍 COMPILER DEBUG START ====================');
        console.log('User authenticated:', !!req.user);
        console.log('User ID:', req.user?._id);
        console.log('User email:', req.user?.email);
        console.log('Request body:', req.body);
        console.log('🔍 COMPILER DEBUG END ======================');

        const { code, language, input = '' } = req.body;
        
        // Check user authentication
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        
        if (!code?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Code is required'
            });
        }
        
        if (!language) {
            return res.status(400).json({
                success: false,
                error: 'Language is required'
            });
        }
        
        const lang = language.toLowerCase();
        if (!['python', 'java', 'c'].includes(lang)) {
            return res.status(400).json({
                success: false,
                error: 'Only Python, Java, and C are supported'
            });
        }
        
        console.log(`🏃 Executing ${lang} code for user: ${req.user.email}`);
        
        // Call Piston API for all languages
        let result;
        
        try {
            result = await callPistonAPI(code, lang, input);
            
        } catch (error) {
            result = {
                success: false,
                output: '',
                error: error.message,
                executionTime: 0,
                exitCode: -1
            };
        }
        
        // SAVE TO DATABASE WITH USER ID
        let compilationId = null;
        try {
            const compilation = new Compilation({
                userId: req.user._id,
                code: code.substring(0, 5000),
                language: lang,
                output: result.output.substring(0, 2000),
                stderr: result.error,
                error: !result.success ? result.error : null,
                executionTime: result.executionTime,
                status: result.success ? 'success' : 'error',
                exitCode: result.exitCode,
                version: '1.0',
                isCompilation: ['java', 'c'].includes(lang),
                isExecution: true,
                createdAt: new Date()
            });
            
            await compilation.save();
            compilationId = compilation._id;
            console.log(`💾 Saved compilation for user ${req.user.email}, ID: ${compilationId}`);
            
        } catch (dbError) {
            console.warn('⚠️ Could not save compilation to DB:', dbError.message);
        }
        
        // Return response
        res.json({
            success: result.success,
            output: result.output,
            error: result.error,
            execution_time: result.executionTime,
            compilation_id: compilationId,
            language: lang,
            user: {
                id: req.user._id,
                email: req.user.email
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Execution error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Execution failed'
        });
    }
});

// Compile-only endpoint
router.post('/compile', protect, async (req, res) => {
    try {
        const { code, language } = req.body;
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        
        if (!code?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Code is required'
            });
        }
        
        if (!language) {
            return res.status(400).json({
                success: false,
                error: 'Language is required'
            });
        }
        
        const lang = language.toLowerCase();
        if (!['java', 'c'].includes(lang)) {
            return res.status(400).json({
                success: false,
                error: 'Compilation only supported for Java and C'
            });
        }
        
        console.log(`🔨 Compiling ${lang} code for user: ${req.user.email}`);
        
        // Use Piston API for compilation
        let compileResult;
        
        try {
            compileResult = await callPistonAPI(code, lang);
            
        } catch (error) {
            compileResult = {
                success: false,
                output: '',
                error: error.message,
                executionTime: 0,
                exitCode: -1
            };
        }
        
        // SAVE COMPILATION TO DATABASE
        let compilationId = null;
        try {
            const compilation = new Compilation({
                userId: req.user._id,
                code: code.substring(0, 5000),
                language: lang,
                output: compileResult.output.substring(0, 2000),
                stderr: compileResult.error,
                error: !compileResult.success ? compileResult.error : null,
                executionTime: compileResult.executionTime,
                status: compileResult.success ? 'success' : 'error',
                exitCode: compileResult.exitCode,
                version: '1.0',
                isCompilation: true,
                isExecution: false,
                compilationTime: compileResult.executionTime,
                createdAt: new Date()
            });
            
            await compilation.save();
            compilationId = compilation._id;
            console.log(`💾 Saved compilation for user ${req.user.email}, ID: ${compilationId}`);
            
        } catch (dbError) {
            console.warn('⚠️ Could not save compilation to DB:', dbError.message);
        }
        
        res.json({
            success: compileResult.success,
            output: compileResult.output,
            error: compileResult.error,
            compilation_id: compilationId,
            language: lang,
            user: {
                id: req.user._id,
                email: req.user.email
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Compilation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Compilation failed'
        });
    }
});


// DELETE /history/:id — delete a specific compilation
// DELETE /history/clear — delete all user's compilations (MUST COME FIRST!)
router.delete('/history/clear', protect, async (req, res) => {
    try {
        console.log('🗑️ [CLEAR ALL] Starting clear compilations for user:', req.user.email);
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const result = await Compilation.deleteMany({
            userId: req.user._id
        });

        console.log(`✅ [CLEAR ALL] Cleared ${result.deletedCount} compilations for user ${req.user.email}`);

        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} compilations`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('❌ [CLEAR ALL] Clear compilations error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear compilations: ' + error.message
        });
    }
});

// DELETE /history/:id — delete a specific compilation (MUST COME AFTER clear!)
router.delete('/history/:id', protect, async (req, res) => {
    try {
        console.log('🗑️ [DELETE SINGLE] Deleting compilation:', req.params.id);
        
        const { id } = req.params;

        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const compilation = await Compilation.findOneAndDelete({
            _id: id,
            userId: req.user._id
        });

        if (!compilation) {
            return res.status(404).json({
                success: false,
                error: 'Compilation not found or access denied'
            });
        }

        console.log(`✅ [DELETE SINGLE] Deleted compilation ${id} for user ${req.user.email}`);

        res.json({
            success: true,
            message: 'Compilation deleted successfully'
        });

    } catch (error) {
        console.error('❌ [DELETE SINGLE] Delete compilation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete compilation: ' + error.message
        });
    }
});


// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Compiler routes are working!',
        endpoints: {
            'GET /health': 'Health check',
            'GET /history': 'Get user compilation history',
            'POST /execute': 'Execute code (Python, Java, C)',
            'POST /compile': 'Compile code (Java, C)',
            'GET /test': 'Test endpoint'
        }
    });
});

console.log('✅ Compiler routes loaded successfully!');

export default router;