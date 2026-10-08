import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCode, FiSearch, FiAlertTriangle, FiClock,
  FiArrowRight, FiPlay, FiShield, FiCpu,
  FiCheckCircle, FiCopy, FiTerminal, FiLayers, FiCheck
} from 'react-icons/fi';

const DEMO_SAMPLES = {
  security: {
    title: 'Security Audit & Auth Fix',
    lang: 'javascript',
    original: `// Vulnerable Login Route\napp.post('/login', async (req, res) => {\n  const { username, password } = req.body;\n  const query = "SELECT * FROM users WHERE user = '" + username + "' AND pass = '" + password + "'";\n  const user = await db.query(query);\n  res.json({ token: user.id });\n});`,
    aiFix: `// Parameterized Query & Bcrypt Hashing\napp.post('/login', async (req, res) => {\n  const { username, password } = req.body;\n  const user = await db.query('SELECT id, password_hash FROM users WHERE user = $1', [username]);\n  if (!user || !(await bcrypt.compare(password, user.password_hash))) {\n    return res.status(401).json({ error: 'Invalid credentials' });\n  }\n  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });\n  res.json({ token });\n});`,
    severity: 'Security Advisories Detected',
    score: '34 -> 98/100',
    metrics: { vulnerabilities: 3, performanceGain: '2.4x', complexity: 'O(1)' }
  },
  performance: {
    title: 'Database Query Optimization',
    lang: 'python',
    original: `# Inefficient N+1 Database Iteration\ndef get_user_order_summary(user_ids):\n    results = []\n    for uid in user_ids:\n        user = db.users.find_one({"_id": uid})\n        orders = list(db.orders.find({"user_id": uid}))\n        results.append({"user": user["name"], "total": sum(o["price"] for o in orders)})\n    return results`,
    aiFix: `# Single Aggregation Pipeline\ndef get_user_order_summary(user_ids):\n    pipeline = [\n        {"$match": {"user_id": {"$in": user_ids}}},\n        {"$group": {"_id": "$user_id", "total": {"$sum": "$price"}}},\n        {"$lookup": {"from": "users", "localField": "_id", "foreignField": "_id", "as": "user_info"}}\n    ]\n    return list(db.orders.aggregate(pipeline))`,
    severity: 'Latency Bottleneck',
    score: '52 -> 96/100',
    metrics: { vulnerabilities: 0, performanceGain: '18.5x', complexity: 'O(N)' }
  },
  complexity: {
    title: 'O(N^2) Loop Refactoring',
    lang: 'typescript',
    original: `// Unoptimized Duplicate Finder O(N^2)\nfunction findDuplicates(arr: number[]): number[] {\n  const dupes: number[] = [];\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = i + 1; j < arr.length; j++) {\n      if (arr[i] === arr[j] && !dupes.includes(arr[i])) {\n        dupes.push(arr[i]);\n      }\n    }\n  }\n  return dupes;\n}`,
    aiFix: `// Hash Set Lookup O(N)\nfunction findDuplicates(arr: number[]): number[] {\n  const seen = new Set<number>();\n  const dupes = new Set<number>();\n  for (const num of arr) {\n    if (seen.has(num)) dupes.add(num);\n    else seen.add(num);\n  }\n  return Array.from(dupes);\n}`,
    severity: 'Algorithmic Optimization',
    score: '60 -> 99/100',
    metrics: { vulnerabilities: 0, performanceGain: '45x', complexity: 'O(N)' }
  }
};

