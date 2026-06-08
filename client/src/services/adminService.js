import api from './api';

const adminService = {
  // Get all users with pagination and filters
  getUsers: async (params = {}) => {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = params;
    const response = await api.get('/admin/users', {
      params: { page, limit, search, role, status },
    });
    return response.data;
  },

  // Get single user
  getUser: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Update user status (activate/deactivate)
  updateUserStatus: async (userId, isActive) => {
    const response = await api.put(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  },

  // Update user permissions
  updateUserPermissions: async (userId, permissions) => {
    const response = await api.put(`/admin/users/${userId}/permissions`, { permissions });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Get analytics data
  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  // Get available roles
  getRoles: async () => {
    const response = await api.get('/admin/roles');
    return response.data;
  },
};

export default adminService;
