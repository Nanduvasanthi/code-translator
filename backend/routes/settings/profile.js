// backend/routes/settings/profile.js
import express from 'express';
import User from '../../models/User.js';
import Translation from '../../models/Translation.js';
import Compilation from '../../models/Compilation.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/settings/profile - Get user profile with stats
router.get('/profile', protect, async (req, res) => {
  try {
    console.log('⚙️ [SETTINGS] Fetching profile for user:', req.user.email);
    
    // Get basic user info
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get translation count for this user
    const translationsCount = await Translation.countDocuments({ 
      userId: req.user._id 
    });

    // Get compilation count for this user
    const compilationsCount = await Compilation.countDocuments({ 
      userId: req.user._id 
    });

    // Get successful translations count
    const successfulTranslations = await Translation.countDocuments({ 
      userId: req.user._id,
      status: 'success'
    });

    // Calculate success rate
    const successRate = translationsCount > 0 
      ? Math.round((successfulTranslations / translationsCount) * 100)
      : 0;

    // Format dates using your User schema fields
    const joinedDate = user.createdAt 
      ? new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'N/A';

    // Use updatedAt as last activity if lastLogin doesn't exist
    const lastLogin = user.updatedAt 
      ? new Date(user.updatedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Today';

    // Build full name from your schema fields
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    
    // Use username if name is empty
    const displayName = fullName || user.username || user.email.split('@')[0];

    res.json({
      success: true,
      name: displayName,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      joinedDate,
      lastLogin,
      translationsCount,
      compilationsCount,
      successRate,
      profilePicture: user.profilePicture || null,
      isVerified: user.isVerified || false,
      provider: user.provider || 'local'
    });

  } catch (error) {
    console.error('❌ [SETTINGS] Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile data'
    });
  }
});

export default router;