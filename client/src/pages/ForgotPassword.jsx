import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiCode, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setEmailSent(true);
        toast.success('Password reset email sent!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center">
                <FiCheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white">Check your email</h2>
            <p className="mt-2 text-dark-400">
              We've sent a password reset link to <span className="text-primary-400">{email}</span>
            </p>
          </div>

          <div className="card p-8 space-y-6">
            <p className="text-dark-300 text-center">
              Click the link in the email to reset your password. The link will expire in 10 minutes.
            </p>
            <p className="text-dark-400 text-sm text-center">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setEmailSent(false)}
                className="text-primary-500 hover:text-primary-400"
              >
                try again
              </button>
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-dark-400 hover:text-white inline-flex items-center"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center">
              <FiCode className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Forgot password?</h2>
          <p className="mt-2 text-dark-400">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dark-500 mb-2">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="h-5 w-5 text-dark-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input pl-10"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-dark-400 hover:text-white inline-flex items-center"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
