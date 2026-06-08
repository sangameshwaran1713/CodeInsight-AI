const Analysis = require('../models/Analysis.model');
const { ROLES } = require('../config/roles.config');

/**
 * Middleware to check resource ownership
 * Ensures users can only access their own resources unless they're admin
 */

const checkAnalysisOwnership = async (req, res, next) => {
  try {
    const analysisId = req.params.id || req.params.analysisId;
    
    if (!analysisId) {
      return res.status(400).json({
        success: false,
        message: 'Analysis ID is required',
      });
    }

    const analysis = await Analysis.findById(analysisId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found',
      });
    }

    // Allow access if user owns the resource or is admin/super_admin
    const isOwner = analysis.user.toString() === req.user.id;
    const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    // Attach analysis to request for use in controller
    req.analysis = analysis;
    next();
  } catch (error) {
    next(error);
  }
};

const checkUserOwnership = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.params.id;
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Allow access if user is accessing their own data or is admin
    const isSelf = targetUserId === req.user.id;
    const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR].includes(req.user.role);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this user data',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkAnalysisOwnership,
  checkUserOwnership,
};
