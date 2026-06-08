import AnalysisDashboard from './AnalysisDashboard';

/**
 * AnalysisResults - Wrapper component for displaying code analysis results
 * 
 * This component uses the AnalysisDashboard for a professional,
 * developer-focused UI with structured sections for:
 * - Project Summary
 * - Function Explanations
 * - Line-by-Line Analysis
 * - Bug Detection
 * - Suggested Fixes
 * - Time & Space Complexity
 * - Code Improvements
 */
const AnalysisResults = ({ results, isLoading, processingTime }) => {
  return (
    <AnalysisDashboard 
      results={results} 
      isLoading={isLoading} 
      processingTime={processingTime}
    />
  );
};

export default AnalysisResults;
