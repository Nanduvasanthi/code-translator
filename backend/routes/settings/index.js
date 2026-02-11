// backend/routes/settings/index.js
import express from 'express';
import profileRoutes from './profile.js';
import accountRoutes from './account.js';

const router = express.Router();

// Mount settings routes
router.use('/', profileRoutes);    // GET /profile
router.use('/', accountRoutes);    // DELETE /account

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Settings API is working!',
    endpoints: {
      profile: 'GET /profile',
      account: 'DELETE /account',
      test: 'GET /test',
      health: 'GET /health'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Settings API is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;