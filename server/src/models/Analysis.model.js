const mongoose = require('mongoose');

/**
 * CodeAnalysis Schema
 * Stores code analysis results from AI service
 * 
 * Example Document:
 * {
 *   "_id": "65f1234567890abcdef12345",
 *   "user": "65f9876543210fedcba98765",
 *   "language": "python",
 *   "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
 *   "fileName": "fibonacci.py",
 *   "summary": {
 *     "title": "Fibonacci Calculator",
 *     "purpose": "Recursive implementation of Fibonacci sequence",
 *     "components": [{ "name": "fibonacci", "type": "function", "purpose": "Calculate nth Fibonacci number" }],
 *     "technologies": ["Python", "Recursion"]
 *   },
 *   "lineExplanations": [
 *     { "lineNumber": 1, "code": "def fibonacci(n):", "explanation": "Function definition..." },
 *     { "lineNumber": 2, "code": "    if n <= 1:", "explanation": "Base case check..." }
 *   ],
 *   "bugs": {
 *     "count": 2,
 *     "issues": [
 *       { "line": 1, "severity": "high", "type": "performance", "description": "No memoization", "impact": "Exponential time" }
 *     ]
 *   },
 *   "suggestedFixes": [
 *     { "issue": "No input validation", "fix": "Add type checking", "code": "if not isinstance(n, int)..." }
 *   ],
 *   "complexity": {
 *     "time": { "notation": "O(2^n)", "explanation": "Exponential due to repeated calculations" },
 *     "space": { "notation": "O(n)", "explanation": "Stack depth equals n" },
 *     "cyclomaticComplexity": 2,
 *     "maintainabilityIndex": 75.5
 *   },
 *   "improvements": "Use memoization with @lru_cache...",
 *   "staticAnalysis": { "pylintIssues": [...], "radonMetrics": {...} },
 *   "analysisTypes": ["explain", "bugs", "complexity"],
 *   "processingTime": 1234,
 *   "status": "completed",
 *   "createdAt": "2026-03-07T10:30:00.000Z"
 * }
 */

// Sub-schema for line-by-line explanations
const lineExplanationSchema = new mongoose.Schema({
  lineNumber: { type: Number, required: true },
  code: { type: String, required: true },
  explanation: { type: String, required: true },
}, { _id: false });

// Sub-schema for bug reports
const bugIssueSchema = new mongoose.Schema({
  line: { type: Number },
  severity: { 
    type: String, 
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    default: 'medium'
  },
  type: { type: String }, // e.g., 'logic', 'security', 'performance', 'syntax'
  description: { type: String, required: true },
  impact: { type: String },
  suggestion: { type: String },
}, { _id: false });

