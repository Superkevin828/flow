const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, businessName } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = new User({
        name, email, passwordHash,
        businessName: businessName || '',
        plan: 'free',
        currency: 'UGX'
      });
      await user.save();

      const accessToken = AuthController.generateAccessToken(user._id);
      const refreshToken = AuthController.generateRefreshToken(user._id);
      user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await user.save();

      AuthController.setTokenCookies(res, accessToken, refreshToken);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: user._id, name: user.name, email: user.email,
          businessName: user.businessName, plan: user.plan,
          currency: user.currency, businessProfileCompleted: user.businessProfileCompleted
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Failed to create account' });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const accessToken = AuthController.generateAccessToken(user._id);
      const refreshToken = AuthController.generateRefreshToken(user._id);
      user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await user.save();

      AuthController.setTokenCookies(res, accessToken, refreshToken);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id, name: user.name, email: user.email,
          businessName: user.businessName, industry: user.industry,
          location: user.location, plan: user.plan,
          planExpiresAt: user.planExpiresAt, currency: user.currency,
          businessProfileCompleted: user.businessProfileCompleted,
          avatarUrl: user.avatarUrl, notifications: user.notifications
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Failed to login' });
    }
  }

  static async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'No refresh token provided' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || !user.refreshTokenHash) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
      }

      const newAccessToken = AuthController.generateAccessToken(user._id);
      const newRefreshToken = AuthController.generateRefreshToken(user._id);
      user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
      await user.save();

      AuthController.setTokenCookies(res, newAccessToken, newRefreshToken);

      // FIX: Return user data with refresh so state.js checkAuth can populate user
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        user: {
          id: user._id, name: user.name, email: user.email,
          businessName: user.businessName, plan: user.plan,
          planExpiresAt: user.planExpiresAt, currency: user.currency,
          businessProfileCompleted: user.businessProfileCompleted
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
  }

  static async logout(req, res) {
    try {
      if (req.user) {
        req.user.refreshTokenHash = null;
        await req.user.save();
      }

      const isProd = process.env.NODE_ENV === 'production';
      const cookieOpts = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/'
      };
      res.clearCookie('accessToken', cookieOpts);
      res.clearCookie('refreshToken', cookieOpts);

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, message: 'Failed to logout' });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { name, businessName, industry, location, currency } = req.body;
      const user = req.user;

      if (name) user.name = name;
      if (businessName !== undefined) user.businessName = businessName;
      if (industry) user.industry = industry;
      if (location) user.location = location;
      // FIX: accept currency update from settings page
      if (currency && ['UGX', 'USD'].includes(currency)) user.currency = currency;
      user.businessProfileCompleted = true;

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id, name: user.name, email: user.email,
          businessName: user.businessName, industry: user.industry,
          location: user.location, plan: user.plan,
          currency: user.currency, businessProfileCompleted: user.businessProfileCompleted
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      user.refreshTokenHash = null;
      await user.save();

      const accessToken = AuthController.generateAccessToken(user._id);
      const refreshToken = AuthController.generateRefreshToken(user._id);
      user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await user.save();

      AuthController.setTokenCookies(res, accessToken, refreshToken);

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ success: false, message: 'Failed to change password' });
    }
  }

  static generateAccessToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  }

  static generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  // FIX: sameSite 'lax' for localhost (cross-port), 'none' for production (cross-origin)
  static setTokenCookies(res, accessToken, refreshToken) {
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite = isProd ? 'none' : 'lax';

    res.cookie('accessToken', accessToken, {
      httpOnly: true, secure: isProd, sameSite,
      maxAge: 15 * 60 * 1000, path: '/'
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: isProd, sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/'
    });
  }
}

module.exports = AuthController;