const features = [
  {
    icon: FiShield,
    title: 'AST Vulnerability Auditing',
    description: 'Abstract Syntax Tree analysis detects SQL injection, XSS, insecure deserialization, and token leakage.',
    badge: 'Security'
  },
  {
    icon: FiClock,
    title: 'Algorithmic Complexity Meter',
    description: 'Automatic time and space complexity evaluation for loops, recursive calls, and memory usage.',
    badge: 'Performance'
  },
  {
    icon: FiCode,
    title: 'Refactoring & Code Health',
    description: 'Converts legacy code structures into async/await, modern syntax, and clean architecture patterns.',
    badge: 'Quality'
  },
  {
    icon: FiCpu,
    title: 'Multi-Engine Language Models',
    description: 'Supports local Ollama DeepSeek models, OpenAI GPT-4o, and Anthropic Claude 3.5 Sonnet.',
    badge: 'Engine'
  },
  {
    icon: FiTerminal,
    title: 'Integrated Code Playground',
    description: 'Monaco editor with side-by-side diff views, code execution simulation, and test generation.',
    badge: 'IDE'
  },
  {
    icon: FiLayers,
    title: 'Compliance Reports',
    description: 'Export audit findings formatted for engineering managers, security reviews, and compliance teams.',
    badge: 'Reports'
  },
];

const stats = [
  { value: '2.8M+', label: 'Lines Audited' },
  { value: '45K+', label: 'Issues Resolved' },
  { value: '< 120ms', label: 'Analysis Latency' },
  { value: '99.6%', label: 'AST Precision' },
];

