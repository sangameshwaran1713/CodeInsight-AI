const Analysis = require('../models/Analysis.model');

// @desc    Get all analyses for current user
// @route   GET /api/history
// @access  Private
exports.getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const analyses = await Analysis.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('code language analysisTypes createdAt status');

    const total = await Analysis.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: analyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single analysis
// @route   GET /api/history/:id
// @access  Private
exports.getAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found',
      });
    }

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete analysis
// @route   DELETE /api/history/:id
// @access  Private
exports.deleteAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found',
      });
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analysis statistics
// @route   GET /api/history/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Analysis.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          avgProcessingTime: { $avg: '$processingTime' },
          languageBreakdown: { $push: '$language' },
        },
      },
    ]);

    // Get analyses per day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Analysis.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || { totalAnalyses: 0, avgProcessingTime: 0 },
        daily: dailyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
