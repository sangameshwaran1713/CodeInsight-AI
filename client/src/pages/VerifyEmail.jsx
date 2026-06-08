import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiLoader, FiMail, FiKey } from 'react-icons/fi';
import api from '../services/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(token ? 'verifying' : 'otp-input'); // verifying, otp-input, success, error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifyEmailWithToken = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        if (response.data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    if (token) {
      verifyEmailWithToken();
    }
  }, [token]);

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-email-otp', { email, otp });
      if (response.data.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiLoader className="w-10 h-10 text-primary-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Verifying Your Email</h2>
              <p className="text-dark-400">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'otp-input' && (
            <>
              <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiKey className="w-10 h-10 text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Verify Your Email</h2>
              <p className="text-dark-400 mb-6">Enter the 6-digit code sent to your email address.</p>
              
              <form onSubmit={handleOTPSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="input w-full text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                    required
                  />
                </div>
                
                {message && (
                  <p className="text-red-400 text-sm text-center">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <FiLoader className="w-5 h-5 animate-spin" />
                  ) : (
                    'Verify Email'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-dark-700">
                <p className="text-dark-500 text-sm">
                  Didn't receive the code?{' '}
                  <Link to="/login" className="text-primary-500 hover:text-primary-400">
                    Login and request a new one
                  </Link>
                </p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Email Verified!</h2>
              <p className="text-dark-400 mb-6">{message}</p>
              <p className="text-dark-400 mb-6">You now have full access to CodeInsight AI.</p>
              <Link to="/dashboard" className="btn-primary inline-flex items-center space-x-2">
                <span>Go to Dashboard</span>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiXCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Verification Failed</h2>
              <p className="text-dark-400 mb-6">{message}</p>
              <div className="space-y-3">
                <button 
                  onClick={() => { setStatus('otp-input'); setMessage(''); }}
                  className="btn-primary w-full"
                >
                  Try with OTP Code
                </button>
                <Link to="/login" className="btn-secondary w-full flex items-center justify-center">
                  Go to Login
                </Link>
                <p className="text-dark-500 text-sm">
                  Need a new verification link?{' '}
                  <Link to="/dashboard" className="text-primary-500 hover:text-primary-400">
                    Login and request a new one
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
