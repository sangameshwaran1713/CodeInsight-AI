const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * AIService - Handles communication between Node.js backend and Python FastAPI AI service
 * 
 * Flow:
 * 1. Frontend sends code to Node.js API (POST /api/analyze)
 * 2. Node.js validates request and forwards to Python AI service
 * 3. Python analyzes code using OpenAI + static analysis tools
 * 4. Python returns structured result
 * 5. Node.js processes response and sends back to frontend
 */
class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_SERVICE_URL,
      timeout: 120000, // 120 seconds timeout for AI operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AI Service] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AI Service] Response: ${response.status} from ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        console.error('[AI Service] Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
          code: error.code,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Analyze code using Python AI service
   * @param {string} code - Source code to analyze
   * @param {string} language - Programming language
   * @param {string} analysisType - Type of analysis (explain, bugs, fix, complexity, improve, line-by-line)
   * @returns {Promise<object>} Analysis result from Python service
   */
  async analyzeCode(code, language, analysisType) {
    try {
      const response = await this.client.post(`/api/analyze/${analysisType}`, {
        code,
        language,
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get project summary from Python AI service
   * @param {string} code - Source code to analyze
   * @param {string} language - Programming language
   * @returns {Promise<object>} Project summary
   */
  async getProjectSummary(code, language) {
    try {
      const response = await this.client.post('/api/analyze/summary', {
        code,
        language,
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Get function explanations from Python AI service
   * @param {string} code - Source code to analyze
   * @param {string} language - Programming language
   * @returns {Promise<object>} Function explanations
   */
  async getFunctionExplanations(code, language) {
    try {
      const response = await this.client.post('/api/analyze/functions', {
        code,
        language,
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Perform full analysis using Python AI service
   * @param {string} code - Source code to analyze
   * @param {string} language - Programming language
   * @returns {Promise<object>} Complete analysis result
   */
  async fullAnalysis(code, language) {
    try {
      const response = await this.client.post('/api/analyze/full', {
        code,
        language,
      });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Run multiple analysis types in parallel
   * @param {string} code - Source code to analyze
   * @param {string} language - Programming language
   * @param {string[]} analysisTypes - Array of analysis types
   * @returns {Promise<object>} Results keyed by analysis type
   */
  async analyzeMultiple(code, language, analysisTypes) {
    const results = {};
    const errors = [];

    // Execute all analyses in parallel
    const promises = analysisTypes.map(async (type) => {
      try {
        const result = await this.analyzeCode(code, language, type);
        results[type] = result.data;
      } catch (error) {
        results[type] = { error: error.message };
        errors.push({ type, error: error.message });
      }
    });

    await Promise.all(promises);

    return { results, errors, hasErrors: errors.length > 0 };
  }

  /**
   * Check AI service health
   * @returns {Promise<object>} Health status with details
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const response = await this.client.get('/health', { timeout: 5000 });
      const latency = Date.now() - startTime;
      
      return { 
        status: 'healthy',
        latency: `${latency}ms`,
        service: 'Python AI Service',
        url: AI_SERVICE_URL,
        ...response.data 
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message,
        code: error.code,
        url: AI_SERVICE_URL,
        suggestion: error.code === 'ECONNREFUSED' 
          ? 'Ensure Python AI service is running on ' + AI_SERVICE_URL
          : 'Check network connectivity'
      };
    }
  }

  /**
   * Get AI service URL for debugging
   * @returns {string} Service URL
   */
  getServiceUrl() {
    return AI_SERVICE_URL;
  }

  /**
   * Handle errors from Python AI service
   * @private
   */
  _handleError(error) {
    // Connection refused - service not running
    if (error.code === 'ECONNREFUSED') {
      const err = new Error('AI service is unavailable. Please try again later.');
      err.statusCode = 503;
      err.code = 'SERVICE_UNAVAILABLE';
      return err;
    }

    // Timeout - code too complex or service overloaded
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      const err = new Error('AI service timeout. Code may be too complex.');
      err.statusCode = 504;
      err.code = 'GATEWAY_TIMEOUT';
      return err;
    }

    // HTTP errors from Python service
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.response.data?.message;
      
      if (status === 422) {
        const err = new Error(`Invalid request: ${detail || 'Check code and language'}`);
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        return err;
      }
      
      if (status === 429) {
        const err = new Error('Rate limit exceeded. Please wait and try again.');
        err.statusCode = 429;
        err.code = 'RATE_LIMITED';
        return err;
      }
      
      if (status >= 500) {
        const err = new Error('AI service error. Please try again later.');
        err.statusCode = 502;
        err.code = 'BAD_GATEWAY';
        return err;
      }

      const err = new Error(detail || 'AI service error');
      err.statusCode = status;
      return err;
    }

    // Unknown error
    const err = new Error('Unable to connect to AI service');
    err.statusCode = 503;
    err.code = 'CONNECTION_ERROR';
    return err;
  }
}

module.exports = new AIService();
