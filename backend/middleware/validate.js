const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// Common validation rules
const rules = {
  email: {
    isEmail: { errorMessage: 'Please provide a valid email' },
    normalizeEmail: true
  },
  password: {
    isLength: { 
      options: { min: 8 },
      errorMessage: 'Password must be at least 8 characters'
    }
  },
  required: (field) => ({
    notEmpty: { errorMessage: `${field} is required` }
  })
};

module.exports = { validate, rules };