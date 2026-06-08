import { Link } from 'react-router-dom';
import { 
  FiCode, 
  FiSearch, 
  FiAlertCircle, 
  FiSettings, 
  FiClock, 
  FiTrendingUp,
  FiArrowRight,
  FiZap,
  FiPlay,
  FiShield,
  FiCpu,
  FiUser
} from 'react-icons/fi';

const features = [
  {
    icon: FiSearch,
    title: 'Code Explanation',
    description: 'Get detailed explanations of what your code does in plain English.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FiCode,
    title: 'Line-by-Line Analysis',
    description: 'Understand each line of code with comprehensive breakdowns.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: FiAlertCircle,
    title: 'Bug Detection',
    description: 'Automatically identify potential bugs and issues in your code.',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: FiSettings,
    title: 'Fix Suggestions',
    description: 'Get AI-powered suggestions to fix detected issues.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: FiClock,
    title: 'Time Complexity',
    description: 'Analyze the time and space complexity of your algorithms.',
    color: 'from-yellow-500 to-amber-500',
  },
  {
    icon: FiTrendingUp,
    title: 'Code Improvement',
    description: 'Receive optimization suggestions to improve your code quality.',
    color: 'from-indigo-500 to-violet-500',
  },
];

const stats = [
  { value: '10K+', label: 'Code Analyses', icon: FiCode },
  { value: '5K+', label: 'Bugs Found', icon: FiShield },
  { value: '99%', label: 'Accuracy', icon: FiCpu },
];

const Home = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">

        {/* Subtle vignette so edges feel deep */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,4,8,0.7)_100%)]" />

        {/* Nebula accent blobs */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <div className="blob w-[500px] h-[500px] bg-primary-500/10 top-1/4 left-1/4 animate-float"></div>
          <div className="blob w-[400px] h-[400px] bg-cyan-500/8 bottom-1/4 right-1/4 animate-float" style={{ animationDelay: '-2s' }}></div>
          <div className="blob w-[300px] h-[300px] bg-purple-500/8 top-1/2 right-1/3 animate-float" style={{ animationDelay: '-4s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-primary-500/10 text-primary-400 px-5 py-2.5 rounded-full text-sm mb-8 border border-primary-500/20 backdrop-blur-sm animate-bounce-in">
              <FiZap className="w-4 h-4" />
              <span className="font-medium">AI-Powered Code Analysis</span>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
            </div>
            
            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight animate-slide-up">
              Understand Your Code
              <br />
              <span className="gradient-text text-glow">with AI Intelligence</span>
            </h1>
            
            {/* Subheading */}
            <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-slide-up stagger-1">
              Paste your code and let AI explain it, detect bugs, analyze complexity, 
              and suggest improvements in seconds.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-slide-up stagger-2">
              <Link to="/register" className="btn-glow text-lg px-8 py-4 flex items-center space-x-3 group">
                <span>Sign Up</span>
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="btn-outline text-lg px-8 py-4 flex items-center space-x-3 group">
                <FiUser className="w-5 h-5" />
                <span>Login</span>
              </Link>
            </div>

            {/* Secondary Links */}
            <div className="flex items-center justify-center gap-6 mb-16 animate-slide-up stagger-2">
              <Link to="/playground" className="text-dark-400 hover:text-primary-400 flex items-center gap-2 transition-colors">
                <FiPlay className="w-4 h-4" />
                <span>Try Playground</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 animate-slide-up stagger-3">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center space-x-3 px-6 py-3 glass-card">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-dark-400">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-dark-400 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-primary-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <span className="badge-primary mb-4">Features</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Powerful Code Analysis
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              Everything you need to understand, debug, and improve your code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group card-hover p-8 animate-slide-up relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-dark-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 bg-dark-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="badge-primary mb-4">How it Works</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Simple & Powerful
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Paste Your Code', desc: 'Paste or type your code in any supported language' },
              { step: '02', title: 'Choose Analysis', desc: 'Select from bug detection, explanation, or optimization' },
              { step: '03', title: 'Get Insights', desc: 'Receive instant AI-powered analysis and suggestions' },
            ].map((item, index) => (
              <div key={index} className="text-center animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 text-white text-2xl font-bold mb-6 shadow-lg shadow-primary-500/25">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-dark-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 via-primary-800/20 to-cyan-900/30"></div>
        <div className="blob w-[600px] h-[600px] bg-primary-500/20 -top-1/2 -left-1/4"></div>
        <div className="blob w-[500px] h-[500px] bg-cyan-500/20 -bottom-1/2 -right-1/4"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
            Ready to level up your code?
          </h2>
          <p className="text-dark-400 text-xl mb-12 max-w-2xl mx-auto">
            Join thousands of developers who use CodeInsight AI to write better, cleaner, and more efficient code.
          </p>
          <Link to="/register" className="btn-glow text-lg px-10 py-4 inline-flex items-center space-x-3 group">
            <span>Start Analyzing for Free</span>
            <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
