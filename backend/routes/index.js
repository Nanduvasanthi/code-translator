import express from 'express';

const router = express.Router();

console.log('🔧 [ROUTES] Loading main routes...');

// Simple test endpoint
router.get('/test', (req, res) => {
    console.log('✅ GET /api/test called');
    res.json({
        success: true,
        message: 'Backend API is working!',
        timestamp: new Date().toISOString()
    });
});

// Health check
router.get('/health', (req, res) => {
    console.log('✅ GET /api/health called');
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Function to dynamically import routes with error handling
async function loadRoutes() {
    console.log('🔄 Starting to load all routes...');
    
    // Try to load auth routes
    try {
        console.log('📦 Loading auth routes...');
        const authRoutes = (await import('./auth/index.js')).default;
        console.log('✅ Auth routes loaded successfully');
        
        // Use auth routes
        router.use('/auth', authRoutes);
        console.log('✅ Auth routes mounted at /api/auth');
        
    } catch (error) {
        console.error('❌ Failed to load auth routes:', error.message);
        console.error('❌ Error details:', error.stack);
        
        // Create fallback auth routes
        const fallbackAuthRouter = express.Router();
        
        fallbackAuthRouter.get('/test', (req, res) => {
            res.json({
                success: true,
                message: 'Fallback auth test route',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });
        
        fallbackAuthRouter.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'Fallback auth health',
                timestamp: new Date().toISOString()
            });
        });

        fallbackAuthRouter.get('/forgot-password', (req, res) => {
            res.json({
                success: false,
                message: 'Auth routes not loaded properly',
                error: 'Forgot password functionality unavailable',
                timestamp: new Date().toISOString()
            });
        });
        
        router.use('/auth', fallbackAuthRouter);
        console.log('⚠️ Using fallback auth routes');
    }
    
    // Try to load dashboard routes
    try {
        console.log('📦 Loading dashboard routes...');
        const dashboardRoutes = (await import('./dashboard/index.js')).default;
        router.use('/dashboard', dashboardRoutes);
        console.log('✅ Dashboard routes mounted at /api/dashboard');
    } catch (error) {
        console.error('❌ Failed to load dashboard routes:', error.message);
        
        // Create fallback dashboard route
        router.get('/dashboard', (req, res) => {
            res.json({
                success: true,
                message: 'Dashboard routes not loaded',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });
    }

    // Try to load translation routes
    try {
        console.log('📦 Loading translation routes...');
        const translationRoutes = (await import('./translations/index.js')).default;
        router.use('/translations', translationRoutes);
        console.log('✅ Translation routes mounted at /api/translations');
    } catch (error) {
        console.error('❌ Failed to load translation routes:', error.message);
        console.error('❌ Stack trace:', error.stack);
        
        // Create fallback translation routes
        const fallbackTranslationRouter = express.Router();
        
        fallbackTranslationRouter.get('/test', (req, res) => {
            res.json({
                success: true,
                message: 'Fallback translation test route',
                error: error.message
            });
        });
        
        fallbackTranslationRouter.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'Translation service is in fallback mode',
                timestamp: new Date().toISOString()
            });
        });
        
        fallbackTranslationRouter.post('/', (req, res) => {
            res.status(503).json({
                success: false,
                message: 'Translation service unavailable',
                error: 'Translation routes failed to load: ' + error.message
            });
        });
        
        router.use('/translations', fallbackTranslationRouter);
        console.log('⚠️ Using fallback translation routes');
    }
    
    // Try to load compiler routes
    try {
        console.log('📦 Loading compiler routes...');
        const compilerRoutes = (await import('./compiler/index.js')).default;
        router.use('/compiler', compilerRoutes);
        console.log('✅ Compiler routes mounted at /api/compiler');
    } catch (error) {
        console.error('❌ Failed to load compiler routes:', error.message);
        console.error('❌ Stack trace:', error.stack);
        
        // Create fallback compiler routes
        const fallbackCompilerRouter = express.Router();
        
        fallbackCompilerRouter.get('/test', (req, res) => {
            res.json({
                success: true,
                message: 'Fallback compiler test route',
                error: error.message
            });
        });
        
        fallbackCompilerRouter.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'Compiler service is in fallback mode',
                timestamp: new Date().toISOString()
            });
        });
        
        fallbackCompilerRouter.post('/execute', (req, res) => {
            res.status(503).json({
                success: false,
                message: 'Compiler service unavailable',
                error: 'Compiler routes failed to load: ' + error.message
            });
        });
        
        fallbackCompilerRouter.get('/languages', (req, res) => {
            res.json({
                success: true,
                languages: ['python', 'javascript', 'java', 'c', 'cpp', 'csharp'],
                count: 6,
                note: 'Fallback language list (compiler service offline)'
            });
        });
        
        router.use('/compiler', fallbackCompilerRouter);
        console.log('⚠️ Using fallback compiler routes');
    }


        // Try to load settings routes
    try {
        console.log('📦 Loading settings routes...');
        const settingsRoutes = (await import('./settings/index.js')).default;
        router.use('/settings', settingsRoutes);
        console.log('✅ Settings routes mounted at /api/settings');
    } catch (error) {
        console.error('❌ Failed to load settings routes:', error.message);
        console.error('❌ Stack trace:', error.stack);
        
        // Create fallback settings routes
        const fallbackSettingsRouter = express.Router();
        
        fallbackSettingsRouter.get('/test', (req, res) => {
            res.json({
                success: true,
                message: 'Fallback settings test route',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });
        
        fallbackSettingsRouter.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'Settings service is in fallback mode',
                timestamp: new Date().toISOString()
            });
        });
        
        fallbackSettingsRouter.get('/profile', (req, res) => {
            res.status(503).json({
                success: false,
                message: 'Settings service unavailable',
                error: 'Settings routes failed to load: ' + error.message
            });
        });
        
        router.use('/settings', fallbackSettingsRouter);
        console.log('⚠️ Using fallback settings routes');
    }
    
    // ✅ ADD MAIN COMPILE PIPELINE ROUTE HERE (after other services)
    try {
        console.log('📦 Loading main compile pipeline route...');
        const compileRoute = (await import('./compile.js')).default;
        router.use('/', compileRoute); // This mounts it at /api/
        console.log('✅ Main compile pipeline route mounted');
    } catch (error) {
        console.error('❌ Failed to load main compile route:', error.message);
        
        // Fallback endpoint
        router.post('/compile', (req, res) => {
            res.status(503).json({
                success: false,
                error: 'Main compile pipeline unavailable',
                details: error.message
            });
        });
    }
    
    // Add endpoint info route (AFTER all routes are loaded)
    router.get('/endpoints', (req, res) => {
        res.json({
            success: true,
            available_endpoints: {
                auth: [
                    'POST /api/auth/login',
                    'POST /api/auth/register',
                    'GET  /api/auth/test'
                ],
                dashboard: [
                    'GET  /api/dashboard'
                ],
                translations: [
                    'POST /api/translations/translate',
                    'GET  /api/translations/supported',
                    'GET  /api/translations/health'
                ],
                compiler: [
                    'POST /api/compiler/execute',
                    'POST /api/compiler/compile',
                    'GET  /api/compiler/languages',
                    'GET  /api/compiler/health'
                ],
                settings: [
                    'GET /api/settings/profile',
                    'DELETE /api/settings/account',
                    'GET /api/settings/test',
                    'GET /api/settings/health'
                ],
                pipeline: [  // ✅ NEW: Add the pipeline endpoint
                    'POST /api/compile',
                    'GET  /api/compile/health',
                    'GET  /api/compile/test'
                ],
                system: [
                    'GET  /api/health',
                    'GET  /api/test',
                    'GET  /api/endpoints'
                ]
            },
            description: {
                '/api/compile': 'Main pipeline: Validate → Translate → Compile → Save to DB',
                '/api/compiler/compile': 'Direct compilation only',
                '/api/translations/translate': 'Direct translation only',
                '/api/settings/profile': 'Get user profile and stats',
                'api/settings/accuhnt': 'Delete user account'
            },
            timestamp: new Date().toISOString()
        });
    });
    
    console.log('✅ All routes loaded successfully');
}

// Load all routes
loadRoutes();

export default router;