// backend/routes/compile.js - MAIN PIPELINE ORCHESTRATION
import express from 'express';
import axios from 'axios';
import Translation from '../models/Translation.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

console.log('🚀 Loading main compile pipeline route...');

// Environment variables
const COMPILATION_SERVICE_URL = process.env.COMPILATION_SERVICE_URL || 'http://localhost:3002';
const TRANSLATION_SERVICE_URL = process.env.TRANSLATION_SERVICE_URL || 'http://localhost:5000/api/translations';

// Authentication middleware




// Helper to check if translation is possible
function canTranslate(code, sourceLang, targetLang) {
    // List of features your translator CANNOT handle
    const unsupportedFeatures = {
        'python': ['async ', 'yield ', '@', 'class ', 'lambda '],
        'javascript': ['async ', 'await ', 'class ', 'import.meta'],
        'java': ['->', 'var ', 'record ']
    };
    
    const features = unsupportedFeatures[sourceLang.toLowerCase()] || [];
    
    for (const feature of features) {
        if (code.includes(feature)) {
            return {
                supported: false,
                reason: `Unsupported feature: "${feature}" in ${sourceLang}`
            };
        }
    }
    
    return {
        supported: true,
        reason: 'All features supported'
    };
}
// Helper to call compilation service
async function callCompilerService(code, language, endpoint = 'compile') {
    try {
        const compilerUrl = `${COMPILATION_SERVICE_URL}/compile`;
        
        console.log(`📞 Calling Piston compilation service: ${language}`);
        console.log(`🔗 Service URL: ${compilerUrl}`);
        
        const response = await axios.post(compilerUrl, {
            code: code,
            language: language.toLowerCase()
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: response.data.success,
            data: response.data
        };
    } catch (error) {
        console.error(`❌ Compilation service error:`, error.message);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || 'Compilation service failed',
            statusCode: error.response?.status || 500
        };
    }
}

