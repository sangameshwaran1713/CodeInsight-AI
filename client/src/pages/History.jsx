import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiCode, FiTrash2, FiEye, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import analysisService from '../services/analysisService';

const History = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      const response = await analysisService.getHistory(page, 10);
      setAnalyses((prev) => (page === 1 ? response.data : [...prev, ...response.data]));
      setHasMore(response.data.length === 10);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;

    try {
      await analysisService.deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a._id !== id));
      toast.success('Analysis deleted');
    } catch (error) {
      toast.error('Failed to delete analysis');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analysis History</h1>
          <p className="text-dark-400">View and manage your previous code analyses.</p>
        </div>

        {analyses.length === 0 ? (
          <div className="card p-12 text-center">
            <FiClock className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No analyses yet</h3>
            <p className="text-dark-400 mb-6">
              Start analyzing code to build your history.
            </p>
            <Link to="/analyze" className="btn-primary">
              Analyze Code
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <div key={analysis._id} className="card p-6 hover:border-dark-400 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <FiCode className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-primary-400 uppercase">
                        {analysis.language}
                      </span>
                      <span className="text-dark-400 text-sm">
                        {formatDate(analysis.createdAt)}
                      </span>
                    </div>
                    <pre className="text-dark-500 text-sm font-mono truncate max-w-full">
                      {analysis.code?.slice(0, 100)}...
                    </pre>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {analysis.analysisTypes?.map((type) => (
                        <span
                          key={type}
                          className="px-2 py-1 bg-dark-300 text-dark-500 text-xs rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Link
                      to={`/analysis/${analysis._id}`}
                      className="btn-secondary p-2"
                      title="View details"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(analysis._id)}
                      className="btn-secondary p-2 hover:bg-red-500/20 hover:text-red-400"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary"
                  disabled={loading}
                >
                  {loading ? (
                    <FiLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
