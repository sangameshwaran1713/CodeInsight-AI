import { Link } from 'react-router-dom';
import { FiCode, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-dark-100 border-t border-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <FiCode className="w-6 h-6 text-primary-500" />
              <span className="text-lg font-bold gradient-text">CodeInsight AI</span>
            </Link>
            <p className="text-dark-400 text-sm max-w-md">
              AI-powered code analysis platform that helps developers understand, 
              debug, and optimize their code with intelligent insights.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-dark-600 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/analyze" className="text-dark-400 hover:text-primary-400 text-sm transition-colors">
                  Analyze Code
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-dark-400 hover:text-primary-400 text-sm transition-colors">
                  History
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-dark-400 hover:text-primary-400 text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-dark-600 mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-400 hover:text-white transition-colors"
              >
                <FiGithub className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-400 hover:text-white transition-colors"
              >
                <FiTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dark-400 hover:text-white transition-colors"
              >
                <FiLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-300 mt-8 pt-8 text-center">
          <p className="text-dark-400 text-sm">
            © {new Date().getFullYear()} CodeInsight AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