// Sub-schema for suggested fixes
const suggestedFixSchema = new mongoose.Schema({
  issue: { type: String, required: true },
  fix: { type: String, required: true },
  code: { type: String },
  priority: { 
    type: String, 
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
}, { _id: false });

// Sub-schema for complexity analysis
const complexitySchema = new mongoose.Schema({
  time: {
    notation: { type: String }, // e.g., "O(n)", "O(n^2)"
    bestCase: { type: String },
    averageCase: { type: String },
    worstCase: { type: String },
    explanation: { type: String },
  },
  space: {
    notation: { type: String },
    explanation: { type: String },
  },
  cyclomaticComplexity: { type: Number },
  maintainabilityIndex: { type: Number },
  cognitiveComplexity: { type: Number },
  linesOfCode: {
    total: { type: Number },
    logical: { type: Number },
    source: { type: Number },
    comments: { type: Number },
    blank: { type: Number },
  },
}, { _id: false });

// Sub-schema for project summary
const summarySchema = new mongoose.Schema({
  title: { type: String },
  purpose: { type: String },
  components: [{
    name: { type: String },
    type: { type: String }, // 'function', 'class', 'method', 'module'
    purpose: { type: String },
    line: { type: Number },
  }],
  technologies: [{ type: String }],
  architecture: { type: String },
  entryPoints: [{ type: String }],
  dependencies: [{ type: String }],
  dataFlow: { type: String },
}, { _id: false });

// Main Analysis Schema
const analysisSchema = new mongoose.Schema(
  {
    // User reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Code information
    code: {
      type: String,
      required: [true, 'Code is required'],
      maxlength: [100000, 'Code cannot exceed 100000 characters'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: [
        'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
        'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
        'scala', 'html', 'css', 'sql',
      ],
      index: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    
    // Analysis results - structured fields
    summary: summarySchema,
    lineExplanations: [lineExplanationSchema],
    bugs: {
      count: { type: Number, default: 0 },
      issues: [bugIssueSchema],
      staticAnalysis: mongoose.Schema.Types.Mixed, // Pylint/AST results
    },
    suggestedFixes: [suggestedFixSchema],
    complexity: complexitySchema,
    improvements: { type: String }, // Markdown text with improvement suggestions
    
    // Raw AI responses (for debugging/caching)
    rawResults: {
      explain: mongoose.Schema.Types.Mixed,
      'line-by-line': mongoose.Schema.Types.Mixed,
      bugs: mongoose.Schema.Types.Mixed,
      fix: mongoose.Schema.Types.Mixed,
      complexity: mongoose.Schema.Types.Mixed,
      improve: mongoose.Schema.Types.Mixed,
      summary: mongoose.Schema.Types.Mixed,
      functions: mongoose.Schema.Types.Mixed,
    },
    
    // Static analysis results
    staticAnalysis: {
      pylint: mongoose.Schema.Types.Mixed,
      radon: mongoose.Schema.Types.Mixed,
      ast: mongoose.Schema.Types.Mixed,
    },
    
    // Metadata
    analysisTypes: [{
      type: String,
      enum: ['explain', 'line-by-line', 'bugs', 'fix', 'complexity', 'improve', 'summary', 'functions', 'full'],
    }],
    processingTime: {
      type: Number, // in milliseconds
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    errorMessage: {
      type: String,
    },
    
    // Version for schema migrations
    schemaVersion: {
      type: Number,
      default: 2,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// =============================================================================
// INDEXES for efficient queries
// =============================================================================

// Compound index for user's analysis history (sorted by date)
analysisSchema.index({ user: 1, createdAt: -1 });

// Index for filtering by language and status
analysisSchema.index({ language: 1, status: 1 });

// Index for finding recent analyses
analysisSchema.index({ createdAt: -1 });

// Text index for searching code content (optional, enable if needed)
// analysisSchema.index({ code: 'text', 'summary.title': 'text', 'summary.purpose': 'text' });

// =============================================================================
// VIRTUALS
// =============================================================================

// Virtual for total bug count
analysisSchema.virtual('totalBugs').get(function() {
  return this.bugs?.issues?.length || 0;
});

// Virtual for has critical bugs
analysisSchema.virtual('hasCriticalBugs').get(function() {
  return this.bugs?.issues?.some(bug => 
    bug.severity === 'critical' || bug.severity === 'high'
  ) || false;
});

// =============================================================================
// METHODS
// =============================================================================

// Instance method to check if analysis is complete
analysisSchema.methods.isComplete = function() {
  return this.status === 'completed';
};

// Instance method to get summary for list view
analysisSchema.methods.toListView = function() {
  return {
    id: this._id,
    language: this.language,
    fileName: this.fileName,
    title: this.summary?.title || 'Untitled Analysis',
    bugCount: this.totalBugs,
    status: this.status,
    createdAt: this.createdAt,
  };
};

// =============================================================================
// STATICS
// =============================================================================

// Static method to find user's recent analyses
analysisSchema.statics.findByUser = function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-code -rawResults'); // Exclude large fields
};

// Static method to get language statistics
analysisSchema.statics.getLanguageStats = function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$language', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Pre-save middleware to update bug count
analysisSchema.pre('save', function(next) {
  if (this.bugs && this.bugs.issues) {
    this.bugs.count = this.bugs.issues.length;
  }
  next();
});

module.exports = mongoose.model('Analysis', analysisSchema);
