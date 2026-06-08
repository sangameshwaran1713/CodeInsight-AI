import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiCode, 
  FiClock, 
  FiTrendingUp, 
  FiArrowRight,
  FiZap,
  FiPlay,
  FiAlertCircle,
  FiCheckCircle,
  FiActivity
} from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      icon: FiCode,
      title: 'Analyze Code',
      description: 'Paste or upload code for AI analysis',
      link: '/analyze',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FiPlay,
      title: 'Playground',
      description: 'Run and debug code in real-time',
      link: '/playground',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: FiClock,
      title: 'View History',
      description: 'Check your previous analyses',
      link: '/history',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const stats = [
    { 
      label: 'Analyses Today', 
      value: '0', 
      icon: FiZap, 
      change: '+0%',
      changeType: 'neutral',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      label: 'Total Analyses', 
      value: '0', 
      icon: FiTrendingUp, 
      change: '+0%',
      changeType: 'neutral',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      label: 'Bugs Found', 
      value: '0', 
      icon: FiAlertCircle, 
      change: '-0%',
      changeType: 'neutral',
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      label: 'Code Quality', 
      value: 'A+', 
      icon: FiCheckCircle, 
      change: 'Excellent',
      changeType: 'positive',
      gradient: 'from-green-500 to-emerald-500'
    },
  ];

  const recentActivity = [
    { type: 'analysis', title: 'No recent activity', time: 'Start analyzing to see your history here' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-10 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-500/25">
              {(user?.name || 'D')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, <span className="gradient-text">{user?.name || 'Developer'}</span>!
              </h1>
              <p className="text-dark-400">
                Ready to analyze some code? Choose an action below to get started.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="card-hover p-6 group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.changeType === 'positive' ? 'bg-green-500/10 text-green-400' :
                  stat.changeType === 'negative' ? 'bg-red-500/10 text-red-400' :
                  'bg-dark-400/20 text-dark-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-dark-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <FiZap className="text-primary-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="group card-hover p-6 flex flex-col items-center text-center animate-slide-up"
                  style={{ animationDelay: `${(index + 4) * 100}ms` }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <action.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-dark-400 text-sm">{action.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Go</span>
                    <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <FiActivity className="text-primary-400" />
              Recent Activity
            </h2>
            <div className="card p-6 space-y-4 animate-slide-up stagger-5">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm">{activity.title}</p>
                    <p className="text-dark-500 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Getting Started CTA */}
        <div className="card p-8 relative overflow-hidden animate-slide-up stagger-5">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 via-transparent to-cyan-900/20"></div>
          <div className="blob w-[300px] h-[300px] bg-primary-500/20 -top-1/2 -right-20"></div>
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-float">
                <FiCode className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  New to CodeInsight AI?
                </h2>
                <p className="text-dark-400 max-w-md">
                  Start by pasting your code in the analyzer and selecting the types of analysis you want.
                </p>
              </div>
            </div>
            <Link to="/analyze" className="btn-glow flex items-center space-x-2 whitespace-nowrap px-8 py-4">
              <span>Start Analyzing</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
