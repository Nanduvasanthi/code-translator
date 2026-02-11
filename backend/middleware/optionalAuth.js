import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const optionalAuth = async (req, res, next) => {
  let token;
  
  console.log('🔐 [OPTIONAL AUTH] Checking for authentication...');
  
  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('✅ Token found in Authorization header');
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('✅ Token found in cookies');
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user ID:', decoded.id);
      
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        console.log('✅ User authenticated:', user.email);
      } else {
        console.log('❌ User not found in database');
        req.user = null;
      }
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      req.user = null;
    }
  } else {
    console.log('⚠️ No token found - allowing as guest');
    req.user = null;
  }
  
  next();
};