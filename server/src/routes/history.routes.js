const express = require('express');
const router = express.Router();
const {
  getHistory,
  getAnalysis,
  deleteAnalysis,
  getStats,
} = require('../controllers/history.controller');
const { protect } = require('../middleware/auth.middleware');

// Protected routes
router.use(protect);

router.get('/', getHistory);
router.get('/stats', getStats);
router.get('/:id', getAnalysis);
router.delete('/:id', deleteAnalysis);

module.exports = router;
