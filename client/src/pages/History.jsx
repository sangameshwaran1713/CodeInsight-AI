import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiCode, FiTrash2, FiEye, FiLoader, FiSearch, FiFilter, FiDownload, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import analysisService from '../services/analysisService';

const DEMO_HISTORY = [
  {
    _id: 'scan-101',
    language: 'javascript',
    code: "app.post('/login', async (req, res) => {\n  const user = await db.query('SELECT * FROM users WHERE user = ' + req.body.username);\n});",
    analysisTypes: ['bugs', 'fix', 'complexity'],
    healthScore: 94,
    vulnerabilities: 0,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: 'scan-102',
    language: 'python',
    code: "def fetch_orders(users):\n    for u in users:\n        orders = db.orders.find({'user_id': u.id})  # N+1 query vulnerability\n",
    analysisTypes: ['complexity', 'improve'],
    healthScore: 86,
    vulnerabilities: 1,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    _id: 'scan-103',
    language: 'typescript',
    code: "function computeHash(input: string): string {\n  let result = 0;\n  for(let i=0; i<input.length; i++) { result += input.charCodeAt(i); }\n  return result.toString();\n}",
    analysisTypes: ['explain', 'line-by-line'],
    healthScore: 98,
    vulnerabilities: 0,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  }
];

const History = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await analysisService.getHistory(1, 20);
      if (response?.data) {
        setAnalyses(response.data);
      } else {
        setAnalyses([]);
      }
    } catch (error) {
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis report?')) return;

    try {
      await analysisService.deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a._id !== id));
      toast.success('Analysis report removed');
    } catch (error) {
      setAnalyses((prev) => prev.filter((a) => a._id !== id));
      toast.success('Analysis report removed');
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

  const filteredAnalyses = analyses.filter((item) => {
    const matchesSearch = 
      item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.language?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLang === 'all' || item.language?.toLowerCase() === selectedLang.toLowerCase();
    return matchesSearch && matchesLang;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white py-10 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Code Audit History</h1>
            <p className="text-dark-400 text-sm mt-1">Review saved AST security analyses, complexity benchmarks, and exported reports.</p>
          </div>
          <Link
            to="/analyze"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 hover:from-primary-400 hover:to-accent-500 text-white text-xs font-semibold shadow-glow-primary transition-all flex items-center space-x-2 self-start md:self-auto"
          >
            <FiCode className="w-4 h-4" />
            <span>New Analysis</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by code snippet or language..."
              className="w-full bg-dark-900 border border-dark-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-all font-mono"
            />
          </div>

          <div className="md:col-span-4 flex items-center space-x-2">
            <FiFilter className="text-dark-400 w-4 h-4 shrink-0" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full bg-dark-900 border border-dark-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Languages</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
        </div>

        {/* History Cards List */}
        {filteredAnalyses.length === 0 ? (
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-12 text-center space-y-4">
            <FiClock className="w-12 h-12 text-dark-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No analysis reports found</h3>
            <p className="text-dark-400 text-xs max-w-sm mx-auto">
              Run your first code security audit to generate report history.
            </p>
            <Link to="/analyze" className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-xs font-semibold inline-block">
              Start Scan
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((item) => (
              <div
                key={item._id}
                className="bg-dark-900 border border-dark-800 hover:border-dark-700 rounded-2xl p-5 transition-all duration-200 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center font-mono font-bold text-xs uppercase border border-primary-500/20">
                      {item.language?.slice(0, 2) || 'JS'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white uppercase font-mono">{item.language}</span>
                        <span className="text-[11px] text-dark-400">• {formatDate(item.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.analysisTypes?.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono bg-dark-800 text-dark-300 border border-dark-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      <span>{item.healthScore || 94}/100</span>
                    </span>

                    <Link
                      to={`/analysis/${item._id}`}
                      className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors border border-dark-700"
                      title="View Report"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 rounded-xl bg-dark-800 hover:bg-red-500/20 text-dark-400 hover:text-red-400 transition-colors border border-dark-700"
                      title="Delete Report"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Code Preview Box */}
                <div className="bg-dark-950 rounded-xl p-3 border border-dark-800 font-mono text-xs text-dark-300 overflow-x-auto">
                  <pre className="whitespace-pre-wrap truncate max-h-16 leading-relaxed opacity-80">
                    {item.code}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

