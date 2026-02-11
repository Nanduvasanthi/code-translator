// backend/routes/translations/index.js
import express from 'express';
import axios from 'axios';
import mongoose from 'mongoose'; 
import Translation from '../../models/Translation.js';
import { protect } from '../../middleware/authMiddleware.js'; // Import real auth middleware

const router = express.Router();

// Environment variables
const TRANSLATOR_SERVICE_URL = process.env.TRANSLATOR_SERVICE_URL || 'http://localhost:3001';

// POST /translate — forward to translator-service
router.post('/translate', protect, async (req, res) => {
  try {
    console.log('🔍 Database Status Check:');
    console.log('Database name:', mongoose.connection.name || 'Not connected');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('State meaning:', 
      mongoose.connection.readyState === 0 ? 'Disconnected' :
      mongoose.connection.readyState === 1 ? 'Connected ✓' :
      mongoose.connection.readyState === 2 ? 'Connecting' :
      mongoose.connection.readyState === 3 ? 'Disconnecting' : 'Unknown'
    );
    
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected! Translations will not save.');
    }

    const { source_code, source_language, target_language } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required to save translations' 
      });
    }

    // Basic validation
    if (!source_code?.trim()) {
      return res.status(400).json({ success: false, error: 'Source code is required' });
    }

    if (!source_language || !target_language) {
      return res.status(400).json({ success: false, error: 'Source and target languages are required' });
    }

    if (source_language === target_language) {
      return res.status(400).json({ success: false, error: 'Cannot translate to the same language' });
    }

    console.log(`🔄 Forwarding translation: ${source_language} → ${target_language}`);
    console.log(`👤 User: ${req.user.email} (${req.user._id})`);
    console.log(`🔗 Translator service URL: ${TRANSLATOR_SERVICE_URL}/translate`);

    // Forward request to translator-service
    let response;
    try {
      response = await axios.post(`${TRANSLATOR_SERVICE_URL}/translate`, {
        source_code,
        source_language,
        target_language
      }, {
        timeout: 10000 // 10 second timeout
      });
    } catch (axiosError) {
      console.error('❌ Translator service error:', axiosError.message);
      return res.status(502).json({
        success: false,
        error: `Translator service unavailable at ${TRANSLATOR_SERVICE_URL}`
      });
    }

    // Validate translator response
    if (!response.data?.success) {
      return res.status(500).json({
        success: false,
        error: response.data?.error || 'Translation service failed'
      });
    }

    const translated_code = response.data.translated_code || '';
    
    if (!translated_code.trim()) {
      return res.status(500).json({
        success: false,
        error: 'Translation service returned empty result'
      });
    }

    console.log(`✅ Translation successful, ${translated_code.length} chars`);

    // Save translation to database WITH USER ID
    let translationId = null;
    try {
      const translation = new Translation({
        userId: req.user._id, // Actual logged-in user's ID
        sourceCode: source_code.substring(0, 5000),
        translatedCode: translated_code.substring(0, 5000),
        sourceLanguage: source_language,
        targetLanguage: target_language,
        executionTime: response.data.execution_time || null,
        confidence: response.data.confidence || null,
        linesOfCode: (source_code.match(/\n/g) || []).length + 1,
        status: 'success'
      });
      await translation.save();
      translationId = translation._id;
      console.log(`💾 Saved to database for user ${req.user._id}, ID: ${translationId}`);
    } catch (dbError) {
      console.warn('⚠️ Could not save translation to DB:', dbError.message);
      // Continue even if DB save fails
    }

    // Return result to frontend
    res.json({
      success: true,
      source_code,
      translated_code,
      source_language,
      target_language,
      translation_id: translationId,
      execution_time: response.data.execution_time || null,
      confidence: response.data.confidence || null,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name
      },
      translator_service: TRANSLATOR_SERVICE_URL
    });

  } catch (error) {
    console.error('❌ Translation route error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Translation failed'
    });
  }
});

// GET /history — get user's translation history
router.get('/history', protect, async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required to view history' 
      });
    }

    const translations = await Translation.find({ 
      userId: req.user._id 
    })
    .sort({ createdAt: -1 })
    .select('-__v') // Exclude version key
    .limit(50); // Limit to 50 most recent

    console.log(`📖 Retrieved ${translations.length} translations for user ${req.user._id}`);

    res.json({
      success: true,
      count: translations.length,
      translations: translations.map(t => ({
        id: t._id,
        sourceCode: t.sourceCode,
        translatedCode: t.translatedCode,
        sourceLanguage: t.sourceLanguage,
        targetLanguage: t.targetLanguage,
        executionTime: t.executionTime,
        confidence: t.confidence,
        linesOfCode: t.linesOfCode,
        status: t.status,
        createdAt: t.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ History route error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve translation history'
    });
  }
});

// DELETE /history/:id — delete a specific translation
// DELETE /history/clear — delete all user's translations (FIRST!)
router.delete('/history/clear', protect, async (req, res) => {
    try {
        console.log('🗑️ [CLEAR ALL] Starting clear translations for user:', req.user.email);
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentication required' 
            });
        }

        const result = await Translation.deleteMany({ 
            userId: req.user._id 
        });

        console.log(`✅ [CLEAR ALL] Cleared ${result.deletedCount} translations for user ${req.user.email}`);

        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} translations`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('❌ [CLEAR ALL] Clear translations error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to clear translations'
        });
    }
});

// DELETE /history/:id — delete a specific translation (AFTER!)
router.delete('/history/:id', protect, async (req, res) => {
    try {
        console.log('🗑️ [DELETE SINGLE] Deleting translation:', req.params.id);
        
        const { id } = req.params;

        if (!req.user || !req.user._id) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentication required' 
            });
        }

        const translation = await Translation.findOneAndDelete({
            _id: id,
            userId: req.user._id
        });

        if (!translation) {
            return res.status(404).json({
                success: false,
                error: 'Translation not found or access denied'
            });
        }

        console.log(`✅ [DELETE SINGLE] Deleted translation ${id} for user ${req.user.email}`);

        res.json({
            success: true,
            message: 'Translation deleted successfully'
        });

    } catch (error) {
        console.error('❌ [DELETE SINGLE] Delete translation error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to delete translation'
        });
    }
});


// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Translation route is running',
    endpoint: 'POST /api/translations/translate',
    translator_service: TRANSLATOR_SERVICE_URL,
    timestamp: new Date().toISOString()
  });
});

// Supported languages endpoint
router.get('/supported', (req, res) => {
  res.json({
    success: true,
    supported_translations: [
      { source: 'python', target: 'java' },
      { source: 'python', target: 'c' },
      { source: 'java', target: 'python' },
      { source: 'java', target: 'c' },
      { source: 'c', target: 'python' },
      { source: 'c', target: 'java' }
    ],
    translator_service: TRANSLATOR_SERVICE_URL,
    timestamp: new Date().toISOString()
  });
});

export default router;