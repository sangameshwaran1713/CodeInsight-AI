import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCode } from 'react-icons/fi';
import toast from 'react-hot-toast';
import analysisService from '../services/analysisService';
import CodeEditor from '../components/Editor/CodeEditor';
import AnalysisResults from '../components/Analysis/AnalysisResults';

const AnalysisDetail = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      const response = await analysisService.getAnalysisById(id);
      setAnalysis(response.data);
    } catch (error) {
      toast.error('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <FiCode className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Analysis not found</h3>
          <Link to="/history" className="btn-primary mt-4">
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/history" className="inline-flex items-center space-x-2 text-dark-400 hover:text-white mb-4">
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to History</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Analysis Details</h1>
          <p className="text-dark-400">
            Analyzed on {new Date(analysis.createdAt).toLocaleString()} • {analysis.language}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Original Code</h2>
            <CodeEditor
              value={analysis.code}
              language={analysis.language}
              readOnly={true}
              height="500px"
            />
          </div>

          {/* Results */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Analysis Results</h2>
            <AnalysisResults results={analysis.results} isLoading={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDetail;
