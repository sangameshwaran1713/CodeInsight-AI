import api from './api';

export const analysisService = {
  // Unified analyze endpoint - sends all selected analysis types in one request
  analyze: async (code, language, analysisTypes = ['explain']) => {
    const response = await api.post('/analyze', { 
      code, 
      language,
      analysisTypes 
    });
    return response.data;
  },

  // Explain what the code does
  explainCode: async (code, language) => {
    const response = await api.post('/analysis/explain', { code, language });
    return response.data;
  },

  // Line-by-line explanation
  lineByLineAnalysis: async (code, language) => {
    const response = await api.post('/analysis/line-by-line', { code, language });
    return response.data;
  },

  // Detect bugs in the code
  detectBugs: async (code, language) => {
    const response = await api.post('/analysis/bugs', { code, language });
    return response.data;
  },

  // Get fix suggestions
  suggestFixes: async (code, language) => {
    const response = await api.post('/analysis/fix', { code, language });
    return response.data;
  },

  // Analyze time complexity
  analyzeComplexity: async (code, language) => {
    const response = await api.post('/analysis/complexity', { code, language });
    return response.data;
  },

  // Get code improvement suggestions
  improveCode: async (code, language) => {
    const response = await api.post('/analysis/improve', { code, language });
    return response.data;
  },

  // Full analysis (all features)
  fullAnalysis: async (code, language) => {
    const response = await api.post('/analysis/full', { code, language });
    return response.data;
  },

  // Upload code file
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/analysis/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get analysis history
  getHistory: async (page = 1, limit = 10) => {
    const response = await api.get(`/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get specific analysis by ID
  getAnalysisById: async (id) => {
    const response = await api.get(`/history/${id}`);
    return response.data;
  },

  // Delete analysis from history
  deleteAnalysis: async (id) => {
    const response = await api.delete(`/history/${id}`);
    return response.data;
  },
};

export default analysisService;
