import { useState, useCallback } from 'react';
import analysisService from '../services/analysisService';
import { getErrorMessage } from '../utils/helpers';

/**
 * Custom hook for code analysis operations
 */
export const useAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const analyze = useCallback(async (code, language, analysisTypes) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const analysisResults = {};

      for (const type of analysisTypes) {
        let result;
        switch (type) {
          case 'explain':
            result = await analysisService.explainCode(code, language);
            break;
          case 'line-by-line':
            result = await analysisService.lineByLineAnalysis(code, language);
            break;
          case 'bugs':
            result = await analysisService.detectBugs(code, language);
            break;
          case 'fix':
            result = await analysisService.suggestFixes(code, language);
            break;
          case 'complexity':
            result = await analysisService.analyzeComplexity(code, language);
            break;
          case 'improve':
            result = await analysisService.improveCode(code, language);
            break;
          default:
            break;
        }
        analysisResults[type] = result;
      }

      setResults(analysisResults);
      return analysisResults;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fullAnalysis = useCallback(async (code, language) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const result = await analysisService.fullAnalysis(code, language);
      setResults(result.data?.results || result);
      return result;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResults(null);
  }, []);

  return {
    isLoading,
    error,
    results,
    analyze,
    fullAnalysis,
    reset,
  };
};

export default useAnalysis;
