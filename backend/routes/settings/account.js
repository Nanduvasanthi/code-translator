// backend/routes/settings/account.js
import express from 'express';
import User from '../../models/User.js';
import Translation from '../../models/Translation.js';
import Compilation from '../../models/Compilation.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// DELETE /api/settings/account - Delete user account
router.delete('/account', protect, async (req, res) => {
  try {
    console.log('⚙️ [SETTINGS] Deleting account for user:', req.user.email);
    
    // Delete all user's translations
    await Translation.deleteMany({ userId: req.user._id });
    console.log('🗑️ Deleted user translations');
    
    // Delete all user's compilations
    await Compilation.deleteMany({ userId: req.user._id });
    console.log('🗑️ Deleted user compilations');
    
    // Delete user account
    await User.findByIdAndDelete(req.user._id);
    console.log('🗑️ Deleted user account');
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('❌ [SETTINGS] Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

export default router;