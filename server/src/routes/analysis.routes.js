const express = require('express');
const router = express.Router();
const {
  explainCode,
  lineByLineAnalysis,
  detectBugs,
  suggestFixes,
  analyzeComplexity,
  improveCode,
  fullAnalysis,
  uploadFile,
} = require('../controllers/analysis.controller');
const { protect } = require('../middleware/auth.middleware');
const { analysisValidation } = require('../middleware/validation.middleware');
const upload = require('../middleware/upload.middleware');

// Protected routes
router.use(protect);

router.post('/explain', analysisValidation, explainCode);
router.post('/line-by-line', analysisValidation, lineByLineAnalysis);
router.post('/bugs', analysisValidation, detectBugs);
router.post('/fix', analysisValidation, suggestFixes);
router.post('/complexity', analysisValidation, analyzeComplexity);
router.post('/improve', analysisValidation, improveCode);
router.post('/full', analysisValidation, fullAnalysis);
router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;
