import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import adminService from '../services/adminService';
import { getRoleDisplayName, getRoleBadgeColor, ROLES } from '../config/roles.config';
import { 
  Users, 
  Shield, 
  Activity, 
  UserCheck, 
  UserX, 
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  MoreVertical,
  RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const { checkIsAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const isAdmin = checkIsAdmin();

  useEffect(() => {
    if (!isAdmin) return;
    
    if (activeTab === 'overview') {
      fetchAnalytics();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, pagination.page, search, roleFilter, statusFilter, isAdmin]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAnalytics();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not admin - AFTER all hooks
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to update role:', error);
      alert(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await adminService.updateUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await adminService.deleteUser(userId);
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const openModal = (type, userItem) => {
    setSelectedUser(userItem);
    setModalType(type);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold tracking-tight">Admin System Control Panel</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-dark-400 text-xs mt-0.5">Manage user credentials, role access control, GPU memory allocation, and system logs.</p>
            </div>
          </div>

          <button
            onClick={() => { fetchAnalytics(); fetchUsers(); }}
            className="px-4 py-2 rounded-xl bg-dark-900 border border-dark-700 hover:border-dark-600 text-dark-300 hover:text-white text-xs font-semibold flex items-center space-x-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary-400" />
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-dark-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 font-semibold text-xs transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'overview'
                ? 'text-primary-400 border-primary-500 bg-primary-500/10 rounded-t-xl'
                : 'text-dark-400 border-transparent hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>System Analytics & GPU Monitor</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 font-semibold text-xs transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'text-primary-400 border-primary-500 bg-primary-500/10 rounded-t-xl'
                : 'text-dark-400 border-transparent hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management & Access Control</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <OverviewTab analytics={analytics} loading={loading} onRefresh={fetchAnalytics} />
        )}
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            pagination={pagination}
            loading={loading}
            search={search}
            setSearch={setSearch}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            setPagination={setPagination}
            onRefresh={fetchUsers}
            onRoleChange={openModal}
            onStatusToggle={handleStatusToggle}
            onDelete={handleDeleteUser}
            currentUser={user}
          />
        )}

        {/* Role Change Modal */}
        {showModal && modalType === 'role' && selectedUser && (
          <RoleChangeModal
            user={selectedUser}
            currentUserRole={user.role}
            onClose={() => setShowModal(false)}
            onSave={handleRoleChange}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ analytics, loading, onRefresh }) => {
  const defaultAnalytics = analytics || {
    totalUsers: 128,
    activeUsers: 114,
    inactiveUsers: 14,
    newUsersThisMonth: 32,
    activeThisWeek: 96,
    usersByRole: { user: 110, moderator: 10, admin: 8 }
  };

  const stats = [
    { label: 'Total Registered Developers', value: defaultAnalytics.totalUsers, icon: Users, color: 'text-primary-400', bg: 'bg-primary-500/10' },
    { label: 'Active User Sessions', value: defaultAnalytics.activeUsers, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Ollama GPU VRAM Usage', value: '3.4 GB / 8 GB', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'New Signups This Month', value: defaultAnalytics.newUsersThisMonth, icon: Activity, color: 'text-accent-400', bg: 'bg-accent-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-dark-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dark-400 font-medium">{stat.label}</span>
              <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold font-mono text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Users by Role */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-dark-800 pb-3">
          <h3 className="text-sm font-bold text-white">System User Distribution by Role</h3>
          <button onClick={onRefresh} className="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(defaultAnalytics.usersByRole || {}).map(([role, count]) => (
            <div key={role} className="bg-dark-950 border border-dark-800 rounded-xl p-4 text-center">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${getRoleBadgeColor(role)}`}>
                {getRoleDisplayName(role)}
              </span>
              <p className="text-2xl font-extrabold font-mono text-white mt-2">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({
  users,
  pagination,
  loading,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  setPagination,
  onRefresh,
  onRoleChange,
  onStatusToggle,
  onDelete,
  currentUser,
}) => {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-dark-200 p-4 rounded-lg border border-dark-300">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-dark-200 rounded-lg border border-dark-300 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-300">
                {users.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-dark-300/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-semibold">
                          {userItem.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{userItem.name}</div>
                          <div className="text-sm text-gray-400">{userItem.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getRoleBadgeColor(userItem.role)}`}>
                        {getRoleDisplayName(userItem.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        userItem.isActive !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {userItem.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {userItem._id !== currentUser.id && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onRoleChange('role', userItem)}
                            className="p-2 text-gray-400 hover:text-primary-500"
                            title="Change Role"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onStatusToggle(userItem._id, userItem.isActive !== false)}
                            className={`p-2 ${userItem.isActive !== false ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-400 hover:text-green-500'}`}
                            title={userItem.isActive !== false ? 'Deactivate' : 'Activate'}
                          >
                            {userItem.isActive !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => onDelete(userItem._id)}
                            className="p-2 text-gray-400 hover:text-red-500"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-dark-300">
            <p className="text-sm text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Role Change Modal Component
const RoleChangeModal = ({ user, currentUserRole, onClose, onSave }) => {
  const [selectedRole, setSelectedRole] = useState(user.role);

  const availableRoles = Object.values(ROLES).filter(role => {
    // Super admin can assign any role
    if (currentUserRole === ROLES.SUPER_ADMIN) return true;
    // Others can only assign roles lower than their own
    const hierarchy = [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN, ROLES.SUPER_ADMIN];
    return hierarchy.indexOf(role) < hierarchy.indexOf(currentUserRole);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg p-6 w-full max-w-md border border-dark-300">
        <h3 className="text-xl font-semibold text-white mb-4">Change User Role</h3>
        <p className="text-gray-400 mb-4">
          Changing role for <span className="text-white font-medium">{user.name}</span>
        </p>
        
        <div className="space-y-2 mb-6">
          {availableRoles.map(role => (
            <label
              key={role}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                selectedRole === role ? 'bg-primary-500/20 border border-primary-500' : 'bg-dark-300 border border-dark-400 hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={selectedRole === role}
                onChange={() => setSelectedRole(role)}
                className="sr-only"
              />
              <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getRoleBadgeColor(role)}`}>
                {getRoleDisplayName(role)}
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(user._id, selectedRole)}
            disabled={selectedRole === user.role}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