const Home = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [copied, setCopied] = useState(false);
  const sample = DEMO_SAMPLES[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(sample.aiFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in bg-dark-950 text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Clean Enterprise Hero Text */}
            <div className="lg:col-span-6 text-center lg:text-left space-y-6">
              
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Audit, Debug & Refactor <br />
                <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-ivory-100 bg-clip-text text-transparent">
                  Codebases Efficiently
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-dark-300 max-w-xl leading-relaxed">
                Comprehensive Abstract Syntax Tree (AST) auditing, algorithmic complexity evaluation, and refactoring tools for engineering teams.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/analyze"
                  className="px-6 py-3.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-dark-950 font-bold text-xs shadow-glow-primary transition-all duration-200 flex items-center space-x-2"
                >
                  <FiSearch className="w-4 h-4" />
                  <span>Analyze Repository</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/playground"
                  className="px-6 py-3.5 rounded-xl bg-dark-900 border border-primary-500/30 hover:border-primary-500/60 text-primary-200 font-semibold text-xs transition-all duration-200 flex items-center space-x-2"
                >
                  <FiPlay className="w-4 h-4 text-primary-400" />
                  <span>Open Code Playground</span>
                </Link>
              </div>

              {/* Metrics Bar */}
              <div className="pt-6 border-t border-dark-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-dark-900/80 border border-dark-800 rounded-xl p-3">
                    <p className="text-lg font-bold text-primary-300 font-mono">{stat.value}</p>
                    <p className="text-[11px] text-dark-400 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Clean Code Inspection Window */}
            <div className="lg:col-span-6">
              <div className="bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl overflow-hidden relative">
                
                {/* Window Header */}
                <div className="px-4 py-3 bg-dark-950 border-b border-dark-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-dark-700 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-dark-700 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-dark-700 inline-block"></span>
                    <span className="text-xs font-mono text-dark-400 ml-2">code-analysis-preview.ts</span>
                  </div>
                  <span className="text-[11px] font-mono text-primary-400">DeepSeek Model</span>
                </div>

                {/* Sample Presets Tab Header */}
                <div className="flex border-b border-dark-800 bg-dark-950 overflow-x-auto">
                  {Object.keys(DEMO_SAMPLES).map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 ${
                        activeTab === key
                          ? 'border-primary-400 text-primary-400 bg-primary-500/10'
                          : 'border-transparent text-dark-400 hover:text-dark-200'
                      }`}
                    >
                      {DEMO_SAMPLES[key].title}
                    </button>
                  ))}
                </div>

                {/* Audit Summary Bar */}
                <div className="px-4 py-2 bg-dark-950 border-b border-dark-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-dark-300 font-medium">{sample.severity}</span>
                  <span className="text-primary-400 font-semibold">Quality Index: {sample.score}</span>
                </div>

                {/* Code Window Display */}
                <div className="p-4 space-y-3 font-mono text-xs max-h-[340px] overflow-y-auto bg-dark-950">
                  {/* Original Snippet */}
                  <div className="rounded-xl bg-dark-900 border border-dark-800 p-3">
                    <div className="flex items-center justify-between text-[11px] text-dark-400 mb-1.5 font-sans font-medium">
                      <span>BEFORE</span>
                      <span>Complexity: {sample.metrics.complexity}</span>
                    </div>
                    <pre className="text-dark-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                      {sample.original}
                    </pre>
                  </div>

                  {/* Refactored Snippet */}
                  <div className="rounded-xl bg-dark-900 border border-primary-500/30 p-3">
                    <div className="flex items-center justify-between text-[11px] text-primary-400 mb-1.5 font-sans font-medium">
                      <span>AFTER (REFACTORED)</span>
                      <button
                        onClick={handleCopy}
                        className="flex items-center space-x-1 text-dark-400 hover:text-primary-300 transition-colors"
                      >
                        {copied ? <FiCheck className="w-3.5 h-3.5 text-primary-400" /> : <FiCopy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-primary-200 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                      {sample.aiFix}
                    </pre>
                  </div>
                </div>

                {/* Demo Card Footer */}
                <div className="px-4 py-3 bg-dark-950 border-t border-dark-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-dark-400">
                    <FiCheckCircle className="w-4 h-4 text-primary-400" />
                    <span>0 Vulnerabilities Remaining</span>
                  </div>
                  <Link
                    to="/playground"
                    className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center space-x-1"
                  >
                    <span>Open in Playground</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Grid Section - Monochromatic Professional Icon Badges */}
      <section className="py-20 bg-dark-900/60 border-y border-dark-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-extrabold text-white">
              Platform Features
            </h2>
            <p className="text-dark-400 text-sm leading-relaxed">
              Essential auditing and complexity tools designed for modern codebases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-dark-900 border border-dark-800 hover:border-primary-500/40 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 group relative"
                >
                  <div className="flex items-center justify-between mb-4">
                    {/* Minimalist Professional Monochromatic Icon Box */}
                    <div className="w-10 h-10 rounded-xl bg-dark-800 border border-primary-500/20 flex items-center justify-center text-primary-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-dark-950 text-dark-400 border border-dark-800">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-dark-400 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-3xl font-extrabold text-white">
              Workflow Integration
            </h2>
            <p className="text-dark-400 text-sm">Analyze code in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Import Source Code',
                desc: 'Paste code snippets or connect GitHub repositories for multi-file analysis.',
                icon: FiSearch
              },
              {
                step: '02',
                title: 'AST & Model Execution',
                desc: 'Abstract Syntax Tree parser evaluates security rules and language model recommendations.',
                icon: FiCpu
              },
              {
                step: '03',
                title: 'Review & Refactor',
                desc: 'Inspect complexity reports, apply clean code suggestions, and export audit files.',
                icon: FiCheckCircle
              }
            ].map((item, idx) => {
              const StepIcon = item.icon;
              return (
                <div key={idx} className="bg-dark-900 border border-dark-800 rounded-2xl p-6 relative group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold font-mono text-primary-400">
                      {item.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-dark-800 flex items-center justify-center text-dark-400 group-hover:text-primary-400 transition-colors">
                      <StepIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-dark-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-16 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-dark-900 border border-primary-500/30 rounded-3xl p-10 text-center relative overflow-hidden shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Start Auditing Your Codebase
            </h2>
            <p className="text-dark-300 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
              Full access to local model analysis, code playground, and AST complexity reports.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-7 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-dark-950 font-bold text-xs shadow-glow-primary transition-all flex items-center space-x-2"
              >
                <span>Create Free Account</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/analyze"
                className="px-7 py-3 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 text-white text-xs font-semibold transition-all"
              >
                Start Analysis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;


