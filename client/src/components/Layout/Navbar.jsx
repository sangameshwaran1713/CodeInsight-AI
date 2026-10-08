import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiMenu, FiX, FiCode, FiUser, FiLogOut, FiShield, FiSettings, 
  FiSearch, FiActivity, FiLayers
} from 'react-icons/fi';
import BrandLogo from '../ui/BrandLogo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const { isAuthenticated, user, logout, checkIsAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 ${isActive
      ? 'bg-primary-500/10 text-primary-300 border border-primary-500/30'
      : 'text-dark-300 hover:text-white hover:bg-dark-900'
    }`;

  return (
    <nav className="bg-dark-950/90 backdrop-blur-2xl border-b border-dark-800 sticky top-0 z-40 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/">
            <BrandLogo className="w-8 h-8" showText={true} textClassName="text-xl" />
          </Link>

          {/* Desktop Navigation & Actions */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  <FiActivity className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/analyze" className={navLinkClass}>
                  <FiSearch className="w-3.5 h-3.5" />
                  <span>Analyze</span>
                </NavLink>
                <NavLink to="/playground" className={navLinkClass}>
                  <FiCode className="w-3.5 h-3.5" />
                  <span>Playground</span>
                </NavLink>
                <NavLink to="/history" className={navLinkClass}>
                  <FiLayers className="w-3.5 h-3.5" />
                  <span>History</span>
                </NavLink>
                {checkIsAdmin() && (
                  <NavLink to="/admin" className={navLinkClass}>
                    <FiShield className="w-3.5 h-3.5 text-primary-400" />
                    <span>Admin</span>
                  </NavLink>
                )}

                {/* Profile & Dropdown */}
                <div className="relative ml-2 pl-2 border-l border-dark-800">
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-dark-900 border border-dark-800 hover:border-dark-700 transition-all text-left"
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 flex items-center justify-center font-bold text-xs">
                      {(user?.name || 'D')[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-white">{user?.name || 'Developer'}</span>
                  </button>

                  {userDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl p-2 z-50 animate-scale-in divide-y divide-dark-800">
                      <div className="px-3 py-2">
                        <p className="text-xs font-medium text-white">{user?.name}</p>
                        <p className="text-[11px] text-dark-400 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/settings"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-xs text-dark-300 hover:text-white hover:bg-dark-800 rounded-xl transition-colors"
                        >
                          <FiSettings className="w-4 h-4 text-primary-400" />
                          <span>Settings & AI Models</span>
                        </Link>
                        {checkIsAdmin() && (
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdown(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs text-dark-300 hover:text-white hover:bg-dark-800 rounded-xl transition-colors"
                          >
                            <FiShield className="w-4 h-4 text-primary-400" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                      </div>
                      <div className="pt-1">
                        <button
                          onClick={() => {
                            setUserDropdown(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                          <FiLogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/playground" className={navLinkClass}>
                  Playground
                </NavLink>

                {location.pathname !== '/login' ? (
                  <NavLink to="/login" className={navLinkClass}>
                    Sign In
                  </NavLink>
                ) : (
                  <NavLink to="/register" className={navLinkClass}>
                    Sign Up
                  </NavLink>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-dark-400 hover:text-white p-2 rounded-xl hover:bg-dark-800 transition-all"
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-dark-800 bg-dark-950/95 backdrop-blur-2xl animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  <FiActivity className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink
                  to="/analyze"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  <FiSearch className="w-4 h-4" />
                  <span>Analyze Repository</span>
                </NavLink>
                <NavLink
                  to="/playground"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  <FiCode className="w-4 h-4" />
                  <span>AI Code Playground</span>
                </NavLink>
                <NavLink
                  to="/history"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  <FiLayers className="w-4 h-4" />
                  <span>Scan History</span>
                </NavLink>
                {checkIsAdmin() && (
                  <NavLink
                    to="/admin"
                    className={navLinkClass}
                    onClick={() => setIsOpen(false)}
                  >
                    <FiShield className="w-4 h-4 text-amber-400" />
                    <span>Admin Control</span>
                  </NavLink>
                )}
                <NavLink
                  to="/settings"
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  <FiSettings className="w-4 h-4" />
                  <span>Settings & API Keys</span>
                </NavLink>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl flex items-center space-x-2 transition-all text-sm font-medium"
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
                  Sign In
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
