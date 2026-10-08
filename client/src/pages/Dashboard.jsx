import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiCode, FiClock, FiTrendingUp, FiArrowRight, FiZap,
  FiPlay, FiAlertTriangle, FiCheckCircle, FiActivity,
  FiCpu, FiShield, FiSliders, FiFileText, FiRefreshCw, FiCheck, FiSearch
} from 'react-icons/fi';
import analysisService from '../services/analysisService';

const Dashboard = () => {
  const { user } = useAuth();
  const [recentScans, setRecentScans] = useState([]);
  const [totalScans, setTotalScans] = useState(0);
  const [loadingScans, setLoadingScans] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoadingScans(true);
      const [historyRes, statsRes] = await Promise.allSettled([
        analysisService.getHistory(1, 5),
        analysisService.getStats()
      ]);

      if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
        setRecentScans(historyRes.value.data);
      } else {
        setRecentScans([]);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.overview) {
        setTotalScans(statsRes.value.data.overview.totalAnalyses || 0);
      } else if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
        setTotalScans(historyRes.value.data.length);
      }
    } catch (err) {
      console.error('Failed to load user history:', err);
      setRecentScans([]);
    } finally {
      setLoadingScans(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const quickActions = [
    {
      icon: FiSearch,
      title: 'Analyze Repository',
      description: 'Run deep AST security & performance scan on GitHub repo or local code.',
      link: '/analyze',
      badge: 'Core Tool'
    },
    {
      icon: FiPlay,
      title: 'AI Code Playground',
      description: 'Monaco Editor with side-by-side refactoring diffs & test generators.',
      link: '/playground',
      badge: 'Real-Time'
    },
    {
      icon: FiClock,
      title: 'Scan Reports & PDF',
      description: 'Access past analysis history, export compliance PDFs, and JSON matrices.',
      link: '/history',
      badge: 'Export'
    },
    {
      icon: FiSliders,
      title: 'AI Engine Settings',
      description: 'Configure local Ollama host, DeepSeek parameters, or OpenAI API keys.',
      link: '/settings',
      badge: 'Config'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-white py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-dark-900 via-primary-950/40 to-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 blur-[90px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-dark-950 border border-primary-500/40 flex items-center justify-center text-primary-400 text-2xl font-bold shadow-md shrink-0">
                {(user?.name || 'D')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome back, <span className="bg-gradient-to-r from-white via-dark-100 to-primary-300 bg-clip-text text-transparent">{user?.name || 'Developer'}</span>!
                  </h1>
                </div>
                <p className="text-dark-300 text-sm mt-1">
                  {totalScans > 0 ? (
                    <>You have completed <span className="text-primary-300 font-semibold font-mono">{totalScans} code audit scan{totalScans > 1 ? 's' : ''}</span>.</>
                  ) : (
                    <>Ready to audit your codebase with local Ollama & DeepSeek models.</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <Link
                to="/analyze"
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-dark-950 font-bold text-xs shadow-glow-primary transition-all flex items-center justify-center space-x-2"
              >
                <FiZap className="w-4 h-4" />
                <span>New Code Scan</span>
              </Link>
              <Link
                to="/playground"
                className="px-4 py-2.5 rounded-xl bg-dark-950 hover:bg-dark-900 text-dark-200 hover:text-white font-semibold text-xs border border-dark-800 transition-all flex items-center space-x-1.5"
              >
                <FiPlay className="w-3.5 h-3.5 text-primary-400" />
                <span>Playground</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Executive Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-dark-400">Total Code Scans</span>
              <div className="w-9 h-9 rounded-xl bg-dark-950 border border-primary-500/20 text-primary-400 flex items-center justify-center">
                <FiCode className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold font-mono text-white">{totalScans}</p>
              <span className="text-xs text-primary-400 font-semibold flex items-center font-mono">
                {totalScans > 0 ? 'Active' : '0 Scans'}
              </span>
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-primary-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-dark-400">Active AI Model</span>
              <div className="w-9 h-9 rounded-xl bg-dark-950 border border-primary-500/20 text-primary-400 flex items-center justify-center">
                <FiCpu className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-base font-bold font-mono text-white truncate">gpt-oss:120b</p>
              <span className="text-[11px] text-primary-400 font-mono">Local Ollama</span>
            </div>
          </div>
        </div>

        {/* Main Content Split: Quick Actions + Recent Scans Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Quick Actions Grid */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <FiZap className="w-4 h-4 text-primary-400" />
                <span>Developer Command Tools</span>
              </h2>
              <span className="text-xs text-dark-400">Click to launch tool</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={idx}
                    to={action.link}
                    className="bg-dark-900 border border-dark-800 hover:border-primary-500/40 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-dark-950 border border-primary-500/30 flex items-center justify-center text-primary-400 shadow-md group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-dark-950 text-dark-400 border border-dark-800">
                        {action.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-dark-400 text-xs leading-relaxed mb-3">
                      {action.description}
                    </p>
                    <div className="flex items-center text-xs font-semibold text-primary-400 group-hover:translate-x-1 transition-transform">
                      <span>Open Tool</span>
                      <FiArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Column: Recent Activity Feed & AI Recommendations */}
          <div className="lg:col-span-5 space-y-6">
            {/* Recent Analysis Activity */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FiActivity className="w-4 h-4 text-cyan-400" />
                  <span>Recent Scan Activity</span>
                </h3>
                <Link to="/history" className="text-xs text-primary-400 hover:text-primary-300 font-medium">
                  View All
                </Link>
              </div>

              {loadingScans ? (
                <div className="py-8 text-center space-y-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto" />
                  <p className="text-xs text-dark-400">Loading audit history...</p>
                </div>
              ) : recentScans.length > 0 ? (
                <div className="space-y-3">
                  {recentScans.map((scan) => (
                    <div key={scan._id} className="p-3.5 rounded-xl bg-dark-950 border border-dark-800 flex items-center justify-between hover:border-primary-500/30 transition-colors">
                      <div className="space-y-1 overflow-hidden pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-primary-500/10 text-primary-400 border border-primary-500/20 font-bold">
                            {scan.language || 'Code'}
                          </span>
                          <span className="text-[11px] text-dark-400">• {formatDate(scan.createdAt)}</span>
                        </div>
                        <p className="text-xs font-mono text-dark-200 truncate max-w-[220px]">
                          {scan.code?.split('\n')[0] || 'Code Snippet'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {scan.healthScore || 95}/100
                        </span>
                        <Link to={`/analysis/${scan._id}`} className="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors">
                          <FiArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-3 bg-dark-950/60 rounded-xl border border-dark-800/80 p-4">
                  <FiClock className="w-8 h-8 text-dark-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">No recent scans yet</p>
                    <p className="text-[11px] text-dark-400 max-w-xs mx-auto">
                      Run your first code security & performance audit to populate your scan history.
                    </p>
                  </div>
                  <Link
                    to="/analyze"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-400 text-dark-950 font-bold text-xs shadow-glow-primary transition-all mt-1"
                  >
                    <FiZap className="w-3.5 h-3.5" />
                    <span>Start First Code Scan</span>
                  </Link>
                </div>
              )}
          </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;

