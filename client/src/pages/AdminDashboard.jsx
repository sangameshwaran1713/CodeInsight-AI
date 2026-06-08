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
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-500" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Manage users, roles, and system settings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-dark-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
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
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-400">
        Failed to load analytics data
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Active Users', value: analytics.activeUsers, icon: UserCheck, color: 'text-green-500' },
    { label: 'Inactive Users', value: analytics.inactiveUsers, icon: UserX, color: 'text-red-500' },
    { label: 'New This Month', value: analytics.newUsersThisMonth, icon: Activity, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-dark-200 rounded-lg p-6 border border-dark-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-10 h-10 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Users by Role */}
      <div className="bg-dark-200 rounded-lg p-6 border border-dark-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Users by Role</h3>
          <button onClick={onRefresh} className="text-gray-400 hover:text-white">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.usersByRole || {}).map(([role, count]) => (
            <div key={role} className="text-center p-4 bg-dark-300 rounded-lg">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${getRoleBadgeColor(role)}`}>
                {getRoleDisplayName(role)}
              </span>
              <p className="text-2xl font-bold text-white mt-2">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="bg-dark-200 rounded-lg p-6 border border-dark-300">
        <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
        <div className="flex items-center space-x-8">
          <div>
            <p className="text-gray-400 text-sm">Active This Week</p>
            <p className="text-2xl font-bold text-white">{analytics.activeThisWeek}</p>
          </div>
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
