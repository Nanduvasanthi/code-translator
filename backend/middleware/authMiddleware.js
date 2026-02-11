import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  
  console.log('🔐 [AUTH MIDDLEWARE] Checking authentication...');
  
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
  
  if (!token) {
    console.log('⚠️ No token provided - allowing request to continue');
    req.user = null; // Set user to null but don't block
    return next(); // Continue to the route handler
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified for user ID:', decoded.id);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('❌ User not found in database');
      req.user = null;
      return next();
    }
    
    req.user = user;
    console.log('✅ User authenticated:', user.email);
    next();
    
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    req.user = null;
    next();
  }
};