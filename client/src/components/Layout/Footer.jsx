import { Link } from 'react-router-dom';
import { FiCpu, FiShield, FiActivity, FiTerminal } from 'react-icons/fi';
import BrandLogo from '../ui/BrandLogo';

const Footer = () => {
  return (
    <footer className="bg-dark-950 border-t border-dark-800/80 relative overflow-hidden">
      {/* Background Subtle Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-accent-500/5 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link to="/">
              <BrandLogo className="w-8 h-8" showText={true} textClassName="text-xl" />
            </Link>
            <p className="text-dark-400 text-sm max-w-sm leading-relaxed">
              Enterprise AI code analysis platform delivering AST security auditing, performance optimization, and real-time refactoring powered by local DeepSeek LLMs & Ollama.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/analyze" className="text-dark-400 hover:text-primary-400 text-xs transition-colors flex items-center space-x-1.5">
                  <FiActivity className="w-3.5 h-3.5 text-primary-400" />
                  <span>Repository Scanner</span>
                </Link>
              </li>
              <li>
                <Link to="/playground" className="text-dark-400 hover:text-primary-400 text-xs transition-colors flex items-center space-x-1.5">
                  <FiTerminal className="w-3.5 h-3.5 text-accent-400" />
                  <span>AI Code Playground</span>
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-dark-400 hover:text-primary-400 text-xs transition-colors flex items-center space-x-1.5">
                  <FiShield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audit Reports</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* AI Engines */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 tracking-wider uppercase">AI Models</h4>
            <ul className="space-y-2.5">
              <li className="text-dark-400 text-xs flex items-center space-x-2">
                <FiCpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ollama DeepSeek Coder</span>
              </li>
              <li className="text-dark-400 text-xs flex items-center space-x-2">
                <FiCpu className="w-3.5 h-3.5 text-primary-400" />
                <span>OpenAI GPT-4o</span>
              </li>
              <li className="text-dark-400 text-xs flex items-center space-x-2">
                <FiCpu className="w-3.5 h-3.5 text-accent-400" />
                <span>Anthropic Claude 3.5</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-dark-400">
          <p>© {new Date().getFullYear()} CodeInsight AI Inc. Enterprise Code Intelligence.</p>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <Link to="/settings" className="hover:text-primary-400 transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/settings" className="hover:text-primary-400 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/settings" className="hover:text-primary-400 transition-colors">Security Audit Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

