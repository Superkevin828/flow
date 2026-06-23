const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  /**
   * Register new user
   */
  static async register(req, res) {
    try {
      const { name, email, password, businessName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const user = new User({
        name,
        email,
        passwordHash,
        businessName: businessName || '',
        plan: 'free',
        currency: 'UGX'
      });

      await user.save();

      // Generate tokens
      const accessToken = AuthController.generateAccessToken(user._id);
      const refreshToken = AuthController.generateRefreshToken(user._id);

      // Store refresh token hash
      user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await user.save();

      // Set cookies
      AuthController.setTokenCookies(res, accessToken, refreshToken);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          businessName: user.businessName,
          plan: user.plan,
          currency: user.currency,
          businessProfileCompleted: user.businessProfileCompleted
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create account'
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate tokens
      const accessToken = AuthController.generateAccessToken(user._id);
      const refreshToken = AuthController.generateRefreshToken(user._id);

      // Store refresh token hash
      user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await user.save();

      // Set cookies
      AuthController.setTokenCookies(res, accessToken, refreshToken);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          businessName: user.businessName,
          industry: user.industry,
          location: user.location,
          plan: user.plan,
          planExpiresAt: user.planExpiresAt,
          currency: user.currency,
          businessProfileCompleted: user.businessProfileCompleted,
          avatarUrl: user.avatarUrl,
          notifications: user.notifications
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login'
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'No refresh token provided'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || !user.refreshTokenHash) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Verify refresh token hash
      const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const newAccessToken = AuthController.generateAccessToken(user._id);
      const newRefreshToken = AuthController.generateRefreshToken(user._id);

      // Update refresh token hash
      user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
      await user.save();

      // Set new cookies
      AuthController.setTokenCookies(res, newAccessToken, newRefreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req, res) {
    try {
      // Clear refresh token in database
      if (req.user) {
        req.user.refreshTokenHash = null;
        await req.user.save();
      }

      // Clear cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }
  }

  /**
   * Update business profile
   */
  static async updateProfile(req, res) {
    try {
      const { businessName, industry, location } = req.body;
      
      const user = req.user;
      user.businessName = businessName || user.businessName;
      user.industry = industry || user.industry;
      user.location = location || user.location;
      user.businessProfileCompleted = true;
      
      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          businessName: user.businessName,
          industry: user.industry,
          location: user.location,
          plan: user.plan,
          currency: user.currency,
          businessProfileCompleted: user.businessProfileCompleted
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      
      // Invalidate all refresh tokens
      user.refreshTokenHash = null;
      
      await user.save();

      // Generate new tokens
      const accessToken = AuthController.generateAccessToken(user._id);
      const refreshToken = AuthController.generateRefreshToken(user._id);
      user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await user.save();

      AuthController.setTokenCookies(res, accessToken, refreshToken);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }

  /**
   * Helper: Generate access token
   */
  static generateAccessToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  /**
   * Helper: Generate refresh token
   */
  static generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Helper: Set token cookies
   */
  static setTokenCookies(res, accessToken, refreshToken) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
  }
}

module.exports = AuthController;