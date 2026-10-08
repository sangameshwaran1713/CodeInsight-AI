import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiKey } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to CodeInsight.AI!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('mmm@gmail.com');
    setPassword('SecurePass123!');
    toast.success('Demo credentials loaded!');
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-[calc(100vh-4rem)]">
      
      {/* Soft Ambient Radial Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-primary-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10 animate-fade-in">
        
        {/* Header Title Section */}
        <div className="text-center pb-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome <span className="bg-gradient-to-r from-white via-primary-300 to-ivory-100 bg-clip-text text-transparent">Back</span>
          </h2>
        </div>

        {/* Login Card */}
        <div className="bg-dark-900/90 border border-primary-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
          
          {/* Subtle Top Glowing Line Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400 group-focus-within:text-primary-400 transition-colors">
                  <FiMail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-dark-950/90 text-white text-sm rounded-xl pl-10 pr-4 py-3 border border-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all placeholder-dark-500 font-sans"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-dark-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400 group-focus-within:text-primary-400 transition-colors">
                  <FiLock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-dark-950/90 text-white text-sm rounded-xl pl-10 pr-10 py-3 border border-dark-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all placeholder-dark-500 font-sans"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-dark-400 hover:text-white transition-colors"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-500 hover:bg-primary-400 text-dark-950 font-bold text-xs shadow-glow-primary rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-dark-950 border-t-transparent" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Action */}
          <div className="mt-5 pt-5 border-t border-dark-800/80 text-center">
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center space-x-1.5 text-xs text-dark-400 hover:text-primary-300 transition-colors bg-dark-950/60 hover:bg-dark-950 px-3 py-1.5 rounded-lg border border-dark-800"
            >
              <FiKey className="w-3.5 h-3.5 text-primary-400" />
              <span>Fill Demo Credentials</span>
            </button>
          </div>

        </div>

        {/* Signup Redirect Footer */}
        <p className="text-center text-dark-400 text-xs">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
            Create account free
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
