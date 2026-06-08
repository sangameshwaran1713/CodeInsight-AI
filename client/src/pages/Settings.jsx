import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiSave, FiEye, FiEyeOff, FiShield, FiCheckCircle, FiAlertCircle, FiSend } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getRoleDisplayName, getRoleBadgeColor } from '../config/roles.config';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password form state - OTP flow
  const [passwordStep, setPasswordStep] = useState(1); // 1 = request OTP, 2 = enter OTP & new password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Resend verification
  const [resendLoading, setResendLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const response = await api.put('/auth/profile', { name, email });
      
      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    setPasswordLoading(true);

    try {
      const response = await api.post('/auth/request-password-otp');
      
      if (response.data.success) {
        toast.success('OTP sent to your email!');
        setOtpSent(true);
        setPasswordStep(2);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordChangeWithOTP = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Validate password strength
    if (newPassword.length < 12) {
      toast.error('Password must be at least 12 characters');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must contain uppercase, lowercase, number, and special character (@$!%*?&)');
      return;
    }

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await api.put('/auth/password-with-otp', {
        otp,
        newPassword,
      });

      if (response.data.success) {
        toast.success('Password changed successfully!');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordStep(1);
        setOtpSent(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);

    try {
      const response = await api.post('/auth/resend-verification');
      
      if (response.data.success) {
        toast.success('Verification email sent!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiLock },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-dark-400">Manage your account settings and preferences</p>
      </div>

      {/* Account Overview Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center">
            <FiUser className="w-8 h-8 text-primary-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
            <p className="text-dark-400">{user?.email}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getRoleBadgeColor(user?.role)}`}>
              {getRoleDisplayName(user?.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-dark-200 text-dark-400 hover:bg-dark-300 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiUser className="w-5 h-5 mr-2 text-primary-500" />
            Profile Information
          </h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-dark-500 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-dark-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-10"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-500 mb-2">
                Email Address
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
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={profileLoading}
                className="btn-primary flex items-center space-x-2"
              >
                {profileLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Email Verification Status */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FiMail className="w-5 h-5 mr-2 text-primary-500" />
              Email Verification
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {user?.isEmailVerified ? (
                  <>
                    <FiCheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="text-white font-medium">Email Verified</p>
                      <p className="text-dark-400 text-sm">Your email address has been verified</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FiAlertCircle className="w-6 h-6 text-yellow-500" />
                    <div>
                      <p className="text-white font-medium">Email Not Verified</p>
                      <p className="text-dark-400 text-sm">Please verify your email address</p>
                    </div>
                  </>
                )}
              </div>
              {!user?.isEmailVerified && (
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="btn-secondary flex items-center space-x-2"
                >
                  {resendLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      <span>Resend Verification</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FiShield className="w-5 h-5 mr-2 text-primary-500" />
              Change Password
            </h3>
            <p className="text-dark-400 text-sm mb-4">
              For security, we'll send a one-time password (OTP) to your email to verify your identity.
            </p>

            {passwordStep === 1 ? (
              <div>
                <p className="text-dark-300 mb-4">
                  Click the button below to receive an OTP at <span className="text-primary-400">{user?.email}</span>
                </p>
                <button
                  onClick={handleRequestOTP}
                  disabled={passwordLoading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {passwordLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      <span>Send OTP</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChangeWithOTP} className="space-y-4">
                {otpSent && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                    <p className="text-green-400 text-sm flex items-center">
                      <FiCheckCircle className="w-4 h-4 mr-2" />
                      OTP sent to your email. It expires in 10 minutes.
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-dark-500 mb-2">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiShield className="h-5 w-5 text-dark-400" />
                    </div>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      className="input pl-10 tracking-widest text-center font-mono"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-dark-500 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-dark-400" />
                    </div>
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="input pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-400 hover:text-dark-300"
                    >
                      {showNewPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-500 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-dark-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="input pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-400 hover:text-dark-300"
                    >
                      {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordStep(1);
                      setOtp('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setOtpSent(false);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {passwordLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <FiShield className="w-4 h-4" />
                        <span>Change Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
