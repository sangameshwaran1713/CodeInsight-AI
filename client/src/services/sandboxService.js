/**
 * Sandbox Service - Client API for code execution
 * Communicates with the AI service's sandbox endpoint
 */

import axios from 'axios';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

const sandboxApi = axios.create({
  baseURL: `${AI_SERVICE_URL}/api/sandbox`,
  timeout: 60000, // 60 seconds for code execution
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Execute code in the secure sandbox
 * @param {Object} params - Execution parameters
 * @param {string} params.code - Source code to execute
 * @param {string} params.language - Programming language ('python' or 'javascript')
 * @param {string} [params.stdin] - Standard input for the program
 * @param {number} [params.timeout=10] - Execution timeout in seconds
 * @returns {Promise<Object>} Execution result
 */
export const executeCode = async ({ code, language, stdin = '', timeout = 10 }) => {
  try {
    const response = await sandboxApi.post('/execute-simple', {
      code,
      language,
      stdin,
      timeout,
    });
    // Response is flat: { success, stdout, stderr, exit_code, execution_time, ... }
    return response.data;
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 422) throw new Error(data.detail?.message || data.detail || 'Invalid code or parameters');
      if (status === 429) throw new Error('Rate limit exceeded. Please wait before trying again.');
      if (status === 503 || status === 500) throw new Error('Sandbox service unavailable.');
      throw new Error(data.detail?.message || data.message || 'Execution failed');
    }
    if (error.code === 'ECONNABORTED') throw new Error('Execution timed out');
    throw new Error('Failed to connect to sandbox service');
  }
};

/**
 * Get supported languages
 * @returns {Promise<Array>} List of supported languages
 */
export const getSupportedLanguages = async () => {
  try {
    const response = await sandboxApi.get('/languages');
    return response.data.languages;
  } catch (error) {
    // Return default languages if endpoint fails
    return [
      { name: 'python', extension: '.py', version: '3.x' },
      { name: 'javascript', extension: '.js', version: 'Node.js' },
    ];
  }
};

/**
 * Check sandbox service health
 * @returns {Promise<Object>} Health status
 */
export const checkSandboxHealth = async () => {
  try {
    const response = await sandboxApi.get('/health');
    return response.data;
  } catch (error) {
    return { 
      status: 'unavailable', 
      docker_available: false,
      message: error.message 
    };
  }
};

export default {
  executeCode,
  getSupportedLanguages,
  checkSandboxHealth,
};
