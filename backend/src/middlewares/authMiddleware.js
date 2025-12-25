import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';

// 1. Rename requireAuth to "protect" to match your routes
export const protect = ClerkExpressRequireAuth();

// 2. Add the "authorize" middleware
// This checks if the user's role in MongoDB matches the allowed roles
export const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Find the user in YOUR database using the Clerk ID
      const user = await User.findOne({ clerkId: req.auth.userId });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User record not found' });
      }

      // Check if the user's role is allowed
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: `User role '${user.role}' is not authorized to access this route` 
        });
      }

      // Attach the full user object to request for convenience in controllers
      req.user = user; 
      next();
    } catch (error) {
      console.error('Authorization Error:', error);
      res.status(500).json({ success: false, message: 'Server Error during authorization' });
    }
  };
};

// 3. Populate req.user without role check (for common routes)
export const loadUser = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findOne({ clerkId: req.auth.userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Load User Error:', error);
    res.status(500).json({ success: false, message: 'Server Error loading user' });
  }
};