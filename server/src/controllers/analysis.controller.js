const Analysis = require('../models/Analysis.model');
const User = require('../models/User.model');
const aiService = require('../services/ai.service');

// Supported programming languages
const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
  'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
  'scala', 'html', 'css', 'sql'
];

// Valid analysis types
const VALID_ANALYSIS_TYPES = [
  'explain', 'line-by-line', 'bugs', 'fix', 'complexity', 'improve'
];

// File extension to language mapping
const EXTENSION_TO_LANGUAGE = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  rb: 'ruby',
  swift: 'swift',
  kt: 'kotlin',
  scala: 'scala',
  html: 'html',
  css: 'css',
  sql: 'sql',
};

// Helper: Detect language from file extension
const detectLanguage = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] || 'javascript';
};

// Helper: Validate language
const isValidLanguage = (language) => {
  return SUPPORTED_LANGUAGES.includes(language.toLowerCase());
};

// Helper: Validate analysis types
const validateAnalysisTypes = (types) => {
  if (!Array.isArray(types)) return false;
  return types.every(type => VALID_ANALYSIS_TYPES.includes(type));
};

// @desc    Unified analyze endpoint (accepts code or file upload)
// @route   POST /api/analyze
// @access  Private
exports.analyze = async (req, res, next) => {
  try {
    let code, language, fileName;
    const { analysisTypes = ['explain'] } = req.body;
    const startTime = Date.now();

    // Handle file upload
    if (req.file) {
      code = req.file.buffer.toString('utf-8');
      fileName = req.file.originalname;
      language = req.body.language || detectLanguage(fileName);
    } else {
      // Handle code from request body
      code = req.body.code;
      language = req.body.language;
    }

    // Validation
    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Code is required. Provide code in body or upload a file.',
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Programming language is required.',
      });
    }

    if (!isValidLanguage(language)) {
      return res.status(400).json({
        success: false,
        message: `Invalid language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
      });
    }

    if (!validateAnalysisTypes(analysisTypes)) {
      return res.status(400).json({
        success: false,
        message: `Invalid analysis types. Valid: ${VALID_ANALYSIS_TYPES.join(', ')}`,
      });
    }

    // Code size validation
    if (code.length > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Code exceeds maximum allowed size (100KB).',
      });
    }

    // Run selected analyses in parallel using AI service
    const { results, errors } = await aiService.analyzeMultiple(
      code, 
      language.toLowerCase(), 
      analysisTypes
    );

    const processingTime = Date.now() - startTime;

    // Save to database if user is authenticated
    if (req.user) {
      await Analysis.create({
        user: req.user.id,
        code,
        language: language.toLowerCase(),
        fileName: fileName || null,
        analysisTypes,
        results,
        processingTime,
        status: errors.length === analysisTypes.length ? 'failed' : 'completed',
      });

      // Update user's analysis count
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { analysisCount: 1 },
      });
    }

    res.json({
      success: true,
      result: results,
      language: language.toLowerCase(),
      fileName: fileName || null,
      processingTime,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze with file upload
// @route   POST /api/analyze/upload
// @access  Private
exports.analyzeWithFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file.',
      });
    }

    const code = req.file.buffer.toString('utf-8');
    const fileName = req.file.originalname;
    const language = req.body.language || detectLanguage(fileName);
    const analysisTypes = req.body.analysisTypes 
      ? JSON.parse(req.body.analysisTypes) 
      : ['explain'];

    // Forward to main analyze function
    req.body = { code, language, analysisTypes };
    req.file = null; // Clear file to prevent re-processing
    
    return exports.analyze(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Explain code
// @route   POST /api/analysis/explain
// @access  Private
exports.explainCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    
    const result = await aiService.analyzeCode(code, language, 'explain');
    
    res.json({
      success: true,
      result: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Line-by-line analysis
// @route   POST /api/analysis/line-by-line
// @access  Private
exports.lineByLineAnalysis = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    
    const result = await aiService.analyzeCode(code, language, 'line-by-line');
    
    res.json({
      success: true,
      result: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Detect bugs
// @route   POST /api/analysis/bugs
// @access  Private
exports.detectBugs = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    
    const result = await aiService.analyzeCode(code, language, 'bugs');
    
    res.json({
      success: true,
      result: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suggest fixes
// @route   POST /api/analysis/fix
// @access  Private
exports.suggestFixes = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    
    const result = await aiService.analyzeCode(code, language, 'fix');
    
    res.json({
      success: true,
      result: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze complexity
// @route   POST /api/analysis/complexity
// @access  Private
exports.analyzeComplexity = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    
    const result = await aiService.analyzeCode(code, language, 'complexity');
    
    res.json({
      success: true,
      result: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Improve code
// @route   POST /api/analysis/improve
// @access  Private
exports.improveCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    
    const result = await aiService.analyzeCode(code, language, 'improve');
    
    res.json({
      success: true,
      result: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Full analysis
// @route   POST /api/analysis/full
// @access  Private
exports.fullAnalysis = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const startTime = Date.now();
    
    const analysisTypes = ['explain', 'line-by-line', 'bugs', 'fix', 'complexity', 'improve'];
    const results = {};
    
    // Run all analyses in parallel
    const promises = analysisTypes.map(async (type) => {
      try {
        const result = await aiService.analyzeCode(code, language, type);
        results[type] = { result: result.data };
      } catch (error) {
        results[type] = { error: error.message };
      }
    });
    
    await Promise.all(promises);
    
    const processingTime = Date.now() - startTime;
    
    // Save to database
    const analysis = await Analysis.create({
      user: req.user.id,
      code,
      language,
      analysisTypes,
      results,
      processingTime,
      status: 'completed',
    });
    
    // Update user's analysis count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { analysisCount: 1 },
    });
    
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload file for analysis
// @route   POST /api/analysis/upload
// @access  Private
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }
    
    const code = req.file.buffer.toString('utf-8');
    const fileName = req.file.originalname;
    
    // Detect language from file extension
    const ext = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      php: 'php',
      rb: 'ruby',
      swift: 'swift',
      kt: 'kotlin',
      scala: 'scala',
      html: 'html',
      css: 'css',
      sql: 'sql',
    };
    
    const language = languageMap[ext] || 'javascript';
    
    res.json({
      success: true,
      data: {
        code,
        language,
        fileName,
      },
    });
  } catch (error) {
    next(error);
  }
};
