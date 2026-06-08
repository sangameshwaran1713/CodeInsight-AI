import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiCode, FiUser, FiLogOut, FiShield, FiSettings } from 'react-icons/fi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout, checkIsAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/20 text-primary-400 border border-primary-500/30'
        : 'text-dark-400 hover:text-white hover:bg-dark-200/50'
    }`;

  return (
    <nav className="bg-dark-100/80 backdrop-blur-xl border-b border-dark-300/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all group-hover:scale-105">
              <FiCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-primary-300 bg-clip-text text-transparent">
              CodeInsight AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/analyze" className={navLinkClass}>
                  Analyze
                </NavLink>
                <NavLink to="/playground" className={navLinkClass}>
                  Playground
                </NavLink>
                <NavLink to="/history" className={navLinkClass}>
                  History
                </NavLink>
                {checkIsAdmin() && (
                  <NavLink to="/admin" className={navLinkClass}>
                    <FiShield className="w-4 h-4 inline mr-1" />
                    Admin
                  </NavLink>
                )}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-dark-300/50">
                  <NavLink to="/settings" className="flex items-center justify-center w-9 h-9 rounded-xl text-dark-400 hover:text-white hover:bg-dark-300/50 transition-all">
                    <FiSettings className="w-4 h-4" />
                  </NavLink>
                  <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-dark-200/50 border border-dark-300/50">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                      <FiUser className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-dark-400 font-medium">{user?.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/playground" className={navLinkClass}>
                  Playground
                </NavLink>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <Link 
                  to="/register" 
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-400 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all hover:scale-105"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-dark-400 hover:text-white p-2 rounded-xl hover:bg-dark-300/50 transition-all"
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-dark-300/50 bg-dark-100/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/analyze"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  Analyze
                </NavLink>
                <NavLink
                  to="/playground"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  Playground
                </NavLink>
                <NavLink
                  to="/history"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  History
                </NavLink>
                {checkIsAdmin() && (
                  <NavLink
                    to="/admin"
                    className={navLinkClass}
                    onClick={() => setIsOpen(false)}
                  >
                    <FiShield className="w-4 h-4 inline mr-1" />
                    Admin
                  </NavLink>
                )}
                <NavLink
                  to="/settings"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  <FiSettings className="w-4 h-4 inline mr-1" />
                  Settings
                </NavLink>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl flex items-center space-x-2 transition-all"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/playground"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  Playground
                </NavLink>
                <NavLink
                  to="/login"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