// Helper to call translation service
async function callTranslationService(source_code, source_language, target_language) {
    try {
        const translationUrl = `${TRANSLATION_SERVICE_URL}/translate`;
        
        console.log(`📞 Calling translation service: ${source_language} → ${target_language}`);
        console.log(`🔗 Service URL: ${translationUrl}`);
        
        const response = await axios.post(translationUrl, {
            source_code: source_code,
            source_language: source_language,
            target_language: target_language
        }, {
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('❌ Translation service error:', error.message);
        
        return {
            success: false,
            error: error.response?.data?.error || error.message || 'Translation service failed',
            statusCode: error.response?.status || 500
        };
    }
}

// Helper to save pipeline result to database
async function savePipelineResult(result) {
    try {
        // Handle failed translations - provide default translated code
        const translatedCode = result.translatedCode || 
            `// Translation ${result.status}\n// ${result.error || 'No translation available'}`;
        
        const translation = new Translation({
            userId: result.userId,
            sourceCode: result.sourceCode.substring(0, 10000),
            translatedCode: translatedCode.substring(0, 10000),
            sourceLanguage: result.sourceLanguage,
            targetLanguage: result.targetLanguage,
            executionTime: result.totalExecutionTime || 0,
            linesOfCode: result.sourceCode.split('\n').length,
            status: result.status,
            confidence: result.confidence || 0,
            metadata: {
                sourceValidation: result.steps?.sourceValidation?.success,
                translationSuccess: result.steps?.translation?.success,
                targetCompilation: result.steps?.targetCompilation?.success
            }
        });
        
        const saved = await translation.save();
        console.log(`💾 Saved pipeline result to DB with ID: ${saved._id}`);
        return saved._id;
    } catch (dbError) {
        console.warn('⚠️ Could not save to database:', dbError.message);
        return null;
    }
}



// MAIN PIPELINE ENDPOINT
router.post('/compile', protect, async (req, res) => {
    const pipelineStartTime = Date.now();
    
    try {
        const { 
            source_code, 
            source_language, 
            target_language,
            input = '',
            skip_source_validation = false
        } = req.body;

        console.log(`🚀 Starting full pipeline: ${source_language} → ${target_language} for user ${req.user._id}`);

        // 1. VALIDATION
        if (!source_code?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Source code is required'
            });
        }

        if (!source_language || !target_language) {
            return res.status(400).json({
                success: false,
                error: 'Source and target languages are required'
            });
        }

        if (source_language === target_language) {
            return res.status(400).json({
                success: false,
                error: 'Cannot translate to the same language'
            });
        }

        let pipelineResult = {
            userId: req.user._id,
            sourceCode: source_code,
            sourceLanguage: source_language,
            targetLanguage: target_language,
            status: 'processing',
            steps: {},
            startTime: new Date().toISOString()
        };

        // 2. STEP 1: VALIDATE SOURCE CODE
        if (!skip_source_validation) {
            console.log(`🔍 Step 1: Validating ${source_language} source code...`);
            const sourceStartTime = Date.now();
            
            const sourceValidation = await callCompilerService(source_code, source_language, 'compile');
            
            pipelineResult.steps.sourceValidation = {
                success: sourceValidation.success,
                output: sourceValidation.data?.output,
                error: sourceValidation.error,
                executionTime: Date.now() - sourceStartTime
            };

            if (!sourceValidation.success) {
                pipelineResult.status = 'failed';
                pipelineResult.error = `Source ${source_language} code has errors: ${sourceValidation.error}`;
                pipelineResult.totalExecutionTime = Date.now() - pipelineStartTime;
                
                const dbId = await savePipelineResult(pipelineResult);
                
                return res.json({
                    success: false,
                    error: pipelineResult.error,
                    step: 'source_validation',
                    details: {
                        sourceValidation: pipelineResult.steps.sourceValidation,
                        translationId: dbId
                    },
                    execution_time: pipelineResult.totalExecutionTime
                });
            }
            console.log(`✅ Source validation passed in ${Date.now() - sourceStartTime}ms`);
        } else {
            console.log('⚠️ Skipping source code validation');
            pipelineResult.steps.sourceValidation = {
                success: true,
                skipped: true,
                note: 'Skipped as requested'
            };
        }

        // NEW STEP 1.5: Check if translation is possible
console.log(`🔍 Checking if ${source_language} → ${target_language} translation is supported...`);
const canTranslateResult = canTranslate(source_code, source_language, target_language);

if (!canTranslateResult.supported) {
    // Save as FAILED: unsupported feature
    pipelineResult.status = 'failed_unsupported';
    pipelineResult.error = `Translation not supported: ${canTranslateResult.reason}`;
    pipelineResult.totalExecutionTime = Date.now() - pipelineStartTime;
    
    const dbId = await savePipelineResult(pipelineResult);
    
    return res.json({
        success: false,
        error: pipelineResult.error,
        step: 'translation_validation',
        translationId: dbId,
        execution_time: pipelineResult.totalExecutionTime
    });
}
console.log(`✅ Translation supported: ${canTranslateResult.reason}`);

        // 3. STEP 2: TRANSLATE CODE
        console.log(`🔄 Step 2: Translating ${source_language} → ${target_language}...`);
        const translationStartTime = Date.now();
        
        const translationResult = await callTranslationService(
            source_code, 
            source_language, 
            target_language
        );
        
        pipelineResult.steps.translation = {
            success: translationResult.success,
            translatedCode: translationResult.data?.translated_code,
            error: translationResult.error,
            executionTime: Date.now() - translationStartTime,
            translationId: translationResult.data?.translation_id
        };

        if (!translationResult.success) {
            pipelineResult.status = 'failed';
            pipelineResult.error = `Translation failed: ${translationResult.error}`;
            pipelineResult.totalExecutionTime = Date.now() - pipelineStartTime;
            
            const dbId = await savePipelineResult(pipelineResult);
            
            return res.json({
                success: false,
                error: pipelineResult.error,
                step: 'translation',
                details: {
                    sourceValidation: pipelineResult.steps.sourceValidation,
                    translation: pipelineResult.steps.translation,
                    translationId: dbId
                },
                execution_time: pipelineResult.totalExecutionTime
            });
        }

        const translated_code = translationResult.data?.translated_code || '';
        pipelineResult.translatedCode = translated_code;
        console.log(`✅ Translation completed in ${Date.now() - translationStartTime}ms`);

        // 4. STEP 3: COMPILE TRANSLATED CODE
        console.log(`🔨 Step 3: Compiling translated ${target_language} code...`);
        const compileStartTime = Date.now();
        
        const compileResult = await callCompilerService(translated_code, target_language, 'compile');
        
        pipelineResult.steps.targetCompilation = {
            success: compileResult.success,
            output: compileResult.data?.output,
            error: compileResult.error,
            executionTime: Date.now() - compileStartTime
        };

        // 5. CALCULATE CONFIDENCE SCORE
        let confidence = 0;
        if (pipelineResult.steps.sourceValidation?.success) confidence += 25;
        if (pipelineResult.steps.translation?.success) confidence += 50;
        if (pipelineResult.steps.targetCompilation?.success) confidence += 25;
        pipelineResult.confidence = confidence;

        // 6. DETERMINE FINAL STATUS
        pipelineResult.status = pipelineResult.steps.targetCompilation?.success ? 'success' : 'partial_success';
        pipelineResult.totalExecutionTime = Date.now() - pipelineStartTime;

        // 7. SAVE TO DATABASE
        const dbId = await savePipelineResult(pipelineResult);

        // 8. RETURN FINAL RESULT
        const response = {
            success: pipelineResult.status === 'success',
            source_code: source_code,
            translated_code: translated_code,
            source_language: source_language,
            target_language: target_language,
            compilation_success: pipelineResult.steps.targetCompilation?.success,
            execution_time: pipelineResult.totalExecutionTime,
            confidence: confidence,
            translation_id: dbId,
            steps: {
                source_validation: pipelineResult.steps.sourceValidation,
                translation: {
                    success: pipelineResult.steps.translation.success,
                    execution_time: pipelineResult.steps.translation.executionTime
                },
                target_compilation: pipelineResult.steps.targetCompilation
            },
            user_id: req.user._id,
            timestamp: new Date().toISOString()
        };

        console.log(`🎉 Pipeline completed in ${pipelineResult.totalExecutionTime}ms`);

        res.json(response);

    } catch (error) {
        console.error('❌ Pipeline catastrophic error:', error);
        
        const errorResult = {
            success: false,
            error: 'Internal server error in pipeline',
            details: error.message,
            execution_time: Date.now() - pipelineStartTime,
            timestamp: new Date().toISOString()
        };

        res.status(500).json(errorResult);
    }
});

// Health check for pipeline
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Compile pipeline is running',
        endpoint: 'POST /api/compile',
        description: 'Full pipeline: Validate → Translate → Compile → Save',
        services: {
            compilation: COMPILATION_SERVICE_URL,
            translation: TRANSLATION_SERVICE_URL,
            database: 'MongoDB'
        },
        environment: {
            compilation_url: COMPILATION_SERVICE_URL,
            translation_url: TRANSLATION_SERVICE_URL
        },
        timestamp: new Date().toISOString()
    });
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Compile pipeline test endpoint',
        endpoints: {
            'POST /compile': 'Main pipeline endpoint',
            'GET /health': 'Health check',
            'GET /test': 'Test endpoint'
        },
        flow: [
            '1. Validate source code (Compilation service)',
            '2. Translate code (Translation service)',
            '3. Compile translated code (Compilation service)',
            '4. Save to database',
            '5. Return result'
        ],
        environment: {
            compilation_url: COMPILATION_SERVICE_URL,
            translation_url: TRANSLATION_SERVICE_URL
        }
    });
});

console.log('✅ Main compile pipeline route loaded successfully!');

export default router;