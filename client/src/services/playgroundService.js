/**
 * Playground Service - Direct API calls to AI service
 * Bypasses Node.js backend authentication for public playground
 */

import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_AI_SERVICE_URL;
  if (envUrl) return envUrl;
  
  // If no env var, use current host but port 8000
  const host = window.location.hostname;
  return `http://${host}:8000`;
};

const AI_SERVICE_URL = getBaseUrl();

const aiApi = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 120000, // 2 minutes for AI analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Detect bugs in code
 */
export const detectBugs = async (code, language) => {
  try {
    const response = await aiApi.post('/api/analyze/bugs', { code, language });
    return response.data;
  } catch (error) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Failed to analyze code for bugs');
  }
};

/**
 * Get fix suggestions
 */
export const suggestFixes = async (code, language) => {
  try {
    const response = await aiApi.post('/api/analyze/fix', { code, language });
    return response.data;
  } catch (error) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Failed to get fix suggestions');
  }
};

/**
 * Explain code
 */
export const explainCode = async (code, language) => {
  try {
    const response = await aiApi.post('/api/analyze/explain', { code, language });
    return response.data;
  } catch (error) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Failed to explain code');
  }
};

/**
 * Analyze code for anti-gravity stability
 */
export const analyzeAntiGravity = async (code, language) => {
  try {
    const response = await aiApi.post('/api/anti-gravity/analyze', { code, language });
    return response.data;
  } catch (error) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Failed to run anti-gravity analysis');
  }
};

/**
 * Execute code - tries sandbox first, falls back to simple execution
 */
export const executeCode = async ({ code, language, stdin = '', timeout = 10 }) => {
  try {
    // Try sandbox first
    const response = await aiApi.post('/api/sandbox/execute', {
      code,
      language,
      stdin,
      timeout,
    });
    return response.data;
  } catch (error) {
    // If sandbox is unavailable (Docker not running, or CORS network error), use simple execution
    // Broadened check: 500 or 503 status often indicates the sandbox container failed to build or run.
    if (!error.response || error.response?.status === 503 || error.response?.status === 500 || error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      return executeSimple({ code, language, stdin });
    }
    
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Failed to execute code');
  }
};

/**
 * Simple code execution fallback (no Docker)
 */
export const executeSimple = async ({ code, language, stdin = '' }) => {
  try {
    const response = await aiApi.post('/api/sandbox/execute-simple', {
      code,
      language,
      stdin,
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Code execution not available');
  }
};

/**
 * Check sandbox health - always returns available since we have simple execution fallback
 */
export const checkSandboxHealth = async () => {
  try {
    const response = await aiApi.get('/api/sandbox/health');
    // Even if Docker is unavailable, we have simple execution fallback
    return { available: true, docker_available: response.data?.docker_available || false };
  } catch (error) {
    // Simple execution still works without the health endpoint
    return { available: true, docker_available: false };
  }
};

/**
 * Get the current AI provider
 */
export const getAIProvider = async () => {
  try {
    const response = await aiApi.get('/api/provider');
    return response.data;
  } catch (error) {
    console.error('Failed to get AI provider:', error);
    return { provider: 'ollama', available_providers: ['ollama', 'openai'] };
  }
};

/**
 * Set the AI provider
 */
export const setAIProvider = async (provider) => {
  try {
    const response = await aiApi.post('/api/provider', { provider });
    return response.data;
  } catch (error) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Failed to set AI provider');
  }
};

export default {
  detectBugs,
  suggestFixes,
  explainCode,
  analyzeAntiGravity,
  executeCode,
  executeSimple,
  checkSandboxHealth,
  getAIProvider,
  setAIProvider,
};
