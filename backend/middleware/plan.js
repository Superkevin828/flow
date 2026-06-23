const checkPlan = (requiredPlan) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if user has required plan
    if (requiredPlan === 'pro' && req.user.plan !== 'pro') {
      return res.status(403).json({ 
        success: false, 
        message: 'This feature requires a Pro plan subscription',
        code: 'UPGRADE_REQUIRED'
      });
    }

    // Check if pro plan has expired
    if (req.user.plan === 'pro' && req.user.planExpiresAt) {
      const now = new Date();
      if (now > new Date(req.user.planExpiresAt)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Your Pro plan has expired. Please renew.',
          code: 'PLAN_EXPIRED'
        });
      }
    }

    next();
  };
};

module.exports = checkPlan;