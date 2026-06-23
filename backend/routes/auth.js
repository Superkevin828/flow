const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validate, rules } = require('../middleware/validate');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register',
  rateLimiter.auth,
  validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ]),
  AuthController.register
);

router.post('/login',
  rateLimiter.auth,
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ]),
  AuthController.login
);

router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', auth, AuthController.logout);
router.put('/profile', auth, AuthController.updateProfile);
router.put('/change-password', auth, AuthController.changePassword);

module.exports = router;